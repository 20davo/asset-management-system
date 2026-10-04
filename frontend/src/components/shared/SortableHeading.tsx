import { useLanguage } from '../../context/LanguageContext'

interface SortableHeadingProps {
  direction: 'asc' | 'desc'
  isActive: boolean
  label: string
  onSort: () => void
}

export function SortableHeading({ direction, isActive, label, onSort }: SortableHeadingProps) {
  const { t } = useLanguage()
  const icon = !isActive ? '↕' : direction === 'asc' ? '↑' : '↓'
  const sortStateLabel = !isActive
    ? t.common.sortNotSorted
    : direction === 'asc'
      ? t.common.sortAscending
      : t.common.sortDescending

  return (
    <button type="button" className="data-list__sort-button" onClick={onSort}>
      <span>{label}</span>
      <span className="data-list__sort-icon" aria-hidden="true">
        {icon}
      </span>
      <span className="visually-hidden">{sortStateLabel}</span>
    </button>
  )
}
