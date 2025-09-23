import { NextRequest, NextResponse } from "next/server";
import { Message as VercelChatMessage, StreamingTextResponse } from "ai";

import { ChatOpenAI } from "@langchain/openai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatGroq } from "@langchain/groq";
import { ChatMistralAI } from "@langchain/mistralai";
import { ChatDeepSeek } from "@langchain/deepseek";
import { ChatAnthropic } from "@langchain/anthropic";
import { PromptTemplate } from "@langchain/core/prompts";

export const runtime = "edge";

const formatMessage = (message: VercelChatMessage) => {
  return `${message.role}: ${message.content}`;
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages = body.messages ?? [];
    const formattedPreviousMessages = messages.slice(0, -1).map(formatMessage);
    const currentMessageContent = messages[messages.length - 1]?.content ?? "";
    const selectedLanguage = body.language ?? "en";
    const aiModel = body?.aiModel;

    if (!aiModel || aiModel === null) {
      return NextResponse.json(
        { error: "AI model not provided" },
        { status: 400 }
      );
    }

    const provider = aiModel?.provider;
    let providerModel: string | undefined;

    if (["google", "openai", "mistral", "deepseek", "grok", "claude"].includes(provider)) {
      providerModel = aiModel?.model;
    }

   const TEMPLATE = `
        You are a helpful assistant that can provide responses in multiple formats:

        1. **For regular text/conversation**: Return plain text or markdown
        2. **For tabular data**: Return JSON with table data
        3. **For visual data that would be better as charts**: Return JSON with chart data

        ## Response Format Guidelines:

        ### For Regular Text:
        Respond with plain text or markdown.

      

        **For Pie Chart or Doughnut Chart:**
       
        **For Bar Chart, Line Chart, Radar Chart, or Polar Area Chart:**
        {{
          "content": "Here is a bar/line chart showing the data you requested.",
          "chart": {{
            "type": "bar-chart",
            "title": "Chart Title",
            "xAxis": "Category",
            "yAxis": "Value",
            "data": [
              {{ "label": "Label1", "value": 30 }},
              {{ "label": "Label2", "value": 25 }},
              {{ "label": "Label3", "value": 45 }}
            ]
          }}
        }}

        ### For Analytic Card Only:
        When the user specifically asks for data in analytic card, return ONLY valid JSON (no markdown code blocks):

        {{
          "content": "Here is your analytics card:",
          "analyticCard": {{
            "title": "Some title",
            "description": "Optional summary",
            "tabs": {{
              "table": {{
                "headers": ["Col1", "Col2"],
                "rows": [["A", "100"], ["B", "200"]]
          }},
              "chart": {{
                "type": "bar-chart",
                "xAxis": "Col1",
                "yAxis": "Col2",
                "data": [
                  {{ "label": "A", "value": 100 }},
                  {{ "label": "B", "value": 200 }}
                ]
          }}
          }}
          }}
          }}

        ### For Analytic Card With File Download API Only:
        When the user specifically asks for data in analytic card with file download api, return ONLY valid JSON (no markdown code blocks):

        {{
        "analyticCardWithFileApi": {{
          "table": {{
            "title": "Some title",
            "description": "Optional summary",
            "data": {{
              "headers": ["Col1", "Col2"],
              "rows": [
                ["A", "100"],
                ["B", "200"]
              ]
          }}
          }},
          "chart": {{
            "title": "Some title",
            "description": "Optional summary",
            "chartData": {{
              "type": "bar-chart",
              "xAxis": "Col1",
              "yAxis": "Col2",
              "data": [
                {{ "label": "A", "value": 100 }},
                {{ "label": "B", "value": 200 }}
              ]
          }}
          }},
          "story": {{
            "title": "Some title",
            "description": "Optional summary",
            "data": [
              "Row A has a value of 100.",
              "Row B has a value of 200."
            ]
          }}
          }}
          }}

        **Chart types available**: 
        - "pie-chart", "doughnut-chart": Use format with "labels" array and "data" array
        - "bar-chart", "line-chart", "radar-chart", "polar-area-chart": Use format with "data" array containing objects with "label" and "value" properties

        ## Important Notes:
        - For JSON responses (tables, charts, analytic cards), return ONLY the JSON object without any markdown code blocks or additional formatting
        - Do NOT wrap JSON responses in code blocks
        - The JSON must be valid and parseable
        - For pie/doughnut charts: use separate "labels" and "data" arrays
        - For bar/line/radar/polar charts: use "data" array with label-value objects

        ## Decision Making:
        - Use **plain text/markdown** for: explanations, conversations, lists
        - Use **JSON tables** for: tabular data that the user specifically requests
        - Use **JSON charts** only when: user explicitly asks for charts, or when data visualization would be significantly more helpful than a table

        Conversation so far:
        {chat_history}

        User: {input}
        (Note: respond in {language} language.)
`;

    const prompt = PromptTemplate.fromTemplate(TEMPLATE);

    const modelsMap: Record<string, any> = {
      openai: new ChatOpenAI({
        temperature: 0.8,
        model: providerModel ?? "gpt-4o-mini",
        apiKey: aiModel?.key,
      }),
      google: new ChatGoogleGenerativeAI({
        temperature: 0.8,
        model: providerModel ?? "gemini-1.5-pro",
        apiKey: aiModel?.key,
      }),
      grok: new ChatGroq({
        model:providerModel ?? "llama-3.3-70b-versatile",
        temperature: 0,
        apiKey: aiModel?.key,
      }),
      mistral: new ChatMistralAI({
        model: providerModel ?? "mistral-large-latest",
        temperature: 0,
        apiKey: aiModel?.key,
      }),
      claude: new ChatAnthropic({
        model: "claude-3-7-sonnet-20250219",
        temperature: 0.8,
        apiKey: aiModel?.key,
      }),
      deepseek: new ChatDeepSeek({
        model: "deepseek-chat",
        temperature: 0.8,
        apiKey: aiModel?.key,
      }),
    };

    const model = modelsMap[provider as string];

    if (!model) {
      return NextResponse.json(
        { error: `Unsupported provider: ${provider}` },
        { status: 400 }
      );
    }

    const chain = prompt.pipe(model);

    // Usage capture + ready signal
    let finalTokenUsage: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    } | null = null;

    let resolveUsage!: () => void;
    const usageReady = new Promise<void>((resolve) => {
      resolveUsage = resolve;
    });

    const stream = await chain.stream(
      {
        chat_history: formattedPreviousMessages.join("\n"),
        input: currentMessageContent,
        language: selectedLanguage,
      },
      {
        callbacks: [
          {
            handleLLMEnd(output) {
              const usage = output?.llmOutput?.tokenUsage;
              if (usage) {
                finalTokenUsage = {
                  promptTokens: Number(usage.promptTokens) || 0,
                  completionTokens: Number(usage.completionTokens) || 0,
                  totalTokens: Number(usage.totalTokens) || 0,
                };
                console.log("Final token usage:", finalTokenUsage);
              }
              // Resolve whether usage exists or not, to unblock header attachment
              resolveUsage();
            },
            handleLLMError(err) {
              console.error("LLM error:", err);
              resolveUsage();
            },
          },
        ],
      }
    );

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream as AsyncIterable<{ content?: string }>) {
            const content = chunk?.content ?? "";
            if (content) controller.enqueue(encoder.encode(content));
          }
          controller.close();
        } catch (error) {
          console.error("Stream error:", error);
          controller.error(error);
        }
      },
    });

    // Wait for token usage to be ready, then set header
    await usageReady;
    console.log("x-usage header about to send:", finalTokenUsage);

    const headers = new Headers();
    if (finalTokenUsage) {
      headers.set("x-usage", JSON.stringify(finalTokenUsage));
    }

    return new StreamingTextResponse(readableStream, { headers });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
  }
}
