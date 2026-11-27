import { describe, expect, it } from 'vitest'
import { blendScore, containsTerm, matchKeywords, normalize, scoreLabel } from './keywords'

const hay = (s: string) => normalize(s)

describe('containsTerm', () => {
  it('matches whole words only', () => {
    expect(containsTerm(hay('Built APIs with Java'), 'java')).toBe(true)
    expect(containsTerm(hay('Wrote JavaScript daily'), 'java')).toBe(false)
  })

  it('handles terms with symbols', () => {
    expect(containsTerm(hay('Systems in C++ and C#'), 'c++')).toBe(true)
    expect(containsTerm(hay('Systems in C++ and C#'), 'c#')).toBe(true)
    expect(containsTerm(hay('I use Node.js'), 'node.js')).toBe(true)
  })

  it('treats React and React.js as the same skill', () => {
    expect(containsTerm(hay('Frontend in React.js'), 'react')).toBe(true)
    expect(containsTerm(hay('Frontend in React'), 'react.js')).toBe(true)
  })

  it('matches multi-word phrases across line breaks', () => {
    expect(containsTerm(hay('Led\nproject   management'), 'project management')).toBe(true)
  })
})

describe('matchKeywords', () => {
  const kws = [
    { term: 'React', importance: 'must' as const },
    { term: 'TypeScript', importance: 'must' as const },
    { term: 'Docker', importance: 'nice' as const },
    { term: 'react', importance: 'nice' as const },
  ]

  it('dedupes terms and flags missing ones', () => {
    const r = matchKeywords('React developer', kws)
    expect(r.items).toHaveLength(3)
    expect(r.items.find((i) => i.term === 'TypeScript')?.found).toBe(false)
  })

  it('weights must-have keywords double', () => {
    // must: React (found, 2) + TypeScript (missing, 2); nice: Docker (missing, 1) => 2/5
    expect(matchKeywords('React developer', kws).coverage).toBe(40)
  })

  it('returns 0 for no keywords', () => {
    expect(matchKeywords('anything', []).coverage).toBe(0)
  })
})

describe('score helpers', () => {
  it('blends and clamps', () => {
    expect(blendScore(100, 100)).toBe(100)
    expect(blendScore(50, 100)).toBe(70)
    expect(blendScore(-20, 500)).toBe(40)
  })

  it('labels bands', () => {
    expect(scoreLabel(80).tone).toBe('good')
    expect(scoreLabel(60).tone).toBe('ok')
    expect(scoreLabel(10).tone).toBe('bad')
  })
})
