import { useLanguage } from '../../context/LanguageContext'
import type { CheckoutWarning } from '../../utils/checkoutDeadlines'

export function DeadlineFlag({ warning }: { warning: CheckoutWarning }) {
  const { t } = useLanguage()

  return warning === 'overdue' ? (
    <span className="deadline-flag deadline-flag--danger">{t.checkouts.overdueBadge}</span>
  ) : (
    <span className="deadline-flag deadline-flag--warning">{t.checkouts.dueSoonBadge}</span>
  )
}
