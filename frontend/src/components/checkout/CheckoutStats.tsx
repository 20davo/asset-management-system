import { useLanguage } from '../../context/LanguageContext'
import type { CheckoutItem } from '../../types/checkout'
import { isCheckoutOverdue } from '../../utils/checkoutDeadlines'

interface CheckoutStatsProps {
  active: CheckoutItem[]
  history: CheckoutItem[]
}

export function CheckoutStats({ active, history }: CheckoutStatsProps) {
  const { t } = useLanguage()
  const overdueCount = active.filter((checkout) =>
    isCheckoutOverdue(checkout.dueAt, checkout.returnedAt),
  ).length

  return (
    <section className="stats-grid stats-grid--three">
      <article className="stat-card">
        <span className="stat-card__label">{t.myItems.activeLabel}</span>
        <strong className="stat-card__value">{active.length}</strong>
      </article>
      <article className="stat-card">
        <span className="stat-card__label">{t.checkouts.overdue}</span>
        <strong className="stat-card__value">{overdueCount}</strong>
      </article>
      <article className="stat-card">
        <span className="stat-card__label">{t.myItems.historyLabel}</span>
        <strong className="stat-card__value">{history.length}</strong>
      </article>
    </section>
  )
}
