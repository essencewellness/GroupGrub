import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

// Dictionary of all UI strings. Portuguese is the source language.
// English is scaffolded (same strings) so adding real translations later is trivial.
import pt from './locales/pt'
import en from './locales/en'

i18n.use(initReactI18next).init({
  resources: {
    pt: { translation: pt },
    en: { translation: en },
  },
  lng: 'pt',
  fallbackLng: 'pt',
  returnObjects: true,
  interpolation: { escapeValue: false },
})

export default i18n
