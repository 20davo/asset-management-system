import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import type { CheckoutItem } from '../../types/checkout'
import { getCheckoutWarning, WARNING_FILTERS } from '../../utils/checkoutDeadlines'
import { matchesCheckoutSearch, sortCheckouts } from '../../utils/checkoutList'
import { getStatusBadgeClass, getStatusLabel } from '../../utils/labels'
import {
  getEnumSearchParam,
  getTextSearchParam,
  setMergedSearchParams,
  toggleSortSearchParams,
} from '../../utils/searchParams'
import { CheckoutCard } from './CheckoutCard'
import { AssetCell } from '../shared/AssetCell'
import { DateTimeValue } from '../shared/DateTimeValue'
import { FilterPanel } from '../shared/FilterPanel'
import { SortableHeading } from '../shared/SortableHeading'
import { ViewSwitch } from '../shared/ViewSwitch'
import { WarningFilterSelect } from '../shared/WarningFilterSelect'

interface AssignedAssetsSectionProps {
  items: CheckoutItem[]
  emptyTitle: string
  emptyText: string
  searchPlaceholder: string
  title?: string
  queryKeyPrefix: string
  enableWarningFilter?: boolean
}

type AssignedAssetSortField = 'asset' | 'serial' | 'status' | 'checkedOutAt' | 'dueAt'

export function AssignedAssetsSection({
  items,
  emptyTitle,
  emptyText,
  searchPlaceholder,
  title,
  queryKeyPrefix,
  enableWarningFilter = false,
}: AssignedAssetsSectionProps) {
  const { language, t } = useLanguage()
  const [searchParams, setSearchParams] = useSearchParams()
  const assetView = getEnumSearchParam(
    searchParams,
    `${queryKeyPrefix}-view`,
    ['cards', 'list'] as const,
    'list',
  )
  const searchQuery = getTextSearchParam(searchParams, `${queryKeyPrefix}-search`)
  const sortField = getEnumSearchParam(
    searchParams,
    `${queryKeyPrefix}-sort`,
    ['asset', 'serial', 'status', 'checkedOutAt', 'dueAt'] as const,
    'dueAt',
  )
  const sortDirection = getEnumSearchParam(
    searchParams,
    `${queryKeyPrefix}-dir`,
    ['asc', 'desc'] as const,
    'asc',
  )
  const warningFilter = getEnumSearchParam(
    searchParams,
    `${queryKeyPrefix}-warning`,
    WARNING_FILTERS,
    'all',
  )

  const filteredItems = useMemo(() => {
    const result = items.filter((checkout) => {
      const warning = getCheckoutWarning(checkout.dueAt, checkout.returnedAt) ?? 'none'
      const matchesWarning =
        !enableWarningFilter || warningFilter === 'all' || warning === warningFilter

      return matchesWarning && matchesCheckoutSearch(checkout, searchQuery)
    })

    return sortCheckouts(result, sortField, sortDirection, language)
  }, [enableWarningFilter, items, language, searchQuery, sortDirection, sortField, warningFilter])

  function resetFilters() {
    setMergedSearchParams(setSearchParams, {
      [`${queryKeyPrefix}-search`]: null,
      [`${queryKeyPrefix}-sort`]: null,
      [`${queryKeyPrefix}-dir`]: null,
      [`${queryKeyPrefix}-warning`]: null,
      [`${queryKeyPrefix}-view`]: null,
    })
  }

  function renderSortableHeading(field: AssignedAssetSortField, label: string) {
    return (
      <SortableHeading
        direction={sortDirection}
        isActive={sortField === field}
        label={label}
        onSort={() =>
          toggleSortSearchParams(
            setSearchParams,
            `${queryKeyPrefix}-sort`,
            `${queryKeyPrefix}-dir`,
            field,
            field === 'checkedOutAt' ? 'desc' : 'asc',
          )
        }
      />
    )
  }

  if (items.length === 0) {
    return (
      <div className="empty-state">
        <h3>{emptyTitle}</h3>
        <p>{emptyText}</p>
      </div>
    )
  }

  return (
    <section className="inventory-stack">
      {title && (
        <div className="section-heading section-heading--toolbar">
          <div>
            <h2 className="section-heading__title">{title}</h2>
          </div>
        </div>
      )}

      <FilterPanel
        filteredCount={filteredItems.length}
        layout="checkout"
        onReset={resetFilters}
        onSearchChange={(value) =>
          setMergedSearchParams(setSearchParams, {
            [`${queryKeyPrefix}-search`]: value.trim() ? value : null,
          })
        }
        searchId={`${queryKeyPrefix}-assets-search`}
        searchPlaceholder={searchPlaceholder}
        searchValue={searchQuery}
        totalCount={items.length}
        viewSwitch={
          <ViewSwitch
            value={assetView}
            onChange={(view) =>
              setMergedSearchParams(setSearchParams, {
                [`${queryKeyPrefix}-view`]: view === 'cards' ? view : null,
              })
            }
          />
        }
      >
        {enableWarningFilter && (
          <WarningFilterSelect
            id={`${queryKeyPrefix}-assets-warning`}
            value={warningFilter}
            onChange={(value) =>
              setMergedSearchParams(setSearchParams, {
                [`${queryKeyPrefix}-warning`]: value === 'all' ? null : value,
              })
            }
          />
        )}
      </FilterPanel>

      {filteredItems.length === 0 ? (
        <div className="empty-state">
          <h3>{t.checkouts.noResultsTitle}</h3>
          <p>{t.checkouts.noResultsText}</p>
        </div>
      ) : assetView === 'list' ? (
        <div className="data-list data-list--assigned-assets">
          <div className="data-list__header">
            <span className="data-list__heading">{renderSortableHeading('asset', t.common.asset)}</span>
            <span className="data-list__heading">{renderSortableHeading('serial', t.inventory.serial)}</span>
            <span className="data-list__heading">{renderSortableHeading('status', t.common.status)}</span>
            <span className="data-list__heading">{renderSortableHeading('checkedOutAt', t.checkouts.checkedOutAt)}</span>
            <span className="data-list__heading">{renderSortableHeading('dueAt', t.checkouts.dueAt)}</span>
          </div>

          <div className="data-list__body">
            {filteredItems.map((checkout) => {
              const warning = getCheckoutWarning(checkout.dueAt, checkout.returnedAt)

              return (
                <article
                  key={checkout.id}
                  className={`data-list__row ${
                    warning === 'overdue' ? 'data-list__row--overdue' : ''
                  }`}
                >
                  <AssetCell
                    asset={checkout.equipment}
                    secondaryText={checkout.equipment.category}
                    tertiaryText={checkout.note}
                    warning={warning}
                  />

                  <div className="data-list__cell">
                    <span className="data-list__mobile-label">{t.inventory.serial}</span>
                    <span className="data-list__value">{checkout.equipment.serialNumber}</span>
                  </div>

                  <div className="data-list__cell">
                    <span className="data-list__mobile-label">{t.common.status}</span>
                    <div className="data-list__status-stack">
                      <span className={getStatusBadgeClass(checkout.equipment.status)}>
                        {getStatusLabel(checkout.equipment.status, language)}
                      </span>
                    </div>
                  </div>

                  <div className="data-list__cell">
                    <span className="data-list__mobile-label">{t.checkouts.checkedOutAt}</span>
                    <span className="data-list__value">
                      <DateTimeValue value={checkout.checkedOutAt} />
                    </span>
                  </div>

                  <div className="data-list__cell">
                    <span className="data-list__mobile-label">{t.checkouts.dueAt}</span>
                    <span
                      className={`data-list__value ${
                        warning === 'overdue' ? 'data-list__value--danger' : ''
                      }`}
                    >
                      <DateTimeValue value={checkout.dueAt} />
                    </span>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="equipment-list">
          {filteredItems.map((checkout) => (
            <CheckoutCard key={checkout.id} checkout={checkout} />
          ))}
        </div>
      )}
    </section>
  )
}
