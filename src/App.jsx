import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { UtensilsCrossed, ShoppingCart, CalendarDays, RefreshCw, Share2, Plus, Receipt } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import useTrip, { buildTripStructure } from './hooks/useTrip'
import { useTrips } from './hooks/useTrips'
import MealCard from './components/MealCard'
import ShoppingTab from './components/ShoppingTab'
import AddMealModal from './components/AddMealModal'
import ShareModal from './components/ShareModal'
import Plano from './components/Plano'
import TripsSelector from './components/TripsSelector'
import NewTripWizard from './components/NewTripWizard'
import ExpensesTab from './components/ExpensesTab'
import GuestNamePrompt from './components/GuestNamePrompt'
import { GUEST_NAME_MAX_LENGTH, TOAST_DURATION_MS, TAB_SWITCH_DELAY_MS } from './lib/constants'
import { getInviteKey } from './lib/inviteKey'

// App gratuita, sem contas: quem tem o link tem acesso total. Só pedimos o
// nome uma vez (para atribuir despesas/itens) — ver `myName` mais abaixo.
const isOwner = true

function Toast({ toast }) {
  const shouldReduceMotion = useReducedMotion()
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 60, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={shouldReduceMotion ? undefined : { opacity: 0, y: 40 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          role="alert"
          aria-live="assertive"
          className="fixed bottom-7 left-1/2 -translate-x-1/2 z-[200] px-6 py-2.5 rounded-xl font-mono text-sm font-semibold tracking-wide"
          style={{
            background: 'rgba(10,10,11,0.94)',
            color: toast.type === 'err' ? '#ff5a26' : '#34d399',
            border: `1px solid ${toast.type === 'err' ? 'rgba(255,90,38,0.45)' : 'rgba(52,211,153,0.45)'}`,
            boxShadow: `0 0 26px ${toast.type === 'err' ? 'rgba(255,90,38,0.28)' : 'rgba(52,211,153,0.18)'}, 0 12px 40px rgba(0,0,0,.7)`,
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
  const shouldReduceMotion = useReducedMotion()
  // Nome de quem está a usar a app agora — pedido uma única vez (ver GuestNamePrompt
  // mais abaixo), independentemente de ter criado a viagem ou entrado por um link.
  const [myName, setMyName] = useState(
    () => localStorage.getItem('groupgrub_user_name') || localStorage.getItem('groupgrub_guest_name') || ''
  )
  const [guestNameInput, setGuestNameInput] = useState('')
  const [tab, setTab] = useState('refeicoes')
  const [expanded, setExpanded] = useState(null)
  const [showAddMeal, setAddMeal] = useState(false)
  const [showShare, setShare] = useState(false)
  const [showWizardOverride, setShowWizardOverride] = useState(false)
  const [wizardDismissed, setWizardDismissed] = useState(false)
  const [toast, setToast] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const toastTimerRef = useRef(null)
  useEffect(() => () => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current) }, [])

  const showToast = useCallback((msg, type = 'ok') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setToast({ msg, type })
    toastTimerRef.current = setTimeout(() => setToast(null), TOAST_DURATION_MS)
  }, [])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await trip.refresh()
      showToast(t('common.updated'))
    } catch {
      showToast(t('common.syncError'), 'err')
    } finally {
      setRefreshing(false)
    }
  }, [trip.refresh, showToast, t])

  const handleAddMealWithIngredientes = useCallback(async (meal) => {
    await trip.addMeal(meal)
    if (meal.ingredientes?.length) {
      const count = await trip.addIngredientes(meal.ingredientes, trip.items)
      if (count > 0) {
        showToast(`${count} ingrediente${count !== 1 ? 's' : ''} adicionado${count !== 1 ? 's' : ''} às ${t('nav.shopping')}!`)
        setTimeout(() => setTab('compras'), TAB_SWITCH_DELAY_MS)
      } else {
        showToast(t('common.alreadyThere'))
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip.addMeal, trip.addIngredientes, trip.items, showToast, t])

  /** Called by the New Trip Wizard. Creates the trip, saves meta, navigates to the new trip URL. */
  const handleCreateTrip = async (meta) => {
    const newId = await trips.createTrip(meta.title, null, meta.startDate, meta.endDate)
    // Save meta under the NEW trip's localStorage key before reload.
    // trip.setTripMeta() uses the OLD tripId from its closure — calling it would write to the
    // wrong key and cause needsSetup=true on the next load, reopening the wizard immediately.
    const structure = buildTripStructure(meta.startDate, meta.endDate)
    localStorage.setItem(`ferias_meta_${newId}`, JSON.stringify({ ...meta, structure }))
    setWizardDismissed(true)
    showToast(`"${meta.title}" ${t('common.added')}`)
    // Navigate to new trip URL — reload ensures useTrip reads the correct ID.
    // Carry &key= in the owner's own address bar too, same as guest links: if
    // her localStorage is ever wiped (iOS Safari, PWA reinstall, new device),
    // this URL — bookmarked, in PWA history, or shared to herself — is what
    // lets the app recover the real token instead of silently minting a new
    // one that can never match the server's stored invite_token.
    const url = new URL(window.location)
    url.searchParams.set('trip', newId)
    const key = getInviteKey(newId)
    if (key) url.searchParams.set('key', key)
    window.location.href = url.toString()
  }

  // Stable toggle callback for ShoppingTab — avoids recreating an arrow function
  // per render that would break React.memo on ShopItem items.
  const handleToggleItem = useCallback((id) => trip.toggleItem(id, myName), [trip.toggleItem, myName])

  const showWizard = showWizardOverride || (!trip.loading && trip.needsSetup && !wizardDismissed)

  // Garante que quem já tinha dado o nome está sempre na lista de pessoas — corre uma vez em mount
  useEffect(() => {
    if (myName && !trip.pessoas.includes(myName)) {
      trip.addPessoa(myName)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // intentionally empty — one-shot mount operation

  if (trip.loading) {
    return (
      <div role="status" aria-live="polite" aria-label={t('app.initializing')} className="min-h-dvh flex flex-col items-center justify-center gap-6 bg-black relative overflow-hidden px-6">
        {/* Atmospheric glow */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 60%, rgba(255,90,38,0.08) 0%, transparent 70%)'
        }} />
        <motion.div
          animate={shouldReduceMotion ? {} : { y: [0, -6, 0] }}
          transition={shouldReduceMotion ? {} : { duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="text-5xl"
        >🛰️</motion.div>
        <div>
          <div className="font-display text-2xl font-bold tracking-[-0.01em] text-cream text-center">
            GROUP<span className="text-brand">GRUB</span>
          </div>
          <div className="font-mono text-[0.6rem] tracking-[0.25em] text-faint uppercase text-center mt-1.5 motion-safe:animate-pulse">
            {t('app.initializing')}
          </div>
        </div>
        <div className="w-[140px] h-[2px] bg-white/[0.06] overflow-hidden rounded-full">
          <motion.div
            animate={{ x: ['-100%', '280%'] }}
            transition={shouldReduceMotion ? { duration: 0 } : { duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
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
      <header className="sticky top-0 z-50 border-b border-line" style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(20px) saturate(1.5)', paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="max-w-[680px] mx-auto px-5">
          <div className="flex items-center justify-between py-3.5">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex-shrink-0">
                <h1 className="font-display text-[1.15rem] font-bold tracking-[-0.01em] text-cream leading-none">
                  GROUP<span className="text-brand">GRUB</span>
                </h1>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand flex-shrink-0 glow-brand" />
                  <span className="font-mono text-[0.65rem] tracking-[0.14em] text-faint uppercase">
                    {trip.tripId ? `#${trip.tripId}` : 'offline'}
                  </span>
                </div>
              </div>
              <div className="w-px h-8 bg-line flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <TripsSelector
                  currentTripId={trip.tripId}
                  trips={trips.trips}
                  tripsLoading={trips.loading}
                  onSwitchTrip={trip.setTripId}
                  onDeleteTrip={trips.deleteTrip}
                  onShowWizard={() => setShowWizardOverride(true)}
                />
              </div>
            </div>
            <div className="flex gap-1.5 items-center flex-shrink-0 ml-2">
              <motion.button
                whileTap={{ scale: 0.88 }}
                animate={refreshing ? { rotate: 360 } : { rotate: 0 }}
                transition={refreshing && !shouldReduceMotion ? { duration: 0.6, repeat: Infinity, ease: 'linear' } : {}}
                onClick={handleRefresh}
                aria-label={t('common.sync')}
                className="w-11 h-11 flex items-center justify-center rounded-lg border border-line bg-white/[0.03] text-faint hover:text-cream hover:border-lineStrong transition-all"
              >
                <RefreshCw size={13} aria-hidden="true" />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={() => setShare(true)}
                aria-label={t('common.share')}
                className="w-11 h-11 flex items-center justify-center rounded-lg border border-line bg-white/[0.03] text-faint hover:text-cream hover:border-lineStrong transition-all"
              >
                <Share2 size={14} aria-hidden="true" />
              </motion.button>
              <div className="hidden sm:block text-xl ml-1" aria-hidden="true">🛰️</div>
            </div>
          </div>

          {/* Tabs */}
          <div role="tablist" aria-label="Secções da aplicação" className="flex gap-0.5 pb-0 relative">
            {[
              { key: 'refeicoes', label: t('nav.meals'), Icon: UtensilsCrossed },
              { key: 'plano', label: t('nav.plan'), Icon: CalendarDays },
              { key: 'compras', label: t('nav.shopping'), Icon: ShoppingCart },
              { key: 'contas', label: t('expenses.tab'), Icon: Receipt },
            ].map(({ key, label, Icon }) => (
              <button
                key={key}
                role="tab"
                aria-selected={tab === key}
                aria-controls={`tabpanel-${key}`}
                id={`tab-${key}`}
                onClick={() => setTab(key)}
                className={`flex-1 py-3.5 text-[0.65rem] font-bold tracking-[0.1em] transition-all duration-200 relative ${
                  tab === key ? 'text-brand' : 'text-faint hover:text-muted'
                }`}
              >
                <span className="relative z-10 flex items-center justify-center gap-1.5">
                  <Icon size={13} strokeWidth={tab === key ? 2.5 : 1.8} aria-hidden="true" /> {label}
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

      {/* CONTENT */}
      <main className="flex-1 max-w-[680px] w-full mx-auto px-4 py-6 pb-52" style={{ paddingBottom: 'max(13rem, calc(8rem + env(keyboard-inset-height, 0px)))' }}>
        <AnimatePresence mode={shouldReduceMotion ? 'sync' : 'wait'}>
          {tab === 'refeicoes' && (
            <motion.div
              key="ref"
              id="tabpanel-refeicoes"
              role="tabpanel"
              aria-labelledby="tab-refeicoes"
              initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0, y: -16 }}
              transition={{ duration: 0.24 }}
              className="grid gap-2.5"
            >
              {trip.meals.map((meal) => (
                <MealCard
                  key={meal.id}
                  meal={meal}
                  isOpen={expanded === meal.id}
                  isOwner={isOwner}
                  onClick={() => setExpanded(expanded === meal.id ? null : meal.id)}
                  onUpdate={async (patch) => {
                    const prevIngs = meal.ingredientes || []
                    await trip.updateMeal(meal.id, patch)
                    if (patch.ingredientes?.length > prevIngs.length) {
                      const novos = patch.ingredientes.filter(i => !prevIngs.includes(i))
                      if (novos.length) {
                        const count = await trip.addIngredientes(novos, trip.items)
                        if (count > 0) showToast(`${count} ingrediente(s) → Lista de compras!`)
                      }
                    }
                  }}
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
            <motion.div
              key="plano"
              id="tabpanel-plano"
              role="tabpanel"
              aria-labelledby="tab-plano"
              initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0, y: -16 }}
              transition={{ duration: 0.24 }}
            >
              <Plano meals={trip.meals} plano={trip.plano} onUpdate={trip.updatePlano} structure={trip.structure} />
            </motion.div>
          )}

          {tab === 'contas' && (
            <motion.div
              key="contas"
              id="tabpanel-contas"
              role="tabpanel"
              aria-labelledby="tab-contas"
              initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0, y: -16 }}
              transition={{ duration: 0.24 }}
            >
              <ExpensesTab
                expenses={trip.expenses}
                pessoas={trip.pessoas}
                onAddExpense={trip.addExpense}
                onRemoveExpense={trip.removeExpense}
                onAddPessoa={trip.addPessoa}
                onRemovePessoa={trip.removePessoa}
                isOwner={isOwner}
                currentUser={myName}
              />
            </motion.div>
          )}

          {tab === 'compras' && (
            <motion.div
              key="comp"
              id="tabpanel-compras"
              role="tabpanel"
              aria-labelledby="tab-compras"
              initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0, y: -16 }}
              transition={{ duration: 0.24 }}
            >
              <ShoppingTab
                items={trip.items}
                pessoas={trip.pessoas}
                isOwner={isOwner}
                tripId={trip.tripId}
                onToggle={handleToggleItem}
                onRemove={trip.removeItem}
                onUpdate={trip.updateItem}
                onAddItem={trip.addItem}
                onResetTicks={trip.resetTicks}
                onCategorizarTudo={trip.categorizarTudo}
                showToast={showToast}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <AddMealModal open={showAddMeal} onClose={() => setAddMeal(false)} onAdd={handleAddMealWithIngredientes} />
      <ShareModal open={showShare} onClose={() => setShare(false)} shareUrl={trip.shareUrl} tripId={trip.tripId} isOwner={isOwner} />
      <NewTripWizard
        open={showWizard}
        onClose={() => { setWizardDismissed(true); setShowWizardOverride(false) }}
        onCreate={handleCreateTrip}
      />
      {/* Pedido de nome — mostrado uma única vez, a quem quer que abra a app sem nome guardado */}
      <AnimatePresence>
        {!myName && (
          <GuestNamePrompt
            guestNameInput={guestNameInput}
            onInputChange={setGuestNameInput}
            onConfirm={() => {
              const n = guestNameInput.trim().slice(0, GUEST_NAME_MAX_LENGTH)
              if (!n) return
              localStorage.setItem('groupgrub_user_name', n)
              trip.addPessoa(n)
              setMyName(n)
            }}
          />
        )}
      </AnimatePresence>

      <Toast toast={toast} />
    </div>
  )
}
