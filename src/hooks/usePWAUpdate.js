import { useRegisterSW } from 'virtual:pwa-register/react'

/**
 * Registers the service worker and exposes whether a new version is waiting.
 * Without this, users can get stuck indefinitely on stale cached JS (confirmed:
 * a device kept running a build from hours earlier despite fresh deploys, silently
 * reproducing bugs already fixed server-side).
 */
export function usePWAUpdate() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError(error) {
      console.warn('SW registration failed', error)
    },
  })

  return { needRefresh, reload: () => updateServiceWorker(true) }
}
