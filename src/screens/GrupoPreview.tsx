import { Avatar } from '../components/Avatar'
import { SOON_LABEL } from '../config'

const DEMO = [
  { name: 'Ana', character: 'baleia', pct: 1.0, l: '2,00 L' },
  { name: 'Você', character: 'gota', pct: 0.75, l: '1,50 L' },
  { name: 'Rafa', character: 'cacto', pct: 0.6, l: '1,50 L' },
  { name: 'Ju', character: 'pinguim', pct: 0.5, l: '1,00 L' },
]

/** Prévia ilustrativa da aba Grupo enquanto o servidor não existe. */
export function GrupoPreview() {
  return (
    <div className="screen">
      <div className="row between"><h1>Grupo</h1><span className="chip warn">{SOON_LABEL}</span></div>
      <div className="card">
        <b>Jogar com amigos chega na próxima versão.</b>
        <div className="muted small" style={{ marginTop: 4 }}>Você vai criar um grupo, convidar por link e disputar o Maior Gole do Dia, da Semana e Geral. Enquanto isso, seus goles já contam: tudo fica guardado para quando os grupos abrirem.</div>
      </div>
      <div className="soon-block" aria-hidden="true">
        <div className="row" style={{ marginBottom: 12 }}>
          <button className="btn small" disabled>Convidar · ABCDEF</button>
          <button className="btn secondary small" disabled>Opções</button>
        </div>
        <div className="card">
          <div className="row between"><b>Gole do Grupo</b><span className="small muted">6,00 L de 9,00 L hoje</span></div>
          <div className="reservoir" style={{ marginTop: 8 }}><i style={{ width: '66%' }} /></div>
        </div>
        <div className="seg" style={{ marginBottom: 10 }}><button className="on">Maior Gole do Dia</button><button>Semana</button><button>Geral</button></div>
        <div className="card">
          {DEMO.map((r, i) => (
            <div key={r.name} className={`rank${r.name === 'Você' ? ' me' : ''}`}>
              <div className={`pos${i === 0 ? ' gold' : ''}`}>{i === 0 ? '👑' : i + 1}</div>
              <div className="mini"><Avatar character={r.character} fill={r.pct} size={40} /></div>
              <div style={{ flex: 1 }}><div className="name">{r.name}</div><div className="bar"><i style={{ width: `${r.pct * 100}%` }} /></div></div>
              <div className="score">{Math.round(r.pct * 100)}%<small>{r.l}</small></div>
            </div>
          ))}
        </div>
      </div>
      <div className="small muted" style={{ textAlign: 'center' }}>Prévia ilustrativa. Os nomes e valores acima são exemplos.</div>
    </div>
  )
}
