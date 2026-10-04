import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { getAllCheckouts } from '../api/checkoutApi'
import { CheckoutCard } from '../components/checkout/CheckoutCard'
import { AssetCell } from '../components/shared/AssetCell'
import { DateTimeValue } from '../components/shared/DateTimeValue'
import { FilterPanel } from '../components/shared/FilterPanel'
import { SortableHeading } from '../components/shared/SortableHeading'
import { ViewSwitch } from '../components/shared/ViewSwitch'
import { WarningFilterSelect } from '../components/shared/WarningFilterSelect'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import type { CheckoutItem } from '../types/checkout'
import { getApiErrorMessage } from '../utils/apiErrors'
import { getCheckoutWarning, isCheckoutOverdue, WARNING_FILTERS } from '../utils/checkoutDeadlines'
import { matchesCheckoutSearch, sortCheckouts } from '../utils/checkoutList'
import { getStatusBadgeClass, getStatusLabel } from '../utils/labels'
import {
  getEnumSearchParam,
  getTextSearchParam,
  setMergedSearchParams,
  toggleSortSearchParams,
} from '../utils/searchParams'

type CheckoutFilter = 'all' | 'active' | 'closed'
type AllCheckoutsSortField =
  | 'asset'
  | 'user'
  | 'status'
  | 'checkedOutAt'
  | 'dueAt'
  | 'returnedAt'

function getCheckoutState(checkout: CheckoutItem): Exclude<CheckoutFilter, 'all'> {
  if (checkout.returnedAt) {
    return 'closed'
  }

  return 'active'
}

function AllCheckoutsPage() {
  const { user } = useAuth()
  const { language, t } = useLanguage()
  const [searchParams, setSearchParams] = useSearchParams()

  const [checkouts, setCheckouts] = useState<CheckoutItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const checkoutView = getEnumSearchParam(
    searchParams,
    'view',
    ['cards', 'list'] as const,
    'list',
  )
  const searchQuery = getTextSearchParam(searchParams, 'search')
  const statusFilter = getEnumSearchParam(
    searchParams,
    'state',
    ['all', 'active', 'closed'] as const,
    'all',
  )
  const warningFilter = getEnumSearchParam(
    searchParams,
    'warning',
    WARNING_FILTERS,
    'all',
  )
  const sortField = getEnumSearchParam(
    searchParams,
    'sort',
    ['asset', 'user', 'status', 'checkedOutAt', 'dueAt', 'returnedAt'] as const,
    'checkedOutAt',
  )
  const sortDirection = getEnumSearchParam(searchParams, 'dir', ['asc', 'desc'] as const, 'desc')

  useEffect(() => {
    async function loadCheckouts() {
      try {
        setErrorMessage('')
        const data = await getAllCheckouts()
        setCheckouts(data)
      } catch (error: unknown) {
        setErrorMessage(getApiErrorMessage(error, t.checkouts.loadError, language))
      } finally {
        setIsLoading(false)
      }
    }

    void loadCheckouts()
  }, [language, t.checkouts.loadError])

  const activeCount = checkouts.filter((checkout) => !checkout.returnedAt).length
  const overdueCount = checkouts.filter((checkout) =>
    isCheckoutOverdue(checkout.dueAt, checkout.returnedAt),
  ).length
  const returnedCount = checkouts.filter((checkout) => !!checkout.returnedAt).length

  const filteredCheckouts = useMemo(() => {
    const result = checkouts.filter((checkout) => {
      const warning = getCheckoutWarning(checkout.dueAt, checkout.returnedAt) ?? 'none'
      const matchesStatus = statusFilter === 'all' || getCheckoutState(checkout) === statusFilter
      const matchesWarning =
        statusFilter !== 'active' || warningFilter === 'all' || warning === warningFilter

      return matchesStatus && matchesWarning && matchesCheckoutSearch(checkout, searchQuery)
    })

    return sortCheckouts(result, sortField, sortDirection, language)
  }, [checkouts, language, searchQuery, sortDirection, sortField, statusFilter, warningFilter])

  function resetFilters() {
    setMergedSearchParams(setSearchParams, {
      search: null,
      state: null,
      warning: null,
      sort: null,
      dir: null,
      view: null,
    })
  }

  function renderSortableHeading(field: AllCheckoutsSortField, label: string) {
    return (
      <SortableHeading
        direction={sortDirection}
        isActive={sortField === field}
        label={label}
        onSort={() =>
          toggleSortSearchParams(
            setSearchParams,
            'sort',
            'dir',
            field,
            field === 'checkedOutAt' ? 'desc' : 'asc',
          )
        }
      />
    )
  }

  if (user?.role !== 'Admin') {
    return <Navigate to="/?reason=forbidden" replace />
  }

  if (isLoading) {
    return <div className="loading-state">{t.checkouts.loading}</div>
  }

  if (errorMessage) {
    return <p className="form-error">{errorMessage}</p>
  }

  return (
    <div className="page-shell">
      <section className="page-hero">
        <div className="page-hero__content">
          <h1 className="page-title">{t.checkouts.allPageTitle}</h1>
        </div>
      </section>

      <section className="stats-grid stats-grid--three">
        <article className="stat-card">
          <span className="stat-card__label">{t.checkouts.active}</span>
          <strong className="stat-card__value">{activeCount}</strong>
        </article>
        <article className="stat-card">
          <span className="stat-card__label">{t.checkouts.overdue}</span>
          <strong className="stat-card__value">{overdueCount}</strong>
        </article>
        <article className="stat-card">
          <span className="stat-card__label">{t.checkouts.closed}</span>
          <strong className="stat-card__value">{returnedCount}</strong>
        </article>
      </section>

      <section className="inventory-stack">
        <FilterPanel
          filteredCount={filteredCheckouts.length}
          layout="checkout-log"
          onReset={resetFilters}
          onSearchChange={(value) =>
            setMergedSearchParams(setSearchParams, { search: value.trim() ? value : null })
          }
          searchId="all-checkouts-search"
          searchPlaceholder={t.checkouts.allSearchPlaceholder}
          searchValue={searchQuery}
          totalCount={checkouts.length}
          viewSwitch={
            <ViewSwitch
              value={checkoutView}
              onChange={(view) =>
                setMergedSearchParams(setSearchParams, { view: view === 'cards' ? view : null })
              }
            />
          }
        >
          <div className="form-field">
            <label className="visually-hidden" htmlFor="all-checkouts-status-filter">
              {t.checkouts.statusFilterLabel}
            </label>
            <select
              id="all-checkouts-status-filter"
              value={statusFilter}
              onChange={(event) =>
                setMergedSearchParams(setSearchParams, {
                  state: event.target.value === 'all' ? null : event.target.value,
                  warning: event.target.value === 'active' ? searchParams.get('warning') : null,
                })
              }
            >
              <option value="all">{t.checkouts.filterAll}</option>
              <option value="active">{t.checkouts.filterActive}</option>
              <option value="closed">{t.checkouts.filterClosed}</option>
            </select>
          </div>

          {statusFilter === 'active' && (
            <WarningFilterSelect
              id="all-checkouts-warning-filter"
              value={warningFilter}
              onChange={(value) =>
                setMergedSearchParams(setSearchParams, { warning: value === 'all' ? null : value })
              }
            />
          )}
        </FilterPanel>

        {checkouts.length === 0 ? (
          <div className="empty-state">
            <h3>{t.checkouts.allEmptyTitle}</h3>
            <p>{t.checkouts.allEmptyText}</p>
          </div>
        ) : filteredCheckouts.length === 0 ? (
          <div className="empty-state">
            <h3>{t.checkouts.noResultsTitle}</h3>
            <p>{t.checkouts.noResultsText}</p>
          </div>
        ) : checkoutView === 'list' ? (
          <div className="data-list data-list--checkouts">
            <div className="data-list__header">
              <span className="data-list__heading">{renderSortableHeading('asset', t.common.asset)}</span>
              <span className="data-list__heading">{renderSortableHeading('user', t.common.user)}</span>
              <span className="data-list__heading">{renderSortableHeading('status', t.common.status)}</span>
              <span className="data-list__heading">{renderSortableHeading('checkedOutAt', t.checkouts.checkedOutAt)}</span>
              <span className="data-list__heading">{renderSortableHeading('dueAt', t.checkouts.dueAt)}</span>
              <span className="data-list__heading">{renderSortableHeading('returnedAt', t.checkouts.returnedAt)}</span>
            </div>

            <div className="data-list__body">
              {filteredCheckouts.map((checkout) => {
                const warning = getCheckoutWarning(checkout.dueAt, checkout.returnedAt)

                return (
                  <article
                    key={checkout.id}
                    className={`data-list__row ${warning === 'overdue' ? 'data-list__row--overdue' : ''}`}
                  >
                    <AssetCell
                      asset={checkout.equipment}
                      secondaryText={`${checkout.equipment.category} SN ${checkout.equipment.serialNumber}`}
                      tertiaryText={checkout.note}
                      warning={warning}
                    />

                    <div className="data-list__cell">
                      <span className="data-list__mobile-label">{t.common.user}</span>
                      <Link
                        to={`/users/${checkout.user.id}`}
                        className="context-link context-link--stack"
                      >
                        <strong className="data-list__context-name context-link__primary">
                          {checkout.user.name}
                        </strong>
                      </Link>
                      <span className="data-list__context-value">{checkout.user.email}</span>
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
                      <span className="data-list__mobile-label">
                        {t.checkouts.checkedOutAt}
                      </span>
                      <span className="data-list__value">
                        <DateTimeValue value={checkout.checkedOutAt} />
                      </span>
                    </div>

                    <div className="data-list__cell">
                      <span className="data-list__mobile-label">{t.checkouts.dueAt}</span>
                      <span
                        className={`data-list__value ${warning === 'overdue' ? 'data-list__value--danger' : ''}`}
                      >
                        <DateTimeValue value={checkout.dueAt} />
                      </span>
                    </div>

                    <div className="data-list__cell">
                      <span className="data-list__mobile-label">{t.checkouts.returnedAt}</span>
                      <span className="data-list__value">
                        {checkout.returnedAt ? (
                          <DateTimeValue value={checkout.returnedAt} />
                        ) : (
                          t.checkouts.notClosed
                        )}
                      </span>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="equipment-list">
            {filteredCheckouts.map((checkout) => (
              <CheckoutCard key={checkout.id} checkout={checkout} showReturned showUser />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default AllCheckoutsPage
