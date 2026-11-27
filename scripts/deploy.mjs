// Publishes dist/ to the gh-pages branch (GitHub Pages serves that branch).
import { execSync } from 'node:child_process'
import { cpSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const run = (cmd, cwd) => execSync(cmd, { cwd, stdio: 'inherit' })
const remote = execSync('git remote get-url origin').toString().trim()

const dir = mkdtempSync(join(tmpdir(), 'ats-pages-'))
try {
  cpSync('dist', dir, { recursive: true })
  writeFileSync(join(dir, '.nojekyll'), '')
  // Single-page app on Pages: unknown paths fall back to the app.
  cpSync(join('dist', 'index.html'), join(dir, '404.html'))
  run('git init -q -b gh-pages', dir)
  run('git add -A', dir)
  run('git commit -q -m "Deploy to GitHub Pages"', dir)
  run(`git push -f ${remote} gh-pages`, dir)
} finally {
  rmSync(dir, { recursive: true, force: true })
}
