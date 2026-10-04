import type { ReactNode } from 'react'
import { useLanguage } from '../../context/LanguageContext'

interface FilterPanelProps {
  children?: ReactNode
  filteredCount: number
  layout: 'checkout' | 'checkout-log' | 'inventory' | 'users'
  onReset: () => void
  onSearchChange: (value: string) => void
  searchId: string
  searchPlaceholder: string
  searchValue: string
  totalCount: number
  viewSwitch?: ReactNode
}

export function FilterPanel({
  children,
  filteredCount,
  layout,
  onReset,
  onSearchChange,
  searchId,
  searchPlaceholder,
  searchValue,
  totalCount,
  viewSwitch,
}: FilterPanelProps) {
  const { t } = useLanguage()

  return (
    <section className="section-card section-card--compact filter-panel">
      <div className={`filter-panel__grid filter-panel__grid--${layout}`}>
        <div className="form-field">
          <label className="visually-hidden" htmlFor={searchId}>
            {t.common.search}
          </label>
          <input
            id={searchId}
            type="search"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
          />
        </div>

        {children}
      </div>

      <div className="filter-panel__footer">
        {viewSwitch}
        <p className="filter-panel__summary">
          {filteredCount} / {totalCount}
          <span aria-hidden="true">·</span>
          <button type="button" className="filter-panel__clear" onClick={onReset}>
            {t.common.clearFilters}
          </button>
        </p>
      </div>
    </section>
  )
}
