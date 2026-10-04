import { useLanguage } from '../../context/LanguageContext'
import type { WarningFilter } from '../../utils/checkoutDeadlines'

interface WarningFilterSelectProps {
  id: string
  onChange: (value: WarningFilter) => void
  value: WarningFilter
}

export function WarningFilterSelect({ id, onChange, value }: WarningFilterSelectProps) {
  const { t } = useLanguage()

  return (
    <div className="form-field">
      <label className="visually-hidden" htmlFor={id}>
        {t.common.warningFilterLabel}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value as WarningFilter)}
      >
        <option value="all">{t.common.allWarnings}</option>
        <option value="none">{t.common.noWarning}</option>
        <option value="dueSoon">{t.common.warningDueSoon}</option>
        <option value="overdue">{t.common.warningOverdue}</option>
      </select>
    </div>
  )
}
