export function isCheckoutOverdue(dueAt: string, returnedAt: string | null) {
  if (returnedAt) {
    return false
  }

  return new Date(dueAt).getTime() < Date.now()
}

export function isCheckoutDueSoon(
  dueAt: string,
  returnedAt: string | null,
  warningWindowHours = 48,
) {
  if (returnedAt) {
    return false
  }

  const dueTime = new Date(dueAt).getTime()

  if (Number.isNaN(dueTime) || dueTime < Date.now()) {
    return false
  }

  const warningWindowMs = warningWindowHours * 60 * 60 * 1000
  return dueTime - Date.now() <= warningWindowMs
}

export type CheckoutWarning = 'overdue' | 'dueSoon'

export const WARNING_FILTERS = ['all', 'none', 'dueSoon', 'overdue'] as const

export type WarningFilter = (typeof WARNING_FILTERS)[number]

export function getCheckoutWarning(
  dueAt: string | null,
  returnedAt: string | null,
): CheckoutWarning | null {
  if (!dueAt) {
    return null
  }

  if (isCheckoutOverdue(dueAt, returnedAt)) {
    return 'overdue'
  }

  return isCheckoutDueSoon(dueAt, returnedAt) ? 'dueSoon' : null
}
