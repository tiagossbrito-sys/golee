export type Sex = 'f' | 'm' | 'x'
export type Activity = 'baixa' | 'media' | 'alta'
export type Objective = 'saude' | 'emagrecer' | 'pele' | 'energia'
export type GoleKind = 'gole' | 'meia' | 'garrafa'
export type RankingMode = 'percentual' | 'litros'

export interface Profile {
  name: string
  sex: Sex
  weightKg: number
  activity: Activity
  objective: Objective
}

export interface Settings {
  glassMl: number
  bottleMl: number | null
  goalMl: number
  awakeStart: number // hour 0-23
  awakeEnd: number
  reminderMin: 30 | 45 | 60 | 90
  pushEnabled: boolean
  skipIfRecent: boolean
  groupAlerts: boolean
  pokes: boolean
  nightSummary: boolean
  tipsPerDay: 0 | 1 | 2
  showLiters: boolean
  showTimes: boolean
  theme: 'auto' | 'claro' | 'escuro'
  reduceMotion: boolean
  unit: 'ml' | 'oz'
  weatherBoost: boolean
}

export interface Gole {
  id: string
  ts: number
  ml: number
  kind: GoleKind
  points: number
  flags: ('ritmo' | 'rapido' | 'excesso' | 'editado')[]
}

export interface Member {
  id: string
  name: string
  character: string
  isBot: boolean
  goalMl: number
  pace?: number // bots: fraction of goal per day
  seed?: number
}

export interface Group {
  id: string
  code: string
  name: string
  emoji: string
  scene: string
  mode: RankingMode
  collectiveGoalMl: number | null
  createdAt: number
  ownerId: string
  anyoneInvites: boolean
  pokesMode: 'ligados' | 'acordado' | 'desligados'
  restDay: boolean
  maxMembers: number
  members: Member[]
  isDemo: boolean
}

export interface DayRecord {
  date: string // YYYY-MM-DD
  ml: number
  goalMl: number
  pct: number
  points: number
  winnerId: string | null
  groupMl: number
}

export interface Reaction {
  id: string
  goleId: string
  from: string
  emoji: string
}
