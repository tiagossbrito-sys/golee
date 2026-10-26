export function reminderMessage(name: string, golesDone: number, golesTotal: number, behind: number): string {
  const first = name.split(' ')[0] || 'você'
  if (golesDone >= golesTotal) return `Gole Cheio, ${first}! Hoje já fechou. Um gole extra se o calor pedir.`
  if (behind >= 2) return `${first}, você está ${behind} goles atrás do ritmo. Dois goles na próxima hora e volta ao normal.`
  if (behind === 1) return `Você está um gole atrás do ritmo. Um copo agora e você segue no ritmo de 1 por hora.`
  return `Hora do gole, ${first}. Um copo agora e você segue no ritmo de 1 por hora.`
}

export function morningMessage(name: string, golesTotal: number): string {
  const first = name.split(' ')[0] || 'você'
  return `Qual seu gole hoje, ${first}? Meta: ${golesTotal} goles. O primeiro, antes do café, vale o selo de ritmo.`
}

export function rhythmLine(golesTotal: number, awakeStart: number, awakeEnd: number): string {
  const span = awakeEnd - awakeStart
  const perHour = golesTotal / span
  if (perHour <= 1.05) return `Um copo por hora, das ${awakeStart}h às ${awakeEnd}h, e a meta fecha sozinha.`
  return `${golesTotal} goles das ${awakeStart}h às ${awakeEnd}h: um a cada ${Math.round((span / golesTotal) * 60)} minutos.`
}
