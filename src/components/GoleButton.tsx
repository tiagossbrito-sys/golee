import { useState } from 'react'

export function GoleButton({ onGole, label = 'Gole', sub }: { onGole: () => void; label?: string; sub?: string }) {
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([])
  const [pop, setPop] = useState(false)
  return (
    <button
      className={`gole-btn${pop ? ' pop' : ''}`}
      aria-label={`Registrar um gole: ${sub ?? "um copo"}`}
      onPointerDown={(e) => {
        const r = (e.currentTarget as HTMLButtonElement).getBoundingClientRect()
        const id = Date.now()
        setRipples((rs) => [...rs, { id, x: e.clientX - r.left, y: e.clientY - r.top }])
        setTimeout(() => setRipples((rs) => rs.filter((x) => x.id !== id)), 650)
      }}
      onClick={() => {
        setPop(false)
        requestAnimationFrame(() => setPop(true))
        if ('vibrate' in navigator) navigator.vibrate?.(12)
        onGole()
      }}
    >
      {ripples.map((r) => <span key={r.id} className="ripple" style={{ left: r.x - 20, top: r.y - 20, width: 40, height: 40 }} />)}
      <span className="gole-label">{label}</span>
      {sub && <span className="gole-sub">{sub}</span>}
    </button>
  )
}
