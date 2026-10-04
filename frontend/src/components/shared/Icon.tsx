type IconKind =
  | 'details'
  | 'edit'
  | 'maintenance'
  | 'available'
  | 'delete'
  | 'close'
  | 'note'

export function Icon({ kind }: { kind: IconKind }) {
  switch (kind) {
    case 'note':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v9a1.5 1.5 0 0 1-1.5 1.5H11l-4.5 4v-4h-1A1.5 1.5 0 0 1 4 14.5Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      )
    case 'details':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      )
    case 'edit':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="m4 20 4.2-.8L19 8.4a1.9 1.9 0 0 0 0-2.7l-.7-.7a1.9 1.9 0 0 0-2.7 0L4.8 15.8 4 20Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="m13.8 6.8 3.4 3.4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      )
    case 'maintenance':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M20 6.2a4.1 4.1 0 0 1-5.6 3.8l-7.8 7.8a1.6 1.6 0 0 1-2.3 0l-.1-.1a1.6 1.6 0 0 1 0-2.3l7.8-7.8A4.1 4.1 0 0 1 17.8 4l-2.2 2.2 1.9 1.9L20 6.2Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
    case 'available':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="m5 12 4.2 4.2L19 6.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
    case 'delete':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M4 7h16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M9.5 4h5L15 7H9l.5-3Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M7 7l1 12h8l1-12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
    case 'close':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M6 6l12 12M18 6 6 18"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      )
  }
}
