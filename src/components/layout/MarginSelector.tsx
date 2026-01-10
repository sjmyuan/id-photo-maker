import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { type PaperMargins } from '../../types'
import { validateAllMargins } from '../../utils/marginValidation'

export interface MarginSelectorProps {
  margins: PaperMargins
  paperDimensions: {
    widthMm: number
    heightMm: number
  }
  onMarginsChange: (margins: PaperMargins) => void
  testId?: string
}

/**
 * MarginSelector component for configuring printer margins
 * Allows user to set top, bottom, left, right margins in millimeters
 */
export function MarginSelector({
  margins,
  paperDimensions,
  onMarginsChange,
  testId = 'margin-selector',
}: MarginSelectorProps) {
  const { t } = useTranslation()
  const [showDescription, setShowDescription] = useState(false)

  // Validate current margins
  const validation = validateAllMargins(margins, paperDimensions.widthMm, paperDimensions.heightMm)

  const handleMarginChange = (side: keyof PaperMargins, value: string) => {
    const numValue = value === '' ? 0 : parseFloat(value)
    const newMargins = { ...margins, [side]: numValue }
    onMarginsChange(newMargins)
  }

  const renderInput = (
    side: keyof PaperMargins,
    label: string,
    testId: string
  ) => {
    const error = validation.errors[side]
    const hasError = !!error

    return (
      <div className="flex-1">
        <label className="block text-xs font-medium text-gray-700 mb-1">
          {label}
        </label>
        <input
          type="number"
          value={margins[side]}
          onChange={(e) => handleMarginChange(side, e.target.value)}
          min="0"
          step="0.5"
          data-testid={testId}
          className={`w-full px-2 py-1 text-sm border rounded ${
            hasError
              ? 'border-red-500 bg-red-50'
              : 'border-gray-300 bg-white'
          } focus:outline-none focus:ring-1 ${
            hasError ? 'focus:ring-red-500' : 'focus:ring-blue-500'
          }`}
        />
        {hasError && (
          <p className="mt-0.5 text-[10px] text-red-600">{error}</p>
        )}
      </div>
    )
  }

  return (
    <div data-testid={testId}>
      <div className="flex items-center gap-1.5 mb-2">
        <h3 className="text-sm font-semibold text-gray-800">
          {t('margins.label')}
        </h3>
        <button
          type="button"
          onClick={() => setShowDescription(!showDescription)}
          className="flex items-center justify-center w-4 h-4 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 transition-colors"
          aria-label="Toggle margin description"
          data-testid="margin-info-icon"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-3 h-3"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM8.94 6.94a.75.75 0 11-1.061-1.061 3 3 0 112.871 5.026v.345a.75.75 0 01-1.5 0v-.5c0-.72.57-1.172 1.081-1.287A1.5 1.5 0 108.94 6.94zM10 15a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
      {showDescription && (
        <p className="text-xs text-gray-600 mb-2 p-2 bg-blue-50 rounded border border-blue-200" data-testid="margin-description">
          {t('margins.description')}
        </p>
      )}
      <div className="grid grid-cols-2 gap-2 mb-2">
        {renderInput('top', t('margins.top'), 'margin-top-input')}
        {renderInput('bottom', t('margins.bottom'), 'margin-bottom-input')}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {renderInput('left', t('margins.left'), 'margin-left-input')}
        {renderInput('right', t('margins.right'), 'margin-right-input')}
      </div>
      <p className="mt-1 text-[10px] text-gray-500">
        {t('margins.unit')}
      </p>
    </div>
  )
}
