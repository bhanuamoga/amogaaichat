import { NextRequest } from "next/server";
import { z } from "zod";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { streamObject } from "ai"; // 👈 from vercel/ai sdk

export const runtime = "edge";

const TEMPLATE = `Extract the requested fields from the input.

The field "entity" refers to the first mentioned entity in the input.

Input:

{input}`;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const messages = body.messages ?? [];
  const currentMessageContent = messages[messages.length - 1].content;

  const prompt = PromptTemplate.fromTemplate(TEMPLATE);
  const model = new ChatOpenAI({ model: "gpt-4o-mini", temperature: 0.8 });

  const schema = z.object({
    tone: z.enum(["positive", "negative", "neutral"]),
    entity: z.string(),
    word_count: z.number(),
    chat_response: z.string(),
    final_punctuation: z.optional(z.string()),
  });

  // 👇 returns an SSE stream the ChatWindow understands
  return streamObject({
    model,
    schema,
    messages: [
      { role: "system", content: TEMPLATE },
      { role: "user", content: currentMessageContent },
    ],
  });
}
