import type { ReactNode } from 'react'

interface SegmentedOption<T extends string> {
  icon?: ReactNode
  label: string
  value: T
}

interface SegmentedControlProps<T extends string> {
  compact?: boolean
  label: string
  onChange: (value: T) => void
  options: readonly SegmentedOption<T>[]
  value: T
}

export function SegmentedControl<T extends string>({
  compact = false,
  label,
  onChange,
  options,
  value,
}: SegmentedControlProps<T>) {
  return (
    <div
      className={`segmented-control${compact ? ' segmented-control--compact' : ''}`}
      role="group"
      aria-label={label}
    >
      {options.map((option) => {
        const isActive = option.value === value

        return (
          <button
            key={option.value}
            type="button"
            className={`segmented-control__button${
              isActive ? ' segmented-control__button--active' : ''
            }`}
            aria-label={option.icon ? option.label : undefined}
            aria-pressed={isActive}
            title={option.icon ? option.label : undefined}
            onClick={() => onChange(option.value)}
          >
            {option.icon ?? option.label}
          </button>
        )
      })}
    </div>
  )
}
