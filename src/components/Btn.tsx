import type { ReactNode } from 'react'

interface BtnProps {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'quiet'
  type?: 'button' | 'submit'
  disabled?: boolean
  onClick?: () => void
  full?: boolean
}

export function Btn({ children, variant = 'primary', type = 'button', disabled, onClick, full }: BtnProps) {
  return (
    <button
      type={type}
      className={`btn btn--${variant}${full ? ' btn--full' : ''}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
