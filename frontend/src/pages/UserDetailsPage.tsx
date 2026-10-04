import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { getUserCheckouts } from '../api/checkoutApi'
import { deleteUser, getUser, updateUser as updateUserRequest } from '../api/userApi'
import { AssignedAssetsSection } from '../components/checkout/AssignedAssetsSection'
import { CheckoutHistorySection } from '../components/checkout/CheckoutHistorySection'
import { CheckoutStats } from '../components/checkout/CheckoutStats'
import { FeedbackMessage } from '../components/shared/FeedbackMessage'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import type { CheckoutItem } from '../types/checkout'
import type { ManagedUser } from '../types/user'
import { getApiErrorMessage } from '../utils/apiErrors'
import { getApiMessage } from '../utils/apiMessages'
import { getRoleLabel } from '../utils/labels'

interface UserFormState {
  name: string
  email: string
  role: 'Admin' | 'User'
}

function UserDetailsPage() {
  const { user, updateUser } = useAuth()
  const { userId } = useParams()
  const navigate = useNavigate()
  const { language, t } = useLanguage()
  const [checkouts, setCheckouts] = useState<CheckoutItem[]>([])
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null)
  const [formState, setFormState] = useState<UserFormState>({
    name: '',
    email: '',
    role: 'User',
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    async function loadData() {
      if (!userId) {
        setErrorMessage(t.checkouts.userMissing)
        setIsLoading(false)
        return
      }

      try {
        setErrorMessage('')
        const numericUserId = Number(userId)
        const [targetUser, userCheckouts] = await Promise.all([
          getUser(numericUserId),
          getUserCheckouts(numericUserId),
        ])

        setSelectedUser(targetUser)
        setFormState({
          name: targetUser.name,
          email: targetUser.email,
          role: targetUser.role,
        })
        setCheckouts(userCheckouts)
      } catch (error: unknown) {
        setErrorMessage(getApiErrorMessage(error, t.checkouts.userLoadError, language))
      } finally {
        setIsLoading(false)
      }
    }

    void loadData()
  }, [language, t.checkouts.userLoadError, t.checkouts.userMissing, userId])

  const activeItems = useMemo(
    () => checkouts.filter((checkout) => !checkout.returnedAt),
    [checkouts],
  )
  const historyItems = useMemo(
    () => checkouts.filter((checkout) => !!checkout.returnedAt),
    [checkouts],
  )
  const isAdminAccount = selectedUser?.role === 'Admin'
  // Admins cannot hold assets, so their checkout parts only show up for old records.
  const showCheckouts = !isAdminAccount || checkouts.length > 0
  const isSelf = !!selectedUser && !!user && selectedUser.id === user.id
  const isSelfRoleLocked = isSelf && selectedUser?.role === 'Admin'
  const deleteBlocked = isSelf

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!selectedUser) {
      return
    }

    try {
      setIsSaving(true)
      setErrorMessage('')
      setSuccessMessage('')

      const updatedUser = await updateUserRequest(selectedUser.id, formState)
      setSelectedUser(updatedUser)
      setFormState({
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
      })

      if (user && updatedUser.id === user.id) {
        updateUser({
          ...user,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
        })
      }

      setSuccessMessage(t.users.updateSuccess)
    } catch (error: unknown) {
      setErrorMessage(getApiErrorMessage(error, t.users.updateError, language))
      setSuccessMessage('')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (!selectedUser) {
      return
    }

    const confirmed = window.confirm(t.users.deleteConfirm(selectedUser.name))

    if (!confirmed) {
      return
    }

    try {
      setIsDeleting(true)
      setErrorMessage('')
      const response = await deleteUser(selectedUser.id)
      const deleteSuccessMessage =
        getApiMessage(response.code, language) ?? response.message ?? t.users.deleteSuccess

      navigate('/users', {
        replace: true,
        state: { successMessage: deleteSuccessMessage },
      })
    } catch (error: unknown) {
      setErrorMessage(getApiErrorMessage(error, t.users.deleteError, language))
    } finally {
      setIsDeleting(false)
    }
  }

  if (user?.role !== 'Admin') {
    return <Navigate to="/?reason=forbidden" replace />
  }

  if (isLoading) {
    return <div className="loading-state">{t.users.loading}</div>
  }

  if (errorMessage && !selectedUser) {
    return <FeedbackMessage type="error" message={errorMessage} />
  }

  if (!selectedUser) {
    return <FeedbackMessage type="error" message={t.checkouts.userNotFound} />
  }

  return (
    <div className="page-shell">
      <nav className="details-crumbs" aria-label={t.details.breadcrumb}>
        <Link to="/users">{t.nav.users}</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{selectedUser.name}</span>
      </nav>

      <h1 className="visually-hidden">{selectedUser.name}</h1>

      {errorMessage && <FeedbackMessage type="error" message={errorMessage} />}
      {successMessage && <FeedbackMessage type="success" message={successMessage} />}

      {showCheckouts && <CheckoutStats active={activeItems} history={historyItems} />}

      <section className="details-layout">
        <article className="section-card">
          <div className="section-heading section-heading--tight">
            <h2 className="section-heading__title">{t.users.manageTitle}</h2>
          </div>

          <form className="auth-form" onSubmit={handleSave}>
            <div className="form-row">
              <div className="form-field">
                <label htmlFor="managed-user-name">{t.profile.nameLabel}</label>
                <input
                  id="managed-user-name"
                  type="text"
                  value={formState.name}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, name: event.target.value }))
                  }
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="managed-user-email">{t.profile.emailLabel}</label>
                <input
                  id="managed-user-email"
                  type="email"
                  value={formState.email}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, email: event.target.value }))
                  }
                  required
                />
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="managed-user-role">{t.profile.roleLabel}</label>
              <select
                id="managed-user-role"
                value={formState.role}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    role: event.target.value as UserFormState['role'],
                  }))
                }
                disabled={isSelfRoleLocked}
              >
                <option value="User">{getRoleLabel('User', language)}</option>
                <option value="Admin">{getRoleLabel('Admin', language)}</option>
              </select>
            </div>

            {isSelfRoleLocked && (
              <p className="form-success">{t.users.selfRoleLockNotice}</p>
            )}

            <div className="form-actions">
              <button type="submit" className="form-submit" disabled={isSaving}>
                {isSaving ? t.common.saveInProgress : t.inventory.saveChanges}
              </button>
            </div>
          </form>
        </article>

        <aside className="section-card section-card--compact">
          <div className="section-heading section-heading--tight">
            <h2 className="section-heading__title">{t.users.accessTitle}</h2>
          </div>

          <dl className="details-props__list">
            <div>
              <dt>{t.profile.nameLabel}</dt>
              <dd>{selectedUser.name}</dd>
            </div>
            <div>
              <dt>{t.profile.emailLabel}</dt>
              <dd>{selectedUser.email}</dd>
            </div>
            <div>
              <dt>{t.profile.roleLabel}</dt>
              <dd>{getRoleLabel(selectedUser.role, language)}</dd>
            </div>
          </dl>

          <div className="user-delete">
            <span className="user-delete__label">{t.users.deleteUserLabel}</span>
            <p className="user-delete__text">
              {deleteBlocked ? t.users.selfDeleteBlocked : t.users.deleteUserText}
            </p>
            <div className="profile-actions profile-actions--compact">
              <button
                type="button"
                className="button-danger button-form"
                onClick={handleDelete}
                disabled={isDeleting || deleteBlocked}
              >
                {isDeleting ? t.users.deletingUser : t.users.deleteUserAction}
              </button>
            </div>
          </div>
        </aside>
      </section>

      {(!isAdminAccount || activeItems.length > 0) && (
        <AssignedAssetsSection
          items={activeItems}
          emptyTitle={t.users.currentEmptyTitle}
          emptyText={t.users.currentEmptyText}
          searchPlaceholder={t.users.currentSearchPlaceholder}
          title={t.users.currentItemsTitle}
          queryKeyPrefix="assigned"
          enableWarningFilter
        />
      )}

      {(!isAdminAccount || historyItems.length > 0) && (
        <CheckoutHistorySection
          items={historyItems}
          emptyTitle={t.users.historyEmptyTitle}
          emptyText={t.users.historyEmptyText}
          searchPlaceholder={t.users.historySearchPlaceholder}
          title={t.users.historyTitle}
          queryKeyPrefix="history"
        />
      )}
    </div>
  )
}

export default UserDetailsPage
