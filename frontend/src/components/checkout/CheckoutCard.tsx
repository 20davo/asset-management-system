import { Link } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import type { CheckoutItem } from '../../types/checkout'
import { getCheckoutWarning } from '../../utils/checkoutDeadlines'
import { formatDate } from '../../utils/dates'
import { getStatusBadgeClass, getStatusLabel } from '../../utils/labels'
import { Icon } from '../shared/Icon'
import { ProtectedAssetImage } from '../media/ProtectedAssetImage'
import { DeadlineFlag } from '../shared/DeadlineFlag'

interface CheckoutCardProps {
  checkout: CheckoutItem
  showReturned?: boolean
  showUser?: boolean
}

export function CheckoutCard({ checkout, showReturned = false, showUser = false }: CheckoutCardProps) {
  const { language, t } = useLanguage()
  const { equipment } = checkout
  const warning = getCheckoutWarning(checkout.dueAt, checkout.returnedAt)
  const toneClass =
    warning === 'overdue'
      ? ' details-identity--overdue'
      : warning === 'dueSoon'
        ? ' details-identity--due-soon'
        : ''

  return (
    <article
      className={`section-card details-identity details-identity--with-aside asset-card${toneClass}`}
    >
      <div className="details-identity__media">
        <ProtectedAssetImage
          imageUrl={equipment.imageUrl}
          alt={equipment.name}
          className="details-identity__image"
          placeholderClassName="asset-image-placeholder"
          placeholderText={t.common.noImage}
        />
      </div>

      <div className="details-identity__body">
        <div className="details-identity__top">
          <div className="details-identity__heading">
            <div className="details-identity__title-row">
              <Link to={`/equipment/${equipment.id}`} className="context-link">
                <h3 className="asset-card__title context-link__primary">{equipment.name}</h3>
              </Link>
              {warning && <DeadlineFlag warning={warning} />}
            </div>
            <span className="details-identity__meta">
              {equipment.category} SN {equipment.serialNumber}
            </span>
          </div>

          <div className="details-identity__side">
            <span className={getStatusBadgeClass(equipment.status)}>
              {getStatusLabel(equipment.status, language)}
            </span>
          </div>
        </div>

        {checkout.note && (
          <p className="details-timeline__note asset-card__note" title={t.checkouts.note}>
            <Icon kind="note" />
            <span>{checkout.note}</span>
          </p>
        )}
      </div>

      <div className="details-identity__props">
        <dl className="details-props__list">
          {showUser && (
            <div>
              <dt>{t.common.user}</dt>
              <dd>
                <Link to={`/users/${checkout.user.id}`} className="context-link">
                  {checkout.user.name}
                </Link>
              </dd>
            </div>
          )}
          <div>
            <dt>{t.checkouts.checkedOutAt}</dt>
            <dd>{formatDate(checkout.checkedOutAt, language)}</dd>
          </div>
          <div>
            <dt>{t.checkouts.dueAt}</dt>
            <dd>{formatDate(checkout.dueAt, language)}</dd>
          </div>
          {showReturned && (
            <div>
              <dt>{t.checkouts.returnedAt}</dt>
              <dd>
                {checkout.returnedAt
                  ? formatDate(checkout.returnedAt, language)
                  : t.checkouts.notClosed}
              </dd>
            </div>
          )}
        </dl>
      </div>
    </article>
  )
}
