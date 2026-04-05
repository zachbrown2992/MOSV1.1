import { anthropic } from '@ai-sdk/anthropic'
import { streamText } from 'ai'
import { MOS_SYSTEM_PROMPT } from '@/lib/systemPrompt'

export const maxDuration = 60

export async function POST(req: Request) {
  const { messages } = await req.json()

  const result = await streamText({
    model: anthropic('claude-sonnet-4-6'),
    system: MOS_SYSTEM_PROMPT,
    messages,
  })

  return result.toDataStreamResponse()
}
