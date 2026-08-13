import { useEffect, useRef } from 'react'

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

/** Tab focus trap + Escape-to-close + focus restore for a dialog. Returns the ref to attach to the dialog panel. */
export function useFocusTrap(open, onClose) {
  const panelRef = useRef(null)
  const previousFocus = useRef(null)
  const onCloseRef = useRef(onClose)
  useEffect(() => { onCloseRef.current = onClose })

  useEffect(() => {
    if (!open) return
    previousFocus.current = document.activeElement

    const firstFocusable = panelRef.current?.querySelector(FOCUSABLE)
    ;(firstFocusable || panelRef.current)?.focus()

    const trapFocus = (e) => {
      if (!panelRef.current) return
      const focusable = [...panelRef.current.querySelectorAll(FOCUSABLE)]
      if (focusable.length) {
        const first = focusable[0]
        const last  = focusable[focusable.length - 1]
        if (e.key === 'Tab') {
          if (e.shiftKey) {
            if (document.activeElement === first) { e.preventDefault(); last.focus() }
          } else {
            if (document.activeElement === last) { e.preventDefault(); first.focus() }
          }
        }
      }
      if (e.key === 'Escape') onCloseRef.current?.()
    }

    document.addEventListener('keydown', trapFocus)
    return () => {
      document.removeEventListener('keydown', trapFocus)
      previousFocus.current?.focus()
    }
  }, [open])

  return panelRef
}
