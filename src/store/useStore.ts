import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DayRecord, Gole, GoleKind, Group, Member, Profile, Settings } from '../game/types'
import {
  botMlAt, computeStreak, dateKey, golesOfDay, rankingScore, scoreGole, suggestGoalMl, sumMl, sumPoints, UNDO_MS,
} from '../game/rules'

export interface Celebration {
  kind: 'super' | 'cheio' | 'grupo'
  ml: number
  points: number
}

export interface GoleeState {
  stage: 'onboarding' | 'app'
  userId: string
  profile: Profile
  settings: Settings
  goles: Gole[]
  groups: Group[]
  activeGroupId: string | null
  history: Record<string, DayRecord>
  character: string
  unlocked: string[]
  dailyWins: number
  weeklyWins: number
  pokesSentToday: Record<string, number>
  savedStreakFor: Record<string, string> // friendId -> week key
  celebration: Celebration | null
  warning: string | null
  tipSeed: number
  installedAt: number
  // actions
  completeOnboarding: (p: Profile, s: Partial<Settings>, groupChoice: 'criar' | 'demo' | 'entrar' | 'depois', groupName?: string, code?: string) => void
  addGole: (kind: GoleKind) => void
  undoLast: () => boolean
  setSettings: (s: Partial<Settings>) => void
  setProfile: (p: Partial<Profile>) => void
  setCharacter: (id: string) => void
  createGroup: (name: string, emoji: string) => Group
  joinDemoGroup: () => void
  joinByCode: (code: string) => boolean
  leaveGroup: (id: string) => void
  setActiveGroup: (id: string) => void
  updateGroup: (id: string, patch: Partial<Group>) => void
  poke: (friendId: string) => boolean
  dismissCelebration: () => void
  dismissWarning: () => void
  rollover: () => void
  resetAll: () => void
}

export const DEFAULT_SETTINGS: Settings = {
  glassMl: 250,
  bottleMl: null,
  goalMl: 2000,
  awakeStart: 8,
  awakeEnd: 20,
  reminderMin: 60,
  pushEnabled: true,
  skipIfRecent: true,
  groupAlerts: true,
  pokes: true,
  nightSummary: true,
  tipsPerDay: 1,
  showLiters: true,
  showTimes: true,
  theme: 'claro',
  reduceMotion: false,
  unit: 'ml',
  weatherBoost: true,
}

const DEFAULT_PROFILE: Profile = { name: '', sex: 'x', weightKg: 70, activity: 'media', objective: 'saude' }

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
}

function makeCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  let s = ''
  for (let i = 0; i < 6; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)]
  return s
}

const DEMO_BOTS: Omit<Member, 'id'>[] = [
  { name: 'Ana', character: 'baleia', isBot: true, goalMl: 2000, pace: 1.05 },
  { name: 'Rafa', character: 'cacto', isBot: true, goalMl: 2500, pace: 0.85 },
  { name: 'Ju', character: 'pinguim', isBot: true, goalMl: 2000, pace: 0.95 },
  { name: 'Caio', character: 'tartaruga', isBot: true, goalMl: 2750, pace: 0.7 },
]

export const useStore = create<GoleeState>()(
  persist(
    (set, get) => ({
      stage: 'onboarding',
      userId: uid(),
      profile: DEFAULT_PROFILE,
      settings: DEFAULT_SETTINGS,
      goles: [],
      groups: [],
      activeGroupId: null,
      history: {},
      character: 'gota',
      unlocked: ['gota', 'bolha'],
      dailyWins: 0,
      weeklyWins: 0,
      pokesSentToday: {},
      savedStreakFor: {},
      celebration: null,
      warning: null,
      tipSeed: Math.floor(Math.random() * 1000),
      installedAt: Date.now(),

      completeOnboarding: (p, s, groupChoice, groupName, code) => {
        const goalMl = s.goalMl ?? suggestGoalMl(p)
        set({ profile: p, settings: { ...get().settings, ...s, goalMl }, stage: 'app' })
        if (groupChoice === 'criar') get().createGroup(groupName || `Turma de ${p.name.split(' ')[0]}`, '💧')
        else if (groupChoice === 'demo') get().joinDemoGroup()
        else if (groupChoice === 'entrar' && code) get().joinByCode(code)
      },

      addGole: (kind) => {
        const { goles, settings } = get()
        const now = Date.now()
        const today = golesOfDay(goles, now)
        const scored = scoreGole(kind, today, settings, now)
        if (scored.blocked) {
          set({ warning: 'Mais de 6 goles em uma hora. Beber demais de uma vez também faz mal: espere um pouco. Esse gole não pontua.' })
          return
        }
        const gole: Gole = { id: uid(), ts: now, ml: scored.ml, kind, points: scored.points, flags: scored.flags }
        const next = [...goles, gole]
        const totalToday = sumMl(today) + scored.ml
        let celebration: Celebration | null = null
        const unlocked = [...get().unlocked]
        if (scored.goleCheio) {
          celebration = { kind: 'cheio', ml: totalToday, points: scored.points }
          if (!unlocked.includes('baleia')) unlocked.push('baleia')
        } else if (scored.superGole) {
          celebration = { kind: 'super', ml: totalToday, points: scored.points }
        }
        let warning: string | null = null
        if (totalToday > 5000) warning = 'Você passou de 5 litros hoje. Acima disso não há benefício e pode fazer mal. Pare por hoje.'
        set({ goles: next, celebration, warning, unlocked })
      },

      undoLast: () => {
        const { goles } = get()
        const last = goles[goles.length - 1]
        if (!last || Date.now() - last.ts > UNDO_MS) return false
        set({ goles: goles.slice(0, -1), celebration: null })
        return true
      },

      setSettings: (s) => set({ settings: { ...get().settings, ...s } }),
      setProfile: (p) => set({ profile: { ...get().profile, ...p } }),
      setCharacter: (id) => {
        if (get().unlocked.includes(id)) set({ character: id })
      },

      createGroup: (name, emoji) => {
        const { userId, profile, settings, character } = get()
        const me: Member = { id: userId, name: profile.name, character, isBot: false, goalMl: settings.goalMl }
        const g: Group = {
          id: uid(), code: makeCode(), name, emoji, scene: 'Nascente', mode: 'percentual', collectiveGoalMl: null,
          createdAt: Date.now(), ownerId: userId, anyoneInvites: true, pokesMode: 'ligados', restDay: true, maxMembers: 12,
          members: [me], isDemo: false,
        }
        set({ groups: [...get().groups, g], activeGroupId: g.id })
        return g
      },

      joinDemoGroup: () => {
        if (get().groups.some((g) => g.isDemo)) {
          set({ activeGroupId: get().groups.find((g) => g.isDemo)!.id })
          return
        }
        const { userId, profile, settings, character } = get()
        const me: Member = { id: userId, name: profile.name, character, isBot: false, goalMl: settings.goalMl }
        const bots: Member[] = DEMO_BOTS.map((b, i) => ({ ...b, id: `bot-${i}` }))
        const g: Group = {
          id: 'demo', code: 'DEMO01', name: 'Grupo de demonstração', emoji: '🧪', scene: 'Nascente', mode: 'percentual',
          collectiveGoalMl: null, createdAt: Date.now(), ownerId: 'bot-0', anyoneInvites: true, pokesMode: 'ligados',
          restDay: true, maxMembers: 12, members: [me, ...bots], isDemo: true,
        }
        set({ groups: [...get().groups, g], activeGroupId: g.id })
      },

      joinByCode: (code) => {
        const c = code.trim().toUpperCase()
        if (c === 'DEMO01') { get().joinDemoGroup(); return true }
        const g = get().groups.find((x) => x.code === c)
        if (g) { set({ activeGroupId: g.id }); return true }
        // Sem servidor, só é possível entrar em grupos deste aparelho. A fase 1 com Supabase resolve isso.
        return false
      },

      leaveGroup: (id) => {
        const groups = get().groups.filter((g) => g.id !== id)
        set({ groups, activeGroupId: groups[0]?.id ?? null })
      },
      setActiveGroup: (id) => set({ activeGroupId: id }),
      updateGroup: (id, patch) => set({ groups: get().groups.map((g) => (g.id === id ? { ...g, ...patch } : g)) }),

      poke: (friendId) => {
        const today = dateKey()
        const key = `${today}:${friendId}`
        const sent = get().pokesSentToday
        const count = sent[key] ?? 0
        if (count >= 3) return false
        set({ pokesSentToday: { ...sent, [key]: count + 1 } })
        return true
      },

      dismissCelebration: () => set({ celebration: null }),
      dismissWarning: () => set({ warning: null }),

      /** Fecha dias passados sem registro no histórico: total, percentual, vencedor do grupo. */
      rollover: () => {
        const { goles, settings, history, installedAt, groups, activeGroupId, userId } = get()
        const today = dateKey()
        const next: Record<string, DayRecord> = { ...history }
        let dailyWins = get().dailyWins
        const group = groups.find((g) => g.id === activeGroupId) ?? null
        const start = new Date(startOfDayOf(installedAt))
        const cur = new Date(start)
        let changed = false
        while (dateKey(cur.getTime()) < today) {
      const key = dateKey(cur.getTime())
          if (!next[key]) {
            const dayGoles = goles.filter((g) => dateKey(g.ts) === key)
            const ml = sumMl(dayGoles)
            const points = sumPoints(dayGoles)
            const p = settings.goalMl > 0 ? ml / settings.goalMl : 0
            let winnerId: string | null = null
            let groupMl = ml
            if (group) {
              const endOfDay = cur.getTime() + 23 * 3600 * 1000
              const scores = group.members.map((m) => {
                const mml = m.isBot ? botMlAt(m, key, endOfDay, settings.awakeStart, settings.awakeEnd) : ml
                if (m.isBot) groupMl += mml
                return { id: m.id, s: rankingScore(mml, m.goalMl, m.isBot ? 0 : points, group.mode), ml: mml }
              })
              scores.sort((a, b) => b.s - a.s || b.ml - a.ml)
              winnerId = scores[0]?.ml > 0 ? scores[0].id : null
              if (winnerId === userId) dailyWins++
            }
            next[key] = { date: key, ml, goalMl: settings.goalMl, pct: p, points, winnerId, groupMl }
            changed = true
          }
          cur.setDate(cur.getDate() + 1)
        }
        if (changed) {
          const unlocked = [...get().unlocked]
          const streak = computeStreak(Object.values(next), today, true)
          if (streak >= 3 && !unlocked.includes('cacto')) unlocked.push('cacto')
          if (streak >= 7 && !unlocked.includes('tartaruga')) unlocked.push('tartaruga')
          if (dailyWins > 0 && !unlocked.includes('pinguim')) unlocked.push('pinguim')
          set({ history: next, dailyWins, unlocked })
        }
      },

      resetAll: () => {
        localStorage.removeItem('golee')
        location.reload()
      },
    }),
    {
      name: 'golee',
      version: 2,
      migrate: (state, version) => {
        const st = state as GoleeState
        if (version < 2 && st?.settings?.theme === 'auto') st.settings = { ...st.settings, theme: 'claro' }
        return st
      },
    },
  ),
)

function startOfDayOf(ts: number): number {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/** Seletores derivados. */
export function useToday() {
  const goles = useStore((s) => s.goles)
  const settings = useStore((s) => s.settings)
  const today = golesOfDay(goles)
  const ml = sumMl(today)
  const points = sumPoints(today)
  return { today, ml, points, goalMl: settings.goalMl, pct: settings.goalMl ? ml / settings.goalMl : 0 }
}

export function useActiveGroup(): Group | null {
  const groups = useStore((s) => s.groups)
  const id = useStore((s) => s.activeGroupId)
  return groups.find((g) => g.id === id) ?? null
}

export function useStreak(): number {
  const history = useStore((s) => s.history)
  const { pct } = useToday()
  const today = dateKey()
  const days = [...Object.values(history), { date: today, pct }]
  return computeStreak(days, today, true)
}
