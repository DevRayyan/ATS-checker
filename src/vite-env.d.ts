/// <reference types="vite/client" />

declare module 'mammoth/mammoth.browser.js' {
  export function extractRawText(input: { arrayBuffer: ArrayBuffer }): Promise<{ value: string }>
}

interface ImportMetaEnv {
  readonly VITE_GROQ_API_KEY?: string
  readonly VITE_GROQ_MODEL?: string
}
