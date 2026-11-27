import { useEffect, useRef, useState } from 'react'
import Header from './components/Header'
import InputCard from './components/InputCard'
import Results from './components/Results'
import Rewrite from './components/Rewrite'
import { analyzeResume, type Analysis } from './lib/analyze'
import { DEFAULT_MODEL } from './lib/groq'
import { SAMPLE_JD, SAMPLE_RESUME } from './lib/samples'
import { useStoredString } from './lib/storage'

const API_KEY = (import.meta.env.VITE_GROQ_API_KEY as string | undefined)?.trim() ?? ''
const MODEL = (import.meta.env.VITE_GROQ_MODEL as string | undefined)?.trim() || DEFAULT_MODEL

const MIN_CHARS = 120

export default function App() {
  const [resume, setResume] = useStoredString('ats-resume')
  const [jd, setJd] = useStoredString('ats-jd')
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const resultRef = useRef<HTMLDivElement>(null)
  const abort = useRef<AbortController | null>(null)

  useEffect(() => () => abort.current?.abort(), [])

  const tooShort = resume.trim().length < MIN_CHARS || jd.trim().length < MIN_CHARS

  async function run() {
    abort.current?.abort()
    const ctl = new AbortController()
    abort.current = ctl
    setBusy(true)
    setError('')
    try {
      const result = await analyzeResume(API_KEY, MODEL, resume, jd, ctl.signal)
      setAnalysis(result)
      requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setError(err instanceof Error ? err.message : 'Something went wrong. Try again.')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 sm:pt-12">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-5xl">Will your resume get past the ATS?</h1>
          <p className="mt-3 text-base text-gray-600 dark:text-gray-400 sm:text-lg">
            Paste your resume and a job description. Get a match score, the keywords you are missing, and concrete fixes. Nothing is stored on a server.
          </p>
        </div>

        {!API_KEY && (
          <p role="alert" className="mt-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
            No Groq key was found in this build. Copy <code className="font-mono">.env.example</code> to <code className="font-mono">.env</code>, set{' '}
            <code className="font-mono">VITE_GROQ_API_KEY</code> and restart.
          </p>
        )}

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <InputCard
            id="resume"
            title="Your resume"
            hint="Paste the text or upload a PDF."
            placeholder="Paste your resume here…"
            value={resume}
            onChange={setResume}
            onSample={() => setResume(SAMPLE_RESUME)}
            allowUpload
          />
          <InputCard
            id="jd"
            title="Job description"
            hint="Paste the full posting, with requirements."
            placeholder="Paste the job description here…"
            value={jd}
            onChange={setJd}
            onSample={() => setJd(SAMPLE_JD)}
          />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button type="button" className="btn-primary !px-6 !py-3 !text-base" onClick={run} disabled={busy || tooShort || !API_KEY}>
            {busy ? 'Analyzing…' : 'Check my resume'}
          </button>
          {tooShort && !busy && <span className="text-sm text-gray-500 dark:text-gray-400">Add a bit more text to both boxes first.</span>}
        </div>

        {error && (
          <p role="alert" className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </p>
        )}

        {busy && (
          <div className="mt-8 space-y-4" aria-hidden>
            {[0, 1, 2].map((i) => (
              <div key={i} className="card h-28 animate-pulse bg-gray-100 dark:bg-gray-800/50" />
            ))}
          </div>
        )}

        <div ref={resultRef} className="scroll-mt-6">
          {analysis && !busy && (
            <div className="mt-10 space-y-5">
              <Results a={analysis} />
              <Rewrite apiKey={API_KEY} model={MODEL} resume={resume} jd={jd} />
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-gray-200 py-6 text-center text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
        Built with React, Vite and Groq · Your text is sent to Groq for analysis and is not saved by this site.
      </footer>
    </>
  )
}
