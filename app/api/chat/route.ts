import Anthropic from '@anthropic-ai/sdk'
import { MOS_SYSTEM_PROMPT } from '@/lib/systemPrompt'

export const maxDuration = 60

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: Request) {
  const { messages } = await req.json()

  const stream = await client.messages.stream({
    model: 'claude-sonnet-4-5',
    max_tokens: 8096,
    system: MOS_SYSTEM_PROMPT,
    messages,
  })

  const encoder = new TextEncoder()

  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (
          chunk.type === 'content_block_delta' &&
          chunk.delta.type === 'text_delta'
        ) {
          const text = chunk.delta.text
          controller.enqueue(encoder.encode(`0:${JSON.stringify(text)}\n`))
        }
      }
      controller.close()
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Vercel-AI-Data-Stream': 'v1',
    },
  })
}
