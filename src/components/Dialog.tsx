import { useEffect, type ReactNode } from 'react'

interface DialogProps {
  open: boolean
  title: string
  onCloseRequest: () => void
  children: ReactNode
}

export function Dialog({ open, title, onCloseRequest, children }: DialogProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRequest()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onCloseRequest])

  if (!open) return null
  return (
    <div className="dialog-backdrop" onClick={onCloseRequest}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="dialog-title">{title}</h2>
        {children}
      </div>
    </div>
  )
}
