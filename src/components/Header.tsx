import { useEffect, useState } from 'react'
import { writeStorage } from '../lib/storage'

const base = import.meta.env.BASE_URL

function useDark() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])
  return [
    dark,
    () => {
      const next = !dark
      setDark(next)
      writeStorage('ats-theme', next ? 'dark' : 'light')
    },
  ] as const
}

export default function Header() {
  const [dark, toggle] = useDark()
  return (
    <header className="border-b border-gray-200 bg-white/80 backdrop-blur dark:border-gray-800 dark:bg-[#0d1117]/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <a href={base} aria-label="ATS Checker home">
          <img
            src={`${base}brand/${dark ? 'ats-checker-logo-light.svg' : 'ats-checker-logo.svg'}`}
            alt="ATS Checker"
            className="h-8 w-auto sm:h-9"
          />
        </a>
        <nav className="flex items-center gap-2">
          <a href="https://github.com/DevRayyan/ATS-checker" target="_blank" rel="noreferrer" className="btn-ghost !px-3 !py-2">
            GitHub
          </a>
          <button
            type="button"
            onClick={toggle}
            aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="btn-ghost !px-2.5 !py-2"
          >
            {dark ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
              </svg>
            )}
          </button>
        </nav>
      </div>
    </header>
  )
}
