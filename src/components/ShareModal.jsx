import { useState } from 'react'
import { motion } from 'framer-motion'
import { Copy, Check, Wifi, WifiOff, ExternalLink, LogIn } from 'lucide-react'
import Modal from './Modal'
import { hasSupabase } from '../lib/supabase'

function extractTripId(text) {
  // Aceita URL completo ou só o ID
  const trimmed = text.trim()
  // Tenta ?trip= param
  try {
    const url = new URL(trimmed)
    const t = url.searchParams.get('trip')
    if (t && t.length >= 6) return t
    // Tenta hash antigo
    const h = url.hash.replace('#', '').trim()
    if (h && h.length >= 6) return h
  } catch { /* não é URL — tenta como ID direto abaixo */ }
  // Se for só o ID direto
  if (trimmed.length >= 6 && !trimmed.includes(' ')) return trimmed
  return null
}

export default function ShareModal({ open, onClose, shareUrl }) {
  const [copied, setCopied] = useState(false)
  const [copyHover, setCopyHover] = useState(false)
  const [joinLink, setJoinLink] = useState('')
  const [joinError, setJoinError] = useState(false)

  // BUGFIX: antes o onKeyDown chamava doJoin() — função inexistente (ReferenceError
  // ao premir Enter). Extraída aqui e reutilizada pelo input e pelo botão.
  const doJoin = () => {
    const id = extractTripId(joinLink)
    if (!id) { setJoinError(true); return }
    localStorage.setItem('ferias_trip_id', id)
    sessionStorage.setItem('ferias_trip_id', id)
    const url = new URL(window.location)
    url.searchParams.set('trip', id)
    url.hash = ''
    window.location.href = url.toString()
  }

  const copy = async () => {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const waUrl = `https://wa.me/?text=Junta-te%20às%20Férias%20Celorico!%20${encodeURIComponent(shareUrl)}`

  return (
    <Modal open={open} onClose={onClose} title="Partilhar lista">
      {/* Sync status */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', clipPath: 'polygon(11px 0,100% 0,100% calc(100% - 11px),calc(100% - 11px) 100%,0 100%,0 11px)', marginBottom: 20,
        background: hasSupabase ? 'rgba(124,255,79,0.09)' : 'rgba(255,176,32,0.09)',
        border: `1px solid ${hasSupabase ? 'rgba(124,255,79,0.35)' : 'rgba(255,176,32,0.3)'}`,
      }}>
        {hasSupabase ? <Wifi size={18} style={{ color: 'var(--lime)', flexShrink: 0 }} /> : <WifiOff size={18} style={{ color: 'var(--amber)', flexShrink: 0 }} />}
        <div>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: hasSupabase ? 'var(--lime)' : 'var(--amber)' }}>
            {hasSupabase ? 'LINK EM TEMPO REAL ATIVO' : 'MODO LOCAL'}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--creme-dim)', marginTop: 1 }}>
            {hasSupabase ? 'Qualquer pessoa com o link vê as mesmas alterações em direto' : 'Partilha o link — cada pessoa tem a sua cópia da lista'}
          </div>
        </div>
      </div>

      {/* URL code box with inline copy button */}
      <div style={{
        background: 'rgba(1,3,7,0.7)', border: '1px solid rgba(0,240,255,0.25)',
        clipPath: 'polygon(11px 0,100% 0,100% calc(100% - 11px),calc(100% - 11px) 100%,0 100%,0 11px)', padding: '14px 16px', marginBottom: 6,
        display: 'flex', alignItems: 'center', gap: 10,
        boxShadow: 'inset 0 0 20px rgba(0,240,255,0.05)',
      }}>
        <div style={{
          flex: 1, fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", Consolas, monospace',
          fontSize: '0.75rem', color: 'var(--cyan)', lineHeight: 1.5,
          wordBreak: 'break-all', letterSpacing: '0.02em',
        }}>
          {shareUrl}
        </div>
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={copy}
          onMouseEnter={() => setCopyHover(true)}
          onMouseLeave={() => setCopyHover(false)}
          title="Copiar link"
          style={{
            flexShrink: 0, background: copied ? 'rgba(124,255,79,0.18)' : copyHover ? 'rgba(0,240,255,0.18)' : 'rgba(0,240,255,0.09)',
            border: `1px solid ${copied ? 'rgba(124,255,79,0.5)' : 'rgba(0,240,255,0.32)'}`,
            clipPath: 'polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px)', width: 34, height: 34,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: copied ? 'var(--lime)' : 'var(--cyan)',
            transition: 'all 0.18s',
          }}
        >
          {copied ? <Check size={15} strokeWidth={3} /> : <Copy size={15} />}
        </motion.button>
      </div>

      {/* QR hint text */}
      <div style={{ fontSize: '0.72rem', color: 'rgba(223,246,255,0.30)', marginBottom: 18, paddingLeft: 4, fontStyle: 'italic' }}>
        Ou gera um QR code com este link numa ferramenta como qr-code-generator.com
      </div>

      {/* Main copy button */}
      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={copy}
        style={{
          width: '100%', padding: '14px', clipPath: 'polygon(11px 0,100% 0,100% calc(100% - 11px),calc(100% - 11px) 100%,0 100%,0 11px)', border: 'none',
          background: copied
            ? 'rgba(124,255,79,0.16)'
            : 'rgba(0,240,255,0.14)',
          color: 'var(--cyan)', fontWeight: 800, fontSize: '0.95rem',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          boxShadow: copied
            ? '0 0 26px rgba(124,255,79,0.3)'
            : '0 0 26px rgba(0,240,255,0.28)',
          marginBottom: 12,
          transition: 'all 0.25s',
          letterSpacing: '0.01em',
        }}>
        {copied ? <><Check size={17} /> Copiado! ✓</> : <><Copy size={17} /> Copiar link</>}
      </motion.button>

      {/* WhatsApp share button */}
      <motion.a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        whileTap={{ scale: 0.96 }}
        style={{
          width: '100%', padding: '13px', clipPath: 'polygon(11px 0,100% 0,100% calc(100% - 11px),calc(100% - 11px) 100%,0 100%,0 11px)',
          border: '1px solid rgba(37,211,102,0.3)',
          background: 'rgba(37,211,102,0.07)',
          color: '#25D366', fontWeight: 700, fontSize: '0.9rem',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          boxShadow: '0 2px 12px rgba(37,211,102,0.12)',
          marginBottom: 20, textDecoration: 'none',
          transition: 'all 0.2s',
        }}
      >
        <span style={{ fontSize: '1.1rem' }}>💬</span>
        Partilhar via WhatsApp
        <ExternalLink size={13} style={{ opacity: 0.6 }} />
      </motion.a>

      {/* ── Entrar noutra viagem ── */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 18, marginBottom: 8 }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--creme-dim)', marginBottom: 10 }}>
          ENTRAR NOUTRA LISTA
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={joinLink}
            onChange={e => { setJoinLink(e.target.value); setJoinError(false) }}
            placeholder="Cola aqui o link ou o código…"
            style={{
              flex: 1, background: joinError ? 'rgba(255,43,214,0.08)' : 'rgba(1,3,7,0.6)',
              border: `1px solid ${joinError ? 'rgba(255,43,214,0.45)' : 'rgba(0,240,255,0.2)'}`,
              clipPath: 'polygon(9px 0,100% 0,100% calc(100% - 9px),calc(100% - 9px) 100%,0 100%,0 9px)', padding: '11px 14px', color: 'var(--creme)', fontSize: '0.85rem',
              outline: 'none', transition: 'all 0.2s',
            }}
            onKeyDown={e => { if (e.key === 'Enter') doJoin() }}
          />
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={() => doJoin()}
            style={{
              flexShrink: 0, padding: '0 16px', clipPath: 'polygon(9px 0,100% 0,100% calc(100% - 9px),calc(100% - 9px) 100%,0 100%,0 9px)', border: 'none',
              background: 'rgba(0,240,255,0.16)',
              color: 'var(--cyan)', fontWeight: 700,
              fontSize: '0.85rem', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
              boxShadow: '0 0 18px rgba(0,240,255,0.3)',
            }}
          >
            <LogIn size={15} /> Entrar
          </motion.button>
        </div>
        {joinError && (
          <div style={{ fontSize: '0.72rem', color: 'var(--magenta)', marginTop: 6, paddingLeft: 2 }}>
            Link inválido — cola o link completo ou o código da lista
          </div>
        )}
      </div>

      {!hasSupabase && (
        <div style={{ background: 'rgba(160,107,255,0.08)', border: '1px solid rgba(155,127,212,0.2)', clipPath: 'polygon(11px 0,100% 0,100% calc(100% - 11px),calc(100% - 11px) 100%,0 100%,0 11px)', padding: '14px 16px', marginBottom: 8 }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--violet)', marginBottom: 6 }}>✨ Queres sync em tempo real?</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--creme-dim)', lineHeight: 1.6 }}>
            Cria um projeto grátis em <strong style={{ color: 'var(--creme-mid)' }}>supabase.com</strong>, corre o SQL em <code style={{ color: 'var(--violet)' }}>/supabase/schema.sql</code> e adiciona as variáveis ao <code style={{ color: 'var(--violet)' }}>.env</code>
          </div>
        </div>
      )}
    </Modal>
  )
}
