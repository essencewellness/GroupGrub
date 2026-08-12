/** Builds an onKeyDown handler that activates `handler` on Enter/Space, for non-native clickable elements (role="button"). */
export function onActivateKey(handler, { enabled = true, stopPropagation = false, targetSelfOnly = false } = {}) {
  return (e) => {
    if (!enabled) return
    if (targetSelfOnly && e.target !== e.currentTarget) return
    if (e.key !== 'Enter' && e.key !== ' ') return
    e.preventDefault()
    if (stopPropagation) e.stopPropagation()
    handler(e)
  }
}
