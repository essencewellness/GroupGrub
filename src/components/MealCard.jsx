import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Pencil, Trash2, Check, X, Plus } from 'lucide-react'

const EMOJIS = ['🍽️','🫕','🔥','🐟','🥩','🌅','🥤','🥗','🍳','🥘','🫙','🍖']
const CUT = 'polygon(10px 0,100% 0,100% calc(100% - 10px),calc(100% - 10px) 100%,0 100%,0 10px)'

export default function MealCard({ meal, index, isOpen, onClick, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState({ nome: meal.nome, emoji: meal.emoji, tipo: meal.tipo, ingredientes: meal.ingredientes })
  const [newIng, setNewIng] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [focusedInput, setFocusedInput] = useState(null)

  const saveEdit = () => { onUpdate(draft); setEditing(false) }
  const cancelEdit = () => { setDraft({ nome: meal.nome, emoji: meal.emoji, tipo: meal.tipo, ingredientes: meal.ingredientes }); setEditing(false) }
  const addIng = () => { if (newIng.trim()) { setDraft(d => ({ ...d, ingredientes: [...d.ingredientes, newIng.trim()] })); setNewIng('') } }
  const removeIng = (i) => setDraft(d => ({ ...d, ingredientes: d.ingredientes.filter((_,ii) => ii !== i) }))

  const inputStyle = (name) => ({
    width: '100%',
    background: 'var(--surface-solid)',
    border: `1px solid ${focusedInput === name ? 'var(--cyan)' : 'var(--border)'}`,
    clipPath: CUT,
    padding: '10px 14px',
    color: 'var(--creme)',
    fontFamily: 'JetBrains Mono',
    fontSize: name === 'nome' ? '0.95rem' : '0.88rem',
    marginBottom: name === 'nome' ? 10 : 14,
    outline: 'none',
    boxShadow: focusedInput === name ? '0 0 12px var(--cyan-glow)' : 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  })

  const newIngInputStyle = {
    flex: 1,
    background: 'var(--surface-solid)',
    border: `1px solid ${focusedInput === 'newIng' ? 'var(--cyan)' : 'var(--border)'}`,
    clipPath: CUT,
    padding: '9px 12px',
    color: 'var(--creme)',
    fontFamily: 'JetBrains Mono',
    fontSize: '0.85rem',
    outline: 'none',
    boxShadow: focusedInput === 'newIng' ? '0 0 12px var(--cyan-glow)' : 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  }

  return (
    <motion.div layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, type: 'spring', stiffness: 300, damping: 28 }}
      className="cyber-panel"
      style={{
        background: isOpen ? 'var(--surface2)' : 'var(--surface)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${isOpen ? 'var(--cyan-dim)' : 'var(--border)'}`,
        borderLeft: isOpen ? '3px solid var(--cyan)' : '3px solid transparent',
        clipPath: CUT, overflow: 'hidden',
        boxShadow: isOpen ? '0 8px 40px var(--cyan-glow)' : '0 2px 16px rgba(0,0,0,0.4)',
        transition: 'box-shadow 0.3s, border-color 0.3s, background 0.3s, border-left-color 0.35s',
      }}
    >
      {/* Header row */}
      <div style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }} onClick={onClick}>
        <div style={{ flexShrink: 0, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <AnimatePresence>
            {isOpen && (
              <motion.div
                key="emoji-bg"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                style={{ position: 'absolute', width: 52, height: 52, clipPath: 'polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%)', background: 'var(--cyan-glow)' }}
              />
            )}
          </AnimatePresence>
          <motion.span
            animate={isOpen ? { scale: 1.15 } : { scale: 1 }}
            style={{ fontSize: '2.2rem', position: 'relative', zIndex: 1, filter: isOpen ? 'drop-shadow(0 0 10px var(--cyan-glow))' : 'none', transition: 'filter 0.3s' }}
          >
            {meal.emoji}
          </motion.span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Meal type pill badge */}
          <div style={{ marginBottom: 5 }}>
            <span className="mono" style={{
              background: 'var(--cyan-glow)',
              border: '1px solid var(--cyan-dim)',
              clipPath: 'polygon(6px 0,100% 0,100% calc(100% - 6px),calc(100% - 6px) 100%,0 100%,0 6px)',
              padding: '2px 10px',
              fontSize: '0.58rem',
              fontWeight: 800,
              letterSpacing: '0.12em',
              color: isOpen ? 'var(--cyan)' : 'var(--creme-mid)',
              textTransform: 'uppercase',
              display: 'inline-block',
              transition: 'color 0.3s',
            }}>
              {meal.tipo}
            </span>
          </div>
          <div className="cyber-title" style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--creme)', letterSpacing: '0.01em' }}>{meal.nome}</div>
          <div className="mono" style={{ fontSize: '0.66rem', color: 'var(--creme-dim)', marginTop: 2, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{meal.ingredientes?.length || 0} INGREDIENTES</div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <motion.button whileTap={{ scale: 0.85 }} onClick={e => { e.stopPropagation(); setEditing(true); onClick() }}
            style={{ background: 'var(--surface2)', border: 'none', color: 'var(--cyan-dim)', cursor: 'pointer', clipPath: 'polygon(4px 0,100% 0,100% calc(100% - 4px),calc(100% - 4px) 100%,0 100%,0 4px)', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.2s, box-shadow 0.2s' }}
            onMouseOver={e => { e.currentTarget.style.color = 'var(--cyan)'; e.currentTarget.style.boxShadow = '0 0 10px var(--cyan-glow)' }}
            onMouseOut={e => { e.currentTarget.style.color = 'var(--cyan-dim)'; e.currentTarget.style.boxShadow = 'none' }}>
            <Pencil size={13} />
          </motion.button>
          {!confirmDelete ? (
            <motion.button whileTap={{ scale: 0.85 }} onClick={e => { e.stopPropagation(); setConfirmDelete(true) }}
              style={{ background: 'var(--surface2)', border: 'none', color: 'var(--cyan-dim)', cursor: 'pointer', clipPath: 'polygon(4px 0,100% 0,100% calc(100% - 4px),calc(100% - 4px) 100%,0 100%,0 4px)', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.2s' }}
              onMouseOver={e => e.currentTarget.style.color = 'var(--magenta)'} onMouseOut={e => e.currentTarget.style.color = 'var(--cyan-dim)'}>
              <Trash2 size={13} />
            </motion.button>
          ) : (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ display: 'flex', gap: 5, alignItems: 'center' }} onClick={e => e.stopPropagation()}>
              <span className="mono" style={{ fontSize: '0.66rem', color: 'var(--magenta)', fontWeight: 700, whiteSpace: 'nowrap', letterSpacing: '0.06em', textTransform: 'uppercase' }}>APAGAR?</span>
              <button onClick={onDelete} className="neon-magenta" style={{ padding: '3px 10px', clipPath: 'polygon(5px 0,100% 0,100% calc(100% - 5px),calc(100% - 5px) 100%,0 100%,0 5px)', border: '1px solid var(--magenta)', background: 'var(--magenta)', color: '#04070d', fontFamily: 'JetBrains Mono', fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer' }}>SIM</button>
              <button onClick={() => setConfirmDelete(false)} style={{ padding: '3px 10px', clipPath: 'polygon(5px 0,100% 0,100% calc(100% - 5px),calc(100% - 5px) 100%,0 100%,0 5px)', border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--creme-mid)', fontFamily: 'JetBrains Mono', fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer' }}>NÃO</button>
            </motion.div>
          )}
          <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ type: 'spring', stiffness: 300, damping: 25 }} style={{ color: 'var(--creme-dim)', display: 'flex', alignItems: 'center' }}>
            <ChevronDown size={18} />
          </motion.div>
        </div>
      </div>

      {/* Expanded content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} style={{ overflow: 'hidden' }}>
            <div style={{ borderTop: '1px solid var(--border)', padding: '14px 20px 18px' }}>

              {!editing ? (
                /* View mode */
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {(meal.ingredientes || []).map((ing, ii) => (
                    <motion.span key={ii} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: ii * 0.04 }}
                      style={{
                        background: 'var(--surface2)',
                        border: '1px solid var(--border)',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                        clipPath: 'polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px)',
                        padding: '5px 14px',
                        fontSize: '0.82rem',
                        color: 'var(--creme-mid)',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}>
                      <span style={{ color: 'var(--cyan)', fontSize: '0.7rem' }}>•</span>
                      {ing}
                    </motion.span>
                  ))}
                </div>
              ) : (
                /* Edit mode */
                <div>
                  {/* emoji picker */}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                    {EMOJIS.map(e => (
                      <button key={e} onClick={() => setDraft(d => ({ ...d, emoji: e }))}
                        style={{ fontSize: '1.4rem', background: draft.emoji === e ? 'var(--cyan-glow)' : 'var(--surface2)', border: `1px solid ${draft.emoji === e ? 'var(--cyan)' : 'transparent'}`, clipPath: 'polygon(4px 0,100% 0,100% calc(100% - 4px),calc(100% - 4px) 100%,0 100%,0 4px)', width: 38, height: 38, cursor: 'pointer' }}>
                        {e}
                      </button>
                    ))}
                  </div>
                  <input
                    value={draft.nome}
                    onChange={e => setDraft(d => ({ ...d, nome: e.target.value }))}
                    placeholder="Nome da refeição"
                    onFocus={() => setFocusedInput('nome')}
                    onBlur={() => setFocusedInput(null)}
                    style={inputStyle('nome')}
                  />
                  <input
                    value={draft.tipo}
                    onChange={e => setDraft(d => ({ ...d, tipo: e.target.value }))}
                    placeholder="Tipo (ex: Jantar, Almoço…)"
                    onFocus={() => setFocusedInput('tipo')}
                    onBlur={() => setFocusedInput(null)}
                    style={inputStyle('tipo')}
                  />
                  {/* ingredientes */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                    {draft.ingredientes.map((ing, ii) => (
                      <span key={ii} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', clipPath: 'polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px)', padding: '4px 10px 4px 14px', fontSize: '0.8rem', color: 'var(--creme-mid)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        {ing}
                        <button onClick={() => removeIng(ii)} style={{ background: 'none', border: 'none', color: 'var(--cyan-dim)', cursor: 'pointer', padding: 0, display: 'flex' }}><X size={11} /></button>
                      </span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                    <input
                      value={newIng}
                      onChange={e => setNewIng(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addIng()}
                      placeholder="Adicionar ingrediente…"
                      onFocus={() => setFocusedInput('newIng')}
                      onBlur={() => setFocusedInput(null)}
                      style={newIngInputStyle}
                    />
                    <button onClick={addIng} style={{ background: 'var(--cyan-glow)', border: '1px solid var(--cyan)', clipPath: 'polygon(5px 0,100% 0,100% calc(100% - 5px),calc(100% - 5px) 100%,0 100%,0 5px)', color: 'var(--cyan)', cursor: 'pointer', padding: '0 12px', display: 'flex', alignItems: 'center', boxShadow: '0 0 10px var(--cyan-glow)' }}><Plus size={16} /></button>
                  </div>
                  {/* save/cancel */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={saveEdit}
                      style={{ flex: 1, padding: '10px', clipPath: CUT, border: '1px solid var(--lime)', background: 'var(--lime)', color: '#04070d', fontFamily: 'JetBrains Mono', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: '0 0 12px var(--lime-glow)' }}>
                      <Check size={15} /> GUARDAR
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={cancelEdit}
                      style={{ padding: '10px 14px', clipPath: CUT, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--creme-mid)', fontFamily: 'JetBrains Mono', fontSize: '0.8rem', letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer' }}>
                      CANCELAR
                    </motion.button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
