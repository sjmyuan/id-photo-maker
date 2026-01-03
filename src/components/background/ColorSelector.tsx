import { PRESET_COLORS } from '../../constants/colors'

export interface ColorSelectorProps {
  backgroundColor: string
  onColorChange: (color: string) => void
  testId?: string
}

/**
 * ColorSelector component for selecting background color in compact grid format
 * Displays preset colors with color swatches
 */
export function ColorSelector({ backgroundColor, onColorChange, testId = 'color-selector' }: ColorSelectorProps) {
  return (
    <div data-testid={testId}>
      <h3 className="text-sm font-semibold mb-2 text-gray-800">Background</h3>
      <div className="grid grid-cols-3 gap-1.5">
        {PRESET_COLORS.map((color) => (
          <button
            key={color.value}
            data-testid={`color-${color.name.toLowerCase().replace(' ', '-')}`}
            onClick={() => onColorChange(color.value)}
            className={`px-1.5 py-1.5 rounded border transition-all ${
              backgroundColor === color.value
                ? 'border-blue-600 ring-4 ring-blue-200'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <div className="flex flex-col items-center gap-1">
              <div
                className="w-6 h-6 rounded border border-gray-400"
                style={{ backgroundColor: color.value }}
              />
              <span className="font-semibold text-[10px] text-center leading-tight">{color.name}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
