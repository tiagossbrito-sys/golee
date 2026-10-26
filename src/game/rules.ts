import type { Gole, GoleKind, Member, Profile, Settings } from './types'

export const POINTS = { gole: 10, superGole: 25, goleCheio: 50, ritmo: 5, grupo: 30, rapido: 3 }
export const MAX_GOLES_PER_HOUR = 6
export const RAPIDO_MS = 5 * 60 * 1000
export const UNDO_MS = 2 * 60 * 1000
export const SAFETY_MAX_ML = 5000

export function dateKey(ts: number = Date.now()): string {
  const d = new Date(ts)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

export function startOfDay(ts: number = Date.now()): number {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/** Meta sugerida em ml de bebidas: 2,0 L mulheres / 2,5 L homens, ajustada por peso e atividade. */
export function suggestGoalMl(p: Pick<Profile, 'sex' | 'weightKg' | 'activity'>): number {
  let base = p.sex === 'f' ? 2000 : p.sex === 'm' ? 2500 : 2250
  if (p.weightKg > 0) {
    if (p.weightKg < 55) base -= 250
    else if (p.weightKg > 100) base += 500
    else if (p.weightKg > 85) base += 250
  }
  if (p.activity === 'alta') base += 500
  else if (p.activity === 'media') base += 250
  return Math.min(4000, Math.max(1500, Math.round(base / 250) * 250))
}

export function golesForGoal(goalMl: number, glassMl: number): number {
  return Math.ceil(goalMl / glassMl)
}

export function mlForKind(kind: GoleKind, s: Settings): number {
  if (kind === 'gole') return s.glassMl
  const bottle = s.bottleMl ?? 500
  return kind === 'meia' ? Math.round(bottle / 2) : bottle
}

export function golesOfDay(goles: Gole[], ts: number = Date.now()): Gole[] {
  const key = dateKey(ts)
  return goles.filter((g) => dateKey(g.ts) === key)
}

export function sumMl(goles: Gole[]): number {
  return goles.reduce((a, g) => a + g.ml, 0)
}

export function sumPoints(goles: Gole[]): number {
  return goles.reduce((a, g) => a + g.points, 0)
}

/** Quantos goles o ritmo "um copo por hora" espera até agora. */
export function expectedGolesNow(s: Settings, now: number = Date.now()): number {
  const d = new Date(now)
  const hour = d.getHours() + d.getMinutes() / 60
  const total = golesForGoal(s.goalMl, s.glassMl)
  const span = Math.max(1, s.awakeEnd - s.awakeStart)
  if (hour < s.awakeStart) return 0
  const elapsed = Math.min(span, hour - s.awakeStart)
  return Math.min(total, Math.floor((elapsed / span) * total + 1e-9))
}

export function nextReminder(s: Settings, now: number = Date.now()): Date | null {
  if (!s.pushEnabled) return null
  const d = new Date(now)
  const step = s.reminderMin
  const minutes = d.getHours() * 60 + d.getMinutes()
  const startMin = s.awakeStart * 60
  const endMin = s.awakeEnd * 60
  let next: number
  if (minutes < startMin) next = startMin
  else {
    next = startMin + Math.ceil((minutes - startMin + 1) / step) * step
  }
  const out = new Date(d)
  if (next > endMin) {
    out.setDate(out.getDate() + 1)
    next = startMin
  }
  out.setHours(Math.floor(next / 60), next % 60, 0, 0)
  return out
}

export interface ScoredGole {
  ml: number
  points: number
  flags: Gole['flags']
  superGole: boolean
  goleCheio: boolean
  blocked: boolean
}

/** Pontua um novo gole dado o histórico do dia. */
export function scoreGole(kind: GoleKind, today: Gole[], s: Settings, now: number = Date.now()): ScoredGole {
  const ml = mlForKind(kind, s)
  const flags: Gole['flags'] = []
  const lastHour = today.filter((g) => now - g.ts < 60 * 60 * 1000)
  const before = sumMl(today)
  const after = before + ml

  if (lastHour.length >= MAX_GOLES_PER_HOUR) {
    return { ml, points: 0, flags: ['excesso'], superGole: false, goleCheio: false, blocked: true }
  }
  let points = POINTS.gole
  const last = today[today.length - 1]
  if (last && now - last.ts < RAPIDO_MS) {
    points = POINTS.rapido
    flags.push('rapido')
  }
  const d = new Date(now)
  const h = d.getHours()
  const inWindow = h >= s.awakeStart && h < s.awakeEnd
  if (inWindow && d.getMinutes() <= 15 && !flags.includes('rapido')) {
    points += POINTS.ritmo
    flags.push('ritmo')
  }
  const superGole = Math.floor(after / 1000) > Math.floor(before / 1000)
  if (superGole) points += POINTS.superGole
  const goleCheio = before < s.goalMl && after >= s.goalMl
  if (goleCheio) points += POINTS.goleCheio
  return { ml, points, flags, superGole, goleCheio, blocked: false }
}

export function pct(ml: number, goalMl: number): number {
  return goalMl > 0 ? ml / goalMl : 0
}

/** Pontuação de ranking: percentual da meta (0-150) em pontos, mais bônus. */
export function rankingScore(ml: number, goalMl: number, points: number, mode: 'percentual' | 'litros'): number {
  if (mode === 'litros') return ml
  const p = Math.min(1.5, pct(ml, goalMl))
  return Math.round(p * 1000) / 10 + points / 10
}

/** Streak tolerante: dia conta com >= 50% da meta; uma falta por semana (seg-dom) não quebra. */
export function computeStreak(days: { date: string; pct: number }[], today: string, restDay = true): number {
  const map = new Map(days.map((d) => [d.date, d.pct]))
  let streak = 0
  let misses: Record<string, number> = {}
  const cur = new Date(today + 'T12:00:00')
  // today counts only if already >= 50%
  for (let i = 0; i < 400; i++) {
    const key = dateKey(cur.getTime())
    const p = map.get(key) ?? 0
    if (p >= 0.5) streak++
    else if (i === 0) {
      // today not yet done: skip without breaking
    } else {
      const week = isoWeekKey(cur)
      misses[week] = (misses[week] ?? 0) + 1
      if (!restDay || misses[week] > 1) break
    }
    cur.setDate(cur.getDate() - 1)
  }
  return streak
}

function isoWeekKey(d: Date): string {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const day = t.getUTCDay() || 7
  t.setUTCDate(t.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((t.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${t.getUTCFullYear()}-W${week}`
}

/** Hash determinístico simples para os bots do grupo de demonstração. */
export function hash(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0) / 4294967295
}

/** Quanto um bot já bebeu num dia, em ml, dado o instante. Determinístico por (bot, data). */
export function botMlAt(bot: Member, date: string, now: number, awakeStart: number, awakeEnd: number): number {
  const pace = bot.pace ?? 0.9
  const dayVar = 0.75 + hash(`${bot.id}:${date}`) * 0.5 // 0.75 - 1.25
  const target = bot.goalMl * pace * dayVar
  const isToday = date === dateKey(now)
  if (!isToday) return Math.round(target / 50) * 50
  const d = new Date(now)
  const hour = d.getHours() + d.getMinutes() / 60
  const span = Math.max(1, awakeEnd - awakeStart)
  const frac = Math.max(0, Math.min(1, (hour - awakeStart) / span))
  const jitter = (hash(`${bot.id}:${date}:${d.getHours()}`) - 0.5) * 0.15
  const ml = target * Math.max(0, Math.min(1, frac + jitter))
  return Math.round(ml / 250) * 250
}

export function formatMl(ml: number, unit: 'ml' | 'oz' = 'ml'): string {
  if (unit === 'oz') return `${(ml / 29.5735).toFixed(1)} oz`
  if (ml >= 1000) return `${(ml / 1000).toFixed(ml % 1000 === 0 ? 0 : 2).replace('.', ',')} L`
  return `${ml} ml`
}

export function liters(ml: number): string {
  return (ml / 1000).toFixed(2).replace('.', ',') + ' L'
}
