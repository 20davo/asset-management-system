import { useLanguage } from '../../context/LanguageContext'
import { formatDate, formatTime } from '../../utils/dates'

export function DateTimeValue({ value }: { value: string }) {
  const { language } = useLanguage()

  return (
    <>
      <span className="data-list__date">{formatDate(value, language)}</span>
      <span className="data-list__time">{formatTime(value, language)}</span>
    </>
  )
}
