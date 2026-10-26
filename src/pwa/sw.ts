/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { clientsClaim } from 'workbox-core'
import { registerRoute, NavigationRoute } from 'workbox-routing'
import { NetworkFirst } from 'workbox-strategies'

declare let self: ServiceWorkerGlobalScope

self.skipWaiting()
clientsClaim()
cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)
registerRoute(new NavigationRoute(new NetworkFirst({ cacheName: 'pages' })))

// Push do servidor (fase 1): o payload traz título e corpo.
self.addEventListener('push', (e) => {
  const data = (() => { try { return e.data?.json() } catch { return null } })() ?? { title: 'Hora do gole', body: 'Um copo agora e você segue no ritmo.' }
  e.waitUntil(self.registration.showNotification(data.title, { body: data.body, icon: 'icon-192.png', badge: 'icon-192.png', tag: 'golee-reminder', actions: [{ action: 'gole', title: 'Gole' }] } as NotificationOptions))
})

// Ação "Gole" na notificação (Android e apps de loja): registra sem abrir o app.
self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  e.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    if (e.action === 'gole') {
      if (all.length) { all.forEach((c) => c.postMessage({ type: 'gole' })); return }
      await self.clients.openWindow('./?gole=1')
      return
    }
    if (all.length) await (all[0] as WindowClient).focus()
    else await self.clients.openWindow('./')
  })())
})
