import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  createEquipment,
  deleteEquipment,
  getEquipments,
  markEquipmentAvailable,
  markEquipmentMaintenance,
  updateEquipment,
} from '../api/equipmentApi'
import { useAuth } from '../context/AuthContext'
import type { EquipmentListItem } from '../types/equipment'
import { getCheckoutWarning, WARNING_FILTERS } from '../utils/checkoutDeadlines'
import { formatDate } from '../utils/dates'
import { getStatusLabel } from '../utils/labels'
import { getApiErrorMessage } from '../utils/apiErrors'
import { getApiMessage } from '../utils/apiMessages'
import {
  getEnumSearchParam,
  getTextSearchParam,
  setMergedSearchParams,
  toggleSortSearchParams,
} from '../utils/searchParams'
import { useLanguage } from '../context/LanguageContext'
import { EquipmentForm } from '../components/equipment/EquipmentForm'
import { EquipmentCard } from '../components/equipment/EquipmentCard'
import { EquipmentListRow } from '../components/equipment/EquipmentListRow'
import { EquipmentActions } from '../components/equipment/EquipmentActions'
import { FeedbackMessage } from '../components/shared/FeedbackMessage'
import { FilterPanel } from '../components/shared/FilterPanel'
import { SortableHeading } from '../components/shared/SortableHeading'
import { ViewSwitch } from '../components/shared/ViewSwitch'
import { WarningFilterSelect } from '../components/shared/WarningFilterSelect'
import { emptyEquipmentForm, getUniqueCategories, useEquipmentForm } from '../hooks/useEquipmentForm'

const CATEGORY_DATALIST_ID = 'equipment-category-suggestions'

type EquipmentSortField = 'asset' | 'assignee' | 'serial' | 'status' | 'recorded'

function EquipmentListPage() {
  const { user } = useAuth()
  const { language, t } = useLanguage()
  const isAdmin = user?.role === 'Admin'
  const [searchParams, setSearchParams] = useSearchParams()

  const [equipments, setEquipments] = useState<EquipmentListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const categories = useMemo(
    () => getUniqueCategories(equipments.map((equipment) => equipment.category), language),
    [equipments, language],
  )
  const createForm = useEquipmentForm({
    categories,
    onClearMessages: clearMessages,
    onError: setErrorMessage,
  })
  const [editingEquipmentId, setEditingEquipmentId] = useState<number | null>(null)
  const editForm = useEquipmentForm({
    categories,
    onClearMessages: clearMessages,
    onError: setErrorMessage,
  })

  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [deletingEquipmentId, setDeletingEquipmentId] = useState<number | null>(null)
  const [statusChangingEquipmentId, setStatusChangingEquipmentId] = useState<number | null>(null)
  const [isCreatePanelOpen, setIsCreatePanelOpen] = useState(false)
  const addButtonRef = useRef<HTMLButtonElement | null>(null)
  const createPanelRef = useRef<HTMLElement | null>(null)
  const restoreAddFocus = useRef(false)
  const inventoryView = getEnumSearchParam(
    searchParams,
    'view',
    ['cards', 'list'] as const,
    'list',
  )
  const searchQuery = getTextSearchParam(searchParams, 'search')
  const statusFilter = searchParams.get('status') ?? 'all'
  const categoryFilter = searchParams.get('category') ?? 'all'
  const warningFilter = getEnumSearchParam(
    searchParams,
    'warning',
    WARNING_FILTERS,
    'all',
  )
  const sortField = getEnumSearchParam(
    searchParams,
    'sort',
    ['asset', 'assignee', 'serial', 'status', 'recorded'] as const,
    'asset',
  )
  const sortDirection = getEnumSearchParam(searchParams, 'dir', ['asc', 'desc'] as const, 'asc')

  const loadEquipments = useCallback(async () => {
    try {
      setErrorMessage('')
      const data = await getEquipments()
      setEquipments(data)
    } catch (error: unknown) {
      setErrorMessage(getApiErrorMessage(error, t.inventory.loadError, language))
    } finally {
      setIsLoading(false)
    }
  }, [language, t.inventory.loadError])

  useEffect(() => {
    void loadEquipments()
  }, [loadEquipments])

  // The add button hides while the form is open, so focus moves into the form and back.
  useEffect(() => {
    if (isCreatePanelOpen) {
      createPanelRef.current?.querySelector('input')?.focus({ preventScroll: true })
    } else if (restoreAddFocus.current) {
      restoreAddFocus.current = false
      addButtonRef.current?.focus()
    }
  }, [isCreatePanelOpen])

  function clearMessages() {
    setErrorMessage('')
    setSuccessMessage('')
  }

  function closeCreate() {
    createForm.setForm(emptyEquipmentForm)
    setIsCreatePanelOpen(false)
  }

  function cancelCreate() {
    restoreAddFocus.current = true
    closeCreate()
  }

  function openCreate() {
    cancelEdit()
    setIsCreatePanelOpen(true)
  }

  function startEdit(equipment: EquipmentListItem) {
    clearMessages()
    closeCreate()
    setEditingEquipmentId(equipment.id)
    editForm.setForm({
      name: equipment.name,
      category: equipment.category,
      description: equipment.description ?? '',
      image: null,
      imagePreviewUrl: equipment.imageUrl ?? '',
      removeImage: false,
      serialNumber: equipment.serialNumber,
    })
  }

  function cancelEdit() {
    setEditingEquipmentId(null)
    editForm.setForm(emptyEquipmentForm)
  }

  async function handleCreateSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    clearMessages()
    setIsCreating(true)

    try {
      const payload = createForm.getPayload()
      const response = await createEquipment({
        name: payload.name,
        category: payload.category,
        description: payload.description,
        image: payload.image,
        serialNumber: payload.serialNumber,
      })

      setSuccessMessage(getApiMessage(response.code, language) ?? t.inventory.createSuccess)
      restoreAddFocus.current = true
      closeCreate()
      await loadEquipments()
    } catch (error: unknown) {
      setErrorMessage(getApiErrorMessage(error, t.inventory.createError, language))
    } finally {
      setIsCreating(false)
    }
  }

  async function handleEditSubmit(
    event: React.FormEvent<HTMLFormElement>,
    equipmentId: number,
  ) {
    event.preventDefault()
    clearMessages()
    setIsUpdating(true)

    try {
      const response = await updateEquipment(equipmentId, editForm.getPayload())

      setSuccessMessage(getApiMessage(response.code, language) ?? t.inventory.updateSuccess)
      setEditingEquipmentId(null)
      editForm.setForm(emptyEquipmentForm)
      await loadEquipments()
    } catch (error: unknown) {
      setErrorMessage(getApiErrorMessage(error, t.inventory.updateError, language))
    } finally {
      setIsUpdating(false)
    }
  }

  async function handleDelete(equipmentId: number) {
    const confirmed = window.confirm(t.inventory.deleteConfirm)

    if (!confirmed) {
      return
    }

    clearMessages()
    setDeletingEquipmentId(equipmentId)

    try {
      const response = await deleteEquipment(equipmentId)
      setSuccessMessage(getApiMessage(response.code, language) ?? t.inventory.deleteSuccess)

      if (editingEquipmentId === equipmentId) {
        cancelEdit()
      }

      await loadEquipments()
    } catch (error: unknown) {
      setErrorMessage(getApiErrorMessage(error, t.inventory.deleteError, language))
    } finally {
      setDeletingEquipmentId(null)
    }
  }

  async function handleMarkMaintenance(equipmentId: number) {
    clearMessages()
    setStatusChangingEquipmentId(equipmentId)

    try {
      const response = await markEquipmentMaintenance(equipmentId)
      setSuccessMessage(getApiMessage(response.code, language) ?? t.inventory.maintenanceSuccess)
      await loadEquipments()
    } catch (error: unknown) {
      setErrorMessage(getApiErrorMessage(error, t.inventory.maintenanceError, language))
    } finally {
      setStatusChangingEquipmentId(null)
    }
  }

  async function handleMarkAvailable(equipmentId: number) {
    clearMessages()
    setStatusChangingEquipmentId(equipmentId)

    try {
      const response = await markEquipmentAvailable(equipmentId)
      setSuccessMessage(getApiMessage(response.code, language) ?? t.inventory.availableSuccess)
      await loadEquipments()
    } catch (error: unknown) {
      setErrorMessage(getApiErrorMessage(error, t.inventory.availableError, language))
    } finally {
      setStatusChangingEquipmentId(null)
    }
  }

  const availableCount = equipments.filter(
    (equipment) => equipment.status === 'Available',
  ).length
  const checkedOutCount = equipments.filter(
    (equipment) => equipment.status === 'CheckedOut',
  ).length
  const maintenanceCount = equipments.filter(
    (equipment) => equipment.status === 'Maintenance',
  ).length
  const newestEquipment = equipments.reduce<EquipmentListItem | undefined>(
    (newest, equipment) =>
      !newest || new Date(equipment.createdAt) > new Date(newest.createdAt) ? equipment : newest,
    undefined,
  )
  const filteredEquipments = (() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()

    const result = equipments.filter((equipment) => {
      const warning = getVisibleWarning(equipment) ?? 'none'
      const matchesSearch =
        normalizedQuery.length === 0
          ? true
          : [
              equipment.name,
              equipment.category,
              equipment.serialNumber,
              equipment.description ?? '',
              equipment.activeCheckoutUserName ?? '',
              equipment.maintenanceByUserName ?? '',
            ]
              .join(' ')
              .toLowerCase()
              .includes(normalizedQuery)

      const matchesStatus =
        statusFilter === 'all' ? true : equipment.status === statusFilter
      const matchesCategory =
        categoryFilter === 'all' ? true : equipment.category === categoryFilter
      const matchesWarning =
        statusFilter !== 'CheckedOut' || warningFilter === 'all'
          ? true
          : warning === warningFilter

      return matchesSearch && matchesStatus && matchesCategory && matchesWarning
    })

    result.sort((left, right) => {
      const multiplier = sortDirection === 'asc' ? 1 : -1

      switch (sortField) {
        case 'assignee': {
          const leftValue = getSortAssigneeValue(left)
          const rightValue = getSortAssigneeValue(right)

          // Rows without a person stay at the end in both directions.
          if (!leftValue || !rightValue) {
            return Number(!leftValue) - Number(!rightValue)
          }

          return (
            leftValue.localeCompare(rightValue, language) * multiplier ||
            compareVisibleDueDates(left, right) ||
            left.name.localeCompare(right.name, language)
          )
        }
        case 'serial':
          return (
            left.serialNumber.localeCompare(right.serialNumber, language, { numeric: true }) *
            multiplier
          )
        case 'status':
          return (
            getStatusLabel(left.status, language).localeCompare(
              getStatusLabel(right.status, language),
              language,
            ) * multiplier
          )
        case 'recorded':
          return (
            (new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()) *
            multiplier
          )
        case 'asset':
        default:
          return left.name.localeCompare(right.name, language) * multiplier
      }
    })

    return result
  })()

  function resetFilters() {
    setMergedSearchParams(setSearchParams, {
      search: null,
      status: null,
      category: null,
      warning: null,
      sort: null,
      dir: null,
      view: null,
    })
  }

  function getStatusContext(equipment: EquipmentListItem) {
    if (equipment.status === 'CheckedOut') {
      return {
        label: t.inventory.checkedOutBy,
        value: isCurrentUserName(equipment.activeCheckoutUserName)
          ? t.common.me
          : equipment.activeCheckoutUserName || t.inventory.actorUnknown,
      }
    }

    if (isAdmin && equipment.status === 'Maintenance') {
      return {
        label: t.inventory.maintenanceBy,
        value: equipment.maintenanceByUserName || t.inventory.actorUnknown,
      }
    }

    return null
  }

  function getSortAssigneeValue(equipment: EquipmentListItem) {
    const context = getStatusContext(equipment)
    return context?.value ?? ''
  }

  function compareVisibleDueDates(left: EquipmentListItem, right: EquipmentListItem) {
    const leftDue = canSeeCheckoutDetails(left) ? left.activeCheckoutDueAt : null
    const rightDue = canSeeCheckoutDetails(right) ? right.activeCheckoutDueAt : null

    if (!leftDue || !rightDue) {
      return Number(!leftDue) - Number(!rightDue)
    }

    return new Date(leftDue).getTime() - new Date(rightDue).getTime()
  }

  function canSeeCheckoutDetails(equipment: EquipmentListItem) {
    if (isAdmin) {
      return true
    }

    return equipment.status === 'CheckedOut' && isCurrentUserName(equipment.activeCheckoutUserName)
  }

  // The list API sends only the name of the holder, not the user id.
  function isCurrentUserName(name: string | null) {
    return (
      !!user?.name &&
      name?.trim().toLocaleLowerCase(language) === user.name.trim().toLocaleLowerCase(language)
    )
  }

  function getVisibleWarning(equipment: EquipmentListItem) {
    return canSeeCheckoutDetails(equipment)
      ? getCheckoutWarning(equipment.activeCheckoutDueAt, null)
      : null
  }

  function renderSortableHeading(field: EquipmentSortField, label: string) {
    return (
      <SortableHeading
        direction={sortDirection}
        isActive={sortField === field}
        label={label}
        onSort={() => toggleSortSearchParams(setSearchParams, 'sort', 'dir', field)}
      />
    )
  }

  function renderEquipmentActions(equipment: EquipmentListItem) {
    return (
      <EquipmentActions
        deletingEquipmentId={deletingEquipmentId}
        equipment={equipment}
        onDelete={handleDelete}
        onEdit={startEdit}
        onMarkAvailable={handleMarkAvailable}
        onMarkMaintenance={handleMarkMaintenance}
        statusChangingEquipmentId={statusChangingEquipmentId}
      />
    )
  }

  function renderEquipmentCard(equipment: EquipmentListItem) {
    const statusContext = getStatusContext(equipment)
    const canSeeDueState = canSeeCheckoutDetails(equipment)
    const warning = getVisibleWarning(equipment)

    if (editingEquipmentId === equipment.id) {
      return (
        <article key={equipment.id} className="section-card list-edit-panel">
          <EquipmentForm
            categoryDatalistId={CATEGORY_DATALIST_ID}
            form={editForm.form}
            idPrefix={`edit-${equipment.id}`}
            isSubmitting={isUpdating}
            mediaFallbackName={equipment.name}
            onCancel={cancelEdit}
            onCategoryBlur={editForm.normalizeCategory}
            onCategoryChange={editForm.updateCategory}
            onImageChange={editForm.handleImageChange}
            onRemoveImage={editForm.removeImage}
            onSubmit={(event) => handleEditSubmit(event, equipment.id)}
            setForm={editForm.setForm}
            submitLabel={t.inventory.saveChanges}
            submittingLabel={t.inventory.saving}
            title={t.inventory.editingTitle}
          />
        </article>
      )
    }

    return (
      <EquipmentCard
        key={equipment.id}
        actions={isAdmin ? renderEquipmentActions(equipment) : null}
        canSeeDueState={canSeeDueState}
        equipment={equipment}
        statusContext={statusContext}
        warning={warning}
      />
    )
  }

  if (isLoading) {
    return <div className="loading-state">{t.inventory.loading}</div>
  }

  if (errorMessage && equipments.length === 0) {
    return <FeedbackMessage type="error" message={errorMessage} />
  }

  return (
    <div className="page-shell">
      <section className="page-hero">
        <div className="page-hero__content">
          <h1 className="page-title">{t.inventory.heroTitle}</h1>
          <p className="page-hero__meta">
            {newestEquipment
              ? `${t.inventory.latestRecorded}: ${newestEquipment.name} ${formatDate(newestEquipment.createdAt, language)}`
              : t.inventory.noRecorded}
          </p>
        </div>

        {isAdmin && !isCreatePanelOpen && (
          <button
            ref={addButtonRef}
            type="button"
            className="page-hero__action"
            onClick={openCreate}
          >
            <span aria-hidden="true">+</span>
            {t.inventory.addAsset}
          </button>
        )}
      </section>

      {errorMessage && <FeedbackMessage type="error" message={errorMessage} />}
      {successMessage && <FeedbackMessage type="success" message={successMessage} />}

      <datalist id={CATEGORY_DATALIST_ID}>
        {categories.map((category) => (
          <option key={category} value={category} />
        ))}
      </datalist>

      {isAdmin && isCreatePanelOpen && (
        <section
          ref={createPanelRef}
          className="section-card admin-panel"
          aria-labelledby="create-form-title"
        >
          <EquipmentForm
            categoryDatalistId={CATEGORY_DATALIST_ID}
            form={createForm.form}
            idPrefix="create"
            isSubmitting={isCreating}
            mediaFallbackName={t.inventory.name}
            onCancel={cancelCreate}
            onCategoryBlur={createForm.normalizeCategory}
            onCategoryChange={createForm.updateCategory}
            onImageChange={createForm.handleImageChange}
            onRemoveImage={createForm.removeImage}
            onSubmit={handleCreateSubmit}
            setForm={createForm.setForm}
            submitLabel={t.inventory.saveItem}
            submittingLabel={t.inventory.saving}
            title={t.inventory.adminTitle}
          />
        </section>
      )}

      <section className="stats-grid">
        <article className="stat-card">
          <span className="stat-card__label">{t.inventory.total}</span>
          <strong className="stat-card__value">{equipments.length}</strong>
        </article>
        <article className="stat-card">
          <span className="stat-card__label">{t.inventory.available}</span>
          <strong className="stat-card__value">{availableCount}</strong>
        </article>
        <article className="stat-card">
          <span className="stat-card__label">{t.inventory.checkedOut}</span>
          <strong className="stat-card__value">{checkedOutCount}</strong>
        </article>
        <article className="stat-card">
          <span className="stat-card__label">{t.inventory.maintenance}</span>
          <strong className="stat-card__value">{maintenanceCount}</strong>
        </article>
      </section>

      <section className="inventory-stack">
        <FilterPanel
          filteredCount={filteredEquipments.length}
          layout="inventory"
          onReset={resetFilters}
          onSearchChange={(value) =>
            setMergedSearchParams(setSearchParams, { search: value.trim() ? value : null })
          }
          searchId="inventory-search"
          searchPlaceholder={t.inventory.searchPlaceholder}
          searchValue={searchQuery}
          totalCount={equipments.length}
          viewSwitch={
            <ViewSwitch
              value={inventoryView}
              onChange={(view) =>
                setMergedSearchParams(setSearchParams, { view: view === 'cards' ? view : null })
              }
            />
          }
        >
          <div className="form-field">
            <label className="visually-hidden" htmlFor="inventory-status-filter">
              {t.inventory.statusFilterLabel}
            </label>
            <select
              id="inventory-status-filter"
              value={statusFilter}
              onChange={(event) =>
                setMergedSearchParams(setSearchParams, {
                  status: event.target.value === 'all' ? null : event.target.value,
                  warning: event.target.value === 'CheckedOut' ? searchParams.get('warning') : null,
                })
              }
            >
              <option value="all">{t.inventory.allStatuses}</option>
              <option value="Available">{t.inventory.available}</option>
              <option value="CheckedOut">{t.inventory.checkedOut}</option>
              <option value="Maintenance">{t.inventory.maintenance}</option>
            </select>
          </div>

          {statusFilter === 'CheckedOut' && (
            <WarningFilterSelect
              id="inventory-warning-filter"
              value={warningFilter}
              onChange={(value) =>
                setMergedSearchParams(setSearchParams, { warning: value === 'all' ? null : value })
              }
            />
          )}

          <div className="form-field">
            <label className="visually-hidden" htmlFor="inventory-category-filter">
              {t.inventory.categoryFilterLabel}
            </label>
            <select
              id="inventory-category-filter"
              value={categoryFilter}
              onChange={(event) =>
                setMergedSearchParams(setSearchParams, {
                  category: event.target.value === 'all' ? null : event.target.value,
                })
              }
            >
              <option value="all">{t.inventory.allCategories}</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </FilterPanel>

        {equipments.length === 0 ? (
          <div className="empty-state">
            <h3>{t.inventory.emptyTitle}</h3>
            <p>{t.inventory.emptyText}</p>
          </div>
        ) : filteredEquipments.length === 0 ? (
          <div className="empty-state">
            <h3>{t.inventory.noResultsTitle}</h3>
            <p>{t.inventory.noResultsText}</p>
          </div>
        ) : inventoryView === 'list' ? (
          <div
            className={`data-list data-list--inventory${
              isAdmin ? ' data-list--inventory-admin' : ' data-list--inventory-user'
            }`}
          >
            <div className="data-list__header">
              <span className="data-list__heading">{renderSortableHeading('asset', t.common.asset)}</span>
              <span className="data-list__heading">{renderSortableHeading('assignee', t.inventory.assignee)}</span>
              <span className="data-list__heading">{renderSortableHeading('serial', t.inventory.serial)}</span>
              <span className="data-list__heading">{renderSortableHeading('status', t.common.status)}</span>
              <span className="data-list__heading">{renderSortableHeading('recorded', t.inventory.recordedAt)}</span>
              {isAdmin && (
                <span className="data-list__heading data-list__heading--actions">
                  {t.common.actions}
                </span>
              )}
            </div>

            <div className="data-list__body">
              {filteredEquipments.map((equipment) => {
                const statusContext = getStatusContext(equipment)
                const isEditing = editingEquipmentId === equipment.id

                return (
                  <Fragment key={equipment.id}>
                    <EquipmentListRow
                      actions={isAdmin ? renderEquipmentActions(equipment) : null}
                      equipment={equipment}
                      isEditing={isEditing}
                      statusContext={statusContext}
                      warning={getVisibleWarning(equipment)}
                    />
                    {isEditing && renderEquipmentCard(equipment)}
                  </Fragment>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="equipment-list">{filteredEquipments.map(renderEquipmentCard)}</div>
        )}
      </section>
    </div>
  )
}

export default EquipmentListPage
