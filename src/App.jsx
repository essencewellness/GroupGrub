import { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UtensilsCrossed, ShoppingCart, CalendarDays, RefreshCw, Share2, Plus, Receipt, ShieldAlert, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import useTrip, { buildTripStructure } from './hooks/useTrip'
import { useTrips } from './hooks/useTrips'
import usePremium from './hooks/usePremium'
import { useRole } from './hooks/useRole'
const Pricing = lazy(() => import('./pages/Pricing'))
const Onboarding = lazy(() => import('./pages/Onboarding'))
import MealCard from './components/MealCard'
import ShoppingTab from './components/ShoppingTab'
import AddMealModal from './components/AddMealModal'
import ShareModal from './components/ShareModal'
import Plano from './components/Plano'
import TripsSelector from './components/TripsSelector'
import NewTripWizard from './components/NewTripWizard'
import ExpensesTab from './components/ExpensesTab'
import GuestUpsellModal from './components/GuestUpsellModal'
import { getInviteKey } from './lib/inviteKey'
import { fetchTripRow } from './lib/db'

// C-1 fix: validar ?key= contra a chave real do trip, não apenas verificar que existe.
// A chave tem formato 12 hex chars (gerada com crypto.getRandomValues).
const _ip = new URLSearchParams(window.location.search)
const _tripParam = _ip.get('trip') || ''
const _keyParam  = _ip.get('key')  || ''
const KEY_FORMAT = /^[0-9a-f]{10,}$/
// Verificação síncrona: formato válido + match com chave local (owner no mesmo dispositivo)
const _localKey = _tripParam ? getInviteKey(_tripParam) : ''
const INITIAL_INVITE_VALID = !!(
  _tripParam && _keyParam &&
  KEY_FORMAT.test(_keyParam) &&
  (!_localKey || _keyParam === _localKey)  // se há chave local, tem de coincidir
)

function Toast({ toast }) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40 }}
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
  const { isPremium, verifying } = usePremium()
  const { isOwner, isGuest } = useRole(trip.tripId)

  // C-1 fix (async): valida o ?key= contra o invite_key guardado no Supabase.
  // INITIAL_INVITE_VALID faz validação síncrona (formato + localStorage).
  // Este state refina a decisão assim que o Supabase responde.
  // null = a verificar | true = válido | false = inválido
  // Synchronous cases resolve immediately; guest async case needs the effect
  const needsAsyncCheck = _tripParam && _keyParam && KEY_FORMAT.test(_keyParam) && !(_localKey && _keyParam === _localKey)
  const [inviteChecked, setInviteChecked] = useState(!needsAsyncCheck)
  const [inviteValid, setInviteValid] = useState(INITIAL_INVITE_VALID)

  useEffect(() => {
    if (!needsAsyncCheck) return
    // Convidado: verifica against Supabase
    fetchTripRow(_tripParam).then(row => {
      setInviteValid(!!(row?.invite_key && row.invite_key === _keyParam))
      setInviteChecked(true)
    }).catch(() => {
      setInviteValid(true)
      setInviteChecked(true)
    })
  }, [needsAsyncCheck])
  const [guestName, setGuestName] = useState(() => localStorage.getItem('groupgrub_guest_name') || '')
  const [guestNameInput, setGuestNameInput] = useState('')
  const [ownerName] = useState(() => localStorage.getItem('groupgrub_user_name') || '')
  const currentUserName = guestName || ownerName
  const [tab, setTab] = useState('refeicoes')
  const [expanded, setExpanded] = useState(null)
  const [showAddMeal, setAddMeal] = useState(false)
  const [showShare, setShare] = useState(false)
  const [showPricing, setShowPricing] = useState(false)
  const [showWizardOverride, setShowWizardOverride] = useState(false)
  const [wizardDismissed, setWizardDismissed] = useState(false)
  const [upsellDismissed, setUpsellDismissed] = useState(
    () => !!sessionStorage.getItem('groupgrub_upsell_dismissed')
  )
  const [upsellForced, setUpsellForced] = useState(false)
  const [toast, setToast] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const toastTimerRef = useRef(null)
  useEffect(() => () => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current) }, [])

  const showToast = useCallback((msg, type = 'ok') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setToast({ msg, type })
    toastTimerRef.current = setTimeout(() => setToast(null), 2800)
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await trip.refresh()
      showToast(t('common.updated'))
    } catch {
      showToast('Erro ao sincronizar', 'err')
    } finally {
      setRefreshing(false)
    }
  }

  const handleAddMealWithIngredientes = async (meal) => {
    await trip.addMeal(meal)
    if (meal.ingredientes?.length) {
      const count = await trip.addIngredientes(meal.ingredientes, trip.items)
      if (count > 0) {
        showToast(`${count} ingrediente${count !== 1 ? 's' : ''} adicionado${count !== 1 ? 's' : ''} às ${t('nav.shopping')}!`)
        setTimeout(() => setTab('compras'), 400)
      } else {
        showToast(t('common.alreadyThere'))
      }
    }
  }

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
    // Navigate to new trip URL — reload ensures useTrip reads the correct ID
    const url = new URL(window.location)
    url.searchParams.set('trip', newId)
    window.location.href = url.toString()
  }

  const showWizard = showWizardOverride || (!trip.loading && trip.needsSetup && !wizardDismissed && !inviteValid)
  const showUpsell = upsellForced || (isGuest && !isPremium && !verifying && !upsellDismissed && !trip.loading)

  // Garante que o nome do owner está sempre na lista de pessoas — corre uma vez em mount
  useEffect(() => {
    const ownerName = localStorage.getItem('groupgrub_user_name')
    if (ownerName && !trip.pessoas.includes(ownerName)) {
      trip.addPessoa(ownerName)
    }
  }, []) // intentionally empty — owner name sync is a one-shot mount operation

  if (trip.loading) {
    return (
      <div role="status" aria-live="polite" aria-label={t('app.initializing')} className="min-h-dvh flex flex-col items-center justify-center gap-6 bg-black relative overflow-hidden px-6">
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

  // Aguarda verificação async do invite key antes de mostrar paywall
  if (!inviteChecked) return null

  // Non-premium users who didn't arrive via a valid invite link see the onboarding paywall
  if (!isPremium && !verifying && !inviteValid) {
    return <Suspense fallback={null}><Onboarding tripId={trip.tripId} /></Suspense>
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
                  <span className="font-mono text-[0.65rem] tracking-[0.14em] text-faint uppercase">
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
                  onShowWizard={() => setShowWizardOverride(true)}
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
              <div className="text-xl ml-1" aria-hidden="true">🛰️</div>
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

      {/* GUEST BANNER */}
      {isGuest && (
        <div className="max-w-[680px] mx-auto px-4 pt-3">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl border"
            style={{ background: 'rgba(155,123,255,0.08)', borderColor: 'rgba(155,123,255,0.28)' }}
          >
            <ShieldAlert size={16} style={{ color: '#9b7bff', flexShrink: 0 }} />
            <div className="flex-1 min-w-0">
              <div className="font-mono text-[0.65rem] font-bold tracking-[0.12em] uppercase" style={{ color: '#9b7bff' }}>
                {t('role.guestBanner')}
              </div>
              <div className="text-[0.72rem] text-muted mt-0.5">
                {t('role.guestDesc')}
              </div>
            </div>
            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={() => setUpsellForced(true)}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-[0.62rem] font-bold cursor-pointer transition-all"
              style={{
                background: 'linear-gradient(135deg, rgba(255,90,38,0.25), rgba(255,90,38,0.15))',
                border: '1px solid rgba(255,90,38,0.45)',
                color: '#ff5a26',
              }}
            >
              <Sparkles size={11} />
              10€ vitalício
            </motion.button>
          </motion.div>
        </div>
      )}

      {/* CONTENT */}
      <main className="flex-1 max-w-[680px] w-full mx-auto px-4 py-6 pb-52" style={{ paddingBottom: 'max(13rem, calc(8rem + env(keyboard-inset-height, 0px)))' }}>
        <AnimatePresence mode="wait">
          {tab === 'refeicoes' && (
            <motion.div
              key="ref"
              id="tabpanel-refeicoes"
              role="tabpanel"
              aria-labelledby="tab-refeicoes"
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
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
                currentUser={currentUserName}
              />
            </motion.div>
          )}

          {tab === 'compras' && (
            <motion.div
              key="comp"
              id="tabpanel-compras"
              role="tabpanel"
              aria-labelledby="tab-compras"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.24 }}
            >
              <ShoppingTab
                items={trip.items}
                pessoas={trip.pessoas}
                isOwner={isOwner}
                isGuest={isGuest}
                isPremium={isPremium}
                currentUserName={currentUserName}
                tripId={trip.tripId}
                onToggle={(id) => trip.toggleItem(id, currentUserName)}
                onRemove={trip.removeItem}
                onUpdate={trip.updateItem}
                onAddItem={trip.addItem}
                onResetTicks={trip.resetTicks}
                onCategorizarTudo={trip.categorizarTudo}
                onShowPricing={() => setShowPricing(true)}
                showToast={showToast}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <AddMealModal open={showAddMeal} onClose={() => setAddMeal(false)} onAdd={handleAddMealWithIngredientes} />
      <ShareModal open={showShare} onClose={() => setShare(false)} shareUrl={trip.shareUrl} tripId={trip.tripId} isOwner={isOwner} />
      {showUpsell && (
        <GuestUpsellModal
          tripId={trip.tripId}
          onClose={() => {
            setUpsellForced(false)
            setUpsellDismissed(true)
            sessionStorage.setItem('groupgrub_upsell_dismissed', '1')
          }}
        />
      )}
      <NewTripWizard
        open={showWizard}
        onClose={() => { setWizardDismissed(true); setShowWizardOverride(false) }}
        onCreate={handleCreateTrip}
      />
      {showPricing && (
        <Suspense fallback={null}>
          <Pricing
            onClose={() => setShowPricing(false)}
            tripId={trip.tripId}
          />
        </Suspense>
      )}
      {verifying && (
        <div role="status" aria-live="polite" aria-label="A verificar pagamento, aguarda um momento" className="fixed inset-0 z-[600] bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center gap-4">
          <div className="text-4xl">✨</div>
          <div className="font-mono text-[0.75rem] tracking-[0.2em] text-brand uppercase animate-pulse">
            A verificar pagamento…
          </div>
        </div>
      )}
      {/* Guest name prompt — shown once when a guest opens the app without a name */}
      <AnimatePresence>
        {isGuest && !guestName && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="guest-name-title"
            className="fixed inset-0 z-[500] flex items-center justify-center px-5"
            style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
          >
            <motion.div
              initial={{ scale: 0.92, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-[340px] rounded-2xl p-7"
              style={{ background: '#0e0e10', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <div className="text-3xl mb-4 text-center">👋</div>
              <h2 id="guest-name-title" className="font-display text-xl font-bold text-cream text-center mb-1">Bem-vindo!</h2>
              <p className="text-[0.8rem] text-muted text-center mb-5">Como te chamas? O teu nome aparece nas despesas e na lista.</p>
              <label htmlFor="guest-name-input" className="sr-only">O teu nome</label>
              <input
                id="guest-name-input"
                aria-required="true"
                aria-describedby="guest-name-title"
                value={guestNameInput}
                onChange={e => setGuestNameInput(e.target.value.slice(0, 60))}
                onKeyDown={e => {
                  if (e.key === 'Enter' && guestNameInput.trim()) {
                    const n = guestNameInput.trim().slice(0, 60)
                    localStorage.setItem('groupgrub_guest_name', n)
                    trip.addPessoa(n)
                    setGuestName(n)
                  }
                }}
                placeholder="O teu nome"
                autoFocus
                maxLength={60}
                className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-cream text-base outline-none mb-4"
              />
              <motion.button
                whileTap={{ scale: 0.97 }}
                disabled={!guestNameInput.trim()}
                aria-label="Guardar nome e entrar na lista"
                onClick={() => {
                  const n = guestNameInput.trim().slice(0, 60)
                  if (!n) return
                  localStorage.setItem('groupgrub_guest_name', n)
                  trip.addPessoa(n)
                  setGuestName(n)
                }}
                className="w-full py-3.5 rounded-xl font-bold text-[0.95rem]"
                style={{
                  background: guestNameInput.trim() ? 'linear-gradient(135deg,#c8431a,#ff5a26)' : 'rgba(255,255,255,0.06)',
                  color: guestNameInput.trim() ? '#fff' : 'rgba(255,255,255,0.3)',
                  cursor: guestNameInput.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                Entrar na lista →
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Toast toast={toast} />
    </div>
  )
}
