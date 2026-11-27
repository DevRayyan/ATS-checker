const BASE = 'https://api.groq.com/openai/v1'

export const FALLBACK_MODELS = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant']
export const DEFAULT_MODEL = FALLBACK_MODELS[0]

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

/** gpt-oss models reason before answering; low effort keeps responses quick. */
function effort(model: string): Record<string, string> {
  return /gpt-oss/i.test(model) ? { reasoning_effort: 'low' } : {}
}

export class GroqError extends Error {
  status?: number
  constructor(message: string, status?: number) {
    super(message)
    this.name = 'GroqError'
    this.status = status
  }
}

function headers(key: string): HeadersInit {
  return { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }
}

async function failure(res: Response): Promise<GroqError> {
  let detail = ''
  try {
    const body = await res.json()
    detail = body?.error?.message ?? ''
  } catch {
    /* body was not JSON */
  }
  if (res.status === 401) return new GroqError('Groq rejected this API key. Check it and try again.', 401)
  if (res.status === 429) return new GroqError('Rate limit reached. Wait a moment and try again.', 429)
  return new GroqError(detail || `Groq request failed (${res.status}).`, res.status)
}

/** Chat-capable models on the account, without speech, guard or embedding models. */
export async function listModels(key: string, signal?: AbortSignal): Promise<string[]> {
  const res = await fetch(`${BASE}/models`, { headers: headers(key), signal })
  if (!res.ok) throw await failure(res)
  const body = (await res.json()) as { data?: { id: string; active?: boolean }[] }
  const skip = /whisper|guard|tts|playai|embed|orpheus/i
  return (body.data ?? [])
    .filter((m) => m.active !== false && !skip.test(m.id))
    .map((m) => m.id)
    .sort()
}

interface ChatOptions {
  model: string
  messages: ChatMessage[]
  json?: boolean
  temperature?: number
  signal?: AbortSignal
}

export async function chat(key: string, opts: ChatOptions): Promise<string> {
  const res = await fetch(`${BASE}/chat/completions`, {
    method: 'POST',
    headers: headers(key),
    signal: opts.signal,
    body: JSON.stringify({
      model: opts.model,
      messages: opts.messages,
      temperature: opts.temperature ?? 0.2,
      ...effort(opts.model),
      ...(opts.json ? { response_format: { type: 'json_object' } } : {}),
    }),
  })
  if (!res.ok) throw await failure(res)
  const body = await res.json()
  const text = body?.choices?.[0]?.message?.content
  if (typeof text !== 'string') throw new GroqError('Groq returned an empty answer.')
  return text
}

/** Streams the answer token by token. */
export async function* streamChat(key: string, opts: Omit<ChatOptions, 'json'>): AsyncGenerator<string> {
  const res = await fetch(`${BASE}/chat/completions`, {
    method: 'POST',
    headers: headers(key),
    signal: opts.signal,
    body: JSON.stringify({
      model: opts.model,
      messages: opts.messages,
      temperature: opts.temperature ?? 0.4,
      ...effort(opts.model),
      stream: true,
    }),
  })
  if (!res.ok) throw await failure(res)
  if (!res.body) throw new GroqError('Streaming is not supported in this browser.')

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      if (!line.startsWith('data:')) continue
      const data = line.slice(5).trim()
      if (!data || data === '[DONE]') continue
      try {
        const delta = JSON.parse(data)?.choices?.[0]?.delta?.content
        if (delta) yield delta as string
      } catch {
        /* ignore a partial frame */
      }
    }
  }
}
