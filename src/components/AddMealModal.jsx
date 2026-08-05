import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, X, Check } from 'lucide-react'
import Modal from './Modal'

const EMOJIS = ['🍽️','🫕','🔥','🐟','🥩','🌅','🥤','🥗','🍳','🥘','🍖','🥪','🍕','🥙','🫙']

export default function AddMealModal({ open, onClose, onAdd }) {
  const [form, setForm] = useState({ emoji: '🍽️', nome: '', tipo: '', ingredientes: [] })
  const [newIng, setNewIng] = useState('')
  const [focusedInput, setFocusedInput] = useState(null)
  const [hoveredIng, setHoveredIng] = useState(null)
  const [shimmerHover, setShimmerHover] = useState(false)

  const addIng = () => { if (newIng.trim()) { setForm(f => ({ ...f, ingredientes: [...f.ingredientes, newIng.trim()] })); setNewIng('') } }
  const removeIng = (i) => setForm(f => ({ ...f, ingredientes: f.ingredientes.filter((_,ii) => ii !== i) }))

  const submit = () => {
    if (!form.nome.trim()) return
    onAdd(form)
    setForm({ emoji: '🍽️', nome: '', tipo: '', ingredientes: [] })
    onClose()
  }

  const inputStyle = (name, extra = {}) => ({
    width: '100%',
    background: 'var(--surface-deep)',
    border: `1px solid ${focusedInput === name ? 'var(--cyan-dim)' : 'var(--border)'}`,
    clipPath: 'polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px)',
    padding: '12px 16px',
    color: 'var(--creme)',
    fontFamily: 'JetBrains Mono',
    fontSize: '1rem',
    marginBottom: 10,
    outline: 'none',
    display: 'block',
    boxShadow: focusedInput === name ? '0 0 0 2px var(--cyan-glow)' : 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    ...extra,
  })

  const newIngInputStyle = {
    flex: 1,
    background: 'var(--surface-deep)',
    border: `1px solid ${focusedInput === 'newIng' ? 'var(--cyan-dim)' : 'var(--border)'}`,
    clipPath: 'polygon(6px 0,100% 0,100% calc(100% - 6px),calc(100% - 6px) 100%,0 100%,0 6px)',
    padding: '9px 14px',
    color: 'var(--creme)',
    fontFamily: 'JetBrains Mono',
    fontSize: '0.85rem',
    outline: 'none',
    boxShadow: focusedInput === 'newIng' ? '0 0 0 2px var(--cyan-glow)' : 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  }

  const isReady = form.nome.trim()

  return (
    <Modal open={open} onClose={onClose} title="Nova refeição">
      {/* Emoji label */}
      <div className="label-hud" style={{ fontSize: '0.66rem', fontWeight: 700, letterSpacing: '0.12em', marginBottom: 8 }}>
        ESCOLHE UM EMOJI
      </div>

      {/* Emoji picker */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {EMOJIS.map(e => {
          const isSelected = form.emoji === e
          return (
            <motion.button
              key={e}
              onClick={() => setForm(f => ({ ...f, emoji: e }))}
              animate={isSelected ? { borderColor: ['var(--cyan-dim)', 'var(--cyan)', 'var(--cyan-dim)'] } : { borderColor: 'transparent' }}
              transition={isSelected ? { duration: 1.6, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.15 }}
              style={{
                fontSize: '1.4rem',
                background: isSelected ? 'rgba(0,240,255,0.18)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${isSelected ? 'var(--cyan-dim)' : 'transparent'}`,
                clipPath: 'polygon(5px 0,100% 0,100% calc(100% - 5px),calc(100% - 5px) 100%,0 100%,0 5px)',
                width: 40,
                height: 40,
                cursor: 'pointer',
                transition: 'background 0.15s',
                outline: 'none',
              }}
            >
              {e}
            </motion.button>
          )
        })}
      </div>

      <input
        value={form.nome}
        onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
        placeholder="NOME (EX: LASANHA)"
        onKeyDown={e => e.key === 'Enter' && submit()}
        onFocus={() => setFocusedInput('nome')}
        onBlur={() => setFocusedInput(null)}
        style={inputStyle('nome', { fontWeight: 600 })}
      />

      <input
        value={form.tipo}
        onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
        placeholder="TIPO (EX: JANTAR, PETISCO…)"
        onFocus={() => setFocusedInput('tipo')}
        onBlur={() => setFocusedInput(null)}
        style={inputStyle('tipo', { fontSize: '0.88rem', marginBottom: 16 })}
      />

      {/* Ingredientes */}
      <div className="label-hud" style={{ fontSize: '0.66rem', fontWeight: 700, letterSpacing: '0.12em', marginBottom: 8 }}>INGREDIENTES</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10, minHeight: 32 }}>
        {form.ingredientes.map((ing, ii) => (
          <span
            key={ii}
            onMouseOver={() => setHoveredIng(ii)}
            onMouseOut={() => setHoveredIng(null)}
            style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${hoveredIng === ii ? 'var(--magenta)' : 'var(--border)'}`, clipPath: 'polygon(10px 0,100% 0,100% calc(100% - 10px),calc(100% - 10px) 100%,0 100%,0 10px)', padding: '4px 10px 4px 14px', fontSize: '0.8rem', color: 'var(--creme-mid)', display: 'flex', alignItems: 'center', gap: 6, transition: 'border-color 0.15s' }}
          >
            {ing}
            <button
              onClick={() => removeIng(ii)}
              style={{ background: 'none', border: 'none', color: hoveredIng === ii ? 'var(--magenta)' : 'var(--creme-dim)', cursor: 'pointer', padding: 0, display: 'flex', transition: 'color 0.15s' }}
            >
              <X size={11} />
            </button>
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <input
          value={newIng}
          onChange={e => setNewIng(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addIng()}
          placeholder="ADICIONAR INGREDIENTE…"
          onFocus={() => setFocusedInput('newIng')}
          onBlur={() => setFocusedInput(null)}
          style={newIngInputStyle}
        />
        <button onClick={addIng} style={{ background: 'rgba(0,240,255,0.12)', border: `1px solid var(--cyan-dim)`, clipPath: 'polygon(5px 0,100% 0,100% calc(100% - 5px),calc(100% - 5px) 100%,0 100%,0 5px)', color: 'var(--cyan)', cursor: 'pointer', padding: '0 14px', display: 'flex', alignItems: 'center' }}><Plus size={16} /></button>
      </div>

      <motion.button
        whileTap={{ scale: 0.96 }}
        whileHover={isReady ? { scale: 1.02, boxShadow: '0 8px 30px var(--lime-glow)' } : {}}
        onHoverStart={() => setShimmerHover(true)}
        onHoverEnd={() => setShimmerHover(false)}
        onClick={submit}
        disabled={!isReady}
        style={{
          width: '100%',
          padding: '14px',
          clipPath: 'polygon(10px 0,100% 0,100% calc(100% - 10px),calc(100% - 10px) 100%,0 100%,0 10px)',
          border: 'none',
          background: isReady ? 'linear-gradient(135deg, var(--lime), var(--cyan))' : 'rgba(255,255,255,0.06)',
          color: isReady ? 'var(--bg-deep)' : 'var(--creme-dim)',
          fontFamily: 'Orbitron',
          fontWeight: 800,
          fontSize: '0.92rem',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          cursor: isReady ? 'pointer' : 'not-allowed',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          boxShadow: isReady ? '0 4px 20px var(--lime-glow)' : 'none',
          marginBottom: 4,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Shimmer overlay */}
        {isReady && (
          <motion.div
            animate={shimmerHover ? { x: ['−100%', '200%'] } : { x: '-100%' }}
            transition={shimmerHover ? { duration: 0.5, ease: 'easeInOut' } : { duration: 0 }}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.18) 50%, transparent 60%)',
              pointerEvents: 'none',
            }}
          />
        )}
        <Check size={17} /> ADICIONAR REFEIÇÃO
      </motion.button>
    </Modal>
  )
}
