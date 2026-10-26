import { useEffect } from 'react'
import { useStore } from '../store/useStore'
import { golesOfDay, golesForGoal, nextReminder, sumMl } from '../game/rules'
import { reminderMessage } from '../game/messages'

export function pushStatus(): NotificationPermission | 'unsupported' {
  if (typeof Notification === 'undefined') return 'unsupported'
  return Notification.permission
}

export async function requestPush(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof Notification === 'undefined') return 'unsupported'
  try { return await Notification.requestPermission() } catch { return Notification.permission }
}

async function notify(title: string, body: string) {
  if (pushStatus() !== 'granted') return
  try {
    const reg = await navigator.serviceWorker?.getRegistration()
    const opts: NotificationOptions & { actions?: { action: string; title: string }[] } = {
      body, icon: '/icon-192.png', badge: '/icon-192.png', tag: 'golee-reminder',
      actions: [{ action: 'gole', title: 'Gole' }],
    }
    if (reg) await reg.showNotification(title, opts)
    else new Notification(title, opts)
  } catch { /* sem suporte */ }
}

/**
 * Lembretes locais enquanto o app está aberto ou instalado com o service worker ativo.
 * Push de verdade (com o app fechado) depende do servidor da fase 1.
 */
export function useLocalReminders() {
  useEffect(() => {
    let timer: number | undefined
    function schedule() {
      const { settings, goles, profile } = useStore.getState()
      const next = nextReminder(settings)
      if (!next) return
      const delay = Math.max(1000, next.getTime() - Date.now())
      timer = window.setTimeout(() => {
        const s = useStore.getState()
        const today = golesOfDay(s.goles)
        const last = today[today.length - 1]
        const recent = last && Date.now() - last.ts < 45 * 60 * 1000
        const total = golesForGoal(s.settings.goalMl, s.settings.glassMl)
        const done = Math.floor(sumMl(today) / s.settings.glassMl)
        if (!(s.settings.skipIfRecent && recent) && done < total) {
          notify('Hora do gole', reminderMessage(profile.name, done, total, 0))
        }
        schedule()
      }, delay)
      void goles
    }
    schedule()
    return () => { if (timer) clearTimeout(timer) }
  }, [])

  // Ação "Gole" vinda da notificação (service worker envia mensagem)
  useEffect(() => {
    const onMsg = (e: MessageEvent) => { if (e.data?.type === 'gole') useStore.getState().addGole('gole') }
    navigator.serviceWorker?.addEventListener('message', onMsg)
    return () => navigator.serviceWorker?.removeEventListener('message', onMsg)
  }, [])
}
