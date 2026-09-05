import { useId, useState } from 'react'

interface NumFieldProps {
  label: string
  value: string
  onChange: (v: string) => void
  onSubmit?: () => void
  placeholder?: string
  maxLength?: number
  error?: string
  /** Mask the value (secret entry). Pairs with showToggle. */
  masked?: boolean
  wide?: boolean
  autoFocus?: boolean
  disabled?: boolean
  helper?: string
}

/** Large centred numeric entry. All digits-only; validation copy shows below. */
export function NumField({
  label,
  value,
  onChange,
  onSubmit,
  placeholder,
  maxLength,
  error,
  masked,
  wide,
  autoFocus,
  disabled,
  helper,
}: NumFieldProps) {
  const id = useId()
  const [revealed, setRevealed] = useState(false)
  const hidden = masked && !revealed

  return (
    <div className="field">
      <div className="field-head">
        <label className="field-label" htmlFor={id}>
          {label}
        </label>
        {masked && (
          <button
            type="button"
            className="btn btn--quiet btn--small"
            onClick={() => setRevealed((r) => !r)}
          >
            {revealed ? 'Hide number' : 'Show number'}
          </button>
        )}
      </div>
      <input
        id={id}
        className={`field-input${wide ? ' field-input--code' : ''}${error ? ' has-error' : ''}`}
        inputMode="numeric"
        autoComplete="off"
        autoFocus={autoFocus}
        disabled={disabled}
        type={hidden ? 'password' : 'text'}
        placeholder={placeholder}
        maxLength={maxLength}
        value={value}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-err` : undefined}
        onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, '').slice(0, maxLength ?? 3))}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && onSubmit && value !== '') {
            e.preventDefault()
            onSubmit()
          }
        }}
      />
      {helper && !error && <p className="field-helper">{helper}</p>}
      {error && (
        <p className="field-error" id={`${id}-err`} role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
