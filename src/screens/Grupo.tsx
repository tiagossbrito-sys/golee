import { useMemo, useState } from 'react'
import { useActiveGroup, useStore, useToday } from '../store/useStore'
import { Avatar } from '../components/Avatar'
import { botMlAt, dateKey, hash, liters, rankingScore } from '../game/rules'
import type { Member } from '../game/types'
import { GROUPS_ENABLED } from '../config'
import { GrupoPreview } from './GrupoPreview'

type Period = 'dia' | 'semana' | 'geral'

export function Grupo() {
  if (!GROUPS_ENABLED) return <GrupoPreview />
  return <GrupoReal />
}

function GrupoReal() {
  const group = useActiveGroup()
  const groups = useStore((s) => s.groups)
  const setActiveGroup = useStore((s) => s.setActiveGroup)
  const createGroup = useStore((s) => s.createGroup)
  const joinDemoGroup = useStore((s) => s.joinDemoGroup)
  const joinByCode = useStore((s) => s.joinByCode)
  const leaveGroup = useStore((s) => s.leaveGroup)
  const updateGroup = useStore((s) => s.updateGroup)
  const poke = useStore((s) => s.poke)
  const userId = useStore((s) => s.userId)
  const settings = useStore((s) => s.settings)
  const history = useStore((s) => s.history)
  const { today, ml, points } = useToday()
  const [period, setPeriod] = useState<Period>('dia')
  const [toast, setToast] = useState<string | null>(null)
  const [reactions, setReactions] = useState<Record<string, string>>({})
  const [code, setCode] = useState('')
  const [newName, setNewName] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const now = Date.now()
  const todayKey = dateKey(now)

  function show(t: string) { setToast(t); setTimeout(() => setToast(null), 2200) }

  const rows = useMemo(() => {
    if (!group) return []
    const days: string[] = []
    if (period === 'dia') days.push(todayKey)
    else if (period === 'semana') {
      const d = new Date(now); const dow = (d.getDay() + 6) % 7
      for (let i = dow; i >= 0; i--) { const x = new Date(now); x.setDate(d.getDate() - i); days.push(dateKey(x.getTime())) }
    } else {
      const d = new Date(group.createdAt); d.setHours(0, 0, 0, 0)
      for (let t = d.getTime(); t <= now; t += 86400000) days.push(dateKey(t))
    }
    return group.members.map((m) => {
      let mml = 0, mpts = 0
      for (const day of days) {
        if (m.isBot) mml += botMlAt(m, day, day === todayKey ? now : new Date(day + 'T23:00:00').getTime(), settings.awakeStart, settings.awakeEnd)
        else if (day === todayKey) { mml += ml; mpts += points }
        else { mml += history[day]?.ml ?? 0; mpts += history[day]?.points ?? 0 }
      }
      const goal = m.goalMl * days.length
      return { m, ml: mml, goal, pct: goal ? mml / goal : 0, s: rankingScore(mml, goal, mpts, group.mode) }
    }).sort((a, b) => b.s - a.s || b.ml - a.ml)
  }, [group, period, todayKey, now, ml, points, history, settings.awakeStart, settings.awakeEnd])

  const groupMl = rows.reduce((a, r) => a + (period === 'dia' ? r.ml : 0), 0)
  const collective = group ? (group.collectiveGoalMl ?? group.members.reduce((a, m) => a + m.goalMl, 0)) : 0

  const feed = useMemo(() => {
    if (!group) return []
    const items: { id: string; ts: number; who: Member; text: string; mine: boolean }[] = []
    for (const g of today) items.push({ id: g.id, ts: g.ts, who: group.members.find((m) => m.id === userId)!, mine: true, text: g.ml >= 500 ? `garrafa de ${g.ml} ml` : `gole de ${g.ml} ml${g.flags.includes('ritmo') ? ' · no ritmo' : ''}` })
    for (const m of group.members.filter((x) => x.isBot)) {
      const mml = botMlAt(m, todayKey, now, settings.awakeStart, settings.awakeEnd)
      const n = Math.floor(mml / 250)
      for (let i = 1; i <= n; i++) {
        const frac = (i - 0.5) / Math.max(n, 1)
        const ts = new Date(now).setHours(settings.awakeStart, 0, 0, 0) + frac * (new Date(now).getTime() - new Date(now).setHours(settings.awakeStart, 0, 0, 0)) + (hash(`${m.id}${i}${todayKey}`) - 0.5) * 600000
        items.push({ id: `${m.id}-${i}`, ts, who: m, mine: false, text: i % 4 === 0 ? `Super Gole: ${i / 4} L` : 'gole de 250 ml' })
      }
    }
    return items.sort((a, b) => b.ts - a.ts).slice(0, 25)
  }, [group, today, userId, todayKey, now, settings.awakeStart, settings.awakeEnd])

  if (!group) {
    return (
      <div className="screen">
        <h1>Grupo</h1>
        <p className="muted">O Golee é melhor com amigos. Crie um grupo ou entre em um.</p>
        <div className="card">
          <div className="field"><label>Nome do grupo</label><input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Turma do trabalho" /></div>
          <button className="btn" onClick={() => createGroup(newName || 'Meu grupo', '💧')}>Criar grupo</button>
        </div>
        <div className="card">
          <div className="field"><label>Código de convite</label><input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="ABCDEF" maxLength={6} /></div>
          <button className="btn secondary" onClick={() => { if (!joinByCode(code)) show('Código não encontrado neste aparelho. Entrar em grupos de outras pessoas precisa do servidor (fase 1).') }}>Entrar</button>
        </div>
        <button className="btn ghost" onClick={joinDemoGroup}>Testar com o grupo de demonstração</button>
        {groups.length > 0 && <div className="card">{groups.map((g) => <button key={g.id} className="btn secondary" style={{ marginBottom: 8 }} onClick={() => setActiveGroup(g.id)}>{g.emoji} {g.name}</button>)}</div>}
        {toast && <div className="toast">{toast}</div>}
      </div>
    )
  }

  const inviteUrl = `${location.origin}${location.pathname}?join=${group.code}`
  async function invite() {
    const text = `Entra no meu grupo no Golee e vamos ver quem toma o Maior Gole do Dia. Código ${group!.code}: ${inviteUrl}`
    if (navigator.share) { try { await navigator.share({ title: 'Golee', text, url: inviteUrl }) } catch { /* cancelado */ } }
    else { await navigator.clipboard?.writeText(text); show('Convite copiado') }
  }

  const isOwner = group.ownerId === userId

  return (
    <div className="screen">
      <div className="row between">
        <h1>{group.emoji} {group.name}</h1>
        {groups.length > 1 && <select value={group.id} onChange={(e) => setActiveGroup(e.target.value)} style={{ padding: 6, borderRadius: 10, maxWidth: 140 }} aria-label="Trocar de grupo">{groups.map((g) => <option key={g.id} value={g.id}>{g.emoji} {g.name}</option>)}</select>}
      </div>
      {group.isDemo && <div className="chip warn" style={{ marginBottom: 8 }}>demonstração: Ana, Rafa, Ju e Caio são simulados</div>}
      <div className="row wrap" style={{ marginBottom: 12 }}>
        <button className="btn small" onClick={invite}>Convidar · {group.code}</button>
        <button className="btn secondary small" onClick={() => setShowSettings((v) => !v)}>Opções</button>
      </div>

      {showSettings && (
        <div className="card flat">
          <div className="switch"><div><div className="label">Modo de ranking</div><div className="sub">Percentual da meta é justo entre pesos diferentes</div></div>
            <div className="seg" style={{ width: 170 }}><button className={group.mode === 'percentual' ? 'on' : ''} disabled={!isOwner} onClick={() => updateGroup(group.id, { mode: 'percentual' })}>%</button><button className={group.mode === 'litros' ? 'on' : ''} disabled={!isOwner} onClick={() => updateGroup(group.id, { mode: 'litros' })}>litros</button></div></div>
          <div className="switch"><div><div className="label">Dia de folga do streak</div><div className="sub">Uma falta por semana não quebra</div></div><button className={`toggle${group.restDay ? ' on' : ''}`} disabled={!isOwner} onClick={() => updateGroup(group.id, { restDay: !group.restDay })} aria-label="Dia de folga" /></div>
          <div className="switch"><div><div className="label">Qualquer um convida</div></div><button className={`toggle${group.anyoneInvites ? ' on' : ''}`} disabled={!isOwner} onClick={() => updateGroup(group.id, { anyoneInvites: !group.anyoneInvites })} aria-label="Qualquer um convida" /></div>
          {!isOwner && <div className="small muted">Só quem criou o grupo muda estas opções.</div>}
          <button className="btn ghost small" style={{ marginTop: 8, color: 'var(--bad)' }} onClick={() => leaveGroup(group.id)}>Sair do grupo</button>
        </div>
      )}

      <div className="card">
        <div className="row between"><b>Gole do Grupo</b><span className="small muted">{liters(groupMl)} de {liters(collective)} hoje</span></div>
        <div className="reservoir" style={{ marginTop: 8 }}><i style={{ width: `${Math.min(100, (groupMl / Math.max(1, collective)) * 100)}%` }} /></div>
        <div className="small muted" style={{ marginTop: 6 }}>{groupMl >= collective ? 'Reservatório cheio: +30 pts para todos.' : `Faltam ${liters(collective - groupMl)} para fechar o reservatório.`}</div>
      </div>

      <div className="seg" style={{ marginBottom: 10 }}>
        {(['dia', 'semana', 'geral'] as Period[]).map((p) => <button key={p} className={period === p ? 'on' : ''} onClick={() => setPeriod(p)}>{p === 'dia' ? 'Maior Gole do Dia' : p === 'semana' ? 'Semana' : 'Geral'}</button>)}
      </div>
      <div className="card">
        {rows.map((r, i) => (
          <div key={r.m.id} className={`rank${r.m.id === userId ? ' me' : ''}`}>
            <div className={`pos${i === 0 && r.ml > 0 ? ' gold' : ''}`}>{i === 0 && r.ml > 0 ? '👑' : i + 1}</div>
            <div className="mini"><Avatar character={r.m.character} fill={Math.min(1, r.pct)} size={40} /></div>
            <div style={{ flex: 1 }}>
              <div className="name">{r.m.id === userId ? 'Você' : r.m.name}</div>
              <div className="bar"><i style={{ width: `${Math.min(100, r.pct * 100)}%` }} /></div>
            </div>
            <div className="score">{Math.round(r.pct * 100)}%<small>{settings.showLiters ? liters(r.ml) : ''}</small></div>
            {r.m.id !== userId && settings.pokes && group.pokesMode !== 'desligados' && (
              <button className="btn ghost small" title="Cutucar" onClick={() => show(poke(r.m.id) ? `Você cutucou ${r.m.name}: "bebe água!"` : 'Limite de 3 cutucões por dia para essa pessoa')}>👉</button>
            )}
          </div>
        ))}
        {period === 'geral' && <div className="small muted" style={{ marginTop: 8 }}>Geral soma desde a criação do grupo. Quem mais melhorou nos últimos 30 dias ganha destaque quando houver histórico.</div>}
      </div>

      <h2>Feed de hoje</h2>
      <div className="card">
        {feed.length === 0 && <div className="muted small">Ninguém bebeu ainda. Seja o primeiro gole do dia.</div>}
        {feed.map((f) => (
          <div key={f.id} className="feed-item">
            <span className="t">{new Date(f.ts).getHours()}:{String(new Date(f.ts).getMinutes()).padStart(2, '0')}</span>
            <Avatar character={f.who.character} fill={0.6} size={26} />
            <span><b>{f.mine ? 'Você' : f.who.name}</b> {f.text}</span>
            {!f.mine && <div className="react">{['💧', '🔥', '👏'].map((e) => <button key={e} className={reactions[f.id] === e ? 'on' : ''} onClick={() => setReactions((r) => ({ ...r, [f.id]: r[f.id] === e ? '' : e }))}>{e}</button>)}</div>}
          </div>
        ))}
      </div>
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
