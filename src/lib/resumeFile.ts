import { extractPdfText } from './pdf'

type Kind = 'pdf' | 'docx' | 'doc' | 'text'

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

export function fileKind(file: Pick<File, 'name' | 'type'>): Kind {
  const name = file.name.toLowerCase()
  if (file.type === 'application/pdf' || name.endsWith('.pdf')) return 'pdf'
  if (file.type === DOCX_MIME || name.endsWith('.docx')) return 'docx'
  if (file.type === 'application/msword' || name.endsWith('.doc')) return 'doc'
  return 'text'
}

/** mammoth is loaded only when a Word file is picked. */
async function extractDocxText(file: File): Promise<string> {
  const mammoth = await import('mammoth/mammoth.browser.js')
  const { value } = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })
  return value
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** Reads a resume file (PDF, Word .docx or plain text) into text, in the browser. */
export async function readResumeFile(file: File): Promise<string> {
  const kind = fileKind(file)
  if (kind === 'doc') {
    throw new Error('Old .doc files cannot be read in the browser. Save it as .docx or PDF and upload again.')
  }
  const text = kind === 'pdf' ? await extractPdfText(file) : kind === 'docx' ? await extractDocxText(file) : await file.text()
  if (!text.trim()) {
    throw new Error('No text found. A scanned or image-only file has no text layer, so paste the text instead.')
  }
  return text
}
