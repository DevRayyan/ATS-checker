import type { Analysis } from '../lib/analyze'
import { scoreLabel } from '../lib/keywords'

const TONE = {
  good: { ring: 'stroke-brand-600', text: 'text-brand-700 dark:text-brand-400', pill: 'bg-brand-100 text-brand-800 dark:bg-brand-800/40 dark:text-brand-200' },
  ok: { ring: 'stroke-amber-500', text: 'text-amber-700 dark:text-amber-400', pill: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200' },
  bad: { ring: 'stroke-red-500', text: 'text-red-700 dark:text-red-400', pill: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200' },
} as const

function ScoreRing({ score }: { score: number }) {
  const r = 52
  const c = 2 * Math.PI * r
  const tone = TONE[scoreLabel(score).tone]
  return (
    <div className="relative h-36 w-36 shrink-0" role="img" aria-label={`ATS score ${score} out of 100`}>
      <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90">
        <circle cx="64" cy="64" r={r} fill="none" strokeWidth="10" className="stroke-gray-200 dark:stroke-gray-800" />
        <circle
          cx="64"
          cy="64"
          r={r}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * score) / 100}
          className={`${tone.ring} transition-[stroke-dashoffset] duration-700`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-4xl font-bold tracking-tight ${tone.text}`}>{score}</span>
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">out of 100</span>
      </div>
    </div>
  )
}

function Meter({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span className="font-semibold">{label}</span>
        <span className="text-gray-500 dark:text-gray-400">{value}%</span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
        <div className="h-full rounded-full bg-brand-600" style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

function Check({ ok }: { ok: boolean }) {
  return ok ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0 text-brand-600" aria-label="Found">
      <circle cx="12" cy="12" r="10" fill="currentColor" />
      <path d="M7.5 12.5l3 3 6-6.5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0 text-red-500" aria-label="Missing">
      <circle cx="12" cy="12" r="10" fill="currentColor" />
      <path d="M8.5 8.5l7 7M15.5 8.5l-7 7" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}

function Bullets({ items, tone }: { items: string[]; tone: 'good' | 'bad' }) {
  if (items.length === 0) return <p className="text-sm text-gray-500">Nothing to show.</p>
  return (
    <ul className="space-y-2">
      {items.map((t, i) => (
        <li key={i} className="flex gap-2.5 text-sm leading-relaxed">
          <span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${tone === 'good' ? 'bg-brand-600' : 'bg-red-500'}`} aria-hidden />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  )
}

export default function Results({ a }: { a: Analysis }) {
  const { label, tone } = scoreLabel(a.score)
  const found = a.keywords.filter((k) => k.found)
  const missing = a.keywords.filter((k) => !k.found)
  const missingMust = missing.filter((k) => k.importance === 'must')

  return (
    <div className="space-y-5" aria-live="polite">
      <section className="card p-5 sm:p-6">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
          <ScoreRing score={a.score} />
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <span className={`chip ${TONE[tone].pill}`}>{label}</span>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">{a.jobTitle}</h2>
            {a.summary && <p className="mt-1.5 text-[15px] leading-relaxed text-gray-600 dark:text-gray-300">{a.summary}</p>}
          </div>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Meter label="Keyword match" value={a.keywordCoverage} />
          <Meter label="Fit and clarity (AI review)" value={a.aiScore} />
        </div>
        <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
          Overall = 60% keyword match + 40% AI review. Keywords are checked against your text in the browser, not by the AI.
        </p>
      </section>

      <section className="card p-5 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-lg font-bold tracking-tight">Keywords</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {found.length} of {a.keywords.length} found
            {missingMust.length > 0 && <> · {missingMust.length} required missing</>}
          </p>
        </div>

        {missing.length > 0 && (
          <>
            <p className="label mt-4">Missing</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {missing.map((k) => (
                <span
                  key={k.term}
                  title={k.importance === 'must' ? 'Required' : 'Nice to have'}
                  className={`chip ${k.importance === 'must' ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}
                >
                  {k.term}
                  {k.importance === 'must' && <span className="opacity-60">· required</span>}
                </span>
              ))}
            </div>
          </>
        )}

        {found.length > 0 && (
          <>
            <p className="label mt-5">Found in your resume</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {found.map((k) => (
                <span key={k.term} className="chip bg-brand-100 text-brand-800 dark:bg-brand-800/40 dark:text-brand-200">
                  {k.term}
                </span>
              ))}
            </div>
          </>
        )}
      </section>

      <div className="grid gap-5 md:grid-cols-2">
        <section className="card p-5 sm:p-6">
          <h3 className="mb-3 text-lg font-bold tracking-tight">What is working</h3>
          <Bullets items={a.strengths} tone="good" />
        </section>
        <section className="card p-5 sm:p-6">
          <h3 className="mb-3 text-lg font-bold tracking-tight">Gaps to close</h3>
          <Bullets items={a.gaps} tone="bad" />
        </section>
      </div>

      {a.sections.length > 0 && (
        <section className="card p-5 sm:p-6">
          <h3 className="mb-3 text-lg font-bold tracking-tight">Resume sections</h3>
          <ul className="divide-y divide-gray-200 dark:divide-gray-800">
            {a.sections.map((s) => (
              <li key={s.name} className="flex items-start gap-3 py-2.5">
                <span className="mt-0.5">
                  <Check ok={s.present} />
                </span>
                <div className="text-sm">
                  <p className="font-semibold">{s.name}</p>
                  {s.note && <p className="text-gray-600 dark:text-gray-400">{s.note}</p>}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {a.fixes.length > 0 && (
        <section className="card p-5 sm:p-6">
          <h3 className="mb-4 text-lg font-bold tracking-tight">Fix these first</h3>
          <ol className="space-y-4">
            {a.fixes.map((f, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand-600 text-sm font-bold text-white">{i + 1}</span>
                <div className="min-w-0">
                  <p className="font-semibold">{f.title}</p>
                  <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">{f.why}</p>
                  {f.example && (
                    <p className="mt-2 rounded-lg border-l-4 border-brand-500 bg-gray-50 px-3 py-2 text-sm leading-relaxed dark:bg-[#0d1117]">{f.example}</p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  )
}
