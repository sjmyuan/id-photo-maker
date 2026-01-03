export interface DPISelectorProps {
  requiredDPI: 300 | null
  onDPIChange: (dpi: 300 | null) => void
  testId?: string
}

/**
 * DPISelector component for selecting DPI requirement in compact grid format
 * Options: 300 DPI (for print) or None (no requirement)
 */
export function DPISelector({ requiredDPI, onDPIChange, testId = 'dpi-selector' }: DPISelectorProps) {
  return (
    <div data-testid={testId}>
      <h3 className="text-sm font-semibold mb-2 text-gray-800">DPI</h3>
      <div className="space-y-1.5">
        <button
          onClick={() => onDPIChange(300)}
          className={`w-full px-2 py-1.5 text-left rounded border transition-colors ${
            requiredDPI === 300
              ? 'border-blue-600 bg-blue-50 text-blue-900'
              : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
          }`}
        >
          <div className="font-semibold text-xs">300 DPI</div>
          <div className="text-[10px] text-gray-600">For print</div>
        </button>
        <button
          onClick={() => onDPIChange(null)}
          className={`w-full px-2 py-1.5 text-left rounded border transition-colors ${
            requiredDPI === null
              ? 'border-blue-600 bg-blue-50 text-blue-900'
              : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
          }`}
        >
          <div className="font-semibold text-xs">None</div>
          <div className="text-[10px] text-gray-600">No requirement</div>
        </button>
      </div>
    </div>
  )
}
