import { Link } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import type { CheckoutWarning } from '../../utils/checkoutDeadlines'
import { ProtectedAssetImage } from '../media/ProtectedAssetImage'
import { DeadlineFlag } from './DeadlineFlag'

interface AssetCellProps {
  asset: { id: number; imageUrl: string | null; name: string }
  secondaryText: string
  tertiaryText?: string | null
  warning: CheckoutWarning | null
}

export function AssetCell({ asset, secondaryText, tertiaryText, warning }: AssetCellProps) {
  const { t } = useLanguage()

  return (
    <div className="data-list__cell data-list__cell--primary">
      <div className="data-list__asset">
        <div className="data-list__thumb">
          <ProtectedAssetImage
            imageUrl={asset.imageUrl}
            alt={asset.name}
            className="data-list__thumb-image"
            placeholderClassName="data-list__thumb-placeholder"
            placeholderText={t.common.noImage}
          />
        </div>

        <div className="data-list__asset-copy">
          <div className="data-list__title-row">
            <Link to={`/equipment/${asset.id}`} className="context-link">
              <strong className="data-list__primary-text context-link__primary">{asset.name}</strong>
            </Link>
            {warning && <DeadlineFlag warning={warning} />}
          </div>
          <span className="data-list__secondary-text">{secondaryText}</span>
          {tertiaryText && <span className="data-list__tertiary-text">{tertiaryText}</span>}
        </div>
      </div>
    </div>
  )
}
