import { useSyncExternalStore } from 'react'
import { getConnectionStatus, subscribeToConnectionStatus } from '../../api/connectionStatus'
import { useLanguage } from '../../context/LanguageContext'

export function ConnectionNotice() {
  const { t } = useLanguage()
  const status = useSyncExternalStore(subscribeToConnectionStatus, getConnectionStatus)

  if (status === 'ok') {
    return null
  }

  return (
    <p
      className={status === 'waking' ? 'form-info' : 'form-error'}
      role="status"
      aria-live="polite"
    >
      {status === 'waking' ? t.common.serverWaking : t.common.serverUnreachable}
    </p>
  )
}
