import type { Language } from '../context/LanguageContext'
import type { UserRole } from '../types/auth'
import type { EquipmentStatus } from '../types/equipment'

export function getStatusBadgeClass(status: EquipmentStatus | string) {
  switch (status) {
    case 'Available':
      return 'status-badge status-badge--available'
    case 'CheckedOut':
      return 'status-badge status-badge--checkedout'
    case 'Maintenance':
      return 'status-badge status-badge--maintenance'
    default:
      return 'status-badge'
  }
}

export function getStatusLabel(status: EquipmentStatus | string, language: Language = 'hu') {
  const labels = {
    hu: {
      Available: 'Elérhető',
      CheckedOut: 'Kikérve',
      Maintenance: 'Karbantartás',
    },
    en: {
      Available: 'Available',
      CheckedOut: 'Checked out',
      Maintenance: 'Maintenance',
    },
  } as const

  return labels[language][status as keyof (typeof labels)[Language]] ?? status
}

export function getRoleLabel(role: UserRole | string, language: Language = 'hu') {
  const labels = {
    hu: {
      Admin: 'Adminisztrátor',
      User: 'Felhasználó',
    },
    en: {
      Admin: 'Administrator',
      User: 'User',
    },
  } as const

  return labels[language][role as keyof (typeof labels)[Language]] ?? role
}
