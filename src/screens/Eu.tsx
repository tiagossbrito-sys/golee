import { useState } from 'react'
import { useStore } from '../store/useStore'
import type { Objective, Settings } from '../game/types'
import { golesForGoal, suggestGoalMl } from '../game/rules'
import { requestPush, pushStatus } from '../pwa/reminders'

function Row({ label, sub, on, onToggle }: { label: string; sub?: string; on: boolean; onToggle: () => void }) {
  return (
    <div className="switch">
      <div><div className="label">{label}</div>{sub && <div className="sub">{sub}</div>}</div>
      <button className={`toggle${on ? ' on' : ''}`} onClick={onToggle} role="switch" aria-checked={on} aria-label={label} />
    </div>
  )
}

export function Eu() {
  const profile = useStore((s) => s.profile)
  const settings = useStore((s) => s.settings)
  const setSettings = useStore((s) => s.setSettings)
  const setProfile = useStore((s) => s.setProfile)
  const resetAll = useStore((s) => s.resetAll)
  const goles = useStore((s) => s.goles)
  const [perm, setPerm] = useState(pushStatus())
  const t = (k: keyof Settings) => () => setSettings({ [k]: !settings[k] } as Partial<Settings>)

  function exportCsv() {
    const lines = ['data,hora,ml,tipo,pontos,flags', ...goles.map((g) => { const d = new Date(g.ts); return `${d.toLocaleDateString('pt-BR')},${d.toLocaleTimeString('pt-BR')},${g.ml},${g.kind},${g.points},${g.flags.join('|')}` })]
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'golee.csv'; a.click()
  }

  return (
    <div className="screen">
      <h1>Eu</h1>
      <div className="card">
        <div className="field"><label>Nome</label><input value={profile.name} onChange={(e) => setProfile({ name: e.target.value })} /></div>
        <div className="field"><label>Objetivo das dicas</label>
          <select value={profile.objective} onChange={(e) => setProfile({ objective: e.target.value as Objective })}>
            <option value="saude">Saúde geral</option><option value="emagrecer">Emagrecer</option><option value="pele">Pele</option><option value="energia">Energia</option>
          </select>
        </div>
      </div>

      <h2>Meta e copo</h2>
      <div className="card">
        <div className="field"><label>Meta diária: {(settings.goalMl / 1000).toFixed(2).replace('.', ',')} L = {golesForGoal(settings.goalMl, settings.glassMl)} goles</label>
          <input type="range" min={1500} max={4000} step={250} value={settings.goalMl} onChange={(e) => setSettings({ goalMl: +e.target.value })} />
          <button className="btn ghost small" onClick={() => setSettings({ goalMl: suggestGoalMl(profile) })}>Usar a sugerida ({(suggestGoalMl(profile) / 1000).toFixed(2).replace('.', ',')} L)</button>
        </div>
        <div className="field"><label>Tamanho do copo (1 gole = 1 copo)</label><div className="seg">{[200, 250, 300, 500].map((v) => <button key={v} className={settings.glassMl === v ? 'on' : ''} onClick={() => setSettings({ glassMl: v })}>{v} ml</button>)}</div></div>
        <div className="field"><label>Garrafa (para "meia garrafa" e "garrafa inteira")</label><div className="seg">{[500, 750, 1000].map((v) => <button key={v} className={settings.bottleMl === v ? 'on' : ''} onClick={() => setSettings({ bottleMl: v })}>{v} ml</button>)}</div></div>
        <div className="field"><label>Acordado das {settings.awakeStart}h às {settings.awakeEnd}h</label>
          <div className="range-pair"><div><div className="cap">Acordo</div><input type="range" min={4} max={12} value={settings.awakeStart} onChange={(e) => setSettings({ awakeStart: +e.target.value })} aria-label="Hora de acordar" /></div><div><div className="cap">Durmo</div><input type="range" min={14} max={24} value={settings.awakeEnd} onChange={(e) => setSettings({ awakeEnd: +e.target.value })} aria-label="Hora de dormir" /></div></div>
        </div>
        <Row label="Ajuste por calor e treino" sub="+2 goles em dias quentes ou de treino (fase 2: clima automático)" on={settings.weatherBoost} onToggle={t('weatherBoost')} />
      </div>

      <h2>Notificações</h2>
      <div className="card">
        <Row label="Lembretes push" sub={perm === 'granted' ? 'Permissão concedida' : perm === 'denied' ? 'Bloqueado no navegador' : 'Toque para permitir'} on={settings.pushEnabled && perm === 'granted'} onToggle={async () => { if (!settings.pushEnabled || perm !== 'granted') { const p = await requestPush(); setPerm(p); setSettings({ pushEnabled: p === 'granted' }) } else setSettings({ pushEnabled: false }) }} />
        <div className="field" style={{ marginTop: 10 }}><label>Intervalo</label><div className="seg">{([30, 45, 60, 90] as const).map((v) => <button key={v} className={settings.reminderMin === v ? 'on' : ''} onClick={() => setSettings({ reminderMin: v })}>{v} min</button>)}</div></div>
        <Row label="Pular se bebeu há pouco" sub="Sem lembrete se houve gole nos últimos 45 min" on={settings.skipIfRecent} onToggle={t('skipIfRecent')} />
        <Row label="Avisos do grupo" sub="Ultrapassagem e Gole do Grupo, máximo 3 por dia" on={settings.groupAlerts} onToggle={t('groupAlerts')} />
        <Row label="Cutucões de amigos" on={settings.pokes} onToggle={t('pokes')} />
        <Row label="Resumo da noite" on={settings.nightSummary} onToggle={t('nightSummary')} />
        <div className="small muted" style={{ paddingTop: 8 }}>WhatsApp e e-mail semanal chegam na fase 2. No iPhone, os lembretes só funcionam depois de adicionar o Golee à tela inicial (Compartilhar → Adicionar à Tela de Início).</div>
      </div>

      <h2>Privacidade e aparência</h2>
      <div className="card">
        <Row label="Mostrar litros aos amigos" sub="Desligado mostra só o percentual" on={settings.showLiters} onToggle={t('showLiters')} />
        <Row label="Mostrar horário dos goles" on={settings.showTimes} onToggle={t('showTimes')} />
        <div className="field" style={{ marginTop: 10 }}><label>Tema</label><div className="seg">{(['auto', 'claro', 'escuro'] as const).map((v) => <button key={v} className={settings.theme === v ? 'on' : ''} onClick={() => setSettings({ theme: v })}>{v}</button>)}</div></div>
        <Row label="Reduzir animações" on={settings.reduceMotion} onToggle={t('reduceMotion')} />
        <div className="field" style={{ marginTop: 10 }}><label>Unidade</label><div className="seg">{(['ml', 'oz'] as const).map((v) => <button key={v} className={settings.unit === v ? 'on' : ''} onClick={() => setSettings({ unit: v })}>{v}</button>)}</div></div>
      </div>

      <h2>Dados</h2>
      <div className="card">
        <button className="btn secondary" onClick={exportCsv}>Exportar goles (CSV)</button>
        <button className="btn ghost" style={{ color: 'var(--bad)', marginTop: 8 }} onClick={() => { if (confirm('Apagar tudo deste aparelho? Não dá para desfazer.')) resetAll() }}>Apagar conta e dados</button>
        <div className="small muted" style={{ marginTop: 8 }}>Golee 0.1 · dados guardados só neste aparelho até a fase 1 (servidor).</div>
      </div>
    </div>
  )
}
