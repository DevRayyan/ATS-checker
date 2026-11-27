import { useRef, useState } from 'react'
import { readResumeFile } from '../lib/resumeFile'

interface Props {
  id: string
  title: string
  hint: string
  placeholder: string
  value: string
  onChange: (v: string) => void
  onSample: () => void
  /** Offer a PDF/TXT upload. Used for the resume only. */
  allowUpload?: boolean
}

export default function InputCard({ id, title, hint, placeholder, value, onChange, onSample, allowUpload }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [reading, setReading] = useState(false)
  const [fileError, setFileError] = useState('')

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setFileError('')
    setReading(true)
    try {
      onChange(await readResumeFile(file))
    } catch (err) {
      setFileError(err instanceof Error ? err.message : 'Could not read that file.')
    } finally {
      setReading(false)
    }
  }

  const words = value.trim() ? value.trim().split(/\s+/).length : 0

  return (
    <section className="card flex flex-col p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <label htmlFor={id} className="text-base font-bold tracking-tight">
            {title}
          </label>
          <p className="text-sm text-gray-500 dark:text-gray-400">{hint}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {allowUpload && (
            <>
              <input ref={fileRef} type="file" accept=".pdf,.docx,.doc,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,text/plain" onChange={onFile} className="sr-only" tabIndex={-1} />
              <button type="button" className="btn-quiet" onClick={() => fileRef.current?.click()} disabled={reading}>
                {reading ? 'Reading…' : 'Upload PDF / Word'}
              </button>
            </>
          )}
          <button type="button" className="btn-quiet" onClick={onSample}>
            Sample
          </button>
          {value && (
            <button type="button" className="btn-quiet" onClick={() => onChange('')}>
              Clear
            </button>
          )}
        </div>
      </div>

      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={14}
        className="field mt-3 min-h-[280px] flex-1 resize-y leading-relaxed"
      />

      <div className="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>{words.toLocaleString()} words</span>
        {fileError && (
          <span role="alert" className="text-red-600 dark:text-red-400">
            {fileError}
          </span>
        )}
      </div>
    </section>
  )
}
