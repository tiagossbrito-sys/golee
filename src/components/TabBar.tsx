export type Tab = 'hoje' | 'grupo' | 'colecao' | 'eu'

const ICONS: Record<Tab, React.ReactElement> = {
  hoje: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 3c3 4 6 7.5 6 11a6 6 0 0 1-12 0c0-3.5 3-7 6-11z" /></svg>,
  grupo: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="9" cy="8" r="3.5" /><circle cx="17" cy="10" r="2.5" /><path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6M15 20c0-2.5 1.5-4.5 4-4.5s3 2 3 4.5" /></svg>,
  colecao: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 3l2.6 5.4 6 .8-4.3 4.2 1 5.9L12 16.5 6.7 19.3l1-5.9L3.4 9.2l6-.8z" /></svg>,
  eu: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" /></svg>,
}
const LABELS: Record<Tab, string> = { hoje: 'Hoje', grupo: 'Grupo', colecao: 'Coleção', eu: 'Eu' }

export function TabBar({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav className="tabbar" aria-label="Navegação principal">
      <div className="tabbar-inner">
        {(Object.keys(LABELS) as Tab[]).map((t) => (
          <button key={t} className={`tab${tab === t ? ' on' : ''}`} onClick={() => onChange(t)} aria-current={tab === t ? 'page' : undefined}>
            {ICONS[t]}
            {LABELS[t]}
          </button>
        ))}
      </div>
    </nav>
  )
}
