import Anthropic from '@anthropic-ai/sdk'
import { MOS_SYSTEM_PROMPT } from '@/lib/systemPrompt'

export const maxDuration = 60

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

async function getEmbedding(text: string): Promise<number[]> {
  const response = await fetch('https://api.voyageai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.VOYAGE_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'voyage-3',
      input: text,
    }),
  })
  const data = await response.json()
  return data.data[0].embedding
}

async function queryPinecone(embedding: number[]): Promise<string> {
  const indexName = process.env.PINECONE_INDEX || 'mos-artifacts'
  const pineconeApiKey = process.env.PINECONE_API_KEY || ''

  const listResponse = await fetch(
    `https://api.pinecone.io/indexes/${indexName}`,
    {
      headers: {
        'Api-Key': pineconeApiKey,
        'X-Pinecone-API-Version': '2025-04',
      },
    }
  )
  const indexData = await listResponse.json()
  const host = indexData.host

  const queryResponse = await fetch(`https://${host}/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Api-Key': pineconeApiKey,
      'X-Pinecone-API-Version': '2025-04',
    },
    body: JSON.stringify({
      vector: embedding,
      topK: 5,
      includeMetadata: true,
    }),
  })

  const queryData = await queryResponse.json()
  const matches = queryData.matches || []

  if (matches.length === 0) return ''

  const chunks = matches
    .map((m: any) => `[From: ${m.metadata.filename}]\n${m.metadata.text}`)
    .join('\n\n---\n\n')

  return chunks
}

export async function POST(req: Request) {
  const { messages } = await req.json()

  const lastUserMessage = [...messages].reverse().find((m: any) => m.role === 'user')
  const userText = lastUserMessage?.content || ''

  let contextBlock = ''
  try {
    const embedding = await getEmbedding(userText)
    const context = await queryPinecone(embedding)
    if (context) {
      contextBlock = `\n\nRELEVANT MOS ARTIFACTS:\n${context}\n\nUse the above artifacts to inform and ground your response where relevant.`
    }
  } catch (err) {
    console.error('RAG error:', err)
  }

  const systemWithContext = MOS_SYSTEM_PROMPT + contextBlock

  const stream = await client.messages.stream({
    model: 'claude-sonnet-4-5',
    max_tokens: 8096,
    system: systemWithContext,
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
