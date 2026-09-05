interface Option<T extends string> {
  value: T
  label: string
  sub?: string
}

interface SegmentedProps<T extends string> {
  options: Option<T>[]
  value: T
  onChange: (v: T) => void
  ariaLabel: string
}

export function Segmented<T extends string>({ options, value, onChange, ariaLabel }: SegmentedProps<T>) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="segmented">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          className={`segmented-item${o.value === value ? ' is-active' : ''}`}
          onClick={() => onChange(o.value)}
        >
          <span className="segmented-label">{o.label}</span>
          {o.sub && <span className="segmented-sub">{o.sub}</span>}
        </button>
      ))}
    </div>
  )
}
