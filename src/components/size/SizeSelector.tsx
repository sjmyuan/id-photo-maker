import { useTranslation } from 'react-i18next'
import { SIZE_OPTIONS, type SizeOption } from './CropEditor'

export interface SizeSelectorProps {
  selectedSize: SizeOption
  onSizeChange: (size: SizeOption) => void
  testId?: string
}

/**
 * SizeSelector component for selecting photo size in grid flow format
 * Displays 1-inch, 2-inch, and 3-inch size options with dimensions
 * Uses 2-column grid layout with auto-wrap for better space utilization
 */
export function SizeSelector({ selectedSize, onSizeChange, testId = 'size-selector' }: SizeSelectorProps) {
  const { t } = useTranslation()
  
  return (
    <div data-testid={testId}>
      <h3 className="text-sm font-semibold mb-2 text-gray-800">{t('photoSize.label')}</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {SIZE_OPTIONS.map((size) => (
          <button
            key={size.id}
            onClick={() => onSizeChange(size)}
            className={`w-full px-2 py-1.5 text-left rounded border transition-colors ${
              selectedSize.id === size.id
                ? 'border-blue-600 bg-blue-50 text-blue-900'
                : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
            }`}
          >
            <div className="font-semibold text-xs">{t(size.labelKey)}</div>
            <div className="text-[10px] text-gray-600">{size.dimensions}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
