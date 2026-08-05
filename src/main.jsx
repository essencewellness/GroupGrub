import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n'
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
        <div className="min-h-dvh bg-black flex flex-col items-center justify-center gap-6 p-5 text-center">
          <div className="text-5xl drop-shadow-[0_0_20px_rgba(255,90,38,0.6)]">⚠</div>
          <div>
            <h2 className="font-display text-lg text-brand tracking-tight">FALHA DE SISTEMA</h2>
            <p className="font-mono text-xs text-muted mt-2.5 max-w-[320px] leading-relaxed">
              Ocorreu um erro inesperado. Reinicia a aplicação.
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="btn-brand px-8 py-3 text-xs tracking-[0.12em] uppercase"
          >
            REINICIAR
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

// Guarda o root entre hot-reloads do Vite.
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
