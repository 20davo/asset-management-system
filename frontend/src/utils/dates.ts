import type { Language } from '../context/LanguageContext'
import { copy } from '../locales/copy'

function getLocale(language: Language) {
  return language === 'en' ? 'en-US' : 'hu-HU'
}

const dateFormats = {
  date: { year: 'numeric', month: 'short', day: 'numeric' },
  dateTime: { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' },
  time: { hour: '2-digit', minute: '2-digit' },
} satisfies Record<string, Intl.DateTimeFormatOptions>

const formatters = new Map<string, Intl.DateTimeFormat>()

// Building a formatter is slow, and every list row formats several dates.
function getFormatter(language: Language, format: keyof typeof dateFormats) {
  const key = `${language}:${format}`
  let formatter = formatters.get(key)

  if (!formatter) {
    formatter = new Intl.DateTimeFormat(getLocale(language), dateFormats[format])
    formatters.set(key, formatter)
  }

  return formatter
}

export function formatDate(value: string, language: Language = 'hu') {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return copy[language].common.unknownDate
  }

  return getFormatter(language, 'date').format(date)
}

export function formatDateTime(value: string, language: Language = 'hu') {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return copy[language].common.unknownDateTime
  }

  return getFormatter(language, 'dateTime').format(date)
}

export function formatTime(value: string, language: Language = 'hu') {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return getFormatter(language, 'time').format(date)
}
