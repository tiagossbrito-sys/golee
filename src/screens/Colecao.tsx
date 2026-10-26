import { useStore, useStreak } from '../store/useStore'
import { Avatar } from '../components/Avatar'
import { CHARACTERS } from '../store/characters'
import { liters } from '../game/rules'

export function Colecao() {
  const character = useStore((s) => s.character)
  const unlocked = useStore((s) => s.unlocked)
  const setCharacter = useStore((s) => s.setCharacter)
  const history = useStore((s) => s.history)
  const dailyWins = useStore((s) => s.dailyWins)
  const profile = useStore((s) => s.profile)
  const streak = useStreak()
  const days = Object.values(history)
  const totalMl = days.reduce((a, d) => a + d.ml, 0)
  const cheios = days.filter((d) => d.pct >= 1).length
  const month = new Date().toLocaleDateString('pt-BR', { month: 'long' })

  async function share() {
    const text = `Meu Golee: ${liters(totalMl)} bebidos, ${cheios} Goles Cheios, streak de ${streak} dias e ${dailyWins}x Maior Gole do Dia. Qual seu gole hoje?`
    if (navigator.share) { try { await navigator.share({ title: 'Golee', text }) } catch { /* cancelado */ } }
    else await navigator.clipboard?.writeText(text)
  }

  return (
    <div className="screen">
      <h1>Coleção</h1>
      <div className="card row" style={{ gap: 16 }}>
        <Avatar character={character} fill={1} size={90} happy />
        <div>
          <div className="small muted">Títulos de {profile.name.split(' ')[0]}</div>
          <div><b>Maior Gole do Dia</b> x{dailyWins}</div>
          <div><b>Gole Cheio</b> x{cheios}</div>
          <div><b>Streak</b> {streak} {streak === 1 ? 'dia' : 'dias'}</div>
        </div>
      </div>
      <h2>Personagens</h2>
      <div className="grid">
        {CHARACTERS.map((c) => {
          const ok = unlocked.includes(c.id)
          return (
            <button key={c.id} className={`char${character === c.id ? ' on' : ''}${ok ? '' : ' locked'}`} onClick={() => ok && setCharacter(c.id)} aria-pressed={character === c.id}>
              <Avatar character={c.id} fill={ok ? 0.7 : 0.15} size={70} />
              <div className="name">{c.name}</div>
              <div className="how">{ok ? 'desbloqueado' : c.unlock}</div>
            </button>
          )
        })}
      </div>
      <h2>Resumo de {month}</h2>
      <div className="card">
        <div className="row between"><span>Total bebido</span><b>{liters(totalMl)}</b></div>
        <div className="row between"><span>Dias com Gole Cheio</span><b>{cheios} de {days.length}</b></div>
        <div className="row between"><span>Maior Gole do Dia</span><b>{dailyWins}x</b></div>
        <button className="btn secondary" style={{ marginTop: 10 }} onClick={share}>Compartilhar card</button>
      </div>
    </div>
  )
}
