export type Importance = 'must' | 'nice'

export interface JdKeyword {
  term: string
  importance: Importance
  category?: string
}

export interface KeywordMatch extends JdKeyword {
  found: boolean
}

export interface MatchResult {
  items: KeywordMatch[]
  /** 0-100, must-have keywords count double. */
  coverage: number
}

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * True when `term` appears in `haystack` as a whole word or phrase.
 * Plain \b breaks on terms like "C++" or "Node.js", so the boundaries are
 * "not a letter or digit" on each side instead.
 */
export function containsTerm(haystack: string, term: string): boolean {
  const t = normalize(term).trim()
  if (!t) return false
  const re = new RegExp(`(^|[^a-z0-9])${escapeRegExp(t)}($|[^a-z0-9])`, 'i')
  if (re.test(haystack)) return true
  // "React.js" in a resume should satisfy "React" and vice versa.
  const stripped = t.replace(/\.js$/, '')
  if (stripped !== t && stripped.length > 1) {
    return new RegExp(`(^|[^a-z0-9])${escapeRegExp(stripped)}(\\.?js)?($|[^a-z0-9])`, 'i').test(haystack)
  }
  if (!t.endsWith('js')) {
    return new RegExp(`(^|[^a-z0-9])${escapeRegExp(t)}\\.js($|[^a-z0-9])`, 'i').test(haystack)
  }
  return false
}

export function matchKeywords(resume: string, keywords: JdKeyword[]): MatchResult {
  const hay = normalize(resume)
  const seen = new Set<string>()
  const items: KeywordMatch[] = []
  for (const k of keywords) {
    const key = normalize(k.term).trim()
    if (!key || seen.has(key)) continue
    seen.add(key)
    items.push({ ...k, found: containsTerm(hay, k.term) })
  }
  let total = 0
  let got = 0
  for (const i of items) {
    const w = i.importance === 'must' ? 2 : 1
    total += w
    if (i.found) got += w
  }
  return { items, coverage: total === 0 ? 0 : Math.round((got / total) * 100) }
}

export function blendScore(coverage: number, aiScore: number): number {
  const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)))
  return clamp(clamp(coverage) * 0.6 + clamp(aiScore) * 0.4)
}

export function scoreLabel(score: number): { label: string; tone: 'good' | 'ok' | 'bad' } {
  if (score >= 75) return { label: 'Strong match', tone: 'good' }
  if (score >= 50) return { label: 'Needs work', tone: 'ok' }
  return { label: 'Weak match', tone: 'bad' }
}
