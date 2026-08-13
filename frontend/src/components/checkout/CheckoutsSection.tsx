import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import type { CheckoutItem } from '../../types/checkout'
import {
  formatDateTime,
  getStatusBadgeClass,
  getStatusLabel,
  isCheckoutDueSoon,
  isCheckoutOverdue,
} from '../../utils/presentation'
import {
  getEnumSearchParam,
  getTextSearchParam,
  setMergedSearchParams,
  toggleSortSearchParams,
} from '../../utils/searchParams'
import { ProtectedAssetImage } from '../media/ProtectedAssetImage'

type CheckoutHistorySortField = 'asset' | 'status' | 'checkedOutAt' | 'dueAt' | 'returnedAt'

interface CheckoutsSectionProps {
  items: CheckoutItem[]
  emptyTitle: string
  emptyText: string
  searchPlaceholder: string
  heroKicker: string
  heroTitle: string
  heroText: string
  linkAssetNameOnly?: boolean
  compact?: boolean
  queryKeyPrefix: string
}

function getCheckoutTimelineState(checkout: CheckoutItem) {
  if (isCheckoutOverdue(checkout.dueAt, checkout.returnedAt)) {
    return {
      alertClass: 'deadline-flag deadline-flag--danger',
      alertLabel: 'overdue',
    } as const
  }

  if (isCheckoutDueSoon(checkout.dueAt, checkout.returnedAt)) {
    return {
      alertClass: 'deadline-flag deadline-flag--warning',
      alertLabel: 'dueSoon',
    } as const
  }

  return null
}

export function CheckoutsSection({
  items,
  emptyTitle,
  emptyText,
  searchPlaceholder,
  heroKicker,
  heroTitle,
  heroText,
  linkAssetNameOnly = false,
  compact = false,
  queryKeyPrefix,
}: CheckoutsSectionProps) {
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

  const activeCount = items.filter((checkout) => !checkout.returnedAt).length
  const overdueCount = items.filter((checkout) =>
    isCheckoutOverdue(checkout.dueAt, checkout.returnedAt),
  ).length
  const returnedCount = items.filter((checkout) => !!checkout.returnedAt).length

  const filteredCheckouts = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()

    const result = items.filter((checkout) => {
      const matchesStatus =
        equipmentStatusFilter === 'all'
          ? true
          : checkout.equipment.status === equipmentStatusFilter

      const matchesSearch =
        normalizedQuery.length === 0
          ? true
          : [
              checkout.equipment.name,
              checkout.equipment.category,
              checkout.equipment.serialNumber,
              checkout.user.name,
              checkout.user.email,
              checkout.note ?? '',
            ]
              .join(' ')
              .toLowerCase()
              .includes(normalizedQuery)

      return matchesStatus && matchesSearch
    })

    result.sort((left, right) => {
      const multiplier = sortDirection === 'asc' ? 1 : -1

      switch (sortField) {
        case 'asset':
          return left.equipment.name.localeCompare(right.equipment.name, language) * multiplier
        case 'status':
          return (
            getStatusLabel(left.equipment.status, language).localeCompare(
              getStatusLabel(right.equipment.status, language),
              language,
            ) * multiplier
          )
        case 'dueAt':
          return (new Date(left.dueAt).getTime() - new Date(right.dueAt).getTime()) * multiplier
        case 'returnedAt': {
          const leftTime = left.returnedAt ? new Date(left.returnedAt).getTime() : Number.NEGATIVE_INFINITY
          const rightTime = right.returnedAt ? new Date(right.returnedAt).getTime() : Number.NEGATIVE_INFINITY
          return (leftTime - rightTime) * multiplier
        }
        case 'checkedOutAt':
        default:
          return (
            (new Date(left.checkedOutAt).getTime() - new Date(right.checkedOutAt).getTime()) *
            multiplier
          )
      }
    })

    return result
  }, [
    equipmentStatusFilter,
    items,
    language,
    searchQuery,
    sortDirection,
    sortField,
  ])

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
    const isActive = sortField === field
    const icon = !isActive ? '↕' : sortDirection === 'asc' ? '↑' : '↓'
    const sortStateLabel = !isActive
      ? t.common.sortNotSorted
      : sortDirection === 'asc'
        ? t.common.sortAscending
        : t.common.sortDescending

    return (
      <button
        type="button"
        className="data-list__sort-button"
        onClick={() =>
          toggleSortSearchParams(
            setSearchParams,
            `${queryKeyPrefix}-sort`,
            `${queryKeyPrefix}-dir`,
            field,
            field === 'checkedOutAt' ? 'desc' : field === 'dueAt' ? 'asc' : 'asc',
          )
        }
      >
        <span>{label}</span>
        <span className="data-list__sort-icon" aria-hidden="true">
          {icon}
        </span>
        <span className="visually-hidden">{sortStateLabel}</span>
      </button>
    )
  }

  function renderEquipmentMedia(imageUrl: string | null | undefined, name: string) {
    return (
      <div className="equipment-card__media">
        <ProtectedAssetImage
          imageUrl={imageUrl}
          alt={name}
          className="equipment-card__image"
          placeholderClassName="equipment-card__image-placeholder"
          placeholderText={t.common.noImage}
        />
      </div>
    )
  }

  function renderCheckoutViewSwitch() {
    return (
      <div className="view-switch" role="group" aria-label={t.common.view}>
        <button
          type="button"
          className={`view-switch__button ${
            checkoutView === 'cards' ? 'view-switch__button--active' : ''
          }`}
          onClick={() =>
            setMergedSearchParams(setSearchParams, {
              [`${queryKeyPrefix}-view`]: 'cards',
            })
          }
        >
          {t.common.cardsView}
        </button>
        <button
          type="button"
          className={`view-switch__button ${
            checkoutView === 'list' ? 'view-switch__button--active' : ''
          }`}
          onClick={() =>
            setMergedSearchParams(setSearchParams, {
              [`${queryKeyPrefix}-view`]: null,
            })
          }
        >
          {t.common.listView}
        </button>
      </div>
    )
  }

  return (
    <>
      {!compact && (
        <>
          <section className="page-hero">
            <div className="page-hero__content">
              <span className="page-kicker">{heroKicker}</span>
              <h1 className="page-title">{heroTitle}</h1>
              <p className="page-subtitle">{heroText}</p>
            </div>

            <div className="page-hero__panel">
              <span className="page-hero__panel-label">{t.checkouts.activeState}</span>
              <strong className="page-hero__panel-value">
                {activeCount} {t.checkouts.openCount}
              </strong>
              <p className="page-hero__panel-text">
                {overdueCount > 0
                  ? overdueCount === 1
                    ? t.checkouts.overdueSummarySingle
                    : t.checkouts.overdueSummary(overdueCount)
                  : t.checkouts.noOverdue}
              </p>
            </div>
          </section>

          <section className="stats-grid stats-grid--three">
            <article className="stat-card">
              <span className="stat-card__label">{t.checkouts.active}</span>
              <strong className="stat-card__value">{activeCount}</strong>
              <span className="stat-card__note">{t.checkouts.activeNote}</span>
            </article>
            <article className="stat-card">
              <span className="stat-card__label">{t.checkouts.overdue}</span>
              <strong className="stat-card__value">{overdueCount}</strong>
              <span className="stat-card__note">{t.checkouts.overdueNote}</span>
            </article>
            <article className="stat-card">
              <span className="stat-card__label">{t.checkouts.closed}</span>
              <strong className="stat-card__value">{returnedCount}</strong>
              <span className="stat-card__note">{t.checkouts.closedNote}</span>
            </article>
          </section>
        </>
      )}

      {items.length === 0 ? (
        <div className="empty-state">
          <h3>{emptyTitle}</h3>
          <p>{emptyText}</p>
        </div>
      ) : (
        <section className="inventory-stack">
          <div className="section-heading section-heading--toolbar">
            <div>
              <span className="section-heading__eyebrow">{heroKicker}</span>
              <h2 className="section-heading__title">{heroTitle}</h2>
            </div>
            <div className="section-heading__aside">
              <p className="section-heading__text">{heroText}</p>
              {renderCheckoutViewSwitch()}
            </div>
          </div>

          <section className="section-card section-card--compact filter-panel">
            <div className="filter-panel__grid filter-panel__grid--checkout">
              <div className="form-field">
                <label htmlFor={`${heroTitle}-search`}>{t.common.search}</label>
                <input
                  id={`${heroTitle}-search`}
                  type="search"
                  value={searchQuery}
                  onChange={(event) =>
                    setMergedSearchParams(setSearchParams, {
                      [`${queryKeyPrefix}-search`]: event.target.value.trim()
                        ? event.target.value
                        : null,
                    })
                  }
                  placeholder={searchPlaceholder}
                />
              </div>

              <div className="form-field">
                <label htmlFor={`${heroTitle}-status-filter`}>{t.common.status}</label>
                <select
                  id={`${heroTitle}-status-filter`}
                  value={equipmentStatusFilter}
                  onChange={(event) =>
                    setMergedSearchParams(setSearchParams, {
                      [`${queryKeyPrefix}-status`]:
                        event.target.value !== 'all' ? event.target.value : null,
                    })
                  }
                >
                  <option value="all">{t.inventory.allStatuses}</option>
                  <option value="Available">{t.inventory.available}</option>
                  <option value="CheckedOut">{t.inventory.checkedOut}</option>
                  <option value="Maintenance">{t.inventory.maintenance}</option>
                </select>
              </div>
            </div>

            <div className="filter-panel__footer">
              <p className="filter-panel__summary">
                {filteredCheckouts.length} / {items.length}
              </p>
              <button type="button" className="button-secondary" onClick={resetFilters}>
                {t.common.clearFilters}
              </button>
            </div>
          </section>

          {filteredCheckouts.length === 0 ? (
            <div className="empty-state">
              <h3>{t.checkouts.noResultsTitle}</h3>
              <p>{t.checkouts.noResultsText}</p>
            </div>
          ) : checkoutView === 'list' ? (

          <div
            className={`data-list ${
              linkAssetNameOnly ? 'data-list--checkouts-name-link' : 'data-list--checkouts'
            }`}
          >
            <div className="data-list__header">
              <span className="data-list__heading">{renderSortableHeading('asset', t.common.asset)}</span>
              <span className="data-list__heading">{renderSortableHeading('status', t.common.status)}</span>
              <span className="data-list__heading">{renderSortableHeading('checkedOutAt', t.checkouts.checkedOutAt)}</span>
              <span className="data-list__heading">{renderSortableHeading('dueAt', t.checkouts.dueAt)}</span>
              <span className="data-list__heading">{renderSortableHeading('returnedAt', t.checkouts.returnedAt)}</span>
            </div>

            {filteredCheckouts.map((checkout) => {
              const overdue = isCheckoutOverdue(checkout.dueAt, checkout.returnedAt)
              const timelineState = getCheckoutTimelineState(checkout)

              return (
                <article
                  key={checkout.id}
                  className={`data-list__row ${overdue ? 'data-list__row--overdue' : ''}`}
                >
                  <div className="data-list__cell data-list__cell--primary">
                    <div className="data-list__asset">
                      <div className="data-list__thumb">
                        <ProtectedAssetImage
                          imageUrl={checkout.equipment.imageUrl}
                          alt={checkout.equipment.name}
                          className="data-list__thumb-image"
                          placeholderClassName="data-list__thumb-placeholder"
                          placeholderText={t.common.noImage}
                        />
                      </div>

                      <div className="data-list__asset-copy">
                        <div className="data-list__title-row">
                          <Link
                            to={`/equipment/${checkout.equipment.id}`}
                            className="context-link"
                          >
                            <strong className="data-list__primary-text context-link__primary">
                              {checkout.equipment.name}
                            </strong>
                          </Link>
                          {timelineState && (
                            <span className={timelineState.alertClass}>
                              {timelineState.alertLabel === 'overdue'
                                ? t.checkouts.overdueBadge
                                : t.checkouts.dueSoonBadge}
                            </span>
                          )}
                        </div>
                        <span className="data-list__secondary-text">
                          {checkout.equipment.category} SN {checkout.equipment.serialNumber}
                        </span>
                        <span className="data-list__tertiary-text">
                          {checkout.note || t.checkouts.noNote}
                        </span>
                      </div>
                    </div>
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
                      {formatDateTime(checkout.checkedOutAt, language)}
                    </span>
                  </div>

                  <div className="data-list__cell">
                    <span className="data-list__mobile-label">{t.checkouts.dueAt}</span>
                    <span className="data-list__value">
                      {formatDateTime(checkout.dueAt, language)}
                    </span>
                  </div>

                  <div className="data-list__cell">
                    <span className="data-list__mobile-label">{t.checkouts.returnedAt}</span>
                    <span className="data-list__value">
                      {checkout.returnedAt
                        ? formatDateTime(checkout.returnedAt, language)
                        : t.checkouts.notClosed}
                    </span>
                  </div>

                </article>
              )
            })}
          </div>
          ) : (
          <div className="equipment-list">
            {filteredCheckouts.map((checkout) => {
              const overdue = isCheckoutOverdue(checkout.dueAt, checkout.returnedAt)
              const timelineState = getCheckoutTimelineState(checkout)

              return (
                <article
                  key={checkout.id}
                  className={`equipment-card ${overdue ? 'equipment-card--overdue' : ''}`}
                >
                  <div className="equipment-card__layout equipment-card__layout--media-first">
                    {renderEquipmentMedia(checkout.equipment.imageUrl, checkout.equipment.name)}

                    <div className="equipment-card__main">
                      <div className="equipment-card__header">
                        <div className="equipment-card__title-group">
                          <div className="equipment-card__title-row">
                            <Link
                              to={`/equipment/${checkout.equipment.id}`}
                              className="context-link"
                            >
                              <h3 className="equipment-card__title-small context-link__primary">
                                {checkout.equipment.name}
                              </h3>
                            </Link>
                            {timelineState && (
                              <span className={timelineState.alertClass}>
                                {timelineState.alertLabel === 'overdue'
                                  ? t.checkouts.overdueBadge
                                  : t.checkouts.dueSoonBadge}
                              </span>
                            )}
                          </div>
                          <span className="equipment-card__serial">
                            SN {checkout.equipment.serialNumber}
                          </span>
                          <div className="equipment-card__signal-row">
                            <span className="equipment-category-chip">
                              {checkout.equipment.category}
                            </span>
                          </div>
                        </div>
                        <div className="equipment-card__status-stack">
                          <span className={getStatusBadgeClass(checkout.equipment.status)}>
                            {getStatusLabel(checkout.equipment.status, language)}
                          </span>
                        </div>
                      </div>

                      <div className="equipment-meta">
                        <div className="equipment-meta__item">
                          <span className="equipment-meta__label">{t.checkouts.checkedOutAt}</span>
                          <span className="equipment-meta__value">
                            {formatDateTime(checkout.checkedOutAt, language)}
                          </span>
                        </div>

                        <div className="equipment-meta__item">
                          <span className="equipment-meta__label">{t.checkouts.dueAt}</span>
                          <span className="equipment-meta__value">
                            {formatDateTime(checkout.dueAt, language)}
                          </span>
                        </div>

                        <div className="equipment-meta__item">
                          <span className="equipment-meta__label">{t.checkouts.returnedAt}</span>
                          <span className="equipment-meta__value">
                            {checkout.returnedAt
                              ? formatDateTime(checkout.returnedAt, language)
                              : t.checkouts.notClosed}
                          </span>
                        </div>
                      </div>

                      {timelineState?.alertLabel === 'overdue' && (
                        <p className="form-error">{t.checkouts.overdueAlert}</p>
                      )}

                      {timelineState?.alertLabel === 'dueSoon' && (
                        <p className="timeline-note timeline-note--warning">
                          {t.checkouts.dueSoonAlert}
                        </p>
                      )}

                      {checkout.note && (
                        <div className="equipment-description">
                          <span className="equipment-description__label">{t.checkouts.note}</span>
                          <p className="equipment-description__text">{checkout.note}</p>
                        </div>
                      )}

                    </div>
                  </div>
                </article>
              )
            })}
          </div>
          )}
        </section>
      )}
    </>
  )
}
