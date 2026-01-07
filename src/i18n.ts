import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import zh from './locales/zh.json'

// Safely get saved language from localStorage or default to Chinese
const getSavedLanguage = (): string => {
  try {
    // In test environment, force English
    if (import.meta.env.MODE === 'test') {
      return 'en'
    }
    return localStorage.getItem('language') || 'zh'
  } catch {
    // localStorage not available (e.g., in tests), use English
    return 'en'
  }
}

const savedLanguage = getSavedLanguage()

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: en,
      },
      zh: {
        translation: zh,
      },
    },
    lng: savedLanguage, // Default language is Chinese
    fallbackLng: 'en', // Fallback to English if translation is missing
    interpolation: {
      escapeValue: false, // React already escapes values
    },
  })

// Save language changes to localStorage
i18n.on('languageChanged', (lng) => {
  try {
    localStorage.setItem('language', lng)
  } catch {
    // localStorage not available (e.g., in tests), ignore
  }
})

export default i18n
