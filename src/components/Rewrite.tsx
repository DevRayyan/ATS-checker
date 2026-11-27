import { useEffect, useRef, useState } from 'react'
import { rewriteBullets } from '../lib/analyze'

interface Props {
  apiKey: string
  model: string
  resume: string
  jd: string
}

/** Renders the **Before:** / **After:** lines the model streams back. */
function Line({ text }: { text: string }) {
  const m = text.match(/^\*\*(Before|After):\*\*\s*(.*)$/)
  if (!m) return text.trim() ? <p className="text-sm">{text}</p> : null
  const after = m[1] === 'After'
  return (
    <p
      className={`rounded-lg px-3 py-2 text-sm leading-relaxed ${
        after ? 'bg-brand-50 text-ink dark:bg-brand-800/25 dark:text-gray-100' : 'bg-gray-100 text-gray-600 dark:bg-gray-800/60 dark:text-gray-400'
      }`}
    >
      <span className={`mr-2 text-xs font-bold uppercase tracking-wide ${after ? 'text-brand-700 dark:text-brand-400' : 'text-gray-500'}`}>{m[1]}</span>
      {m[2]}
    </p>
  )
}

export default function Rewrite({ apiKey, model, resume, jd }: Props) {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const abort = useRef<AbortController | null>(null)

  useEffect(() => () => abort.current?.abort(), [])

  async function run() {
    abort.current?.abort()
    const ctl = new AbortController()
    abort.current = ctl
    setText('')
    setError('')
    setBusy(true)
    try {
      for await (const chunk of rewriteBullets(apiKey, model, resume, jd, ctl.signal)) {
        setText((t) => t + chunk)
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold tracking-tight">Rewrite my weakest bullets</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Streams five stronger versions. It never adds facts you did not write, only [X%] placeholders.</p>
        </div>
        <div className="flex gap-2">
          {busy && (
            <button type="button" className="btn-ghost" onClick={() => abort.current?.abort()}>
              Stop
            </button>
          )}
          <button type="button" className="btn-primary" onClick={run} disabled={busy}>
            {busy ? 'Writing…' : text ? 'Rewrite again' : 'Rewrite bullets'}
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}

      {text && (
        <div className="mt-4 space-y-2" aria-live="polite">
          {text.split('\n').map((l, i) => (
            <Line key={i} text={l} />
          ))}
          {busy && <span className="inline-block h-4 w-1.5 animate-pulse bg-brand-600 align-middle" aria-hidden />}
        </div>
      )}
    </section>
  )
}
