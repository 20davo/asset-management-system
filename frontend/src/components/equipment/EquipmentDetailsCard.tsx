import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import type { EquipmentDetails } from '../../types/equipment'
import type { CheckoutWarning } from '../../utils/checkoutDeadlines'
import { getStatusBadgeClass, getStatusLabel } from '../../utils/labels'
import { ProtectedAssetImage } from '../media/ProtectedAssetImage'
import { DeadlineFlag } from '../shared/DeadlineFlag'

interface EquipmentDetailsCardProps {
  aside?: ReactNode
  equipment: EquipmentDetails
  isEditing: boolean
  panel: ReactNode
  tools: ReactNode
  warning: CheckoutWarning | null
}

export function EquipmentDetailsCard({
  aside,
  equipment,
  isEditing,
  panel,
  tools,
  warning,
}: EquipmentDetailsCardProps) {
  const { language, t } = useLanguage()
  const bodyRef = useRef<HTMLDivElement | null>(null)
  const descriptionRef = useRef<HTMLParagraphElement | null>(null)
  const [clampLines, setClampLines] = useState<number | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const toneClass =
    warning === 'overdue'
      ? 'details-identity--overdue'
      : warning === 'dueSoon'
        ? 'details-identity--due-soon'
        : ''

  useEffect(() => {
    const body = bodyRef.current
    const description = descriptionRef.current

    if (!body || !description || isExpanded || typeof ResizeObserver === 'undefined') {
      return
    }

    // The card height comes from the image or the action form, never from the description.
    const observer = new ResizeObserver(() => {
      const lineHeight = parseFloat(getComputedStyle(description).lineHeight)

      if (!Number.isFinite(lineHeight)) {
        setClampLines(null)
        return
      }

      const available =
        body.getBoundingClientRect().bottom - description.getBoundingClientRect().top

      if (description.scrollHeight <= available + 1) {
        setClampLines(null)
        return
      }

      setClampLines(Math.max(1, Math.floor((available - lineHeight) / lineHeight)))
    })

    observer.observe(body)
    observer.observe(description)

    return () => observer.disconnect()
  }, [equipment.description, isEditing, isExpanded])

  const isClamped = clampLines !== null && !isExpanded

  return (
    <section
      className={`section-card details-identity ${toneClass} ${
        isEditing ? 'details-identity--editing' : isExpanded ? 'details-identity--expanded' : ''
      } ${aside && !isEditing ? 'details-identity--with-aside' : ''}`}
    >
      {!isEditing && (
        <div className="details-identity__media">
          <ProtectedAssetImage
            imageUrl={equipment.imageUrl}
            alt={equipment.name}
            className="details-identity__image"
            placeholderClassName="asset-image-placeholder"
            placeholderText={t.common.noImage}
          />
        </div>
      )}

      <div ref={bodyRef} className="details-identity__body">
        <div className="details-identity__top">
          <div className="details-identity__heading">
            <div className="details-identity__title-row">
              <h1 className="page-title">{equipment.name}</h1>
              {warning && <DeadlineFlag warning={warning} />}
            </div>
            <span className="details-identity__meta">
              {equipment.category} SN {equipment.serialNumber}
            </span>
          </div>

          {!isEditing && (
            <div className="details-identity__side">
              <span className={getStatusBadgeClass(equipment.status)}>
                {getStatusLabel(equipment.status, language)}
              </span>
              {tools && <div className="details-identity__tools">{tools}</div>}
            </div>
          )}
        </div>

        {equipment.description && !isEditing && (
          <div className="details-identity__about">
            <p
              ref={descriptionRef}
              className={`details-identity__description ${
                isClamped ? 'details-identity__description--clamped' : ''
              }`}
              style={isClamped ? { WebkitLineClamp: clampLines } : undefined}
            >
              {equipment.description}
              {isExpanded && (
                <button
                  type="button"
                  className="details-identity__more details-identity__more--inline"
                  aria-expanded
                  onClick={() => setIsExpanded(false)}
                >
                  {t.details.showLess}
                </button>
              )}
            </p>
            {isClamped && (
              <button
                type="button"
                className="details-identity__more"
                aria-expanded={false}
                onClick={() => setIsExpanded(true)}
              >
                {t.details.showMore}
              </button>
            )}
          </div>
        )}

        {!equipment.description && !isEditing && (
          <p className="details-identity__description details-identity__description--empty">
            {t.inventory.listDescriptionFallback}
          </p>
        )}

        {panel}
      </div>

      {!isEditing && aside}
    </section>
  )
}
