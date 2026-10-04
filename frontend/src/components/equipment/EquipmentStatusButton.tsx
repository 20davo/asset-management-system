import { useLanguage } from '../../context/LanguageContext'
import type { EquipmentStatus } from '../../types/equipment'
import { Icon } from '../shared/Icon'

interface EquipmentStatusButtonProps {
  isBusy: boolean
  onMarkAvailable: () => void
  onMarkMaintenance: () => void
  status: EquipmentStatus
}

export function EquipmentStatusButton({
  isBusy,
  onMarkAvailable,
  onMarkMaintenance,
  status,
}: EquipmentStatusButtonProps) {
  const { t } = useLanguage()

  if (status === 'CheckedOut') {
    return null
  }

  const kind = status === 'Available' ? 'maintenance' : 'available'
  const label = kind === 'maintenance' ? t.inventory.makeMaintenance : t.inventory.makeAvailable

  return (
    <button
      type="button"
      className={`button-secondary button-icon button-icon--${kind}`}
      onClick={kind === 'maintenance' ? onMarkMaintenance : onMarkAvailable}
      disabled={isBusy}
      title={label}
      aria-label={label}
    >
      {isBusy ? '...' : <Icon kind={kind} />}
    </button>
  )
}
