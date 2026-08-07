import { useState } from 'react'
import { motion } from 'framer-motion'
import { Copy, Check, Wifi, WifiOff, ExternalLink, LogIn } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Modal from './Modal'
import { hasSupabase } from '../lib/supabase'
import { buildInviteUrl } from '../lib/inviteKey'

function extractTripId(text) {
  const trimmed = text.trim()
  try {
    const url = new URL(trimmed)
    const t = url.searchParams.get('trip')
    if (t && t.length >= 6) return t
    const h = url.hash.replace('#', '').trim()
    if (h && h.length >= 6) return h
  } catch { /* not a URL */ }
  if (trimmed.length >= 6 && !trimmed.includes(' ')) return trimmed
  return null
}

export default function ShareModal({ open, onClose, shareUrl: _shareUrl, tripId, isOwner = false }) {
  const shareUrl = isOwner && tripId ? buildInviteUrl(tripId) : _shareUrl
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)
  const [copyHover, setCopyHover] = useState(false)
  const [joinLink, setJoinLink] = useState('')
  const [joinError, setJoinError] = useState(false)

  const doJoin = () => {
    const trimmed = joinLink.trim()
    const id = extractTripId(trimmed)
    if (!id) { setJoinError(true); return }
    // Also extract and forward ?key= so the guest bypasses the paywall check
    let key = ''
    try {
      const u = new URL(trimmed)
      key = u.searchParams.get('key') || ''
    } catch { /* plain id, no key */ }
    localStorage.setItem('ferias_trip_id', id)
    sessionStorage.setItem('ferias_trip_id', id)
    const url = new URL(window.location)
    url.searchParams.set('trip', id)
    if (key) url.searchParams.set('key', key)
    else url.searchParams.delete('key')
    url.hash = ''
    window.location.href = url.toString()
  }

  const copy = async () => {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const waText = isOwner
    ? `🍽️ Junta-te à nossa lista de viagem no GroupGrub!\n\nPodes ver o plano de refeições, a lista de compras e registar despesas.\n\n👉 ${shareUrl}`
    : `🍽️ Lista de viagem no GroupGrub\n\n${shareUrl}`
  const waUrl = `https://wa.me/?text=${encodeURIComponent(waText)}`

  return (
    <Modal open={open} onClose={onClose} title={isOwner ? 'CONVIDAR AMIGOS' : t('common.share')}>
      {/* Role context */}
      {isOwner && (
        <div
          className="flex items-start gap-2.5 p-3.5 rounded-xl mb-4 border"
          style={{ background: 'rgba(52,211,153,0.07)', borderColor: 'rgba(52,211,153,0.25)' }}
        >
          <div className="text-lg flex-shrink-0">👑</div>
          <div>
            <div className="font-mono text-[0.65rem] font-bold tracking-[0.12em] uppercase mb-0.5" style={{ color: '#34d399' }}>
              {t('role.ownerLabel')}
            </div>
            <div className="text-[0.75rem] text-muted leading-relaxed">
              {t('role.shareInviteDesc')}
            </div>
          </div>
        </div>
      )}
      {/* Sync status */}
      <div
        className="flex items-center gap-2.5 p-3 rounded-xl mb-5"
        style={{
          background: hasSupabase ? 'rgba(52,211,153,0.09)' : 'rgba(245,166,35,0.09)',
          border: `1px solid ${hasSupabase ? 'rgba(52,211,153,0.35)' : 'rgba(245,166,35,0.3)'}`,
        }}
      >
        {hasSupabase ? (
          <Wifi size={18} style={{ color: '#34d399', flexShrink: 0 }} />
        ) : (
          <WifiOff size={18} style={{ color: '#f5a623', flexShrink: 0 }} />
        )}
        <div>
          <div className="text-[0.82rem] font-bold" style={{ color: hasSupabase ? '#34d399' : '#f5a623' }}>
            {hasSupabase ? t('app.name') + ' · LIVE' : 'MODO LOCAL'}
          </div>
          <div className="text-[0.72rem] text-muted mt-0.5">
            {hasSupabase
              ? t('app.tagline')
              : 'Partilha o link — cada pessoa tem a sua cópia da lista'}
          </div>
        </div>
      </div>

      {/* URL + copy */}
      <div className="bg-black/50 border border-line rounded-xl p-3.5 mb-1.5 flex items-center gap-2.5">
        <div className="flex-1 font-mono text-[0.75rem] text-brand leading-relaxed break-all">{shareUrl}</div>
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={copy}
          onMouseEnter={() => setCopyHover(true)}
          onMouseLeave={() => setCopyHover(false)}
          title="Copiar link"
          className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg transition-colors"
          style={{
            background: copied ? 'rgba(52,211,153,0.18)' : copyHover ? 'rgba(255,90,38,0.18)' : 'rgba(255,90,38,0.09)',
            border: `1px solid ${copied ? 'rgba(52,211,153,0.5)' : 'rgba(255,90,38,0.32)'}`,
            color: copied ? '#34d399' : '#ff5a26',
          }}
        >
          {copied ? <Check size={15} strokeWidth={3} /> : <Copy size={15} />}
        </motion.button>
      </div>

      <div className="text-[0.72rem] text-faint mb-4 pl-1 italic">
        Ou gera um QR code com este link numa ferramenta como qr-code-generator.com
      </div>

      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={copy}
        className="w-full py-3.5 rounded-xl font-bold text-[0.95rem] mb-3 transition-all"
        style={{
          background: copied ? 'rgba(52,211,153,0.16)' : 'rgba(255,90,38,0.14)',
          color: '#ff5a26',
          boxShadow: copied ? '0 0 26px rgba(52,211,153,0.3)' : '0 0 26px rgba(255,90,38,0.28)',
        }}
      >
        {copied ? <><Check size={17} className="inline mr-1.5" /> Copiado! ✓</> : <><Copy size={17} className="inline mr-1.5" /> Copiar link</>}
      </motion.button>

      <motion.a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        whileTap={{ scale: 0.96 }}
        className="w-full py-3.5 rounded-xl flex items-center justify-center gap-2 font-bold text-[0.9rem] no-underline mb-5"
        style={{ border: '1px solid rgba(37,211,102,0.3)', background: 'rgba(37,211,102,0.07)', color: '#25D366', boxShadow: '0 2px 12px rgba(37,211,102,0.12)' }}
      >
        <span className="text-lg">💬</span> Partilhar via WhatsApp
        <ExternalLink size={13} style={{ opacity: 0.6 }} />
      </motion.a>

      {/* Join another trip */}
      <div className="border-t border-line pt-4.5 mb-2">
        <div className="text-[0.7rem] font-bold uppercase tracking-[0.1em] text-muted mb-2.5">ENTRAR NOUTRA LISTA</div>
        <div className="flex gap-2">
          <input
            value={joinLink}
            onChange={(e) => { setJoinLink(e.target.value); setJoinError(false) }}
            placeholder="Cola aqui o link ou o código…"
            onKeyDown={(e) => { if (e.key === 'Enter') doJoin() }}
            className={`flex-1 bg-black/50 border rounded-xl px-3.5 py-2.5 text-[0.85rem] text-cream outline-none transition-all ${
              joinError ? 'border-brand/50 bg-brand/5' : 'border-line'
            }`}
          />
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={() => doJoin()}
            className="flex-shrink-0 px-4 rounded-xl bg-brand/20 text-brand font-bold text-[0.85rem] flex items-center gap-1.5"
            style={{ boxShadow: '0 0 18px rgba(255,90,38,0.3)' }}
          >
            <LogIn size={15} /> Entrar
          </motion.button>
        </div>
        {joinError && <div className="text-[0.72rem] text-brand mt-1.5 pl-1">Link inválido — cola o link completo ou o código da lista</div>}
      </div>

      {!hasSupabase && (
        <div className="bg-white/[0.03] border border-line rounded-xl p-4 mb-2">
          <div className="text-[0.78rem] font-bold text-cream mb-1.5">✨ Queres sync em tempo real?</div>
          <div className="text-[0.75rem] text-muted leading-relaxed">
            Cria um projeto grátis em <strong className="text-cream">supabase.com</strong>, corre o SQL em <code className="text-brand">/supabase/schema.sql</code> e adiciona as variáveis ao <code className="text-brand">.env</code>
          </div>
        </div>
      )}
    </Modal>
  )
}
