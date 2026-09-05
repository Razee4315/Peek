const asset = (p: string) => `${import.meta.env.BASE_URL}${p.replace(/^\//, '')}`

interface MascotProps {
  size?: number
  mark?: boolean
  className?: string
}

/** Brand artwork. Full-color mark at 48px+, simplified ink mark below that. */
export function Mascot({ size = 96, mark = false, className }: MascotProps) {
  return (
    <img
      src={asset(mark ? 'brand/logo-mono.svg' : 'brand/logo.svg')}
      width={(size * 192) / 160}
      height={size}
      alt=""
      aria-hidden="true"
      className={className}
      draggable={false}
    />
  )
}

export function Wordmark({ height = 26 }: { height?: number }) {
  return (
    <img
      src={asset('brand/wordmark.svg')}
      height={height}
      width={(height * 176) / 64}
      alt="Peek"
      className="wordmark"
      draggable={false}
    />
  )
}
