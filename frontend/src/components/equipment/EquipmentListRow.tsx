import type { ReactNode } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import type { EquipmentListItem } from '../../types/equipment'
import type { CheckoutWarning } from '../../utils/checkoutDeadlines'
import { formatDate } from '../../utils/dates'
import { getStatusBadgeClass, getStatusLabel } from '../../utils/labels'
import { AssetCell } from '../shared/AssetCell'
import type { EquipmentStatusMeta } from './EquipmentCard'

interface EquipmentListRowProps {
  actions?: ReactNode
  equipment: EquipmentListItem
  isEditing?: boolean
  statusContext: EquipmentStatusMeta | null
  warning: CheckoutWarning | null
}

export function EquipmentListRow({
  actions,
  equipment,
  isEditing = false,
  statusContext,
  warning,
}: EquipmentListRowProps) {
  const { language, t } = useLanguage()

  return (
    <article
      className={`data-list__row ${
        isEditing
          ? 'data-list__row--editing'
          : warning === 'overdue'
            ? 'data-list__row--overdue'
            : warning === 'dueSoon'
              ? 'data-list__row--due-soon'
              : ''
      }`}
    >
      <AssetCell
        asset={equipment}
        secondaryText={equipment.category}
        tertiaryText={equipment.description || t.inventory.listDescriptionFallback}
        warning={warning}
      />

      <div className="data-list__cell data-list__cell--context">
        <span className="data-list__mobile-label">{t.inventory.assignee}</span>
        {statusContext ? (
          <div className="data-list__context-stack">
            <span className="data-list__context-label">{statusContext.label}</span>
            <strong className="data-list__context-name">{statusContext.value}</strong>
          </div>
        ) : (
          <span className="data-list__context-placeholder">-</span>
        )}
      </div>

      <div className="data-list__cell">
        <span className="data-list__mobile-label">{t.inventory.serial}</span>
        <span className="data-list__value">{equipment.serialNumber}</span>
      </div>

      <div className="data-list__cell">
        <span className="data-list__mobile-label">{t.common.status}</span>
        <div className="data-list__status-stack">
          <span className={getStatusBadgeClass(equipment.status)}>
            {getStatusLabel(equipment.status, language)}
          </span>
        </div>
      </div>

      <div className="data-list__cell">
        <span className="data-list__mobile-label">{t.inventory.recordedAt}</span>
        <span className="data-list__value">
          {formatDate(equipment.createdAt, language)}
        </span>
      </div>

      {actions && (
        <div className="data-list__cell data-list__cell--actions">
          <div className="data-list__action-row">{actions}</div>
        </div>
      )}
    </article>
  )
}
