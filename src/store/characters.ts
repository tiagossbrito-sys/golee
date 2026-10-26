export interface Character {
  id: string
  name: string
  unlock: string // como desbloquear
  premium?: boolean
}

export const CHARACTERS: Character[] = [
  { id: 'gota', name: 'Gota', unlock: 'Inicial' },
  { id: 'bolha', name: 'Bolha', unlock: 'Inicial' },
  { id: 'baleia', name: 'Baleia', unlock: 'Primeiro Gole Cheio' },
  { id: 'cacto', name: 'Cacto', unlock: 'Streak de 3 dias' },
  { id: 'pinguim', name: 'Pinguim', unlock: 'Primeiro Maior Gole do Dia' },
  { id: 'tartaruga', name: 'Tartaruga', unlock: 'Streak de 7 dias' },
  { id: 'axolote', name: 'Axolote', unlock: 'Golee+', premium: true },
  { id: 'polvo', name: 'Polvo', unlock: 'Golee+', premium: true },
]

export const SCENES = ['Nascente', 'Cachoeira', 'Lagoa', 'Recife']
