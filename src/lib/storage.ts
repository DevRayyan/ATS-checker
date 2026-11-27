import { useCallback, useState } from 'react'

/** localStorage can throw (private mode, blocked site data), so every access is guarded. */
export function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export function writeStorage(key: string, value: string | null): void {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    /* storage unavailable, the app still works for this session */
  }
}

export function useStoredString(key: string, initial = ''): [string, (v: string) => void] {
  const [value, setValue] = useState<string>(() => readStorage(key) ?? initial)
  const set = useCallback(
    (v: string) => {
      setValue(v)
      writeStorage(key, v || null)
    },
    [key],
  )
  return [value, set]
}
