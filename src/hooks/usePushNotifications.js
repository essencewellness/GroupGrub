/**
 * Push Notifications Hook — Premium feature (Pro+ €25/ano)
 * Uses Web Push API (browser native) — zero dependencies
 * Works on iOS 16.4+ / Android Chrome
 */
import { useEffect, useState } from "react"

export function usePushNotifications() {
  const [permission, setPermission] = useState("default")
  const [subscribed, setSubscribed] = useState(false)

  // Check if push is available
  const isAvailable =
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window

  // BUGFIX: antes chamava Notification.requestPermission() no mount — mostrava
  // o popup de permissão sem o utilizador pedir. Agora só LÊ o estado atual.
  const [loading, setLoading] = useState(isAvailable)

  useEffect(() => {
    if (!isAvailable) return
    let cancelled = false
    ;(async () => {
      setPermission(Notification.permission)
      try {
        const sw = await navigator.serviceWorker.ready
        const sub = await sw.pushManager.getSubscription()
        if (!cancelled) setSubscribed(!!sub)
      } catch (e) {
        console.warn("Push: falha a ler subscrição", e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [isAvailable])

  const subscribe = async () => {
    if (!isAvailable) return { error: "Push not available" }

    const perm = await Notification.requestPermission()
    setPermission(perm)
    if (perm !== "granted") return { error: "Permission denied" }

    try {
      const sw = await navigator.serviceWorker.ready
      // BUGFIX: 'userVisibleOptions' não existe na Push API — o campo
      // obrigatório é 'userVisibleOnly'. Antes isto rebentava sempre.
      const sub = await sw.pushManager.subscribe({ userVisibleOnly: true })

      setSubscribed(true)
      localStorage.setItem("ferias_push_sub", JSON.stringify(sub))
      return { sub }
    } catch (e) {
      console.error("Push subscribe falhou", e)
      return { error: e.message }
    }
  }

  const unsubscribe = async () => {
    if (!isAvailable) return
    const sw = await navigator.serviceWorker.ready
    const sub = await sw.pushManager.getSubscription()
    if (sub) {
      await sub.unsubscribe()
      setSubscribed(false)
    }
  }

  // Listen for push events
  useEffect(() => {
    const handler = (event) => {
      const data = event.data?.json()
      // Handle notification click
      if (data?.action === "open_app") {
        window.focus()
      }
    }

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", handler)
      return () => {
        navigator.serviceWorker.removeEventListener("message", handler)
      }
    }
  }, [])

  return {
    isAvailable,
    permission,
    subscribed,
    loading,
    subscribe,
    unsubscribe,
  }
}
