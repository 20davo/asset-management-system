import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import type { CheckoutItem } from '../../types/checkout'
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

type CheckoutHistorySortField = 'asset' | 'status' | 'checkedOutAt' | 'dueAt' | 'returnedAt'

interface CheckoutHistorySectionProps {
  items: CheckoutItem[]
  emptyTitle: string
  emptyText: string
  searchPlaceholder: string
  title: string
  queryKeyPrefix: string
}

export function CheckoutHistorySection({
  items,
  emptyTitle,
  emptyText,
  searchPlaceholder,
  title,
  queryKeyPrefix,
}: CheckoutHistorySectionProps) {
  const { language, t } = useLanguage()
  const [searchParams, setSearchParams] = useSearchParams()
  const checkoutView = getEnumSearchParam(
    searchParams,
    `${queryKeyPrefix}-view`,
    ['cards', 'list'] as const,
    'list',
  )
  const searchQuery = getTextSearchParam(searchParams, `${queryKeyPrefix}-search`)
  const equipmentStatusFilter = getEnumSearchParam(
    searchParams,
    `${queryKeyPrefix}-status`,
    ['all', 'Available', 'CheckedOut', 'Maintenance'] as const,
    'all',
  )
  const sortField = getEnumSearchParam(
    searchParams,
    `${queryKeyPrefix}-sort`,
    ['asset', 'status', 'checkedOutAt', 'dueAt', 'returnedAt'] as const,
    'checkedOutAt',
  )
  const sortDirection = getEnumSearchParam(
    searchParams,
    `${queryKeyPrefix}-dir`,
    ['asc', 'desc'] as const,
    'desc',
  )

  const filteredCheckouts = useMemo(() => {
    const result = items.filter(
      (checkout) =>
        (equipmentStatusFilter === 'all' || checkout.equipment.status === equipmentStatusFilter) &&
        matchesCheckoutSearch(checkout, searchQuery),
    )

    return sortCheckouts(result, sortField, sortDirection, language)
  }, [equipmentStatusFilter, items, language, searchQuery, sortDirection, sortField])

  function resetFilters() {
    setMergedSearchParams(setSearchParams, {
      [`${queryKeyPrefix}-search`]: null,
      [`${queryKeyPrefix}-status`]: null,
      [`${queryKeyPrefix}-sort`]: null,
      [`${queryKeyPrefix}-dir`]: null,
      [`${queryKeyPrefix}-view`]: null,
    })
  }

  function renderSortableHeading(field: CheckoutHistorySortField, label: string) {
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

  return (
    <>
      {items.length === 0 ? (
        <div className="empty-state">
          <h3>{emptyTitle}</h3>
          <p>{emptyText}</p>
        </div>
      ) : (
        <section className="inventory-stack">
          <div className="section-heading section-heading--toolbar">
            <div>
              <h2 className="section-heading__title">{title}</h2>
            </div>
          </div>

          <FilterPanel
            filteredCount={filteredCheckouts.length}
            layout="checkout"
            onReset={resetFilters}
            onSearchChange={(value) =>
              setMergedSearchParams(setSearchParams, {
                [`${queryKeyPrefix}-search`]: value.trim() ? value : null,
              })
            }
            searchId={`${queryKeyPrefix}-search`}
            searchPlaceholder={searchPlaceholder}
            searchValue={searchQuery}
            totalCount={items.length}
            viewSwitch={
              <ViewSwitch
                value={checkoutView}
                onChange={(view) =>
                  setMergedSearchParams(setSearchParams, {
                    [`${queryKeyPrefix}-view`]: view === 'cards' ? view : null,
                  })
                }
              />
            }
          >
            <div className="form-field">
              <label className="visually-hidden" htmlFor={`${queryKeyPrefix}-status-filter`}>
                {t.common.status}
              </label>
              <select
                id={`${queryKeyPrefix}-status-filter`}
                value={equipmentStatusFilter}
                onChange={(event) =>
                  setMergedSearchParams(setSearchParams, {
                    [`${queryKeyPrefix}-status`]: event.target.value !== 'all' ? event.target.value : null,
                  })
                }
              >
                <option value="all">{t.inventory.allStatuses}</option>
                <option value="Available">{t.inventory.available}</option>
                <option value="CheckedOut">{t.inventory.checkedOut}</option>
                <option value="Maintenance">{t.inventory.maintenance}</option>
              </select>
            </div>
          </FilterPanel>

          {filteredCheckouts.length === 0 ? (
            <div className="empty-state">
              <h3>{t.checkouts.noResultsTitle}</h3>
              <p>{t.checkouts.noResultsText}</p>
            </div>
          ) : checkoutView === 'list' ? (
            <div className="data-list data-list--checkout-history">
              <div className="data-list__header">
                <span className="data-list__heading">{renderSortableHeading('asset', t.common.asset)}</span>
                <span className="data-list__heading">{renderSortableHeading('status', t.common.status)}</span>
                <span className="data-list__heading">{renderSortableHeading('checkedOutAt', t.checkouts.checkedOutAt)}</span>
                <span className="data-list__heading">{renderSortableHeading('dueAt', t.checkouts.dueAt)}</span>
                <span className="data-list__heading">{renderSortableHeading('returnedAt', t.checkouts.returnedAt)}</span>
              </div>

              <div className="data-list__body">
                {filteredCheckouts.map((checkout) => (
                  <article key={checkout.id} className="data-list__row">
                    <AssetCell
                      asset={checkout.equipment}
                      secondaryText={`${checkout.equipment.category} SN ${checkout.equipment.serialNumber}`}
                      tertiaryText={checkout.note}
                      warning={null}
                    />

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
                      <span className="data-list__value">
                        <DateTimeValue value={checkout.dueAt} />
                      </span>
                    </div>

                    <div className="data-list__cell">
                      <span className="data-list__mobile-label">{t.checkouts.returnedAt}</span>
                      <span className="data-list__value">
                        {checkout.returnedAt && <DateTimeValue value={checkout.returnedAt} />}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : (
            <div className="equipment-list">
              {filteredCheckouts.map((checkout) => (
                <CheckoutCard key={checkout.id} checkout={checkout} showReturned />
              ))}
            </div>
          )}
        </section>
      )}
    </>
  )
}
