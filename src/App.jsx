import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UtensilsCrossed, ShoppingCart, CalendarDays, RefreshCw, Share2, Plus, Sparkles, RotateCcw, FileText, Receipt, ShieldAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import useTrip from './hooks/useTrip'
import { useTrips } from './hooks/useTrips'
import usePremium from './hooks/usePremium'
import { useRole } from './hooks/useRole'
import Pricing from './pages/Pricing'
import MealCard from './components/MealCard'
import ShopItem from './components/ShopItem'
import AddMealModal from './components/AddMealModal'
import ShareModal from './components/ShareModal'
import Plano from './components/Plano'
import TripsSelector from './components/TripsSelector'
import NewTripWizard from './components/NewTripWizard'
import ExpensesTab from './components/ExpensesTab'
import { exportShoppingList } from './lib/exportPdf'

const CATS = {
  dispensa:   { label: 'Dispensa',         icon: '🥫', color: '#f5a623', desc: 'Compra com antecedência' },
  bebidas:    { label: 'Bebidas',           icon: '🍷', color: '#3aa0ff', desc: 'Compra com antecedência' },
  talho:      { label: 'Talho & Peixaria', icon: '🥩', color: '#ff6b6b', desc: '1–2 dias antes' },
  laticinios: { label: 'Laticínios',       icon: '🧀', color: '#9b7bff', desc: '1–2 dias antes' },
  fresco:     { label: 'Frescos',          icon: '🥦', color: '#34d399', desc: 'Comprar no dia' },
  outro:      { label: 'Outros',           icon: '📦', color: '#6b8299', desc: '' },
}
const CAT_ORDER = ['dispensa', 'bebidas', 'talho', 'laticinios', 'fresco', 'outro']

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
  const { isPremium, verifying } = usePremium()
  const { isOwner, isGuest } = useRole(trip.tripId)
  const [tab, setTab] = useState('refeicoes')
  const [expanded, setExpanded] = useState(null)
  const [showAddMeal, setAddMeal] = useState(false)
  const [showShare, setShare] = useState(false)
  const [showPricing, setShowPricing] = useState(false)
  const [showWizard, setShowWizard] = useState(false)
  const [wizardDismissed, setWizardDismissed] = useState(false)
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

  // Agrupa itens por categoria. Itens "outro" (não categorizados
  // pelo dicionário local) mostram-se na secção "Outros" para o utilizador
  // recolher manualmente — e marcam distinto no ShopItem.
  const grupos = {}
  for (const item of trip.items) {
    const cat = item.categoria && item.categoria !== 'desconhecido' ? item.categoria : 'outro'
    if (!grupos[cat]) grupos[cat] = []
    grupos[cat].push(item)
  }

  /** Called by the New Trip Wizard. Creates the trip, saves meta, navigates to the new trip URL. */
  const handleCreateTrip = async (meta) => {
    const newId = await trips.createTrip(meta.title, null, meta.startDate, meta.endDate)
    // Save meta to localStorage before reload so useTrip picks it up
    trip.setTripMeta(meta)
    setShowWizard(false)
    showToast(`"${meta.title}" ${t('common.added')}`)
    // Navigate to new trip URL — reload ensures useTrip reads the correct ID
    const url = new URL(window.location)
    url.searchParams.set('trip', newId)
    window.location.href = url.toString()
  }

  // Auto-abre o wizard quando a trip não tem datas configuradas.
  // wizardDismissed garante que fechar sem completar não re-abre imediatamente.
  useEffect(() => {
    if (!trip.loading && trip.needsSetup && !wizardDismissed) {
      setShowWizard(true)
    }
  }, [trip.loading, trip.needsSetup, wizardDismissed])

  if (trip.loading) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-6 bg-black relative overflow-hidden px-6">
        {/* Atmospheric glow */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 60%, rgba(255,90,38,0.08) 0%, transparent 70%)'
        }} />
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="text-5xl"
        >🛰️</motion.div>
        <div>
          <div className="font-display text-2xl font-bold tracking-[-0.01em] text-cream text-center">
            GROUP<span className="text-brand">GRUB</span>
          </div>
          <div className="font-mono text-[0.6rem] tracking-[0.25em] text-faint uppercase text-center mt-1.5 animate-pulse">
            {t('app.initializing')}
          </div>
        </div>
        <div className="w-[140px] h-[2px] bg-white/[0.06] overflow-hidden rounded-full">
          <motion.div
            animate={{ x: ['-100%', '280%'] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
            className="w-[40%] h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, transparent, #ff5a26, transparent)', boxShadow: '0 0 10px #ff5a26' }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh flex flex-col bg-black text-cream">
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-line" style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(20px) saturate(1.5)' }}>
        <div className="max-w-[680px] mx-auto px-5">
          <div className="flex items-center justify-between py-3.5">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex-shrink-0">
                <h1 className="font-display text-[1.15rem] font-bold tracking-[-0.01em] text-cream leading-none">
                  GROUP<span className="text-brand">GRUB</span>
                </h1>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand flex-shrink-0 glow-brand" />
                  <span className="font-mono text-[0.58rem] tracking-[0.14em] text-faint uppercase">
                    {trip.tripId ? `#${trip.tripId}` : 'offline'}
                  </span>
                </div>
              </div>
              <div className="w-px h-8 bg-line flex-shrink-0" />
              <div className="min-w-0">
                <TripsSelector
                  currentTripId={trip.tripId}
                  trips={trips.trips}
                  tripsLoading={trips.loading}
                  isPremium={isPremium}
                  onSwitchTrip={trip.setTripId}
                  onDeleteTrip={trips.deleteTrip}
                  onShowWizard={() => setShowWizard(true)}
                  onShowPricing={() => setShowPricing(true)}
                />
              </div>
            </div>
            <div className="flex gap-1.5 items-center flex-shrink-0 ml-2">
              <motion.button
                whileTap={{ scale: 0.88 }}
                animate={refreshing ? { rotate: 360 } : { rotate: 0 }}
                transition={refreshing ? { duration: 0.6, repeat: Infinity, ease: 'linear' } : {}}
                onClick={handleRefresh}
                title={t('common.sync')}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-line bg-white/[0.03] text-faint hover:text-cream hover:border-lineStrong transition-all"
              >
                <RefreshCw size={13} />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={() => setShare(true)}
                title={t('common.share')}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-line bg-white/[0.03] text-faint hover:text-cream hover:border-lineStrong transition-all"
              >
                <Share2 size={14} />
              </motion.button>
              <div className="text-xl ml-1">🛰️</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-0.5 pb-0 relative">
            {[
              { key: 'refeicoes', label: t('nav.meals'), Icon: UtensilsCrossed },
              { key: 'plano', label: t('nav.plan'), Icon: CalendarDays },
              { key: 'compras', label: t('nav.shopping'), Icon: ShoppingCart },
              { key: 'contas', label: t('expenses.tab'), Icon: Receipt },
            ].map(({ key, label, Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex-1 py-3 text-[0.65rem] font-bold tracking-[0.1em] transition-all duration-200 relative ${
                  tab === key ? 'text-brand' : 'text-faint hover:text-muted'
                }`}
              >
                <span className="relative z-10 flex items-center justify-center gap-1.5">
                  <Icon size={13} strokeWidth={tab === key ? 2.5 : 1.8} /> {label}
                </span>
                {tab === key && (
                  <motion.div
                    layoutId="tab-line"
                    className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full"
                    style={{ background: 'linear-gradient(90deg, #c8431a, #ff5a26, #ff7a50)', boxShadow: '0 0 10px rgba(255,90,38,0.6)' }}
                    transition={{ type: 'spring', stiffness: 480, damping: 38 }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* GUEST BANNER */}
      {isGuest && (
        <div className="max-w-[680px] mx-auto px-4 pt-3">
          <div
            className="flex items-start gap-3 px-4 py-3 rounded-xl border"
            style={{ background: 'rgba(155,123,255,0.08)', borderColor: 'rgba(155,123,255,0.28)' }}
          >
            <ShieldAlert size={16} style={{ color: '#9b7bff', flexShrink: 0, marginTop: 2 }} />
            <div className="flex-1 min-w-0">
              <div className="font-mono text-[0.65rem] font-bold tracking-[0.12em] uppercase" style={{ color: '#9b7bff' }}>
                {t('role.guestBanner')}
              </div>
              <div className="text-[0.75rem] text-muted mt-0.5 leading-relaxed">
                {t('role.guestDesc')}
              </div>
            </div>
          </div>
        </div>
      )}

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
                  isOwner={isOwner}
                  onClick={() => setExpanded(expanded === meal.id ? null : meal.id)}
                  onUpdate={(patch) => trip.updateMeal(meal.id, patch)}
                  onDelete={() => {
                    trip.removeMeal(meal.id)
                    if (expanded === meal.id) setExpanded(null)
                  }}
                />
              ))}
              {isOwner && (
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setAddMeal(true)}
                  className="w-full mt-3.5 py-4 rounded-xl border border-dashed border-line text-brand font-semibold text-xs tracking-[0.12em] hover:bg-brand/5 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={16} /> {t('meals.add')}
                </motion.button>
              )}
            </motion.div>
          )}

          {tab === 'plano' && (
            <Plano key="plano" meals={trip.meals} plano={trip.plano} onUpdate={trip.updatePlano} structure={trip.structure} />
          )}

          {tab === 'contas' && (
            <motion.div
              key="contas"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.24 }}
            >
              <ExpensesTab
                expenses={trip.expenses}
                pessoas={trip.pessoas.filter(p => p !== '—')}
                onAddExpense={trip.addExpense}
                onRemoveExpense={trip.removeExpense}
              />
            </motion.div>
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
              <div className="surface p-5 mb-4" style={{ background: 'linear-gradient(135deg, #111113 0%, #0e0e10 100%)' }}>
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <div className="font-mono text-[0.58rem] tracking-[0.2em] text-faint uppercase mb-1">
                      {t('shopping.progress')}
                    </div>
                    <div className="font-mono text-cream flex items-baseline gap-1">
                      <span className="text-3xl font-bold" style={{ fontVariantNumeric: 'tabular-nums' }}>{String(comprados).padStart(2, '0')}</span>
                      <span className="text-faint font-normal text-base">/ {String(total).padStart(2, '0')}</span>
                    </div>
                  </div>
                  <motion.div
                    key={pct}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="font-display text-5xl font-bold leading-none tabular-nums"
                    style={{ color: pct === 100 ? '#34d399' : '#ff5a26', textShadow: pct === 100 ? '0 0 30px rgba(52,211,153,0.3)' : '0 0 30px rgba(255,90,38,0.3)' }}
                  >
                    {pct}<span className="text-xl opacity-50">%</span>
                  </motion.div>
                </div>
                <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden">
                  <motion.div
                    animate={{ width: pct + '%' }}
                    transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                    className="h-full rounded-full"
                    style={{
                      background: pct === 100 ? 'linear-gradient(90deg,#1a7a35,#34d399)' : 'linear-gradient(90deg,#c8431a,#ff5a26,#ff7a50)',
                      boxShadow: pct === 100 ? '0 0 12px rgba(52,211,153,0.5)' : '0 0 12px rgba(255,90,38,0.5)',
                    }}
                  />
                </div>
              </div>

              {/* Toolbar */}
              <div className="flex gap-2 mb-5">
                {isOwner && (
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
                )}
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
                            isOwner={isOwner}
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

              {/* Add item — owner only */}
              {isGuest && (
                <div className="mt-2 px-3.5 py-2.5 rounded-xl border border-line bg-white/[0.02] text-center">
                  <span className="font-mono text-[0.65rem] text-faint tracking-[0.1em]">
                    Só o organizador pode adicionar itens
                  </span>
                </div>
              )}
              {isOwner && <motion.div
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
              </motion.div>}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <AddMealModal open={showAddMeal} onClose={() => setAddMeal(false)} onAdd={handleAddMealWithIngredientes} />
      <ShareModal open={showShare} onClose={() => setShare(false)} shareUrl={trip.shareUrl} isOwner={isOwner} />
      <NewTripWizard
        open={showWizard}
        onClose={() => { setWizardDismissed(true); setShowWizard(false) }}
        onCreate={handleCreateTrip}
      />
      {showPricing && (
        <Pricing
          onClose={() => setShowPricing(false)}
          tripId={trip.tripId}
        />
      )}
      {verifying && (
        <div className="fixed inset-0 z-[600] bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center gap-4">
          <div className="text-4xl">✨</div>
          <div className="font-mono text-[0.75rem] tracking-[0.2em] text-brand uppercase animate-pulse">
            A verificar pagamento…
          </div>
        </div>
      )}
      <Toast toast={toast} />
    </div>
  )
}
