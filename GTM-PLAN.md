# 📱 GTM Plan — App Férias Celorico
*(Single PWA + Native Wrapper Model)*

## ✅ Modelo de Produto

| Component | Description | Cost |
|-----------|-------------|------|
| **Core App** | 1 PWA — funciona como app nativo | €0 (Vercel) |
| **App Store Presence** | PWA Builder wrapper → .ipa / .apk | €123/ano (Apple) |
| **Monetização** | Within-app paywall (mock → Stripe) | 1.4% + €0,25/tx |

---

## 🏗️ Architecture (Single Codebase)

```
1 Codebase → 1 PWA → Multiple Distribution Channels
              ↳ Web browser (https://ferias-app-pi.vercel.app)
              ↳ PWA instalada (Adicionar ao ecrã)
              ↳ App Store (PWA Builder .ipa wrapper)
              ↳ Play Store (PWA Builder .apk/aab wrapper)
              ↳ Desktop (Chrome/Edge instalável)
```

## Monetização Integrada

| Plan | Preço | Features | Como funciona |
|------|-------|----------|---------------|
| **Free** | €0 | 1 trip, localStorage, sync básico | Usa app normal |
| **Pro** | **€10 one-time** | Ilimitado: multi-trips, PDF export, templates, assignment, backup | Unlock dentro da app |

## Fases de Implementação

### Phase 1: Core Premium (Sprint 1-2)
- Auth (email/password)
- Paywall UI + mock payment
- Feature gating (`usePremium()`)
- Templates + assignment
- Exportação PDF

### Phase 2: Store Presence (Sprint 3)
- PWA config para instalável
- PWA Builder wrapper
- App Store screenshots
- Privacy policy hosting

### Phase 3: Publicação (Sprint 4-5)
- Submeter às stores
- Configurar Stripe (quando pronto para vender)
- Testes reais de pagamento

---
