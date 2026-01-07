import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PRESET_COLORS } from '../../constants/colors'

export interface BackgroundSelectorProps {
  /** Callback when background color changes */
  onColorChange: (color: string) => void
  /** Initial background color in hex format (default: #FFFFFF) */
  initialColor?: string
}

interface RGBColor {
  r: number
  g: number
  b: number
}

/**
 * Converts a hex color string to RGB values
 * @param hex - Hex color string (e.g., #FF0000)
 * @returns RGB color object
 */
function hexToRgb(hex: string): RGBColor {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 255, g: 255, b: 255 }
}

/**
 * Converts RGB values to a hex color string
 * @param r - Red value (0-255)
 * @param g - Green value (0-255)
 * @param b - Blue value (0-255)
 * @returns Hex color string (e.g., #FF0000)
 */
function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = Math.max(0, Math.min(255, Math.round(n))).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase()
}

/**
 * Validates if a value is within the valid RGB range (0-255)
 * @param value - Value to validate
 * @returns True if valid, false otherwise
 */
function isValidRgbValue(value: number): boolean {
  return !isNaN(value) && value >= 0 && value <= 255
}

/**
 * BackgroundSelector component allows users to select preset background colors
 * (red, blue, white) or enter custom RGB values with real-time validation.
 * 
 * Acceptance Criteria:
 * - Preset colors change background immediately to #FF0000, #0000FF, #FFFFFF
 * - Custom RGB values (0-255) update in real-time with validation
 * - Invalid inputs show error messages and prevent application
 */
export function BackgroundSelector({ 
  onColorChange, 
  initialColor = '#FFFFFF' 
}: BackgroundSelectorProps) {
  const { t } = useTranslation()
  const [selectedColor, setSelectedColor] = useState<string>(initialColor)
  const [rgbValues, setRgbValues] = useState<RGBColor>(hexToRgb(initialColor))
  const [errors, setErrors] = useState<{ r?: string; g?: string; b?: string }>({})

  const handlePresetClick = (color: string) => {
    setSelectedColor(color)
    setRgbValues(hexToRgb(color))
    setErrors({})
    onColorChange(color)
  }

  const handleRgbChange = (channel: 'r' | 'g' | 'b', value: string) => {
    const numValue = parseInt(value, 10)
    
    // Update the RGB value (use 0 for empty string temporarily)
    const newRgbValues = { ...rgbValues, [channel]: isNaN(numValue) ? 0 : numValue }
    setRgbValues(newRgbValues)
    
    // Validate - empty string, NaN, or out of range
    if (value === '' || isNaN(numValue) || !isValidRgbValue(numValue)) {
      setErrors((prev) => ({ 
        ...prev, 
        [channel]: 'Value must be between 0 and 255' 
      }))
    } else {
      // Valid value - clear error for this channel
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[channel]
        return newErrors
      })
      
      // If all values are valid, update the color
      if (isValidRgbValue(newRgbValues.r) && 
          isValidRgbValue(newRgbValues.g) && 
          isValidRgbValue(newRgbValues.b)) {
        const hexColor = rgbToHex(newRgbValues.r, newRgbValues.g, newRgbValues.b)
        setSelectedColor(hexColor)
        onColorChange(hexColor)
      }
    }
  }

  const hasErrors = Object.keys(errors).length > 0

  return (
    <div className="space-y-4">
      {/* Preview */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700">
          Background Color Preview
        </label>
        <div
          data-testid="background-preview"
          className="h-24 rounded-lg border-2 border-gray-300 shadow-sm"
          style={{ backgroundColor: selectedColor }}
        />
      </div>

      {/* Preset Colors */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          Preset Colors
        </label>
        <div className="grid grid-cols-3 gap-3">
          {PRESET_COLORS.map((color) => (
            <button
              key={color.value}
              type="button"
              onClick={() => handlePresetClick(color.value)}
              className={`
                flex flex-col items-center gap-2 px-4 py-3 rounded-lg 
                border-2 transition-all hover:shadow-md
                ${
                  selectedColor === color.value
                    ? 'ring-2 ring-blue-500 ring-offset-2 border-blue-500'
                    : 'border-gray-300 hover:border-gray-400'
                }
              `}
              aria-label={t(color.nameKey)}
            >
              <div
                className="w-12 h-12 rounded border-2 border-gray-400"
                style={{ backgroundColor: color.value }}
              />
              <span className="text-sm font-medium text-gray-700">
                {t(color.nameKey)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom RGB Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          Custom RGB Color
        </label>
        <div className="flex gap-3">
          {/* Red Input */}
          <div className="flex-1">
            <label htmlFor="rgb-red" className="block text-xs text-gray-600 mb-1">
              Red (0-255)
            </label>
            <input
              id="rgb-red"
              type="number"
              value={rgbValues.r}
              onChange={(e) => handleRgbChange('r', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.r
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
              aria-label="Red"
            />
          </div>

          {/* Green Input */}
          <div className="flex-1">
            <label htmlFor="rgb-green" className="block text-xs text-gray-600 mb-1">
              Green (0-255)
            </label>
            <input
              id="rgb-green"
              type="number"
              value={rgbValues.g}
              onChange={(e) => handleRgbChange('g', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.g
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
              aria-label="Green"
            />
          </div>

          {/* Blue Input */}
          <div className="flex-1">
            <label htmlFor="rgb-blue" className="block text-xs text-gray-600 mb-1">
              Blue (0-255)
            </label>
            <input
              id="rgb-blue"
              type="number"
              value={rgbValues.b}
              onChange={(e) => handleRgbChange('b', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.b
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
              aria-label="Blue"
            />
          </div>
        </div>

        {/* Error Message */}
        {hasErrors && (
          <p className="text-sm text-red-600">
            Value must be between 0 and 255
          </p>
        )}
      </div>
    </div>
  )
}
