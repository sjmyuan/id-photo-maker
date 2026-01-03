export type PaperType = '6-inch' | 'a4'

export interface PaperTypeSelectorProps {
  paperType: PaperType
  onPaperTypeChange: (paperType: PaperType) => void
  testId?: string
}

/**
 * PaperTypeSelector component for selecting paper type in compact grid format
 * Options: 6-inch (4×6 in) or A4 (210×297 mm)
 */
export function PaperTypeSelector({ paperType, onPaperTypeChange, testId = 'paper-type-selector' }: PaperTypeSelectorProps) {
  return (
    <div data-testid={testId}>
      <h3 className="text-sm font-semibold mb-2 text-gray-800">Paper Type</h3>
      <div className="space-y-1.5">
        <button
          onClick={() => onPaperTypeChange('6-inch')}
          className={`w-full px-2 py-1.5 text-left rounded border transition-colors ${
            paperType === '6-inch'
              ? 'border-blue-600 bg-blue-50 text-blue-900'
              : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
          }`}
          data-testid="paper-6-inch-button"
        >
          <div className="font-semibold text-xs">6-inch</div>
          <div className="text-[10px] text-gray-600">4×6 in</div>
        </button>
        <button
          onClick={() => onPaperTypeChange('a4')}
          className={`w-full px-2 py-1.5 text-left rounded border transition-colors ${
            paperType === 'a4'
              ? 'border-blue-600 bg-blue-50 text-blue-900'
              : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
          }`}
          data-testid="paper-a4-button"
        >
          <div className="font-semibold text-xs">A4</div>
          <div className="text-[10px] text-gray-600">210×297 mm</div>
        </button>
      </div>
    </div>
  )
}
