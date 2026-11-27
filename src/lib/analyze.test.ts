import { describe, expect, it } from 'vitest'
import { extractJson, parseAnalysis } from './analyze'

const reply = {
  job_title: 'Frontend Engineer',
  summary: 'Good base, missing TypeScript.',
  quality_score: 70,
  keywords: [
    { term: 'React', importance: 'must' },
    { term: 'TypeScript', importance: 'must' },
    { term: 'Docker', importance: 'nice' },
  ],
  sections: [{ name: 'Experience', present: true, note: 'ok' }],
  strengths: ['React experience'],
  gaps: ['No TypeScript'],
  fixes: [{ title: 'Add TypeScript', why: 'Required', example: 'Built X in TypeScript' }],
}

describe('extractJson', () => {
  it('reads plain JSON', () => {
    expect(extractJson('{"a":1}')).toEqual({ a: 1 })
  })

  it('reads JSON wrapped in a code fence and prose', () => {
    expect(extractJson('Here you go:\n```json\n{"a":1}\n```')).toEqual({ a: 1 })
  })

  it('throws when there is no JSON', () => {
    expect(() => extractJson('sorry, no')).toThrow()
  })
})

describe('parseAnalysis', () => {
  it('checks keywords against the resume text, not the model', () => {
    const a = parseAnalysis(JSON.stringify(reply), 'Senior React developer')
    expect(a.keywords.find((k) => k.term === 'React')?.found).toBe(true)
    expect(a.keywords.find((k) => k.term === 'TypeScript')?.found).toBe(false)
    // must: React 2/4, nice: Docker 0/1 => 2/5 = 40
    expect(a.keywordCoverage).toBe(40)
    expect(a.score).toBe(Math.round(40 * 0.6 + 70 * 0.4))
  })

  it('survives missing or malformed fields', () => {
    const a = parseAnalysis(JSON.stringify({ keywords: [{ term: 'Go' }], quality_score: 'abc' }), 'go dev')
    expect(a.jobTitle).toBe('This role')
    expect(a.aiScore).toBe(0)
    expect(a.fixes).toEqual([])
  })

  it('rejects a reply with no keywords', () => {
    expect(() => parseAnalysis(JSON.stringify({ keywords: [] }), 'x')).toThrow(/keywords/i)
  })
})
