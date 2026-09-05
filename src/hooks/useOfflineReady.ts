import { useEffect, useState } from 'react'

type OfflineReady = 'checking' | 'ready' | 'unavailable'

/** Reflects real service-worker readiness for the small home-screen note. */
export function useOfflineReady() {
  const [ready, setReady] = useState<OfflineReady>('checking')

  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      setReady('unavailable')
      return
    }
    let cancelled = false
    const timer = window.setTimeout(() => {
      if (!cancelled) setReady((r) => (r === 'checking' ? 'unavailable' : r))
    }, 15000)
    navigator.serviceWorker
      .ready
      .then(() => {
        if (!cancelled) setReady('ready')
      })
      .catch(() => {
        if (!cancelled) setReady('unavailable')
      })
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [])

  return ready
}
