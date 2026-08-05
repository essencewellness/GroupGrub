import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Check, X } from 'lucide-react'

const ESTRUTURA = [
  { id: 'sexta',   dia: 'Sexta-feira', emoji: '🌆', slots: ['Jantar'] },
  { id: 'sabado',  dia: 'Sábado',      emoji: '☀️',  slots: ['Almoço', 'Jantar'] },
  { id: 'domingo', dia: 'Domingo',     emoji: '🌅', slots: ['Almoço', 'Lanche Ajantarado'] },
]
const CURSOS = [
  { key: 'entrada',   label: 'Entrada',   emoji: '🥗' },
  { key: 'principal', label: 'Principal', emoji: '🍽️' },
  { key: 'sobremesa', label: 'Sobremesa', emoji: '🍮' },
]

function slotKey(diaId, slot) {
  return `${diaId}-${slot.toLowerCase().replace(/\s/g, '_')}`
}

function MealPicker({ curso, meals, selectedId, onSelect }) {
  const [open, setOpen] = useState(false)
  const [xHover, setXHover] = useState(false)
  const selected = meals.find(m => m.id === selectedId)

  return (
    <div style={{ marginBottom: 10 }}>
      {/* curso header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <span style={{ fontSize: '0.95rem' }}>{curso.emoji}</span>
        <span className="label-hud" style={{ fontSize: '0.66rem', fontWeight: 800, letterSpacing: '0.12em' }}>{curso.label}</span>
      </div>

      {/* selected or picker trigger */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', textAlign: 'left', cursor: 'pointer',
          background: selected ? 'rgba(0,240,255,0.08)' : 'var(--surface)',
          border: `1px solid ${selected ? 'var(--cyan-dim)' : 'var(--border)'}`,
          clipPath: 'polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px)',
          padding: '10px 14px',
          display: 'flex', alignItems: 'center', gap: 10,
          transition: 'all 0.2s',
          boxShadow: selected ? '0 2px 16px var(--cyan-glow)' : 'none',
        }}
      >
        {selected ? (
          <>
            <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>{selected.emoji}</span>
            <span style={{ flex: 1, fontWeight: 600, fontSize: '0.88rem', color: 'var(--creme)' }}>{selected.nome}</span>
            <motion.button
              whileTap={{ scale: 0.85 }}
              onMouseEnter={() => setXHover(true)}
              onMouseLeave={() => setXHover(false)}
              onClick={e => { e.stopPropagation(); onSelect(null); setOpen(false) }}
              style={{
                background: xHover ? 'rgba(255,43,214,0.18)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${xHover ? 'var(--magenta)' : 'var(--border)'}`,
                clipPath: 'polygon(4px 0,100% 0,100% calc(100% - 4px),calc(100% - 4px) 100%,0 100%,0 4px)',
                width: 22, height: 22,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                color: xHover ? 'var(--magenta)' : 'var(--creme-dim)',
                flexShrink: 0, transition: 'all 0.15s',
              }}>
              <X size={11} />
            </motion.button>
          </>
        ) : (
          <>
            <span style={{ flex: 1, fontSize: '0.8rem', color: 'var(--creme-dim)', fontWeight: 500, fontFamily: 'JetBrains Mono', textTransform: 'uppercase', letterSpacing: '0.04em' }}>SELECIONAR REFEIÇÃO…</span>
            <ChevronDown size={14} style={{ color: 'var(--cyan-dim)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </>
        )}
      </motion.button>

      {/* dropdown list */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ paddingTop: 6, display: 'grid', gap: 5 }}>
              {meals.map(meal => (
                <motion.button
                  key={meal.id}
                  whileTap={{ scale: 0.97 }}
                  whileHover={{ background: 'rgba(0,240,255,0.08)', x: 2 }}
                  onClick={() => { onSelect(meal.id); setOpen(false) }}
                  style={{
                    width: '100%', textAlign: 'left', cursor: 'pointer',
                    background: meal.id === selectedId ? 'rgba(0,240,255,0.12)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${meal.id === selectedId ? 'var(--cyan-dim)' : 'var(--border)'}`,
                    clipPath: 'polygon(6px 0,100% 0,100% calc(100% - 6px),calc(100% - 6px) 100%,0 100%,0 6px)',
                    padding: '9px 12px',
                    display: 'flex', alignItems: 'center', gap: 10,
                    transition: 'border-color 0.15s',
                  }}
                >
                  <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{meal.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--creme)' }}>{meal.nome}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--creme-dim)', fontWeight: 500, fontFamily: 'JetBrains Mono', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{meal.tipo}</div>
                  </div>
                  {meal.id === selectedId && (
                    <Check size={14} color="var(--lime)" strokeWidth={3} style={{ flexShrink: 0 }} />
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function SlotCard({ diaId, slot, meals, plano, onUpdate }) {
  const [open, setOpen] = useState(false)
  const key = slotKey(diaId, slot)
  const selection = plano[key] || {}
  const filled = CURSOS.filter(c => selection[c.key]).length
  const allFilled = filled === 3

  const slotEmoji = slot === 'Jantar' ? '🌙' : slot === 'Almoço' ? '☀️' : '🌄'

  return (
    <motion.div
      layout
      whileHover={{ scale: 1.005 }}
      style={{
        background: open ? 'var(--surface-solid)' : 'var(--surface)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${allFilled ? 'rgba(124,255,79,0.35)' : open ? 'var(--cyan-dim)' : 'var(--border)'}`,
        clipPath: 'polygon(10px 0,100% 0,100% calc(100% - 10px),calc(100% - 10px) 100%,0 100%,0 10px)',
        overflow: 'hidden',
        boxShadow: open ? '0 6px 30px var(--cyan-glow)' : '0 2px 12px rgba(0,0,0,0.4)',
        transition: 'box-shadow 0.3s, border-color 0.3s, background 0.3s',
        position: 'relative',
      }}
    >
      {/* green checkmark badge when all 3 courses filled */}
      {allFilled && (
        <div style={{
          position: 'absolute', top: 10, right: 46,
          background: 'rgba(124,255,79,0.12)', border: '1px solid rgba(124,255,79,0.4)',
          clipPath: 'polygon(5px 0,100% 0,100% calc(100% - 5px),calc(100% - 5px) 100%,0 100%,0 5px)',
          padding: '2px 8px',
          display: 'flex', alignItems: 'center', gap: 4,
          fontSize: '0.62rem', fontWeight: 800, color: 'var(--lime)',
          letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'JetBrains Mono',
        }}>
          <Check size={9} strokeWidth={3} /> COMPLETO
        </div>
      )}

      {/* header */}
      <motion.div
        whileTap={{ scale: 0.99 }}
        onClick={() => setOpen(v => !v)}
        style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}
      >
        <span style={{ fontSize: '1.5rem', flexShrink: 0, filter: open ? 'drop-shadow(0 0 8px var(--cyan-glow))' : 'none', transition: 'filter 0.3s' }}>
          {slotEmoji}
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--creme)', textTransform: 'uppercase', letterSpacing: '0.02em', fontFamily: 'Rajdhani' }}>{slot}</div>
          <div style={{ fontSize: '0.72rem', color: allFilled ? 'rgba(124,255,79,0.7)' : 'var(--creme-dim)', marginTop: 2, fontWeight: 500, fontFamily: 'JetBrains Mono', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            {filled === 0 ? 'NENHUMA REFEIÇÃO SELECIONADA' : filled === 3 ? 'TODOS OS CURSOS DEFINIDOS ✓' : `${filled} DE 3 CURSOS DEFINIDOS`}
          </div>
        </div>

        {/* progress dots */}
        <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
          {CURSOS.map(c => (
            <div key={c.key} style={{
              width: 9, height: 9,
              background: selection[c.key] ? (allFilled ? 'var(--lime)' : 'var(--cyan)') : 'rgba(0,240,255,0.08)',
              transition: 'background 0.3s, box-shadow 0.3s',
              boxShadow: selection[c.key] ? (allFilled ? '0 0 10px var(--lime-glow)' : '0 0 10px var(--cyan-glow)') : 'none',
            }} />
          ))}
        </div>

        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          style={{ color: open ? 'var(--cyan)' : 'var(--creme-dim)', flexShrink: 0 }}>
          <ChevronDown size={18} />
        </motion.div>
      </motion.div>

      {/* expanded */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ borderTop: '1px solid var(--border)', padding: '16px 18px' }}>
              {CURSOS.map(curso => (
                <MealPicker
                  key={curso.key}
                  curso={curso}
                  meals={meals}
                  selectedId={selection[curso.key] || null}
                  onSelect={(mealId) => onUpdate(key, { ...selection, [curso.key]: mealId })}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function Plano({ meals, plano, onUpdate }) {
  // Total courses filled across all slots
  const allSlotKeys = ESTRUTURA.flatMap(dia => dia.slots.map(slot => slotKey(dia.id, slot)))
  const totalFilled = allSlotKeys.reduce((acc, key) => {
    const sel = plano[key] || {}
    return acc + CURSOS.filter(c => sel[c.key]).length
  }, 0)
  const totalPossible = allSlotKeys.length * 3 // 3 cursos per slot
  const progressPct = totalPossible > 0 ? Math.round((totalFilled / totalPossible) * 100) : 0

  if (!meals || meals.length === 0) {
    return (
      <motion.div key="plano-empty" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.24 }}>
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '56px 24px', textAlign: 'center',
          background: 'var(--surface)', border: '1px solid var(--border)',
          clipPath: 'polygon(14px 0,100% 0,100% calc(100% - 14px),calc(100% - 14px) 100%,0 100%,0 14px)',
          backdropFilter: 'blur(20px)',
        }}>
          <span style={{ fontSize: '3rem', marginBottom: 16, filter: 'drop-shadow(0 0 12px var(--cyan-glow))' }}>🍽️</span>
          <div style={{ fontFamily: 'Orbitron', fontSize: '1.15rem', fontWeight: 700, color: 'var(--creme)', marginBottom: 8, letterSpacing: '0.04em' }}>
            AINDA SEM REFEIÇÕES
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--creme-dim)', lineHeight: 1.6, maxWidth: 240, fontFamily: 'JetBrains Mono', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
            ADICIONA REFEIÇÕES NA ABA <strong style={{ color: 'var(--cyan)' }}>REFEIÇÕES</strong> PRIMEIRO
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div key="plano" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.24 }}>

      {/* Summary progress card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        style={{
          background: 'var(--surface)', backdropFilter: 'blur(20px)',
          border: '1px solid var(--cyan-dim)',
          clipPath: 'polygon(12px 0,100% 0,100% calc(100% - 12px),calc(100% - 12px) 100%,0 100%,0 12px)',
          padding: '18px 20px', marginBottom: 28,
          boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <div style={{ fontFamily: 'Orbitron', fontSize: '1rem', fontWeight: 700, color: 'var(--cyan)', letterSpacing: '0.04em' }}>
              PLANO DE REFEIÇÕES
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--creme-dim)', marginTop: 2, fontFamily: 'JetBrains Mono', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              {totalFilled} DE {totalPossible} CURSOS PLANEADOS
            </div>
          </div>
          <div style={{
            fontFamily: 'Orbitron', fontSize: '1.6rem', fontWeight: 700,
            color: progressPct === 100 ? 'var(--lime)' : 'var(--cyan)',
            filter: `drop-shadow(0 0 8px ${progressPct === 100 ? 'var(--lime-glow)' : 'var(--cyan-glow)'})`,
            letterSpacing: '0.02em',
          }}>
            {progressPct}%
          </div>
        </div>
        <div style={{ height: 6, background: 'rgba(0,240,255,0.08)', borderRadius: 0, overflow: 'hidden' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
            style={{
              height: '100%', borderRadius: 0,
              background: progressPct === 100
                ? 'linear-gradient(90deg, var(--lime), var(--cyan))'
                : 'linear-gradient(90deg, var(--cyan-dim), var(--cyan))',
              boxShadow: progressPct === 100
                ? '0 0 10px var(--lime-glow)'
                : '0 0 10px var(--cyan-glow)',
            }}
          />
        </div>
      </motion.div>

      {ESTRUTURA.map((dia, di) => {
        // Count filled slots for this day (a slot counts if it has at least 1 curso)
        const diaFilledSlots = dia.slots.filter(slot => {
          const sel = plano[slotKey(dia.id, slot)] || {}
          return CURSOS.some(c => sel[c.key])
        }).length

        return (
          <div key={dia.id} style={{ marginBottom: 32 }}>
            {/* day header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: '1.6rem', filter: 'drop-shadow(0 0 6px var(--cyan-glow))' }}>{dia.emoji}</span>
              <span className="cyber-title" style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--cyan)' }}>{dia.dia}</span>
              {diaFilledSlots > 0 && (
                <div style={{
                  background: 'rgba(0,240,255,0.1)', border: '1px solid var(--cyan-dim)',
                  clipPath: 'polygon(5px 0,100% 0,100% calc(100% - 5px),calc(100% - 5px) 100%,0 100%,0 5px)',
                  padding: '2px 9px',
                  fontSize: '0.62rem', fontWeight: 800, color: 'var(--cyan)',
                  letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap', fontFamily: 'JetBrains Mono',
                }}>
                  {diaFilledSlots} refeiç{diaFilledSlots === 1 ? 'ão' : 'ões'} definida{diaFilledSlots === 1 ? '' : 's'}
                </div>
              )}
              <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, var(--cyan-dim), var(--cyan-glow), transparent)' }} />
            </div>

            <div style={{ display: 'grid', gap: 8 }}>
              {dia.slots.map((slot, si) => (
                <motion.div key={slot} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: di * 0.08 + si * 0.05 }}>
                  <SlotCard
                    diaId={dia.id}
                    slot={slot}
                    meals={meals}
                    plano={plano}
                    onUpdate={onUpdate}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        )
      })}
    </motion.div>
  )
}
