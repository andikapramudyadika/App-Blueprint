import { useCallback, useEffect, useRef, useState } from 'react'
import type { Project } from './model'
import { SaveQueue } from './storage'

export function useProject() {
  const [project, setProject] = useState<Project | null>(null)
  const [saveStatus, setSaveStatus] = useState('Tersimpan')
  const current = useRef<Project | null>(null), revision = useRef(0), saved = useRef(0)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const queue = useRef(new SaveQueue())
  const flush = useCallback(async () => {
    clearTimeout(timer.current)
    const snapshot = current.current, at = revision.current
    if (!snapshot || saved.current === at) return true
    setSaveStatus('Menyimpan')
    try {
      await queue.current.save(snapshot)
      saved.current = Math.max(saved.current, at)
      if (revision.current === at) setSaveStatus('Tersimpan')
      return true
    } catch { setSaveStatus('Gagal menyimpan — coba lagi atau unduh backup'); return false }
  }, [])
  const update = useCallback((mutate: (draft: Project) => void) => {
    if (!current.current) return
    const draft = structuredClone(current.current)
    mutate(draft); draft.updatedAt = new Date().toISOString()
    current.current = draft; revision.current += 1; setProject(draft); setSaveStatus('Menyimpan')
    clearTimeout(timer.current); timer.current = setTimeout(() => { void flush() }, 500)
  }, [flush])
  const load = useCallback(async (next: Project | null) => {
    if (!await flush()) return false
    current.current = next; revision.current = 0; saved.current = 0; setProject(next); setSaveStatus('Tersimpan'); return true
  }, [flush])
  useEffect(() => {
    const unload = (e: BeforeUnloadEvent) => { if (revision.current !== saved.current) { void flush(); e.preventDefault(); e.returnValue = '' } }
    const hidden = () => { if (document.visibilityState === 'hidden') void flush() }
    window.addEventListener('beforeunload', unload); document.addEventListener('visibilitychange', hidden)
    return () => { clearTimeout(timer.current); window.removeEventListener('beforeunload', unload); document.removeEventListener('visibilitychange', hidden) }
  }, [flush])
  return { project, current, update, load, flush, saveStatus }
}
