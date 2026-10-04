import { Link } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import type { EquipmentDetails } from '../../types/equipment'
import { formatDateTime } from '../../utils/dates'
import type { CheckoutWarning } from '../../utils/checkoutDeadlines'

interface EquipmentDetailsSummaryProps {
  activeCheckoutDueAt: string | null
  activeCheckoutUserId: number | null
  activeCheckoutUserName: string | null
  canSeeActiveCheckoutDetails: boolean
  warning: CheckoutWarning | null
  equipment: EquipmentDetails
  isAdminUser: boolean
  lastMovementAt: string | null
}

export function EquipmentDetailsSummary({
  activeCheckoutDueAt,
  activeCheckoutUserId,
  activeCheckoutUserName,
  canSeeActiveCheckoutDetails,
  warning,
  equipment,
  isAdminUser,
  lastMovementAt,
}: EquipmentDetailsSummaryProps) {
  const { language, t } = useLanguage()

  return (
    <div className="details-identity__props">
      <dl className="details-props__list">
        <div>
          <dt>{t.details.activeUserLabel}</dt>
          <dd>
            {!activeCheckoutUserName ? (
              t.details.unassigned
            ) : isAdminUser && activeCheckoutUserId ? (
              <Link to={`/users/${activeCheckoutUserId}`} className="context-link">
                <strong>{activeCheckoutUserName}</strong>
              </Link>
            ) : (
              <strong>{activeCheckoutUserName}</strong>
            )}
          </dd>
        </div>

        {canSeeActiveCheckoutDetails && activeCheckoutDueAt && (
          <div>
            <dt>
              {warning === 'overdue'
                ? t.details.overduePrefix
                : warning === 'dueSoon'
                  ? t.details.dueSoonPrefix
                  : t.details.deadlinePrefix}
            </dt>
            <dd
              className={
                warning === 'overdue'
                  ? 'details-props__value--danger'
                  : warning === 'dueSoon'
                    ? 'details-props__value--warning'
                    : undefined
              }
            >
              {formatDateTime(activeCheckoutDueAt, language)}
            </dd>
          </div>
        )}

        <div>
          <dt>{t.details.category}</dt>
          <dd>{equipment.category}</dd>
        </div>

        <div>
          <dt>{t.details.serial}</dt>
          <dd>{equipment.serialNumber}</dd>
        </div>

        <div>
          <dt>{t.details.recorded}</dt>
          <dd>{formatDateTime(equipment.createdAt, language)}</dd>
        </div>

        <div>
          <dt>{t.details.lastEvent}</dt>
          <dd>
            {lastMovementAt ? formatDateTime(lastMovementAt, language) : t.details.noHistoryNote}
          </dd>
        </div>

        {isAdminUser && (
          <div>
            <dt>{t.details.totalCheckouts}</dt>
            <dd>{equipment.totalCheckoutCount}</dd>
          </div>
        )}
      </dl>
    </div>
  )
}
