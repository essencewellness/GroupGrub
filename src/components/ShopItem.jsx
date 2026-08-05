import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Trash2, X, User } from 'lucide-react'

const CUT = 'polygon(10px 0,100% 0,100% calc(100% - 10px),calc(100% - 10px) 100%,0 100%,0 10px)'

// Cores de categoria alinhadas com a palete cyber (substituem o castanho/laranja antigo)
const CAT_COLORS = {
  duradouro:   'var(--duradouro)',
  congelado:   'var(--congelado)',
  refrigerado: 'var(--refrigerado)',
  fresco:      'var(--fresco)',
  outro:       'var(--cyan-dim)',
}

export default function ShopItem({ item, cat, onToggle, onRemove, onUpdate, pessoas }) {
  const [editQtd, setEditQtd] = useState(false)
  const [editAssignee, setEditAssignee] = useState(false)
  const [qtdVal, setQtdVal] = useState(item.qtd || '')
  const [assigneeVal, setAssigneeVal] = useState(item.assignee || '')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const saveQtd = () => { onUpdate({ qtd: qtdVal }); setEditQtd(false) }
  const saveAssignee = () => { onUpdate({ assignee: assigneeVal }); setEditAssignee(false) }

  const catKey = cat || item.categoria || 'outro'
  const catColor = CAT_COLORS[catKey] || CAT_COLORS.outro
  const borderColor = item.comprado ? 'var(--lime)' : catColor

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: item.comprado ? 0.45 : 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
      className="cyber-panel"
      style={{
        background: confirmDelete ? 'rgba(255,43,214,0.10)' : 'var(--surface)',
        border: `1px solid ${confirmDelete ? 'var(--magenta-glow)' : 'var(--border)'}`,
        borderLeft: confirmDelete ? '3px solid var(--magenta)' : `3px solid ${borderColor}`,
        clipPath: CUT,
        overflow: 'hidden',
        transition: 'background 0.2s, border-color 0.2s, box-shadow 0.2s',
        willChange: 'opacity',
        boxShadow: confirmDelete
          ? '0 0 18px var(--magenta-glow)'
          : (item.comprado ? '0 0 16px var(--lime-glow)' : '0 0 14px var(--cyan-glow)'),
      }}
    >
      {!confirmDelete ? (
        <div style={{ padding: '13px 14px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={onToggle}>
          {/* checkbox */}
          <motion.div whileTap={{ scale: 1.2 }}
            style={{
              width: 24, height: 24, clipPath: 'polygon(4px 0,100% 0,100% calc(100% - 4px),calc(100% - 4px) 100%,0 100%,0 4px)', flexShrink: 0,
              background: item.comprado ? 'var(--lime)' : 'transparent',
              border: item.comprado ? 'none' : '2px solid var(--cyan-dim)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: item.comprado ? '0 0 12px var(--lime-glow)' : 'none',
              transition: 'all 0.2s',
              animation: item.comprado ? 'checkPop 0.4s ease' : 'none',
            }}>
            <AnimatePresence>
              {item.comprado && (
                <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }} transition={{ type: 'spring', stiffness: 500 }}>
                  <Check size={14} color="#04070d" strokeWidth={3} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <span className="mono" style={{ flex: 1, fontWeight: 600, fontSize: '0.95rem', color: item.comprado ? 'var(--lime)' : 'var(--creme)', textShadow: item.comprado ? '0 0 8px var(--lime-glow)' : 'none', textDecoration: item.comprado ? 'line-through' : 'none', textDecorationColor: 'var(--lime)', transition: 'all 0.2s', opacity: item.comprado ? 0.62 : 1, letterSpacing: '0.01em' }}>
            {item.nome}
          </span>

          {/* Assignee badge */}
          {item.assignee && item.assignee !== '—' && (
            <span className="mono" style={{ fontSize: '0.6rem', background: 'var(--cyan-glow)', color: 'var(--cyan)', padding: '2px 8px', clipPath: 'polygon(5px 0,100% 0,100% calc(100% - 5px),calc(100% - 5px) 100%,0 100%,0 5px)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', border: '1px solid var(--cyan-dim)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 3 }}>
              <User size={8} style={{ display: 'inline', marginRight: 2 }} />{item.assignee}
            </span>
          )}

          {/* qty */}
          {editQtd ? (
            <input autoFocus value={qtdVal} onChange={e => setQtdVal(e.target.value)} onBlur={saveQtd} onKeyDown={e => e.key === 'Enter' && saveQtd()}
              onClick={e => e.stopPropagation()}
              style={{ width: 80, background: 'var(--surface-solid)', border: '1px solid var(--cyan-dim)', clipPath: 'polygon(5px 0,100% 0,100% calc(100% - 5px),calc(100% - 5px) 100%,0 100%,0 5px)', padding: '4px 8px', color: 'var(--creme)', fontFamily: 'JetBrains Mono', fontSize: '0.78rem', outline: 'none', textAlign: 'center', boxShadow: '0 0 10px var(--cyan-glow)' }} />
          ) : (
            <span onClick={e => { e.stopPropagation(); setEditQtd(true) }}
              className="mono"
              style={{ fontSize: '0.7rem', color: item.qtd ? 'var(--creme-mid)' : 'var(--creme-dim)', fontWeight: 500, borderBottom: '1px dashed var(--cyan-dim)', cursor: 'text', paddingBottom: 1, minWidth: 20, textAlign: 'center', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              {item.qtd || 'QTD'}
            </span>
          )}

          {/* Assignee edit */}
          {pessoas && pessoas.length > 1 && (
            <span onClick={e => { e.stopPropagation(); setEditAssignee(true) }}
              style={{ cursor: 'pointer', padding: '4px 6px' }}
              title="ATRIBUIR A…">
              <User size={11} style={{ color: 'var(--creme-dim)' }} />
            </span>
          )}

          {/* antecipado badge */}
          {item.antecipado && !item.comprado && (
            <span className="mono" style={{ fontSize: '0.58rem', background: 'rgba(255,176,32,0.15)', color: 'var(--duradouro)', padding: '3px 9px', clipPath: 'polygon(6px 0,100% 0,100% calc(100% - 6px),calc(100% - 6px) 100%,0 100%,0 6px)', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap', border: '1px solid rgba(255,176,32,0.3)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 3 }}>
              <Check size={9} strokeWidth={3} /> ANT.
            </span>
          )}

          {/* delete trigger */}
          <motion.button whileTap={{ scale: 0.85 }}
            onClick={e => { e.stopPropagation(); setConfirmDelete(true) }}
            style={{ background: 'none', border: 'none', color: 'var(--cyan-dim)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 4, clipPath: 'polygon(4px 0,100% 0,100% calc(100% - 4px),calc(100% - 4px) 100%,0 100%,0 4px)', flexShrink: 0, transition: 'color 0.2s' }}
            onMouseOver={e => e.currentTarget.style.color = 'var(--magenta)'}
            onMouseOut={e => e.currentTarget.style.color = 'var(--cyan-dim)'}>
            <Trash2 size={14} />
          </motion.button>
        </div>
      ) : (
        /* ── Confirm delete ── */
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 10 }}
        >
          <span className="mono" style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--magenta)', flex: 1, letterSpacing: '0.03em', textTransform: 'uppercase' }}>
            REMOVER <strong>"{item.nome}"</strong>?
          </span>
          <motion.button whileTap={{ scale: 0.9 }} onClick={onRemove}
            className="neon-magenta"
            style={{ padding: '6px 14px', clipPath: 'polygon(6px 0,100% 0,100% calc(100% - 6px),calc(100% - 6px) 100%,0 100%,0 6px)', border: '1px solid var(--magenta)', background: 'var(--magenta)', color: '#04070d', fontFamily: 'JetBrains Mono', fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer' }}>
            SIM
          </motion.button>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setConfirmDelete(false)}
            style={{ padding: '6px 14px', clipPath: 'polygon(6px 0,100% 0,100% calc(100% - 6px),calc(100% - 6px) 100%,0 100%,0 6px)', border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--creme-mid)', fontFamily: 'JetBrains Mono', fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
            <X size={11} /> NÃO
          </motion.button>
        </motion.div>
      )}

      {/* Assignee dropdown */}
      <AnimatePresence>
        {editAssignee && pessoas && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ background: 'var(--surface-solid)', padding: '10px', display: 'flex', gap: 6, flexWrap: 'wrap' }}
          >
            {pessoas.map(p => (
              <button
                key={p}
                onClick={e => {
                  e.stopPropagation()
                  setAssigneeVal(p)
                  saveAssignee()
                }}
                className="mono"
                style={{ padding: '6px 12px', clipPath: 'polygon(5px 0,100% 0,100% calc(100% - 5px),calc(100% - 5px) 100%,0 100%,0 5px)', border: '1px solid var(--cyan-dim)', background: assigneeVal === p ? 'var(--cyan-glow)' : 'var(--surface2)', color: assigneeVal === p ? 'var(--cyan)' : 'var(--creme-mid)', fontFamily: 'JetBrains Mono', fontSize: '0.74rem', letterSpacing: '0.04em', textTransform: 'uppercase', cursor: 'pointer' }}
              >
                {p}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes checkPop {
          0%   { box-shadow: 0 0 0 0 var(--lime-glow); }
          50%  { box-shadow: 0 0 0 8px rgba(124,255,79,0); }
          100% { box-shadow: 0 0 12px var(--lime-glow); }
        }
      `}</style>
    </motion.div>
  )
}
