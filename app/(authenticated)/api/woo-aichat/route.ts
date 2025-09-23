// app/(authenticated)/api/woo-aichat/route.ts
import { streamText, convertToCoreMessages } from 'ai'
import { openai } from '@ai-sdk/openai'
import { nanoid } from 'nanoid'

export const maxDuration = 30

// Simple ID generator
const generateMessageId = () => `msg_${nanoid(16)}`

export async function POST(req: Request) {
  const { messages } = await req.json()

  // Stream AI response
  const result = streamText({
    model: openai('gpt-4.1-mini'),
    messages: convertToCoreMessages(messages),
    system: 'You are a helpful WooCommerce assistant.',
  })

  // Return the streaming response to the frontend
  return result.toTextStreamResponse({
    originalMessages: messages,
    generateMessageId,
    onFinish: async ({ messages: final }) => {
      // TODO: save { chatId, messages: final } to your DB
      // e.g., Redis or Postgres
    },
  })
}
