import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import InstallBanner from './InstallBanner.jsx'

// ErrorBoundary
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error) {
    if (window.location.hostname && window.location.hostname !== 'localhost') {
      if (window.plausible) {
        window.plausible('Error', { props: { error: error.toString() } })
      }
      console.error('Production error:', {
        error: error.toString(),
        url: window.location.href,
        timestamp: new Date().toISOString(),
      })
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100dvh', background: '#04070d', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 24, padding: '0 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', filter: 'drop-shadow(0 0 20px rgba(255,43,214,0.6))' }}>⚠</div>
          <div>
            <h2 className="cyber-title" style={{ fontSize: '1rem', color: '#ff2bd6', textShadow: '0 0 14px rgba(255,43,214,0.5)' }}>FALHA DE SISTEMA</h2>
            <p className="mono" style={{ fontSize: '0.78rem', color: 'rgba(223,246,255,0.42)', marginTop: 10, maxWidth: 320, lineHeight: 1.7 }}>
              Ocorreu um erro inesperado. Reinicia a aplicação.
            </p>
          </div>
          <button onClick={() => window.location.reload()} className="mono" style={{ padding: '13px 30px', border: '1px solid rgba(0,240,255,0.6)', clipPath: 'polygon(9px 0,100% 0,100% calc(100% - 9px),calc(100% - 9px) 100%,0 100%,0 9px)', background: 'rgba(0,240,255,0.13)', color: '#00f0ff', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.12em', cursor: 'pointer', boxShadow: '0 0 22px rgba(0,240,255,.28)' }}>
            REINICIAR
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

// Guarda o root entre hot-reloads do Vite. Sem isto o HMR chamava createRoot()
// sobre um container já montado → "You are calling createRoot() on a container
// that has already been passed to createRoot()" e nós DOM órfãos (removeChild).
const container = document.getElementById('root')
const root = (globalThis.__feriasRoot ??= createRoot(container))

root.render(
  <StrictMode>
    <ErrorBoundary>
      <App />
      <InstallBanner />
    </ErrorBoundary>
  </StrictMode>,
)
