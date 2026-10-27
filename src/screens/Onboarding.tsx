import { useState } from 'react'
import { useStore } from '../store/useStore'
import type { Activity, Objective, Sex } from '../game/types'
import { golesForGoal, suggestGoalMl } from '../game/rules'
import { Avatar } from '../components/Avatar'

export function Onboarding() {
  const complete = useStore((s) => s.completeOnboarding)
  const joinCodeFromUrl = new URLSearchParams(location.search).get('join') ?? ''
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [sex, setSex] = useState<Sex>('x')
  const [weight, setWeight] = useState(70)
  const [activity, setActivity] = useState<Activity>('media')
  const [objective, setObjective] = useState<Objective>('saude')
  const [glass, setGlass] = useState(250)
  const [awakeStart, setAwakeStart] = useState(8)
  const [awakeEnd, setAwakeEnd] = useState(20)
  const [goal, setGoal] = useState<number | null>(null)
  const [choice, setChoice] = useState<'criar' | 'demo' | 'entrar' | 'depois'>(joinCodeFromUrl ? 'entrar' : 'criar')
  const [groupName, setGroupName] = useState('')
  const [code, setCode] = useState(joinCodeFromUrl)

  const suggested = suggestGoalMl({ sex, weightKg: weight, activity })
  const goalMl = goal ?? suggested
  const goles = golesForGoal(goalMl, glass)

  return (
    <div className="onb app">
      <div className="logo">Golee</div>
      <div className="muted">Beba água com amigos. Um copo, um gole.</div>
      <div className="steps">{[0, 1, 2].map((i) => <i key={i} className={i <= step ? 'on' : ''} />)}</div>

      {step === 0 && (
        <>
          <h1 style={{ fontSize: 24, margin: '0 0 12px' }}>Qual seu gole hoje?</h1>
          <p className="muted small">Três perguntas e a meta sai pronta. Você muda tudo depois.</p>
          <div className="field"><label>Como te chamamos?</label><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" autoFocus /></div>
          <div className="field"><label>Sexo (para a meta sugerida)</label>
            <div className="seg">
              {(['f', 'm', 'x'] as Sex[]).map((v) => <button key={v} className={sex === v ? 'on' : ''} onClick={() => setSex(v)}>{v === 'f' ? 'Feminino' : v === 'm' ? 'Masculino' : 'Prefiro não dizer'}</button>)}
            </div>
          </div>
          <div className="field"><label>Peso: {weight} kg</label><input type="range" min={35} max={160} value={weight} onChange={(e) => setWeight(+e.target.value)} /></div>
          <div className="field"><label>Rotina</label>
            <div className="seg">
              {(['baixa', 'media', 'alta'] as Activity[]).map((v) => <button key={v} className={activity === v ? 'on' : ''} onClick={() => setActivity(v)}>{v === 'baixa' ? 'Parado' : v === 'media' ? 'Normal' : 'Treino/calor'}</button>)}
            </div>
          </div>
          <div className="field"><label>O que você quer com a água?</label>
            <select value={objective} onChange={(e) => setObjective(e.target.value as Objective)}>
              <option value="saude">Saúde geral</option>
              <option value="emagrecer">Emagrecer</option>
              <option value="pele">Pele</option>
              <option value="energia">Energia</option>
            </select>
          </div>
          <div className="spacer" />
          <button className="btn" disabled={!name.trim()} onClick={() => setStep(1)}>Continuar</button>
        </>
      )}

      {step === 1 && (
        <>
          <h1 style={{ fontSize: 24, margin: '0 0 12px' }}>Seu ritmo</h1>
          <div className="card">
            <div className="row between"><b>Meta sugerida</b><span className="chip water">{(goalMl / 1000).toFixed(2).replace('.', ',')} L</span></div>
            <input type="range" min={1500} max={4000} step={250} value={goalMl} onChange={(e) => setGoal(+e.target.value)} style={{ width: '100%' }} />
            <div className="small muted">Base europeia (EFSA): 2,0 L mulheres, 2,5 L homens, ajustada por peso e rotina. É sugestão, não prescrição.</div>
          </div>
          <div className="field"><label>Tamanho do seu copo (1 gole = 1 copo)</label>
            <div className="seg">{[200, 250, 300, 500].map((v) => <button key={v} className={glass === v ? 'on' : ''} onClick={() => setGlass(v)}>{v} ml</button>)}</div>
          </div>
          <div className="field"><label>Acordado das {awakeStart}h às {awakeEnd}h</label>
            <div className="range-pair">
              <div><div className="cap">Acordo às {awakeStart}h</div><input type="range" min={4} max={12} value={awakeStart} onChange={(e) => setAwakeStart(Math.min(+e.target.value, awakeEnd - 4))} aria-label="Hora de acordar" /></div>
              <div><div className="cap">Durmo às {awakeEnd}h</div><input type="range" min={14} max={24} value={awakeEnd} onChange={(e) => setAwakeEnd(Math.max(+e.target.value, awakeStart + 4))} aria-label="Hora de dormir" /></div>
            </div>
          </div>
          <div className="card flat">
            <b>{goles} goles por dia.</b> {goles <= awakeEnd - awakeStart ? `Um copo por hora, das ${awakeStart}h às ${awakeEnd}h, e a meta fecha sozinha.` : `Um a cada ${Math.round(((awakeEnd - awakeStart) / goles) * 60)} minutos entre ${awakeStart}h e ${awakeEnd}h.`}
          </div>
          <div className="spacer" />
          <div className="row"><button className="btn secondary" onClick={() => setStep(0)}>Voltar</button><button className="btn" onClick={() => setStep(2)}>Continuar</button></div>
        </>
      )}

      {step === 2 && (
        <>
          <h1 style={{ fontSize: 24, margin: '0 0 12px' }}>Com quem você joga?</h1>
          <div className="avatar-wrap"><Avatar character="gota" fill={0.35} size={120} happy /></div>
          <button className={`option${choice === 'criar' ? ' on' : ''}`} onClick={() => setChoice('criar')}><b>Criar meu grupo</b><span>Você recebe um código e um link para convidar amigos.</span></button>
          {choice === 'criar' && <div className="field"><input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder={`Turma de ${name.split(' ')[0] || 'amigos'}`} /></div>}
          <button className={`option${choice === 'entrar' ? ' on' : ''}`} onClick={() => setChoice('entrar')}><b>Entrar com código</b><span>Alguém te mandou um link ou um código de 6 letras.</span></button>
          {choice === 'entrar' && <div className="field"><input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="ABCDEF" maxLength={6} /></div>}
          <button className={`option${choice === 'demo' ? ' on' : ''}`} onClick={() => setChoice('demo')}><b>Testar com o grupo de demonstração</b><span>Quatro personagens simulados para você ver o ranking funcionando.</span></button>
          <button className={`option${choice === 'depois' ? ' on' : ''}`} onClick={() => setChoice('depois')}><b>Sozinho por enquanto</b><span>Dá para entrar em um grupo depois, na aba Grupo.</span></button>
          <div className="spacer" />
          <div className="row">
            <button className="btn secondary" onClick={() => setStep(1)}>Voltar</button>
            <button className="btn" onClick={() => complete({ name: name.trim(), sex, weightKg: weight, activity, objective }, { glassMl: glass, goalMl, awakeStart, awakeEnd }, choice, groupName, code)}>Começar</button>
          </div>
        </>
      )}
    </div>
  )
}
