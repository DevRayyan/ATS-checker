import { describe, expect, it } from 'vitest'
import { fileKind } from './resumeFile'

describe('fileKind', () => {
  it('detects PDF by type or extension', () => {
    expect(fileKind({ name: 'cv.pdf', type: '' })).toBe('pdf')
    expect(fileKind({ name: 'cv', type: 'application/pdf' })).toBe('pdf')
  })

  it('detects Word documents', () => {
    expect(fileKind({ name: 'My CV.DOCX', type: '' })).toBe('docx')
    expect(fileKind({ name: 'cv', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })).toBe('docx')
    expect(fileKind({ name: 'old.doc', type: 'application/msword' })).toBe('doc')
  })

  it('treats anything else as text', () => {
    expect(fileKind({ name: 'cv.txt', type: 'text/plain' })).toBe('text')
    expect(fileKind({ name: 'cv.md', type: '' })).toBe('text')
  })
})
