import { useTranslation } from 'react-i18next'

/**
 * LanguageSelector component for switching between supported languages
 * Displays a dropdown with language options and updates the app language
 */
export function LanguageSelector() {
  const { i18n, t } = useTranslation()

  const languages = [
    { code: 'zh', name: t('language.zh') },
    { code: 'en', name: t('language.en') },
  ]

  const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    i18n.changeLanguage(event.target.value)
  }

  return (
    <div className="flex items-center gap-2" data-testid="language-selector">
      <label htmlFor="language-select" className="text-sm font-medium text-gray-700">
        {t('language.label')}:
      </label>
      <select
        id="language-select"
        value={i18n.language}
        onChange={handleLanguageChange}
        className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        data-testid="language-select"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.name}
          </option>
        ))}
      </select>
    </div>
  )
}
