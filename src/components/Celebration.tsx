import { useEffect, useMemo } from 'react'
import { useStore } from '../store/useStore'
import { liters } from '../game/rules'
import { tipFor, EVIDENCIA_LABEL } from '../game/tips'

export function Celebration() {
  const c = useStore((s) => s.celebration)
  const dismiss = useStore((s) => s.dismissCelebration)
  const objective = useStore((s) => s.profile.objective)
  const tipSeed = useStore((s) => s.tipSeed)
  const goles = useStore((s) => s.goles.length)
  const tip = useMemo(() => tipFor(objective, tipSeed + goles), [objective, tipSeed, goles])
  useEffect(() => {
    if (!c) return
    const t = setTimeout(dismiss, 6000)
    return () => clearTimeout(t)
  }, [c, dismiss])
  if (!c) return null
  const drops = Array.from({ length: 18 }, (_, i) => i)
  return (
    <div className="overlay" onClick={dismiss} role="dialog" aria-live="polite">
      <div className="celebrate" onClick={(e) => e.stopPropagation()}>
        {drops.map((i) => <i key={i} className="drop" style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i % 6) * 0.12}s` }} />)}
        <div className="big">{c.kind === 'cheio' ? '🏆' : c.kind === 'super' ? '💧' : '🌊'}</div>
        <h2>{c.kind === 'cheio' ? 'Gole Cheio!' : c.kind === 'super' ? 'Super Gole!' : 'Gole do Grupo!'}</h2>
        <div className="muted">
          {c.kind === 'cheio' ? `Meta do dia batida com ${liters(c.ml)}.` : c.kind === 'super' ? `${liters(c.ml)} hoje. Mais um litro no bolso.` : 'O reservatório do grupo fechou hoje.'}
          {' '}<b>+{c.points} pts</b>
        </div>
        <div className="card flat" style={{ marginTop: 16, textAlign: 'left' }}>
          <div className="small" style={{ fontWeight: 800 }}>Sabia que?</div>
          <div>{tip.texto}</div>
          <div className="small muted" style={{ marginTop: 6 }}>
            <span className={`chip ${tip.evidencia === 'forte' ? 'good' : tip.evidencia === 'moderada' ? 'water' : ''}`}>{EVIDENCIA_LABEL[tip.evidencia]}</span>{' '}
            <a href={tip.fonte} target="_blank" rel="noreferrer">ver a fonte</a>
          </div>
        </div>
        <button className="btn" style={{ marginTop: 14 }} onClick={dismiss}>Continuar</button>
      </div>
    </div>
  )
}
