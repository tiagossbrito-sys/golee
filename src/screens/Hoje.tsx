import { useEffect, useMemo, useState } from 'react'
import { useActiveGroup, useStore, useStreak, useToday } from '../store/useStore'
import { Avatar } from '../components/Avatar'
import { GoleButton } from '../components/GoleButton'
import { botMlAt, dateKey, expectedGolesNow, golesForGoal, liters, nextReminder, rankingScore, UNDO_MS } from '../game/rules'
import { morningMessage, reminderMessage, rhythmLine } from '../game/messages'
import { tipFor, EVIDENCIA_LABEL } from '../game/tips'

export function Hoje({ goGroup }: { goGroup: () => void }) {
  const { today, ml, points, goalMl, pct } = useToday()
  const settings = useStore((s) => s.settings)
  const profile = useStore((s) => s.profile)
  const character = useStore((s) => s.character)
  const addGole = useStore((s) => s.addGole)
  const undoLast = useStore((s) => s.undoLast)
  const userId = useStore((s) => s.userId)
  const tipSeed = useStore((s) => s.tipSeed)
  const group = useActiveGroup()
  const streak = useStreak()
  const [now, setNow] = useState(Date.now())
  const [toast, setToast] = useState<string | null>(null)
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(t)
  }, [])

  const totalGoles = golesForGoal(goalMl, settings.glassMl)
  const done = today.length
  const expected = expectedGolesNow(settings, now)
  const behind = Math.max(0, expected - Math.floor(ml / settings.glassMl))
  const next = nextReminder(settings, now)
  const last = today[today.length - 1]
  const canUndo = last && now - last.ts < UNDO_MS
  const hour = new Date(now).getHours()
  const closed = hour >= settings.awakeEnd || hour < settings.awakeStart
  const msg = closed && pct < 1
    ? `Seu gole de hoje: ${done} de ${totalGoles}. Amanhã recomeça às ${settings.awakeStart}h e o streak continua.`
    : done === 0 && hour < 12 ? morningMessage(profile.name, totalGoles) : reminderMessage(profile.name, Math.floor(ml / settings.glassMl), totalGoles, behind)
  const tip = useMemo(() => tipFor(profile.objective, tipSeed + Number(dateKey().replace(/-/g, ''))), [profile.objective, tipSeed])

  const leader = useMemo(() => {
    if (!group) return null
    const key = dateKey(now)
    const rows = group.members.map((m) => {
      const mml = m.isBot ? botMlAt(m, key, now, settings.awakeStart, settings.awakeEnd) : ml
      return { m, ml: mml, s: rankingScore(mml, m.goalMl, m.isBot ? 0 : points, group.mode) }
    })
    rows.sort((a, b) => b.s - a.s || b.ml - a.ml)
    const myPos = rows.findIndex((r) => r.m.id === userId) + 1
    return { top: rows[0], myPos, n: rows.length }
  }, [group, ml, points, now, settings.awakeStart, settings.awakeEnd, userId])

  function show(t: string) { setToast(t); setTimeout(() => setToast(null), 2200) }

  return (
    <div className="screen hoje">
      <div className="hoje-head">
        <div className="q">Qual seu gole hoje?</div>
        <div className="total">{liters(ml)}<small>{done} {done === 1 ? 'gole' : 'goles'} de {totalGoles}</small></div>
      </div>
      <div className="avatar-wrap"><Avatar character={character} fill={pct} size={190} /></div>

      <div className="card">
        <div className="ritmo">
          <span className="small muted" style={{ minWidth: 44 }}>Ritmo</span>
          <div className="bar" aria-label={`Progresso ${Math.round(pct * 100)}%`}>
            <i style={{ width: `${Math.min(100, pct * 100)}%` }} />
            <b style={{ left: `${Math.min(100, (expected / totalGoles) * 100)}%` }} title="Onde o ritmo de um copo por hora espera você agora" />
          </div>
          <span className={`chip ${behind === 0 ? 'good' : behind === 1 ? 'warn' : ''}`}>{pct >= 1 ? 'Gole Cheio' : closed ? 'dia encerrado' : behind === 0 ? 'no ritmo' : `${behind} atrás`}</span>
        </div>
        <div className="small muted" style={{ marginTop: 8 }}>{rhythmLine(totalGoles, settings.awakeStart, settings.awakeEnd)}</div>
        <div style={{ marginTop: 8 }}>{msg}</div>
        <div className="small muted" style={{ marginTop: 6 }}>
          {next ? `Próximo lembrete às ${next.getHours()}:${String(next.getMinutes()).padStart(2, '0')}` : 'Lembretes desligados'} · streak {streak} {streak === 1 ? 'dia' : 'dias'}
        </div>
      </div>

      {leader && (
        <button className="card row between" style={{ width: '100%', border: 0, textAlign: 'left', cursor: 'pointer' }} onClick={goGroup}>
          <div>
            <div className="small muted">Maior Gole do Dia · {group!.name}</div>
            <div><b>{leader.top.m.id === userId ? 'Você' : leader.top.m.name}</b> lidera com {liters(leader.top.ml)}{leader.myPos > 1 ? ` · você é ${leader.myPos}º de ${leader.n}` : ''}</div>
          </div>
          <Avatar character={leader.top.m.character} fill={Math.min(1, leader.top.ml / leader.top.m.goalMl)} size={44} />
        </button>
      )}

      <div className="card flat">
        <div className="small" style={{ fontWeight: 800 }}>Sabia que?</div>
        <div>{tip.texto}</div>
        <div className="small muted" style={{ marginTop: 6 }}><span className={`chip ${tip.evidencia === 'forte' ? 'good' : tip.evidencia === 'moderada' ? 'water' : ''}`}>{EVIDENCIA_LABEL[tip.evidencia]}</span> <a href={tip.fonte} target="_blank" rel="noreferrer">ver a fonte</a></div>
      </div>

      <div className="gole-area">
        <GoleButton onGole={() => addGole('gole')} />
        <div className="gole-alts">
          <button className="btn secondary small" onClick={() => { addGole('meia'); show('Meia garrafa registrada') }}>Meia garrafa</button>
          <button className="btn secondary small" onClick={() => { addGole('garrafa'); show('Garrafa registrada') }}>Garrafa inteira</button>
          {canUndo && <button className="btn ghost small" onClick={() => { if (undoLast()) show('Último gole desfeito') }}>Desfazer</button>}
        </div>
        {today.length > 0 && settings.showTimes && (
          <div className="small muted">Último gole às {new Date(last!.ts).getHours()}:{String(new Date(last!.ts).getMinutes()).padStart(2, '0')} · {points} pts hoje</div>
        )}
      </div>
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
