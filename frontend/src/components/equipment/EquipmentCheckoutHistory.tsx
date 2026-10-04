import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import type { CheckoutHistoryItem } from '../../types/equipment'
import { isCheckoutDueSoon, isCheckoutOverdue } from '../../utils/checkoutDeadlines'
import { formatDateTime } from '../../utils/dates'
import { Icon } from '../shared/Icon'

interface EquipmentCheckoutHistoryProps {
  checkouts: CheckoutHistoryItem[]
  emptyText?: string
  errorMessage?: string
  showUser?: boolean
  title?: string
}

type EntryState = 'overdue' | 'due-soon' | 'active' | 'late' | 'returned'
type DateTone = 'danger' | 'warn'

function getEntryState(checkout: CheckoutHistoryItem): EntryState {
  if (checkout.returnedAt) {
    return new Date(checkout.returnedAt) > new Date(checkout.dueAt) ? 'late' : 'returned'
  }

  if (isCheckoutOverdue(checkout.dueAt, null)) {
    return 'overdue'
  }

  return isCheckoutDueSoon(checkout.dueAt, null) ? 'due-soon' : 'active'
}

function getDueTone(state: EntryState): DateTone | undefined {
  if (state === 'overdue' || state === 'late') {
    return 'danger'
  }

  return state === 'due-soon' ? 'warn' : undefined
}

function icon(children: ReactNode) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

const outIcon = icon(
  <>
    <path d="M5 11 11 5" />
    <path d="M6 5h5v5" />
  </>,
)

const dueIcon = icon(
  <>
    <rect x="2.5" y="3.5" width="11" height="10" rx="1.5" />
    <path d="M2.5 6.5h11" />
    <path d="M5.5 2v3M10.5 2v3" />
  </>,
)

const returnedIcon = icon(
  <>
    <path d="M11 5 5 11" />
    <path d="M10 11H5V6" />
  </>,
)

interface TimelineDateProps {
  icon: ReactNode
  label: string
  tone?: DateTone
  value: string
}

function TimelineDate({ icon, label, tone, value }: TimelineDateProps) {
  return (
    <span
      className={`details-timeline__date${tone ? ` details-timeline__date--${tone}` : ''}`}
      title={label}
    >
      {icon}
      <span className="visually-hidden">{label}</span>
      {value}
    </span>
  )
}

export function EquipmentCheckoutHistory({
  checkouts,
  emptyText,
  errorMessage,
  showUser = true,
  title,
}: EquipmentCheckoutHistoryProps) {
  const { language, t } = useLanguage()
  const stateLabels: Record<EntryState, string> = {
    overdue: t.checkouts.overdueBadge,
    'due-soon': t.checkouts.dueSoonBadge,
    active: t.details.active,
    late: t.details.returnedLate,
    returned: t.details.closed,
  }

  return (
    <section className="section-card details-history">
      <h2 className="section-heading__title details-history__title">
        {title ?? t.details.historyTitle}
      </h2>

      {errorMessage ? (
        <p className="form-error">{errorMessage}</p>
      ) : checkouts.length === 0 ? (
        <ol className="details-timeline">
          <li className="details-timeline__item details-timeline__item--empty">
            <div className="details-timeline__head">
              <strong>{t.details.noHistoryTitle}</strong>
            </div>
            <p className="details-timeline__dates">{emptyText ?? t.details.noHistoryText}</p>
          </li>
        </ol>
      ) : (
        <ol className="details-timeline">
          {checkouts.map((checkout) => {
            const state = getEntryState(checkout)

            return (
              <li
                key={checkout.id}
                className={`details-timeline__item details-timeline__item--${state}`}
              >
                <div className="details-timeline__head">
                  {showUser && (
                    <Link to={`/users/${checkout.userId}`} className="context-link">
                      <strong>{checkout.userName}</strong>
                    </Link>
                  )}
                  <span className={`details-timeline__tag details-timeline__tag--${state}`}>
                    {stateLabels[state]}
                  </span>
                </div>

                <p className="details-timeline__dates">
                  <TimelineDate
                    icon={outIcon}
                    label={t.details.outLabel}
                    value={formatDateTime(checkout.checkedOutAt, language)}
                  />
                  <TimelineDate
                    icon={dueIcon}
                    label={t.details.dueAt}
                    tone={getDueTone(state)}
                    value={formatDateTime(checkout.dueAt, language)}
                  />
                  {checkout.returnedAt && (
                    <TimelineDate
                      icon={returnedIcon}
                      label={t.details.closed}
                      value={formatDateTime(checkout.returnedAt, language)}
                    />
                  )}
                </p>

                {checkout.note && (
                  <p className="details-timeline__note">
                    <Icon kind="note" />
                    <span>{checkout.note}</span>
                  </p>
                )}
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
