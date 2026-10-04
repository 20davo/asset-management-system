import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { getAllCheckouts } from '../api/checkoutApi'
import { getUsers } from '../api/userApi'
import { FeedbackMessage } from '../components/shared/FeedbackMessage'
import { FilterPanel } from '../components/shared/FilterPanel'
import { SortableHeading } from '../components/shared/SortableHeading'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import type { CheckoutItem } from '../types/checkout'
import type { ManagedUser } from '../types/user'
import { getApiErrorMessage } from '../utils/apiErrors'
import { isCheckoutOverdue } from '../utils/checkoutDeadlines'
import { getRoleLabel } from '../utils/labels'
import {
  getEnumSearchParam,
  getTextSearchParam,
  setMergedSearchParams,
  toggleSortSearchParams,
} from '../utils/searchParams'

interface UserSummary extends ManagedUser {
  totalCheckouts: number
  activeCheckouts: number
  overdueCheckouts: number
  closedCheckouts: number
}

interface UsersLocationState {
  successMessage?: string
}

type UserSortField =
  | 'name'
  | 'role'
  | 'activeCheckouts'
  | 'overdueCheckouts'
  | 'totalCheckouts'
  | 'closedCheckouts'

function UsersPage() {
  const { user } = useAuth()
  const { language, t } = useLanguage()
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [users, setUsers] = useState<UserSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage] = useState(() => {
    const state = location.state as UsersLocationState | null
    return state?.successMessage ?? ''
  })
  const searchQuery = getTextSearchParam(searchParams, 'search')
  const roleFilter = getEnumSearchParam(
    searchParams,
    'role',
    ['all', 'Admin', 'User'] as const,
    'all',
  )
  const sortField = getEnumSearchParam(
    searchParams,
    'sort',
    ['name', 'role', 'activeCheckouts', 'overdueCheckouts', 'totalCheckouts', 'closedCheckouts'] as const,
    'name',
  )
  const sortDirection = getEnumSearchParam(searchParams, 'dir', ['asc', 'desc'] as const, 'asc')

  useEffect(() => {
    const state = location.state as UsersLocationState | null

    if (state?.successMessage) {
      navigate(location.pathname + location.search, { replace: true, state: null })
    }
  }, [location.pathname, location.search, location.state, navigate])

  useEffect(() => {
    async function loadUsers() {
      try {
        setErrorMessage('')
        const [allUsers, allCheckouts] = await Promise.all([getUsers(), getAllCheckouts()])

        const userCards = allUsers.map((candidate) =>
          buildUserSummary(candidate, allCheckouts),
        )

        setUsers(userCards)
      } catch (error: unknown) {
        setErrorMessage(getApiErrorMessage(error, t.users.loadError, language))
      } finally {
        setIsLoading(false)
      }
    }

    void loadUsers()
  }, [language, t.users.loadError])

  const filteredUsers = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()

    const result = users.filter((candidate) => {
      const matchesRole = roleFilter === 'all' ? true : candidate.role === roleFilter

      if (normalizedQuery.length === 0) {
        return matchesRole
      }

      return (
        matchesRole &&
        [candidate.name, candidate.email].join(' ').toLowerCase().includes(normalizedQuery)
      )
    })

    result.sort((left, right) => {
      const multiplier = sortDirection === 'asc' ? 1 : -1

      switch (sortField) {
        case 'role':
          return (
            getRoleLabel(left.role, language).localeCompare(getRoleLabel(right.role, language)) *
            multiplier
          )
        case 'activeCheckouts':
          return (
            (left.activeCheckouts - right.activeCheckouts) * multiplier ||
            left.name.localeCompare(right.name, language)
          )
        case 'overdueCheckouts':
          return (
            (left.overdueCheckouts - right.overdueCheckouts) * multiplier ||
            left.name.localeCompare(right.name, language)
          )
        case 'totalCheckouts':
          return (
            (left.totalCheckouts - right.totalCheckouts) * multiplier ||
            left.name.localeCompare(right.name, language)
          )
        case 'closedCheckouts':
          return (
            (left.closedCheckouts - right.closedCheckouts) * multiplier ||
            left.name.localeCompare(right.name, language)
          )
        case 'name':
        default:
          return left.name.localeCompare(right.name, language) * multiplier
      }
    })

    return result
  }, [language, roleFilter, searchQuery, sortDirection, sortField, users])

  const adminCount = users.filter((candidate) => candidate.role === 'Admin').length
  const activeCheckouts = users.reduce((sum, candidate) => sum + candidate.activeCheckouts, 0)
  function resetFilters() {
    setMergedSearchParams(setSearchParams, {
      search: null,
      role: null,
      sort: null,
      dir: null,
    })
  }

  function renderSortableHeading(field: UserSortField, label: string) {
    return (
      <SortableHeading
        direction={sortDirection}
        isActive={sortField === field}
        label={label}
        onSort={() => toggleSortSearchParams(setSearchParams, 'sort', 'dir', field)}
      />
    )
  }

  if (user?.role !== 'Admin') {
    return <Navigate to="/?reason=forbidden" replace />
  }

  if (isLoading) {
    return <div className="loading-state">{t.users.loading}</div>
  }

  if (errorMessage) {
    return <p className="form-error">{errorMessage}</p>
  }

  return (
    <div className="page-shell">
      {successMessage && <FeedbackMessage type="success" message={successMessage} />}

      <section className="page-hero">
        <div className="page-hero__content">
          <h1 className="page-title">{t.users.heroTitle}</h1>
        </div>
      </section>

      <section className="stats-grid stats-grid--three">
        <article className="stat-card">
          <span className="stat-card__label">{t.users.totalUsersLabel}</span>
          <strong className="stat-card__value">{users.length}</strong>
        </article>
        <article className="stat-card">
          <span className="stat-card__label">{t.users.adminUsersLabel}</span>
          <strong className="stat-card__value">{adminCount}</strong>
        </article>
        <article className="stat-card">
          <span className="stat-card__label">{t.users.activeTracked}</span>
          <strong className="stat-card__value">{activeCheckouts}</strong>
        </article>
      </section>

      <section className="inventory-stack">
        <FilterPanel
          filteredCount={filteredUsers.length}
          layout="users"
          onReset={resetFilters}
          onSearchChange={(value) =>
            setMergedSearchParams(setSearchParams, { search: value.trim() ? value : null })
          }
          searchId="users-search"
          searchPlaceholder={t.users.searchPlaceholder}
          searchValue={searchQuery}
          totalCount={users.length}
        >
          <div className="form-field">
            <label className="visually-hidden" htmlFor="users-role-filter">
              {t.common.roleFilterLabel}
            </label>
            <select
              id="users-role-filter"
              value={roleFilter}
              onChange={(event) =>
                setMergedSearchParams(setSearchParams, {
                  role: event.target.value === 'all' ? null : event.target.value,
                })
              }
            >
              <option value="all">{t.common.allRoles}</option>
              <option value="Admin">{getRoleLabel('Admin', language)}</option>
              <option value="User">{getRoleLabel('User', language)}</option>
            </select>
          </div>
        </FilterPanel>

        {users.length === 0 ? (
          <div className="empty-state">
            <h3>{t.users.emptyTitle}</h3>
            <p>{t.users.emptyText}</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="empty-state">
            <h3>{t.users.noResultsTitle}</h3>
            <p>{t.users.noResultsText}</p>
          </div>
        ) : (
          <div className="data-list data-list--users">
            <div className="data-list__header">
              <span className="data-list__heading">{renderSortableHeading('name', t.common.user)}</span>
              <span className="data-list__heading">{renderSortableHeading('role', t.profile.roleLabel)}</span>
              <span className="data-list__heading">{renderSortableHeading('activeCheckouts', t.users.activeCheckoutsLabel)}</span>
              <span className="data-list__heading">{renderSortableHeading('overdueCheckouts', t.users.overdueCheckoutsLabel)}</span>
              <span className="data-list__heading">{renderSortableHeading('totalCheckouts', t.users.totalCheckoutsLabel)}</span>
              <span className="data-list__heading">{renderSortableHeading('closedCheckouts', t.users.closedCheckoutsLabel)}</span>
            </div>

            <div className="data-list__body">
              {filteredUsers.map((candidate) => (
                <article key={candidate.id} className="data-list__row">
                  <div className="data-list__cell data-list__cell--primary">
                    <div className="data-list__context-stack">
                      <Link
                        to={`/users/${candidate.id}`}
                        className="context-link context-link--stack"
                      >
                        <strong className="data-list__context-name context-link__primary">
                          {candidate.name}
                        </strong>
                      </Link>
                      <span className="data-list__context-value">{candidate.email}</span>
                    </div>
                  </div>

                  <div className="data-list__cell">
                    <span className="data-list__mobile-label">{t.profile.roleLabel}</span>
                    <span className="data-list__value">{getRoleLabel(candidate.role, language)}</span>
                  </div>

                  <div className="data-list__cell">
                    <span className="data-list__mobile-label">
                      {t.users.activeCheckoutsLabel}
                    </span>
                    <span className="data-list__value">{candidate.activeCheckouts}</span>
                  </div>

                  <div className="data-list__cell">
                    <span className="data-list__mobile-label">
                      {t.users.overdueCheckoutsLabel}
                    </span>
                    <span className="data-list__value">{candidate.overdueCheckouts}</span>
                  </div>

                  <div className="data-list__cell">
                    <span className="data-list__mobile-label">
                      {t.users.totalCheckoutsLabel}
                    </span>
                    <span className="data-list__value">{candidate.totalCheckouts}</span>
                  </div>

                  <div className="data-list__cell">
                    <span className="data-list__mobile-label">
                      {t.users.closedCheckoutsLabel}
                    </span>
                    <span className="data-list__value">{candidate.closedCheckouts}</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

function buildUserSummary(user: ManagedUser, allCheckouts: CheckoutItem[]): UserSummary {
  const userCheckouts = allCheckouts.filter((checkout) => checkout.user.id === user.id)
  const activeCheckouts = userCheckouts.filter((checkout) => !checkout.returnedAt).length
  const overdueCheckouts = userCheckouts.filter((checkout) =>
    isCheckoutOverdue(checkout.dueAt, checkout.returnedAt),
  ).length
  const closedCheckouts = userCheckouts.filter((checkout) => !!checkout.returnedAt).length

  return {
    ...user,
    totalCheckouts: userCheckouts.length,
    activeCheckouts,
    overdueCheckouts,
    closedCheckouts,
  }
}

export default UsersPage
