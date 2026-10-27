import { useEffect, useState } from 'react'
import { useStore } from './store/useStore'
import { Onboarding } from './screens/Onboarding'
import { Hoje } from './screens/Hoje'
import { Grupo } from './screens/Grupo'
import { Colecao } from './screens/Colecao'
import { Eu } from './screens/Eu'
import { TabBar, type Tab } from './components/TabBar'
import { Celebration } from './components/Celebration'
import { useLocalReminders } from './pwa/reminders'

export default function App() {
  const stage = useStore((s) => s.stage)
  const theme = useStore((s) => s.settings.theme)
  const reduceMotion = useStore((s) => s.settings.reduceMotion)
  const warning = useStore((s) => s.warning)
  const dismissWarning = useStore((s) => s.dismissWarning)
  const rollover = useStore((s) => s.rollover)
  const joinByCode = useStore((s) => s.joinByCode)
  const [tab, setTab] = useState<Tab>('hoje')
  useLocalReminders()

  useEffect(() => {
    document.documentElement.dataset.theme = theme === 'auto' ? '' : theme
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', theme === 'escuro' ? '#0f2233' : '#2f9be8')
    document.documentElement.dataset.motion = reduceMotion ? 'reduce' : ''
  }, [theme, reduceMotion])

  useEffect(() => {
    rollover()
    const t = setInterval(rollover, 60000)
    return () => clearInterval(t)
  }, [rollover])

  useEffect(() => {
    if (stage !== 'app') return
    const code = new URLSearchParams(location.search).get('join')
    if (code) { joinByCode(code); setTab('grupo'); history.replaceState(null, '', location.pathname) }
  }, [stage, joinByCode])

  if (stage === 'onboarding') return <Onboarding />

  return (
    <div className="app">
      {tab === 'hoje' && <Hoje goGroup={() => setTab('grupo')} />}
      {tab === 'grupo' && <Grupo />}
      {tab === 'colecao' && <Colecao />}
      {tab === 'eu' && <Eu />}
      <TabBar tab={tab} onChange={setTab} />
      <Celebration />
      {warning && (
        <div className="overlay" onClick={dismissWarning}>
          <div className="celebrate" onClick={(e) => e.stopPropagation()}>
            <div className="big">⚠️</div>
            <h2 style={{ fontSize: 22 }}>Calma no gole</h2>
            <div className="muted">{warning}</div>
            <button className="btn" style={{ marginTop: 14 }} onClick={dismissWarning}>Entendi</button>
          </div>
        </div>
      )}
    </div>
  )
}
