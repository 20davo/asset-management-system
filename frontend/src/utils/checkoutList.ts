import type { Language } from '../context/LanguageContext'
import type { CheckoutItem } from '../types/checkout'
import { getStatusLabel } from './labels'

export type CheckoutSortField =
  | 'asset'
  | 'user'
  | 'serial'
  | 'status'
  | 'checkedOutAt'
  | 'dueAt'
  | 'returnedAt'

export function matchesCheckoutSearch(checkout: CheckoutItem, query: string) {
  const normalizedQuery = query.trim().toLowerCase()

  if (!normalizedQuery) {
    return true
  }

  return [
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
}

function getTime(value: string | null) {
  return value ? new Date(value).getTime() : Number.NEGATIVE_INFINITY
}

function compareCheckouts(
  left: CheckoutItem,
  right: CheckoutItem,
  field: CheckoutSortField,
  language: Language,
) {
  switch (field) {
    case 'asset':
      return left.equipment.name.localeCompare(right.equipment.name, language)
    case 'user':
      return left.user.name.localeCompare(right.user.name, language)
    case 'serial':
      return left.equipment.serialNumber.localeCompare(right.equipment.serialNumber, language, {
        numeric: true,
      })
    case 'status':
      return getStatusLabel(left.equipment.status, language).localeCompare(
        getStatusLabel(right.equipment.status, language),
        language,
      )
    case 'checkedOutAt':
      return getTime(left.checkedOutAt) - getTime(right.checkedOutAt)
    case 'dueAt':
      return getTime(left.dueAt) - getTime(right.dueAt)
    case 'returnedAt':
      return getTime(left.returnedAt) - getTime(right.returnedAt)
  }
}

export function sortCheckouts(
  items: CheckoutItem[],
  field: CheckoutSortField,
  direction: 'asc' | 'desc',
  language: Language,
) {
  const multiplier = direction === 'asc' ? 1 : -1

  return [...items].sort((left, right) => compareCheckouts(left, right, field, language) * multiplier)
}
