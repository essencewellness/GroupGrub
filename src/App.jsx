import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UtensilsCrossed, ShoppingCart, Share2, Plus, Sparkles, RotateCcw, CalendarDays, RefreshCw } from 'lucide-react'
import useTrip from './hooks/useTrip'
import MealCard from './components/MealCard'
import ShopItem from './components/ShopItem'
import AddMealModal from './components/AddMealModal'
import ShareModal from './components/ShareModal'
import Plano from './components/Plano'
import TripsSelector from './components/TripsSelector'
import { exportShoppingList } from './lib/exportPdf'
import { FileText } from 'lucide-react'

const CATS = {
  duradouro:   { label: 'Duradouro',   icon: '🥫', color: '#ffb020', desc: 'Compra com antecedência' },
  congelado:   { label: 'Congelado',   icon: '🧊', color: '#00d5ff', desc: 'Conserva no congelador' },
  refrigerado: { label: 'Refrigerado', icon: '🧃', color: '#a06bff', desc: '1–2 dias antes' },
  fresco:      { label: 'Fresco',      icon: '🥦', color: '#7CFF4F', desc: 'Comprar na hora' },
  outro:       { label: 'Outro',       icon: '📦', color: '#6b8299', desc: '' },
}
const CAT_ORDER = ['duradouro', 'congelado', 'refrigerado', 'fresco', 'outro']

// Fundo cibernético: grelha em perspetiva + orbs de neon (estático = performante)
function CyberBackdrop() {
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      {/* Grelha de perspetiva no fundo do ecrã */}
      <div style={{
        position: 'absolute', left: '-50%', right: '-50%', bottom: '-10%', height: '55%',
        backgroundImage:
          'linear-gradient(rgba(0,240,255,0.20) 1px, transparent 1px),' +
          'linear-gradient(90deg, rgba(0,240,255,0.20) 1px, transparent 1px)',
        backgroundSize: '46px 46px',
        transform: 'perspective(320px) rotateX(72deg)',
        transformOrigin: 'bottom center',
        maskImage: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent 78%)',
        WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent 78%)',
        opacity: 0.5,
      }} />
      {/* Orbs de neon */}
      <div style={{ position: 'absolute', width: 620, height: 620, top: '-18%', left: '-22%', background: 'radial-gradient(circle, rgba(0,240,255,0.13) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(70px)' }} />
      <div style={{ position: 'absolute', width: 480, height: 480, top: '38%', left: '62%', background: 'radial-gradient(circle, rgba(255,43,214,0.11) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(70px)' }} />
      <div style={{ position: 'absolute', width: 380, height: 380, top: '72%', left: '2%', background: 'radial-gradient(circle, rgba(160,107,255,0.09) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(70px)' }} />
      {/* Linha de horizonte */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: '45%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(0,240,255,0.45), transparent)', boxShadow: '0 0 18px rgba(0,240,255,0.5)' }} />
    </div>
  )
}

function Toast({ toast }) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 40 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="mono"
          style={{
            position: 'fixed', bottom: 'calc(env(safe-area-inset-bottom,0px) + 28px)', left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(4,10,20,0.94)',
            color: toast.type === 'err' ? '#ff5c8a' : 'var(--cyan)',
            border: `1px solid ${toast.type === 'err' ? 'rgba(255,92,138,0.5)' : 'rgba(0,240,255,0.45)'}`,
            padding: '11px 24px',
            clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
            fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.06em', zIndex: 200, whiteSpace: 'nowrap',
            boxShadow: toast.type === 'err'
              ? '0 0 26px rgba(255,92,138,0.3), 0 12px 40px rgba(0,0,0,.7)'
              : '0 0 26px rgba(0,240,255,0.28), 0 12px 40px rgba(0,0,0,.7)',
            backdropFilter: 'blur(12px)',
          }}>
          {toast.msg}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function App() {
  const trip = useTrip()
  const [tab, setTab]             = useState('refeicoes')
  const [expanded, setExpanded]   = useState(null)
  const [showAddMeal, setAddMeal] = useState(false)
  const [showShare, setShare]     = useState(false)
  const [novoItem, setNovoItem]   = useState('')
  const [toast, setToast]         = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [inputFocused, setInputFocused] = useState(false)

  const showToast = (msg, type = 'ok') => { setToast({ msg, type }); setTimeout(() => setToast(null), 2800) }

  const handleRefresh = async () => {
    setRefreshing(true)
    await trip.refresh()
    setRefreshing(false)
    showToast('✓ Atualizado!')
  }

  const handleAddMealWithIngredientes = async (meal) => {
    await trip.addMeal(meal)
    if (meal.ingredientes?.length) {
      // Passa a snapshot actual dos items para evitar race conditions
      const count = await trip.addIngredientes(meal.ingredientes, trip.items)
      if (count > 0) {
        showToast(`🛒 ${count} ingrediente${count > 1 ? 's' : ''} adicionado${count > 1 ? 's' : ''} às compras!`)
        setTimeout(() => setTab('compras'), 400)
      } else {
        showToast('Ingredientes já estão na lista!')
      }
    }
  }

  const handleAddItem = async () => {
    const nome = novoItem.trim()
    if (!nome) return
    setNovoItem('')
    await trip.addItem(nome)
    showToast(`"${nome}" adicionado!`)
  }

  const total     = trip.items.length
  const comprados = trip.items.filter(i => i.comprado).length
  const pct       = total ? Math.round((comprados / total) * 100) : 0

  const grupos = {}
  trip.items.forEach(item => {
    const cat = item.categoria || 'outro'
    if (!grupos[cat]) grupos[cat] = []
    grupos[cat].push(item)
  })

  if (trip.loading) return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', flexDirection: 'column', gap: 30, position: 'relative', overflow: 'hidden' }}>
      <CyberBackdrop />
      <div style={{ textAlign: 'center', position: 'relative', zIndex: 2 }}>
        <div className="flicker" style={{ fontSize: '3.4rem', marginBottom: 18, filter: 'drop-shadow(0 0 26px rgba(0,240,255,0.65))' }}>🛰️</div>
        <div className="cyber-title glitch" data-text="FÉRIAS CELORICO"
          style={{ fontSize: 'clamp(1.15rem, 5vw, 1.6rem)', color: 'var(--creme)', textShadow: '0 0 14px rgba(0,240,255,0.45)' }}>
          FÉRIAS CELORICO
        </div>
        <div className="label-hud" style={{ marginTop: 12 }}>A INICIALIZAR SISTEMA…</div>
      </div>
      {/* Barra de boot */}
      <div style={{ position: 'relative', zIndex: 2, width: 190, height: 3, background: 'rgba(0,240,255,0.12)', overflow: 'hidden' }}>
        <motion.div
          animate={{ x: ['-100%', '260%'] }}
          transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
          style={{ width: '45%', height: '100%', background: 'linear-gradient(90deg, transparent, var(--cyan), transparent)', boxShadow: '0 0 12px var(--cyan)' }} />
      </div>
    </div>
  )

  return (
    <>
      <CyberBackdrop />
      <div style={{ position: 'relative', zIndex: 2, minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>

        {/* ── HEADER HUD ── */}
        <div style={{ background: 'rgba(4,8,15,.82)', backdropFilter: 'blur(26px) saturate(160%)', WebkitBackdropFilter: 'blur(26px) saturate(160%)', borderBottom: '1px solid rgba(0,240,255,.16)', position: 'sticky', top: 0, zIndex: 50, paddingTop: 'var(--safe-top)', boxShadow: '0 1px 0 rgba(0,240,255,0.10), 0 8px 30px rgba(0,0,0,0.5)' }}>
          {/* Linha de scan no topo do header */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, var(--cyan), transparent)', opacity: 0.5 }} />
          <div style={{ position: 'absolute', bottom: -18, left: 0, right: 0, height: 18, background: 'linear-gradient(to bottom, rgba(4,8,15,0.6), transparent)', pointerEvents: 'none', zIndex: 1 }} />
          <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 0 6px' }}>
              <div>
                <h1 className="cyber-title glitch" data-text="FÉRIAS CELORICO"
                  style={{ fontSize: 'clamp(1.15rem, 4vw, 1.6rem)', color: 'var(--creme)', lineHeight: 1, textShadow: '0 0 12px rgba(0,240,255,0.4)' }}>
                  FÉRIAS <span style={{ color: 'var(--cyan)' }}>CELORICO</span>
                </h1>
                <p className="label-hud" style={{ marginTop: 7, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--lime)', boxShadow: '0 0 8px var(--lime)' }} />
                  5 UNIDADES · 3 CICLOS
                  {trip.aiLoading && <span style={{ color: 'var(--magenta)' }}>· A CLASSIFICAR…</span>}
                </p>
                {import.meta.env.MODE === 'development' && (
                  <div className="mono" style={{ fontSize: '0.6rem', color: 'rgba(124,255,79,0.55)', marginTop: 5 }}>
                    ID::{trip.tripId}
                  </div>
                )}
                <div style={{ marginTop: 10, maxWidth: 420 }}>
                  <TripsSelector
                    currentTripId={trip.tripId}
                    onSwitchTrip={trip.setTripId}
                    userPlan="pro"
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <motion.button whileTap={{ scale: 0.88 }}
                  animate={refreshing ? { rotate: 360 } : { rotate: 0 }}
                  transition={refreshing ? { duration: 0.6, repeat: Infinity, ease: 'linear' } : {}}
                  onClick={handleRefresh}
                  title="Sincronizar"
                  style={{ background: 'rgba(0,240,255,.06)', border: '1px solid rgba(0,240,255,.28)', clipPath: 'polygon(7px 0,100% 0,100% calc(100% - 7px),calc(100% - 7px) 100%,0 100%,0 7px)', color: refreshing ? 'var(--cyan)' : 'var(--creme-mid)', cursor: 'pointer', width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: refreshing ? '0 0 16px rgba(0,240,255,0.35)' : 'none' }}>
                  <RefreshCw size={15} />
                </motion.button>
                <motion.button whileTap={{ scale: 0.88 }} onClick={() => setShare(true)}
                  title="Partilhar"
                  style={{ background: 'rgba(255,43,214,.06)', border: '1px solid rgba(255,43,214,.3)', clipPath: 'polygon(7px 0,100% 0,100% calc(100% - 7px),calc(100% - 7px) 100%,0 100%,0 7px)', color: 'var(--magenta)', cursor: 'pointer', width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Share2 size={16} />
                </motion.button>
                <div className="flicker" style={{ fontSize: '2rem', filter: 'drop-shadow(0 0 14px rgba(0,240,255,.55))' }}>🛰️</div>
              </div>
            </div>
            {/* Tabs */}
            <div style={{ display: 'flex', padding: '8px 0 0', gap: 4 }}>
              {[{ key: 'refeicoes', label: 'REFEIÇÕES', Icon: UtensilsCrossed }, { key: 'plano', label: 'PLANO', Icon: CalendarDays }, { key: 'compras', label: 'COMPRAS', Icon: ShoppingCart }].map(({ key, label, Icon }) => (
                <button key={key} onClick={() => setTab(key)}
                  className="mono"
                  style={{ flex: 1, padding: '11px 6px 14px', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.1em', color: tab === key ? 'var(--cyan)' : 'var(--creme-dim)', transition: 'color 0.25s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, position: 'relative', textShadow: tab === key ? '0 0 10px rgba(0,240,255,0.5)' : 'none' }}>
                  {tab === key && (
                    <motion.div layoutId="tab-pill"
                      style={{ position: 'absolute', inset: '4px 2px 6px', background: 'rgba(0,240,255,0.07)', border: '1px solid rgba(0,240,255,0.22)', clipPath: 'polygon(6px 0,100% 0,100% calc(100% - 6px),calc(100% - 6px) 100%,0 100%,0 6px)', zIndex: 0 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 35 }} />
                  )}
                  <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Icon size={14} /> {label}
                  </span>
                  {tab === key && <motion.div layoutId="tab-line" style={{ position: 'absolute', bottom: 0, left: 8, right: 8, height: 2, background: 'linear-gradient(90deg,transparent,var(--cyan),transparent)', boxShadow: '0 0 12px var(--cyan)' }} transition={{ type: 'spring', stiffness: 400, damping: 35 }} />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── CONTENT ── */}
        <div style={{ flex: 1, maxWidth: 680, width: '100%', margin: '0 auto', padding: '24px 16px', paddingBottom: 'calc(env(safe-area-inset-bottom,0px) + 150px)' }}>
          <AnimatePresence mode="wait">

            {/* ══ REFEIÇÕES ══ */}
            {tab === 'refeicoes' && (
              <motion.div key="ref" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.24 }}>
                <div style={{ display: 'grid', gap: 10 }}>
                  {trip.meals.map((meal, i) => (
                    <MealCard key={meal.id} meal={meal} index={i}
                      isOpen={expanded === meal.id}
                      onClick={() => setExpanded(expanded === meal.id ? null : meal.id)}
                      onUpdate={(patch) => trip.updateMeal(meal.id, patch)}
                      onDelete={() => { trip.removeMeal(meal.id); if (expanded === meal.id) setExpanded(null) }} />
                  ))}
                </div>
                {/* Add meal button */}
                <motion.button whileTap={{ scale: 0.96 }} onClick={() => setAddMeal(true)}
                  className="mono"
                  style={{ width: '100%', marginTop: 14, padding: '15px', border: '1px dashed rgba(0,240,255,.35)', clipPath: 'polygon(12px 0,100% 0,100% calc(100% - 12px),calc(100% - 12px) 100%,0 100%,0 12px)', background: 'rgba(0,240,255,.04)', color: 'var(--cyan)', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.12em', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s' }}
                  whileHover={{ background: 'rgba(0,240,255,.09)' }}>
                  <Plus size={16} /> NOVA REFEIÇÃO
                </motion.button>
              </motion.div>
            )}

            {/* ══ PLANO ══ */}
            {tab === 'plano' && (
              <Plano key="plano" meals={trip.meals} plano={trip.plano} onUpdate={trip.updatePlano} />
            )}

            {/* ══ COMPRAS ══ */}
            {tab === 'compras' && (
              <motion.div key="comp" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.24 }}>

                {/* Progress — painel HUD */}
                <div className="cyber-panel cyber-bracket" style={{ padding: '18px 20px', marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14 }}>
                    <div>
                      <div className="label-hud" style={{ marginBottom: 6 }}>PROGRESSO DE AQUISIÇÃO</div>
                      <div className="mono" style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--creme)' }}>
                        {String(comprados).padStart(2, '0')}
                        <span style={{ color: 'var(--creme-dim)', fontWeight: 400, fontSize: '0.85rem' }}> / {String(total).padStart(2, '0')}</span>
                      </div>
                    </div>
                    <motion.div key={pct} initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 350, damping: 22 }}
                      className="cyber-title"
                      style={{ fontSize: '2.3rem', color: pct === 100 ? 'var(--lime)' : 'var(--cyan)', lineHeight: 1, textShadow: `0 0 18px ${pct === 100 ? 'rgba(124,255,79,0.6)' : 'rgba(0,240,255,0.55)'}` }}>
                      {pct}<span style={{ fontSize: '1.1rem', opacity: 0.6 }}>%</span>
                    </motion.div>
                  </div>
                  {/* Barra segmentada com scan */}
                  <div style={{ background: 'rgba(0,240,255,.07)', border: '1px solid rgba(0,240,255,.15)', height: 12, overflow: 'hidden', position: 'relative' }}>
                    <motion.div
                      animate={{ width: pct + '%' }}
                      style={{
                        height: '100%',
                        background: pct === 100
                          ? 'linear-gradient(90deg,#3d9e2a,var(--lime))'
                          : 'linear-gradient(90deg,#0090a8,var(--cyan))',
                        boxShadow: pct === 100 ? '0 0 16px var(--lime-glow)' : '0 0 16px var(--cyan-glow)',
                        position: 'relative', overflow: 'hidden',
                      }}
                      transition={{ duration: 0.55, ease: 'easeOut' }}>
                      <div className="scan-sweep" style={{ position: 'absolute', inset: 0 }} />
                    </motion.div>
                    {/* Marcas de segmento */}
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', pointerEvents: 'none' }}>
                      {Array.from({ length: 19 }).map((_, i) => (
                        <div key={i} style={{ flex: 1, borderRight: '1px solid rgba(4,8,15,0.65)' }} />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Toolbar */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                  <motion.button whileTap={{ scale: 0.96 }} onClick={() => trip.categorizarTudo()} disabled={trip.aiLoading}
                    className="mono"
                    style={{ flex: 1, padding: '12px 16px', border: `1px solid ${trip.aiLoading ? 'rgba(0,240,255,0.2)' : 'rgba(0,240,255,0.55)'}`, clipPath: 'polygon(9px 0,100% 0,100% calc(100% - 9px),calc(100% - 9px) 100%,0 100%,0 9px)', background: trip.aiLoading ? 'rgba(0,240,255,.04)' : 'rgba(0,240,255,.11)', color: 'var(--cyan)', fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.1em', cursor: trip.aiLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: trip.aiLoading ? 'none' : '0 0 20px rgba(0,240,255,.18)' }}>
                    {trip.aiLoading
                      ? <><span style={{ width: 13, height: 13, border: '2px solid rgba(0,240,255,.25)', borderTopColor: 'var(--cyan)', borderRadius: '50%', display: 'inline-block', animation: 'spin .7s linear infinite' }} /> A ANALISAR…</>
                      : <><Sparkles size={13} /> RECATEGORIZAR</>}
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.93 }} onClick={async () => { await trip.resetTicks(); showToast('↺ REGISTOS LIMPOS') }}
                    title="Limpar ticks"
                    style={{ padding: '12px 14px', border: '1px solid rgba(255,43,214,.32)', clipPath: 'polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px)', background: 'rgba(255,43,214,.06)', color: 'var(--magenta)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <RotateCcw size={13} />
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.93 }} onClick={async () => {
                      await exportShoppingList({
                        tripId: trip.tripId,
                        items: trip.items,
                        pessoas: trip.pessoas,
                        tripName: "Férias Celorico"
                      })
                      showToast('📄 RELATÓRIO EXPORTADO')
                    }}
                      className="mono"
                      style={{ padding: '12px 14px', border: '1px solid rgba(124,255,79,.32)', clipPath: 'polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px)', background: 'rgba(124,255,79,.05)', color: 'var(--lime)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em' }}>
                      <FileText size={13} /> PDF
                    </motion.button>
                </div>

                {/* Grouped items */}
                {CAT_ORDER.filter(cat => grupos[cat]?.length).map((cat, ci) => {
                  const cfg = CATS[cat]
                  const count = grupos[cat].length
                  const doneCount = grupos[cat].filter(i => i.comprado).length
                  return (
                    <motion.div key={cat} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 + ci * 0.05 }} style={{ marginBottom: 26 }}>
                      {/* Cabeçalho de categoria — HUD */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10, padding: '8px 12px 8px 10px', borderLeft: `3px solid ${cfg.color}`, background: `linear-gradient(90deg,${cfg.color}18,transparent 85%)`, boxShadow: `-1px 0 12px ${cfg.color}40` }}>
                        <span style={{ fontSize: '1.05rem' }}>{cfg.icon}</span>
                        <span className="mono" style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: cfg.color, flex: 1, textShadow: `0 0 8px ${cfg.color}70` }}>{cfg.label}</span>
                        {cfg.desc && <span style={{ fontSize: '0.6rem', color: 'var(--creme-dim)', marginRight: 4 }}>{cfg.desc}</span>}
                        <span className="mono" style={{ fontSize: '0.62rem', fontWeight: 700, background: `${cfg.color}1e`, color: cfg.color, border: `1px solid ${cfg.color}55`, padding: '2px 8px' }}>
                          {doneCount}/{count}
                        </span>
                      </div>
                      <div style={{ display: 'grid', gap: 6 }}>
                        <AnimatePresence>
                          {grupos[cat].map(item => (
                            <ShopItem key={item.id} item={item} cat={item.categoria || 'outro'} pessoas={trip.pessoas}
                              onToggle={() => trip.toggleItem(item.id)}
                              onRemove={() => trip.removeItem(item.id)}
                              onUpdate={(patch) => trip.updateItem(item.id, patch)} />
                          ))}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  )
                })}

                {/* Add item — terminal input */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                  style={{
                    background: inputFocused ? 'rgba(0,240,255,.06)' : 'rgba(8,16,28,.6)',
                    backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                    border: inputFocused ? '1px solid rgba(0,240,255,.6)' : '1px solid rgba(0,240,255,.16)',
                    clipPath: 'polygon(12px 0,100% 0,100% calc(100% - 12px),calc(100% - 12px) 100%,0 100%,0 12px)',
                    padding: '14px 16px', display: 'flex', gap: 10, alignItems: 'center', marginTop: 6,
                    boxShadow: inputFocused ? '0 0 24px rgba(0,240,255,.2)' : 'none',
                    transition: 'all 0.2s ease',
                  }}>
                  <span className="mono" style={{ color: inputFocused ? 'var(--cyan)' : 'var(--creme-dim)', fontSize: '0.9rem', fontWeight: 700, flexShrink: 0, transition: 'color 0.2s' }}>&gt;</span>
                  <input
                    value={novoItem}
                    onChange={e => setNovoItem(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddItem()}
                    onFocus={() => setInputFocused(true)}
                    onBlur={() => setInputFocused(false)}
                    placeholder="adicionar_item…"
                    className="mono"
                    style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: '0.88rem', color: 'var(--creme)', fontWeight: 500, letterSpacing: '0.02em' }} />
                  <AnimatePresence>
                    {novoItem.trim() && (
                      <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} whileTap={{ scale: 0.88 }} onClick={handleAddItem}
                        style={{ width: 34, height: 34, border: '1px solid rgba(0,240,255,.6)', clipPath: 'polygon(6px 0,100% 0,100% calc(100% - 6px),calc(100% - 6px) 100%,0 100%,0 6px)', background: 'rgba(0,240,255,.16)', color: 'var(--cyan)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 0 16px rgba(0,240,255,.35)' }}>
                        <Plus size={17} strokeWidth={2.5} />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AddMealModal open={showAddMeal} onClose={() => setAddMeal(false)} onAdd={handleAddMealWithIngredientes} />
      <ShareModal open={showShare} onClose={() => setShare(false)} shareUrl={trip.shareUrl} />
      <Toast toast={toast} />

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: rgba(223,246,255,0.28); }
      `}</style>
    </>
  )
}
