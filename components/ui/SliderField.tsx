'use client'

interface SliderFieldProps {
  label: string
  value: number
  unit: string
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
}

export default function SliderField({ label, value, unit, min, max, step, onChange }: SliderFieldProps) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-end">
        <label className="font-headline text-sm text-on-surface-variant">{label}</label>
        <span className="font-label text-lg font-bold text-tertiary">
          {value} <span className="text-xs uppercase">{unit}</span>
        </span>
      </div>
      <input
        className="w-full"
        max={max}
        min={min}
        step={step}
        type="range"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
      />
    </div>
  )
}
