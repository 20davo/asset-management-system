import { Link } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import type { EquipmentListItem } from '../../types/equipment'
import { Icon } from '../shared/Icon'
import { EquipmentStatusButton } from './EquipmentStatusButton'

interface EquipmentActionsProps {
  deletingEquipmentId: number | null
  equipment: EquipmentListItem
  onDelete: (equipmentId: number) => void
  onEdit: (equipment: EquipmentListItem) => void
  onMarkAvailable: (equipmentId: number) => void
  onMarkMaintenance: (equipmentId: number) => void
  statusChangingEquipmentId: number | null
}

export function EquipmentActions({
  deletingEquipmentId,
  equipment,
  onDelete,
  onEdit,
  onMarkAvailable,
  onMarkMaintenance,
  statusChangingEquipmentId,
}: EquipmentActionsProps) {
  const { t } = useLanguage()

  return (
    <>
      <Link
        to={`/equipment/${equipment.id}`}
        className="button-link button-secondary button-compact-label"
        title={t.inventory.details}
        aria-label={t.inventory.details}
      >
        <Icon kind="details" />
        <span className="button-compact-label__text">{t.inventory.details}</span>
      </Link>

      <button
        type="button"
        className="button-icon"
        onClick={() => onEdit(equipment)}
        title={t.inventory.edit}
        aria-label={t.inventory.edit}
      >
        <Icon kind="edit" />
      </button>

      <EquipmentStatusButton
        isBusy={statusChangingEquipmentId === equipment.id}
        onMarkAvailable={() => onMarkAvailable(equipment.id)}
        onMarkMaintenance={() => onMarkMaintenance(equipment.id)}
        status={equipment.status}
      />

      <button
        type="button"
        className="button-danger button-icon"
        onClick={() => onDelete(equipment.id)}
        disabled={deletingEquipmentId === equipment.id}
        title={t.inventory.delete}
        aria-label={t.inventory.delete}
      >
        {deletingEquipmentId === equipment.id ? '...' : <Icon kind="delete" />}
      </button>
    </>
  )
}
