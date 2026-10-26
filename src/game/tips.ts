import type { Objective } from './types'

export type Evidence = 'forte' | 'moderada' | 'fraca'
export interface Tip {
  id: string
  tema: Objective | 'rins' | 'humor' | 'cabeca' | 'treino'
  texto: string
  evidencia: Evidence
  fonte: string
}

export const TIPS: Tip[] = [
  { id: 't1', tema: 'emagrecer', evidencia: 'moderada', fonte: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11013432/', texto: 'Um gole antes do almoço ajuda a comer menos. Troque o refri de hoje por água e some os dois efeitos.' },
  { id: 't2', tema: 'emagrecer', evidencia: 'moderada', fonte: 'https://jamanetwork.com/journals/jamanetworkopen/fullarticle/2827021', texto: 'Água no lugar de bebida açucarada: cerca de 0,8 kg a menos em ensaios clínicos. Água sozinha não emagrece, a troca sim.' },
  { id: 't3', tema: 'pele', evidencia: 'moderada', fonte: 'https://northbiomedical.com/articles/drinking-water-for-skin/', texto: 'Pele hidratada começa por dentro: quem bebia pouco e passou a beber 2 L viu a pele mais hidratada em 30 dias.' },
  { id: 't4', tema: 'saude', evidencia: 'fraca', fonte: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6356561/', texto: 'Fibra precisa de água para funcionar. Seu gole de hoje ajuda o intestino a fazer a parte dele.' },
  { id: 't5', tema: 'rins', evidencia: 'forte', fonte: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9991749/', texto: 'Rins gostam de volume: 2,5 L por dia é a recomendação para evitar pedra nos rins.' },
  { id: 't6', tema: 'energia', evidencia: 'moderada', fonte: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6356561/', texto: 'Aquele cansaço das 15h pode ser sede. Um gole antes do café.' },
  { id: 't7', tema: 'humor', evidencia: 'moderada', fonte: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6356561/', texto: 'Desidratação leve está associada a mais irritação e fadiga. Beber no ritmo deixa o dia mais leve.' },
  { id: 't8', tema: 'cabeca', evidencia: 'fraca', fonte: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6356561/', texto: 'Dor de cabeça no fim do dia? Verifique seu gole de hoje antes de qualquer coisa.' },
  { id: 't9', tema: 'treino', evidencia: 'moderada', fonte: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6356561/', texto: 'Perder 2% do peso em suor já derruba o desempenho. Dia de treino ou calor: mais 2 goles.' },
  { id: 't10', tema: 'saude', evidencia: 'forte', fonte: 'https://www.ocu.org/alimentacion/agua/consejos/ingesta-agua', texto: 'A recomendação europeia é 2,0 L (mulheres) e 2,5 L (homens) de água total por dia; 70 a 80% disso vem de bebidas.' },
]

export function tipFor(objective: Objective, seed: number): Tip {
  const pool = TIPS.filter((t) => t.tema === objective)
  const rest = TIPS.filter((t) => t.tema !== objective)
  // 2 em 3 chances de vir do objetivo escolhido
  const useObj = seed % 3 !== 2 && pool.length > 0
  const list = useObj ? pool : rest
  return list[seed % list.length]
}

export const EVIDENCIA_LABEL: Record<Evidence, string> = {
  forte: 'evidência forte',
  moderada: 'evidência moderada',
  fraca: 'evidência fraca',
}
