import { useState, useEffect } from 'react'
/* eslint-disable react-hooks/set-state-in-effect */
import { motion, AnimatePresence } from 'framer-motion'
import { UtensilsCrossed, ShoppingCart, CalendarDays, RefreshCw, Share2, Plus, Sparkles, RotateCcw, FileText } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import useTrip from './hooks/useTrip'
import { useTrips } from './hooks/useTrips'
import MealCard from './components/MealCard'
import ShopItem from './components/ShopItem'
import AddMealModal from './components/AddMealModal'
import ShareModal from './components/ShareModal'
import Plano from './components/Plano'
import TripsSelector from './components/TripsSelector'
import NewTripWizard from './components/NewTripWizard'
import Pricing from './pages/Pricing'
import { exportShoppingList } from './lib/exportPdf'

const CATS = {
  duradouro: { label: 'Duradouro', icon: '🥫', color: '#f5a623', desc: 'Compra com antecedência' },
  congelado: { label: 'Congelado', icon: '🧊', color: '#3aa0ff', desc: 'Conserva no congelador' },
  refrigerado: { label: 'Refrigerado', icon: '🧃', color: '#9b7bff', desc: '1–2 dias antes' },
  fresco: { label: 'Fresco', icon: '🥦', color: '#34d399', desc: 'Comprar na hora' },
  outro: { label: 'Outro', icon: '📦', color: '#6b8299', desc: '' },
}
const CAT_ORDER = ['duradouro', 'congelado', 'refrigerado', 'fresco', 'outro']

function Toast({ toast }) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="fixed bottom-7 left-1/2 -translate-x-1/2 z-[200] px-6 py-2.5 rounded-xl font-mono text-sm font-semibold tracking-wide"
          style={{
            background: 'rgba(10,10,11,0.94)',
            color: toast.type === 'err' ? '#ff5a26' : '#ff5a26',
            border: '1px solid rgba(255,90,38,0.45)',
            boxShadow: '0 0 26px rgba(255,90,38,0.28), 0 12px 40px rgba(0,0,0,.7)',
            backdropFilter: 'blur(12px)',
          }}
        >
          {toast.msg}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function App() {
  const { t } = useTranslation()
  const trip = useTrip()
  const trips = useTrips()
  const [tab, setTab] = useState('refeicoes')
  const [expanded, setExpanded] = useState(null)
  const [showAddMeal, setAddMeal] = useState(false)
  const [showShare, setShare] = useState(false)
  const [showPricing, setShowPricing] = useState(false)
  const [showWizard, setShowWizard] = useState(false)
  const [novoItem, setNovoItem] = useState('')
  const [toast, setToast] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [inputFocused, setInputFocused] = useState(false)

  const showToast = (msg, type = 'ok') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 2800)
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await trip.refresh()
    setRefreshing(false)
    showToast(t('common.updated'))
  }

  const handleAddMealWithIngredientes = async (meal) => {
    await trip.addMeal(meal)
    if (meal.ingredientes?.length) {
      const count = await trip.addIngredientes(meal.ingredientes, trip.items)
      if (count > 0) {
        showToast(`${t('shopping.categories.outro')} ${count} → ${t('nav.shopping')}!`)
        setTimeout(() => setTab('compras'), 400)
      } else {
        showToast(t('shopping.alreadyThere'))
      }
    }
  }

  const handleAddItem = async () => {
    const nome = novoItem.trim()
    if (!nome) return
    setNovoItem('')
    await trip.addItem(nome)
    showToast(`"${nome}" ${t('common.added')}`)
  }

  const total = trip.items.length
  const comprados = trip.items.filter((i) => i.comprado).length
  const pct = total ? Math.round((comprados / total) * 100) : 0

  const grupos = {}
  trip.items.forEach((item) => {
    const cat = item.categoria || 'outro'
    if (!grupos[cat]) grupos[cat] = []
    grupos[cat].push(item)
  })

  /** Called by the New Trip Wizard & Nova viagem button. Creates the trip, sets
   *  meta (generates Almoço/Jantar slots), makes it active, then jumps to Plano.
   */
  const handleCreateTrip = async (meta) => {
    await trips.createTrip(meta.title, null, meta.startDate, meta.endDate)
    trip.setTripMeta(meta)
    setShowWizard(false)
    setTab('plano')
    showToast(`"${meta.title}" ${t('common.added')}`)
  }

  // Auto-abre o wizard quando a viagem atual não tem setup (sem datas)
  useEffect(() => {
    if (!trip.loading && trip.needsSetup) {
      setShowWizard(true)
    }
  }, [trip.loading, trip.needsSetup])

  if (trip.loading) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-7 bg-black relative overflow-hidden px-6">
        <div className="text-6xl">🛰️</div>
        <div className="font-display text-xl tracking-tight text-cream">GROUPGRUB</div>
        <div className="font-mono text-[0.62rem] tracking-[0.22em] text-muted uppercase animate-pulse">
          {t('app.initializing')}
        </div>
        <div className="w-[190px] h-[3px] bg-white/5 overflow-hidden rounded-full">
          <motion.div
            animate={{ x: ['-100%', '260%'] }}
            transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
            className="w-[45%] h-full bg-brand rounded-full"
            style={{ boxShadow: '0 0 12px #ff5a26' }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh flex flex-col bg-black text-cream">
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-line">
        <div className="max-w-[680px] mx-auto px-5">
          <div className="flex items-center justify-between py-4">
            <div>
              <h1 className="font-display text-xl tracking-tight text-cream">
                GROUP<span className="text-brand">GRUB</span>
              </h1>
              <p className="text-[0.7rem] text-muted mt-1 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand" style={{ boxShadow: '0 0 8px #ff5a26' }} />
                {trip.tripId && <span className="font-mono">#{trip.tripId}</span>}
              </p>
              <div className="mt-2.5 max-w-[420px]">
                <TripsSelector currentTripId={trip.tripId} onSwitchTrip={trip.setTripId} onShowPricing={() => setShowPricing(true)} onShowWizard={() => setShowWizard(true)} userPlan="pro" />
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <motion.button
                whileTap={{ scale: 0.88 }}
                animate={refreshing ? { rotate: 360 } : { rotate: 0 }}
                transition={refreshing ? { duration: 0.6, repeat: Infinity, ease: 'linear' } : {}}
                onClick={handleRefresh}
                title={t('common.sync')}
                className="w-9 h-9 flex items-center justify-center rounded-xl border border-line bg-white/[0.04] text-muted hover:text-cream transition-colors"
              >
                <RefreshCw size={15} />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={() => setShare(true)}
                title={t('common.share')}
                className="w-9 h-9 flex items-center justify-center rounded-xl border border-line bg-white/[0.04] text-muted hover:text-cream transition-colors"
              >
                <Share2 size={16} />
              </motion.button>
              <div className="text-2xl">🛰️</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 pb-0">
            {[
              { key: 'refeicoes', label: t('nav.meals'), Icon: UtensilsCrossed },
              { key: 'plano', label: t('nav.plan'), Icon: CalendarDays },
              { key: 'compras', label: t('nav.shopping'), Icon: ShoppingCart },
            ].map(({ key, label, Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex-1 py-3 text-[0.7rem] font-semibold tracking-[0.1em] transition-colors relative ${
                  tab === key ? 'text-brand' : 'text-muted hover:text-cream'
                }`}
              >
                <span className="flex items-center justify-center gap-1.5">
                  <Icon size={14} /> {label}
                </span>
                {tab === key && (
                  <motion.div
                    layoutId="tab-line"
                    className="absolute bottom-0 left-4 right-4 h-0.5 bg-brand rounded-full"
                    style={{ boxShadow: '0 0 12px #ff5a26' }}
                    transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <main className="flex-1 max-w-[680px] w-full mx-auto px-4 py-6 pb-40">
        <AnimatePresence mode="wait">
          {tab === 'refeicoes' && (
            <motion.div
              key="ref"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.24 }}
              className="grid gap-2.5"
            >
              {trip.meals.map((meal, i) => (
                <MealCard
                  key={meal.id}
                  meal={meal}
                  index={i}
                  isOpen={expanded === meal.id}
                  onClick={() => setExpanded(expanded === meal.id ? null : meal.id)}
                  onUpdate={(patch) => trip.updateMeal(meal.id, patch)}
                  onDelete={() => {
                    trip.removeMeal(meal.id)
                    if (expanded === meal.id) setExpanded(null)
                  }}
                />
              ))}
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => setAddMeal(true)}
                className="w-full mt-3.5 py-4 rounded-xl border border-dashed border-line text-brand font-semibold text-xs tracking-[0.12em] hover:bg-brand/5 transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={16} /> {t('meals.add')}
              </motion.button>
            </motion.div>
          )}

          {tab === 'plano' && (
            <Plano key="plano" meals={trip.meals} plano={trip.plano} onUpdate={trip.updatePlano} structure={trip.structure} />
          )}

          {tab === 'compras' && (
            <motion.div
              key="comp"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.24 }}
            >
              {/* Progress panel */}
              <div className="surface p-5 mb-4">
                <div className="flex justify-between items-end mb-3.5">
                  <div>
                    <div className="font-mono text-[0.62rem] tracking-[0.18em] text-muted uppercase">
                      {t('shopping.progress')}
                    </div>
                    <div className="font-mono mt-1 text-cream">
                      <span className="text-2xl font-bold">{String(comprados).padStart(2, '0')}</span>
                      <span className="text-muted font-normal text-base"> / {String(total).padStart(2, '0')}</span>
                    </div>
                  </div>
                  <div
                    className="font-display text-4xl leading-none"
                    style={{ color: pct === 100 ? '#34d399' : '#ff5a26' }}
                  >
                    {pct}<span className="text-lg opacity-60">%</span>
                  </div>
                </div>
                <div className="h-3 bg-white/[0.06] rounded-full overflow-hidden">
                  <motion.div
                    animate={{ width: pct + '%' }}
                    transition={{ duration: 0.55, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{
                      background: pct === 100 ? 'linear-gradient(90deg,#1f8a3a,#34d399)' : 'linear-gradient(90deg,#c8431a,#ff5a26)',
                      boxShadow: '0 0 16px rgba(255,90,38,0.4)',
                    }}
                  />
                </div>
              </div>

              {/* Toolbar */}
              <div className="flex gap-2 mb-5">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => trip.categorizarTudo()}
                  className="flex-1 py-3 rounded-xl border text-xs font-semibold tracking-[0.1em] transition-all"
                  style={{
                    borderColor: 'rgba(255,90,38,0.55)',
                    background: 'rgba(255,90,38,0.11)',
                    color: '#ff5a26',
                    boxShadow: '0 0 20px rgba(255,90,38,0.18)',
                  }}
                >
                  <Sparkles size={13} className="inline mr-1.5" /> {t('shopping.recategorize')}
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.93 }}
                  onClick={async () => {
                    await trip.resetTicks()
                    showToast(t('shopping.clear'))
                  }}
                  title={t('shopping.clear')}
                  className="py-3 px-3.5 rounded-xl border border-line bg-white/[0.03] text-muted hover:text-cream transition-colors"
                >
                  <RotateCcw size={13} />
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.93 }}
                  onClick={async () => {
                    await exportShoppingList({
                      tripId: trip.tripId,
                      items: trip.items,
                      pessoas: trip.pessoas,
                      tripName: 'GroupGrub',
                    })
                    showToast(t('shopping.pdfExported'))
                  }}
                  className="py-3 px-3.5 rounded-xl border text-xs font-semibold tracking-[0.08em] transition-colors"
                  style={{ borderColor: 'rgba(52,211,153,0.32)', background: 'rgba(52,211,153,0.05)', color: '#34d399' }}
                >
                  <FileText size={13} className="inline mr-1" /> PDF
                </motion.button>
              </div>

              {/* Grouped items */}
              {CAT_ORDER.filter((cat) => grupos[cat]?.length).map((cat, ci) => {
                const cfg = CATS[cat]
                const count = grupos[cat].length
                const doneCount = grupos[cat].filter((i) => i.comprado).length
                return (
                  <motion.div
                    key={cat}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 + ci * 0.05 }}
                    className="mb-6"
                  >
                    <div
                      className="flex items-center gap-2.5 mb-2.5 px-3 py-2 rounded-lg"
                      style={{ borderLeft: `3px solid ${cfg.color}`, background: `${cfg.color}18` }}
                    >
                      <span className="text-base">{cfg.icon}</span>
                      <span
                        className="font-mono text-[0.62rem] font-bold uppercase tracking-[0.14em] flex-1"
                        style={{ color: cfg.color }}
                      >
                        {t(`shopping.categories.${cat}`)}
                      </span>
                      {cfg.desc && <span className="text-[0.6rem] text-muted">{cfg.desc}</span>}
                      <span
                        className="font-mono text-[0.62rem] font-bold px-2 py-0.5 rounded"
                        style={{ background: `${cfg.color}1e`, color: cfg.color, border: `1px solid ${cfg.color}55` }}
                      >
                        {doneCount}/{count}
                      </span>
                    </div>
                    <div className="grid gap-1.5">
                      <AnimatePresence>
                        {grupos[cat].map((item) => (
                          <ShopItem
                            key={item.id}
                            item={item}
                            cat={item.categoria || 'outro'}
                            pessoas={trip.pessoas}
                            onToggle={() => trip.toggleItem(item.id)}
                            onRemove={() => trip.removeItem(item.id)}
                            onUpdate={(patch) => trip.updateItem(item.id, patch)}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )
              })}

              {/* Add item */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className={`flex gap-2.5 items-center p-3.5 rounded-xl border transition-all duration-200 ${
                  inputFocused ? 'border-brand/60 bg-brand/[0.06]' : 'border-line bg-panel'
                }`}
                style={{ boxShadow: inputFocused ? '0 0 24px rgba(255,90,38,.2)' : 'none' }}
              >
                <span className="font-mono text-cream/60 text-sm font-bold flex-shrink-0">&gt;</span>
                <input
                  value={novoItem}
                  onChange={(e) => setNovoItem(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
                  placeholder={t('shopping.addItem')}
                  className="flex-1 bg-transparent border-none outline-none text-[0.88rem] text-cream font-medium placeholder:text-faint"
                />
                <AnimatePresence>
                  {novoItem.trim() && (
                    <motion.button
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      whileTap={{ scale: 0.88 }}
                      onClick={handleAddItem}
                      className="w-9 h-9 flex items-center justify-center rounded-xl bg-brand/20 text-brand border border-brand/60"
                      style={{ boxShadow: '0 0 16px rgba(255,90,38,.35)' }}
                    >
                      <Plus size={17} strokeWidth={2.5} />
                    </motion.button>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <AddMealModal open={showAddMeal} onClose={() => setAddMeal(false)} onAdd={handleAddMealWithIngredientes} />
      <ShareModal open={showShare} onClose={() => setShare(false)} shareUrl={trip.shareUrl} />
      {showPricing && <Pricing onClose={() => setShowPricing(false)} tripId={trip.tripId} />}
      <NewTripWizard open={showWizard} onClose={() => setShowWizard(false)} onCreate={handleCreateTrip} />
      <Toast toast={toast} />
    </div>
  )
}
