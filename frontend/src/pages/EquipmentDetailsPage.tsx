import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  checkoutEquipment,
  getEquipmentById,
  getEquipments,
  markEquipmentAvailable,
  markEquipmentMaintenance,
  returnEquipment,
  updateEquipment,
} from '../api/equipmentApi'
import { getMyCheckouts } from '../api/checkoutApi'
import { getUsers } from '../api/userApi'
import { useAuth } from '../context/AuthContext'
import type { CheckoutItem } from '../types/checkout'
import type { CheckoutHistoryItem, EquipmentDetails } from '../types/equipment'
import type { ManagedUser } from '../types/user'
import { getCheckoutWarning, type CheckoutWarning } from '../utils/checkoutDeadlines'
import { useLanguage } from '../context/LanguageContext'
import { Icon } from '../components/shared/Icon'
import { EquipmentCheckoutHistory } from '../components/equipment/EquipmentCheckoutHistory'
import { EquipmentDetailsCard } from '../components/equipment/EquipmentDetailsCard'
import { EquipmentDetailsSummary } from '../components/equipment/EquipmentDetailsSummary'
import { EquipmentForm } from '../components/equipment/EquipmentForm'
import { EquipmentStatusButton } from '../components/equipment/EquipmentStatusButton'
import { FeedbackMessage } from '../components/shared/FeedbackMessage'
import { getUniqueCategories, useEquipmentForm } from '../hooks/useEquipmentForm'
import { getApiErrorMessage } from '../utils/apiErrors'
import { getApiMessage } from '../utils/apiMessages'

const MAX_LOAN_DAYS = 30

function formatDateTimeLocal(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${year}-${month}-${day}T${hours}:${minutes}`
}

function toOwnHistory(checkouts: CheckoutItem[], equipmentId: number): CheckoutHistoryItem[] {
  return checkouts
    .filter((checkout) => checkout.equipment.id === equipmentId)
    .sort((a, b) => new Date(b.checkedOutAt).getTime() - new Date(a.checkedOutAt).getTime())
    .map((checkout) => ({
      id: checkout.id,
      checkedOutAt: checkout.checkedOutAt,
      dueAt: checkout.dueAt,
      returnedAt: checkout.returnedAt,
      note: checkout.note,
      userId: checkout.user.id,
      userName: checkout.user.name,
      userEmail: checkout.user.email,
    }))
}

function EquipmentDetailsPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const { language, t } = useLanguage()
  const isAdminUser = user?.role === 'Admin'

  const [equipment, setEquipment] = useState<EquipmentDetails | null>(null)
  const [ownCheckouts, setOwnCheckouts] = useState<CheckoutHistoryItem[] | null>([])
  const [assignableUsers, setAssignableUsers] = useState<ManagedUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isStatusSubmitting, setIsStatusSubmitting] = useState(false)

  const [checkoutForm, setCheckoutForm] = useState({
    assignedUserId: '',
    dueAt: formatDateTimeLocal(new Date(Date.now() + 24 * 60 * 60 * 1000)),
    note: '',
  })
  const [minimumDueAt, setMinimumDueAt] = useState(formatDateTimeLocal(new Date()))
  const [dueMode, setDueMode] = useState<'date' | 'open'>('date')

  const [returnNote, setReturnNote] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [categories, setCategories] = useState<string[]>([])
  const categoriesRequest = useRef<Promise<string[]> | null>(null)
  const editForm = useEquipmentForm({
    categories,
    onClearMessages: () => {
      setErrorMessage('')
      setSuccessMessage('')
    },
    onError: setErrorMessage,
  })

  const loadEquipmentDetails = useCallback(async () => {
    if (!id) {
      setErrorMessage(t.details.missingId)
      setIsLoading(false)
      return
    }

    try {
      setErrorMessage('')
      // The details endpoint sends no history to regular users, so their own records come from /checkout/my.
      const [data, myCheckouts] = await Promise.all([
        getEquipmentById(Number(id)),
        isAdminUser ? Promise.resolve([]) : getMyCheckouts().catch(() => null),
      ])
      setEquipment(data)
      setOwnCheckouts(myCheckouts && toOwnHistory(myCheckouts, data.id))
    } catch (error: unknown) {
      setErrorMessage(getApiErrorMessage(error, t.details.loadError, language))
    } finally {
      setIsLoading(false)
    }
  }, [id, isAdminUser, language, t.details.loadError, t.details.missingId])

  useEffect(() => {
    void loadEquipmentDetails()
  }, [loadEquipmentDetails])

  useEffect(() => {
    if (!isAdminUser) {
      setAssignableUsers([])
      return
    }

    async function loadAssignableUsers() {
      try {
        const users = await getUsers()
        const eligibleUsers = users.filter(
          (candidate) => candidate.role === 'User' && candidate.id !== user?.id,
        )

        setAssignableUsers(eligibleUsers)
        setCheckoutForm((prev) => ({
          ...prev,
          assignedUserId: eligibleUsers[0]?.id ? String(eligibleUsers[0].id) : '',
        }))
      } catch {
        setAssignableUsers([])
      }
    }

    void loadAssignableUsers()
  }, [isAdminUser, user?.id])

  async function handleCheckoutSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!id) {
      return
    }

    setErrorMessage('')
    setSuccessMessage('')
    setIsSubmitting(true)
    setMinimumDueAt(formatDateTimeLocal(new Date()))

    try {
      const assignedUserId = isAdminUser ? Number(checkoutForm.assignedUserId) : undefined

      const response = await checkoutEquipment(Number(id), {
        assignedUserId: isAdminUser ? assignedUserId : undefined,
        dueAt: new Date(checkoutForm.dueAt).toISOString(),
        note: checkoutForm.note.trim() || undefined,
      })

      setSuccessMessage(
        getApiMessage(response.code, language) ??
          (isAdminUser ? t.details.assignSuccess : t.details.checkoutSuccess),
      )
      setCheckoutForm({
        assignedUserId: assignableUsers[0]?.id ? String(assignableUsers[0].id) : '',
        dueAt: formatDateTimeLocal(new Date(Date.now() + 24 * 60 * 60 * 1000)),
        note: '',
      })

      await loadEquipmentDetails()
    } catch (error: unknown) {
      setErrorMessage(getApiErrorMessage(error, t.details.checkoutError, language))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleReturnSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!id) {
      return
    }

    setErrorMessage('')
    setSuccessMessage('')
    setIsSubmitting(true)

    try {
      const response = await returnEquipment(Number(id), {
        note: returnNote.trim() || undefined,
      })

      setSuccessMessage(getApiMessage(response.code, language) ?? t.details.returnSuccess)
      setReturnNote('')

      await loadEquipmentDetails()
    } catch (error: unknown) {
      setErrorMessage(getApiErrorMessage(error, t.details.returnError, language))
    } finally {
      setIsSubmitting(false)
    }
  }

  function startEdit(current: EquipmentDetails) {
    setErrorMessage('')
    setSuccessMessage('')
    editForm.setForm({
      name: current.name,
      category: current.category,
      description: current.description ?? '',
      image: null,
      imagePreviewUrl: current.imageUrl ?? '',
      removeImage: false,
      serialNumber: current.serialNumber,
    })
    setIsEditing(true)

    categoriesRequest.current = getEquipments()
      .then((items) => getUniqueCategories(items.map((item) => item.category), language))
      .catch(() => [])
    void categoriesRequest.current.then(setCategories)
  }

  async function handleEditSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!id) {
      return
    }

    setErrorMessage('')
    setSuccessMessage('')
    setIsSubmitting(true)

    try {
      // Waits for the category list, so "laptop" still becomes an existing "Laptop".
      const knownCategories = (await categoriesRequest.current) ?? categories
      const response = await updateEquipment(Number(id), editForm.getPayload(knownCategories))

      setSuccessMessage(getApiMessage(response.code, language) ?? t.inventory.updateSuccess)
      setIsEditing(false)

      await loadEquipmentDetails()
    } catch (error: unknown) {
      setErrorMessage(getApiErrorMessage(error, t.inventory.updateError, language))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleMarkMaintenance() {
    if (!id) {
      return
    }

    setErrorMessage('')
    setSuccessMessage('')
    setIsStatusSubmitting(true)

    try {
      const response = await markEquipmentMaintenance(Number(id))
      setSuccessMessage(getApiMessage(response.code, language) ?? t.details.maintenanceSuccess)
      await loadEquipmentDetails()
    } catch (error: unknown) {
      setErrorMessage(getApiErrorMessage(error, t.details.maintenanceError, language))
    } finally {
      setIsStatusSubmitting(false)
    }
  }

  async function handleMarkAvailable() {
    if (!id) {
      return
    }

    setErrorMessage('')
    setSuccessMessage('')
    setIsStatusSubmitting(true)

    try {
      const response = await markEquipmentAvailable(Number(id))
      setSuccessMessage(getApiMessage(response.code, language) ?? t.details.availableSuccess)
      await loadEquipmentDetails()
    } catch (error: unknown) {
      setErrorMessage(getApiErrorMessage(error, t.details.availableError, language))
    } finally {
      setIsStatusSubmitting(false)
    }
  }

  if (isLoading) {
    return <div className="loading-state">{t.details.loading}</div>
  }

  if (errorMessage && !equipment) {
    return <FeedbackMessage type="error" message={errorMessage} />
  }

  if (!equipment) {
    return <FeedbackMessage type="error" message={t.details.notFound} />
  }

  const canCheckoutNow = equipment.status === 'Available'
  const canReturnNow = equipment.canReturn
  const latestCheckoutEntry = equipment.checkouts[0]
  const activeCheckoutEntry = equipment.checkouts.find((checkout) => !checkout.returnedAt)
  const activeCheckoutUserName =
    activeCheckoutEntry?.userName ?? equipment.activeCheckoutUserName ?? null
  const activeCheckoutDueAt =
    activeCheckoutEntry?.dueAt ?? equipment.activeCheckoutDueAt ?? null
  const lastMovementAt =
    equipment.lastActivityAt ??
    latestCheckoutEntry?.returnedAt ??
    latestCheckoutEntry?.checkedOutAt ??
    equipment.lastCheckedOutAt ??
    null
  const canSeeActiveCheckoutDetails =
    isAdminUser || equipment.isCheckedOutByCurrentUser
  const warning: CheckoutWarning | null = canSeeActiveCheckoutDetails
    ? getCheckoutWarning(activeCheckoutDueAt, null)
    : null
  const actionKind = isEditing ? null : canCheckoutNow ? 'checkout' : canReturnNow ? 'return' : null

  const tools = isAdminUser && !isEditing ? (
    <>
      <button
        type="button"
        className="button-icon"
        onClick={() => startEdit(equipment)}
        title={t.inventory.edit}
        aria-label={t.inventory.edit}
      >
        <Icon kind="edit" />
      </button>

      <EquipmentStatusButton
        isBusy={isStatusSubmitting}
        onMarkAvailable={handleMarkAvailable}
        onMarkMaintenance={handleMarkMaintenance}
        status={equipment.status}
      />
    </>
  ) : null

  const editPanel =
    isEditing && isAdminUser ? (
      <div className="details-action-panel">
        <datalist id="details-category-suggestions">
          {categories.map((category) => (
            <option key={category} value={category} />
          ))}
        </datalist>
        <EquipmentForm
          categoryDatalistId="details-category-suggestions"
          form={editForm.form}
          idPrefix={`edit-${equipment.id}`}
          isSubmitting={isSubmitting}
          mediaFallbackName={equipment.name}
          onCancel={() => setIsEditing(false)}
          onCategoryBlur={editForm.normalizeCategory}
          onCategoryChange={editForm.updateCategory}
          onImageChange={editForm.handleImageChange}
          onRemoveImage={editForm.removeImage}
          onSubmit={handleEditSubmit}
          setForm={editForm.setForm}
          submitLabel={t.inventory.saveChanges}
          submittingLabel={t.inventory.saving}
        />
      </div>
    ) : null

  const actionTitle =
    actionKind === 'return'
      ? t.details.returnTitle
      : isAdminUser
        ? t.details.assignTitle
        : t.details.checkoutTitle
  const actionHint =
    actionKind === 'return'
      ? t.details.returnHint
      : isAdminUser
        ? t.details.assignHint
        : t.details.checkoutHint(MAX_LOAN_DAYS)
  const loanLimit = new Date()
  loanLimit.setDate(loanLimit.getDate() + MAX_LOAN_DAYS)
  const maximumDueAt = isAdminUser ? undefined : formatDateTimeLocal(loanLimit)

  const actionForm = actionKind ? (
    <section
      className="details-action details-action--card"
      aria-labelledby="details-action-title"
    >
      <h2 id="details-action-title" className="details-action__title">
        {actionTitle}
      </h2>
      <p className="details-action__hint">{actionHint}</p>

      {actionKind === 'checkout' ? (
        <form className="auth-form details-action__form" onSubmit={handleCheckoutSubmit}>
          {isAdminUser && (
            <div className="form-field">
              <label htmlFor="assignedUserId">{t.details.assignUserLabel}</label>
              <select
                id="assignedUserId"
                value={checkoutForm.assignedUserId}
                onChange={(event) =>
                  setCheckoutForm((prev) => ({
                    ...prev,
                    assignedUserId: event.target.value,
                  }))
                }
                required
                disabled={assignableUsers.length === 0}
              >
                {assignableUsers.length === 0 ? (
                  <option value="">{t.details.noAssignableUsers}</option>
                ) : (
                  assignableUsers.map((candidate) => (
                    <option key={candidate.id} value={candidate.id}>
                      {candidate.name} ({candidate.email})
                    </option>
                  ))
                )}
              </select>
            </div>
          )}

          <div className="details-action__row">
            {isAdminUser && (
              <div className="form-field">
                <label htmlFor="dueMode">{t.details.dueAt}</label>
                <select
                  id="dueMode"
                  value={dueMode}
                  onChange={(event) => setDueMode(event.target.value as 'date' | 'open')}
                >
                  <option value="date">{t.details.dueSpecificDate}</option>
                  {/* Needs a nullable due date in the API first. */}
                  <option value="open" disabled>
                    {t.details.dueUntilFurtherNotice}
                  </option>
                </select>
              </div>
            )}

            {dueMode === 'date' && (
              <div className="form-field">
                <input
                  id="dueAt"
                  type="datetime-local"
                  aria-label={t.details.dueAt}
                  value={checkoutForm.dueAt}
                  min={minimumDueAt}
                  max={maximumDueAt}
                  onFocus={() => setMinimumDueAt(formatDateTimeLocal(new Date()))}
                  onChange={(event) =>
                    setCheckoutForm((prev) => ({
                      ...prev,
                      dueAt: event.target.value,
                    }))
                  }
                  required
                />
              </div>
            )}
          </div>

          <div className="form-field">
            <textarea
              id="checkoutNote"
              aria-label={t.details.note}
              value={checkoutForm.note}
              onChange={(event) =>
                setCheckoutForm((prev) => ({
                  ...prev,
                  note: event.target.value,
                }))
              }
              placeholder={t.details.notePlaceholder}
              rows={2}
            />
          </div>

          <button
            type="submit"
            className="form-submit"
            disabled={isSubmitting || (isAdminUser && assignableUsers.length === 0)}
          >
            {isSubmitting ? t.common.saveInProgress : t.details.confirm}
          </button>
        </form>
      ) : (
        <form className="auth-form details-action__form" onSubmit={handleReturnSubmit}>
          <div className="form-field">
            <textarea
              id="returnNote"
              aria-label={t.details.note}
              value={returnNote}
              onChange={(event) => setReturnNote(event.target.value)}
              placeholder={t.details.notePlaceholder}
              rows={3}
            />
          </div>

          <button type="submit" className="form-submit" disabled={isSubmitting}>
            {isSubmitting ? t.common.saveInProgress : t.details.confirm}
          </button>
        </form>
      )}
    </section>
  ) : null

  const summaryProps = {
    activeCheckoutDueAt,
    activeCheckoutUserId: activeCheckoutEntry?.userId ?? null,
    activeCheckoutUserName,
    canSeeActiveCheckoutDetails,
    warning,
    equipment,
    isAdminUser,
    lastMovementAt,
  }

  return (
    <div className="equipment-details-page">
      <nav className="details-crumbs" aria-label={t.details.breadcrumb}>
        <Link to="/">{t.nav.inventory}</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{equipment.name}</span>
      </nav>

      {errorMessage && <FeedbackMessage type="error" message={errorMessage} />}
      {successMessage && <FeedbackMessage type="success" message={successMessage} />}

      <EquipmentDetailsCard
        aside={<EquipmentDetailsSummary {...summaryProps} />}
        warning={warning}
        equipment={equipment}
        isEditing={editPanel !== null}
        panel={editPanel}
        tools={tools}
      />

      <div className={`details-body ${actionForm ? '' : 'details-body--single'}`}>
        {actionForm}
        {isAdminUser ? (
          <EquipmentCheckoutHistory checkouts={equipment.checkouts} />
        ) : (
          <EquipmentCheckoutHistory
            checkouts={ownCheckouts ?? []}
            emptyText={t.details.noOwnHistoryText}
            errorMessage={ownCheckouts ? undefined : t.details.ownHistoryLoadError}
            showUser={false}
            title={t.details.ownHistoryTitle}
          />
        )}
      </div>
    </div>
  )
}

export default EquipmentDetailsPage
