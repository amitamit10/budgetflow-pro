import { auth } from '@/auth'
import { groq, MODEL, buildSystemPrompt } from '@/lib/ai/groq'
import { AIMode, Expense } from '@/types'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { messages, mode, expenses } = (await req.json()) as {
    messages: { role: 'user' | 'assistant'; content: string }[]
    mode: AIMode
    expenses: Expense[]
  }

  const systemPrompt = buildSystemPrompt(mode, expenses)

  const stream = await groq.chat.completions.create({
    model: MODEL,
    messages: [{ role: 'system', content: systemPrompt }, ...messages],
    stream: true,
    temperature: 0.4,
    max_tokens: 4096,
  })

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content ?? ''
        if (text) controller.enqueue(encoder.encode(text))
      }
      controller.close()
    },
  })

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
