const base = import.meta.env.BASE_URL

export default function Header() {
  return (
    <header className="border-b border-gray-200 bg-white/80 backdrop-blur dark:border-gray-800 dark:bg-[#0d1117]/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <a href={base} aria-label="ATS Checker home">
          <img
            src={`${base}brand/ats-checker-logo.svg`}
            alt="ATS Checker"
            className="h-8 w-auto sm:h-9"
          />
        </a>
        <nav className="flex items-center gap-2">
          <a href="https://github.com/DevRayyan/ATS-checker" target="_blank" rel="noreferrer" className="btn-ghost !px-3 !py-2">
            GitHub
          </a>
        </nav>
      </div>
    </header>
  )
}
