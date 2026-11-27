import { chat, streamChat, type ChatMessage } from './groq'
import { blendScore, matchKeywords, type Importance, type JdKeyword, type KeywordMatch } from './keywords'

export interface Fix {
  title: string
  why: string
  example?: string
}

export interface SectionCheck {
  name: string
  present: boolean
  note: string
}

export interface Analysis {
  /** False when no job description was given and the role was inferred from the resume. */
  hasJd: boolean
  jobTitle: string
  summary: string
  aiScore: number
  keywordCoverage: number
  score: number
  keywords: KeywordMatch[]
  sections: SectionCheck[]
  strengths: string[]
  gaps: string[]
  fixes: Fix[]
}

// Keeps a request well inside the model's context window.
const MAX_CHARS = 14000

const SHAPE = `{
  "job_title": string,
  "summary": string,                       // 2 sentences, plain language, addressed to the candidate
  "quality_score": number,                 // 0-100, how well the resume fits THIS job (experience, level, relevance, clarity)
  "keywords": [ { "term": string, "importance": "must" | "nice", "category": string } ],
  "sections": [ { "name": string, "present": boolean, "note": string } ],
  "strengths": [string],                   // 3-5 items
  "gaps": [string],                        // 3-5 items
  "fixes": [ { "title": string, "why": string, "example": string } ]  // 4-6 concrete edits, most valuable first
}`

const COMMON_RULES = `- "sections" must check these in order: Contact details, Summary, Experience, Education, Skills. Add Projects or Certifications only if the job needs them.
- Never invent experience the resume does not show. In "example", rewrite a real line from the resume or show a pattern the candidate can fill in with their own facts.
- Be specific and honest. Do not flatter.
- Also judge ATS readability: flag layouts that parsers struggle with (tables, columns, text in images, icons instead of words, missing dates, unusual headings) in "gaps" or "fixes", but only when the text suggests them.`

const ANALYSIS_SYSTEM = `You are an expert technical recruiter and ATS (applicant tracking system) specialist.
Compare a resume with a job description and answer with ONE JSON object, no prose, in exactly this shape:
${SHAPE}
Rules:
- "keywords" are the skills, tools, technologies, certifications and role terms the job description asks for. Use 12-25 terms, the exact wording from the job description, short (1-3 words). "must" = required, "nice" = preferred or optional.
${COMMON_RULES}`

const GENERAL_SYSTEM = `You are an expert technical recruiter and ATS (applicant tracking system) specialist.
No job description was given. Work out the most likely target role from the resume, review the resume for that role, and answer with ONE JSON object, no prose, in exactly this shape:
${SHAPE}
Rules:
- "job_title" is the target role you inferred, for example "Frontend Developer".
- "quality_score" is the general ATS-readiness and strength of the resume for that role: structure, clarity, quantified results and relevant skills.
- "keywords" are the skills, tools and terms that recruiters and ATS filters usually look for in that role. Use 12-25 short terms (1-3 words), mixing ones the resume already has with important ones it lacks. "must" = core to the role, "nice" = a plus.
${COMMON_RULES}`

function clip(text: string): string {
  const t = text.trim()
  return t.length > MAX_CHARS ? t.slice(0, MAX_CHARS) : t
}

function userPrompt(resume: string, jd: string): string {
  const resumeBlock = `RESUME:\n"""\n${clip(resume)}\n"""`
  if (!jd.trim()) return resumeBlock
  return `JOB DESCRIPTION:\n"""\n${clip(jd)}\n"""\n\n${resumeBlock}`
}

const str = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v.trim() : fallback)
const strList = (v: unknown): string[] =>
  Array.isArray(v) ? v.map((x) => str(x)).filter(Boolean) : []

/** Models sometimes wrap JSON in a code fence or add a sentence around it. */
export function extractJson(raw: string): unknown {
  const text = raw.trim()
  try {
    return JSON.parse(text)
  } catch {
    const start = text.indexOf('{')
    const end = text.lastIndexOf('}')
    if (start >= 0 && end > start) return JSON.parse(text.slice(start, end + 1))
    throw new Error('The model did not return valid JSON.')
  }
}

export function parseAnalysis(raw: string, resume: string, hasJd = true): Analysis {
  const data = extractJson(raw) as Record<string, unknown>

  const keywords: JdKeyword[] = (Array.isArray(data.keywords) ? data.keywords : [])
    .map((k: any): JdKeyword => ({
      term: str(k?.term),
      importance: (k?.importance === 'nice' ? 'nice' : 'must') as Importance,
      category: str(k?.category) || undefined,
    }))
    .filter((k) => k.term)

  if (keywords.length === 0) {
    throw new Error(
      hasJd
        ? 'No keywords were found in the job description. Paste the full text and try again.'
        : 'Could not work out the role from this resume. Add more detail, or paste a job description.',
    )
  }

  // The model only proposes keywords. Whether each one is in the resume is checked here.
  const match = matchKeywords(resume, keywords)
  const aiScore = Math.max(0, Math.min(100, Math.round(Number(data.quality_score) || 0)))

  return {
    hasJd,
    jobTitle: str(data.job_title, 'This role'),
    summary: str(data.summary),
    aiScore,
    keywordCoverage: match.coverage,
    score: blendScore(match.coverage, aiScore),
    keywords: match.items,
    sections: (Array.isArray(data.sections) ? data.sections : [])
      .map((s: any) => ({ name: str(s?.name), present: Boolean(s?.present), note: str(s?.note) }))
      .filter((s) => s.name),
    strengths: strList(data.strengths),
    gaps: strList(data.gaps),
    fixes: (Array.isArray(data.fixes) ? data.fixes : [])
      .map((f: any) => ({ title: str(f?.title), why: str(f?.why), example: str(f?.example) || undefined }))
      .filter((f) => f.title),
  }
}

export async function analyzeResume(
  key: string,
  model: string,
  resume: string,
  jd: string,
  signal?: AbortSignal,
): Promise<Analysis> {
  const messages: ChatMessage[] = [
    { role: 'system', content: jd.trim() ? ANALYSIS_SYSTEM : GENERAL_SYSTEM },
    { role: 'user', content: userPrompt(resume, jd) },
  ]
  const raw = await chat(key, { model, messages, json: true, temperature: 0.1, signal })
  return parseAnalysis(raw, resume, Boolean(jd.trim()))
}

const REWRITE_SYSTEM = `You are a resume editor. Rewrite the weakest experience bullets of the resume so they fit the job description. If no job description is given, make them stronger for the role the resume is aiming at.
Rules:
- Pick the 5 weakest or least relevant bullets from the resume.
- For each, output the original line, then the improved line. Use this format exactly:

**Before:** <original>
**After:** <improved>

- Start each improved bullet with a strong verb, keep it to one line, and use the job description's wording where it is true.
- NEVER add numbers, tools, employers or results that are not in the resume. If a metric would help, write a placeholder like [X%] for the candidate to fill in.
- No intro and no closing text.`

export function rewriteBullets(
  key: string,
  model: string,
  resume: string,
  jd: string,
  signal?: AbortSignal,
): AsyncGenerator<string> {
  return streamChat(key, {
    model,
    signal,
    temperature: 0.4,
    messages: [
      { role: 'system', content: REWRITE_SYSTEM },
      { role: 'user', content: userPrompt(resume, jd) },
    ],
  })
}
