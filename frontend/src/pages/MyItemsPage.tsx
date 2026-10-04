import { useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { getMyCheckouts } from '../api/checkoutApi'
import { AssignedAssetsSection } from '../components/checkout/AssignedAssetsSection'
import { CheckoutHistorySection } from '../components/checkout/CheckoutHistorySection'
import { CheckoutStats } from '../components/checkout/CheckoutStats'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import type { CheckoutItem } from '../types/checkout'
import { getApiErrorMessage } from '../utils/apiErrors'

function MyItemsPage() {
  const { user } = useAuth()
  const { language, t } = useLanguage()
  const [checkouts, setCheckouts] = useState<CheckoutItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    async function loadCheckouts() {
      try {
        setErrorMessage('')
        const data = await getMyCheckouts()
        setCheckouts(data)
      } catch (error: unknown) {
        setErrorMessage(getApiErrorMessage(error, t.checkouts.loadError, language))
      } finally {
        setIsLoading(false)
      }
    }

    void loadCheckouts()
  }, [language, t.checkouts.loadError])

  const activeItems = useMemo(
    () => checkouts.filter((checkout) => !checkout.returnedAt),
    [checkouts],
  )
  const historyItems = useMemo(
    () => checkouts.filter((checkout) => !!checkout.returnedAt),
    [checkouts],
  )

  if (user?.role === 'Admin') {
    return <Navigate to="/users" replace />
  }

  if (isLoading) {
    return <div className="loading-state">{t.checkouts.loading}</div>
  }

  if (errorMessage) {
    return <p className="form-error">{errorMessage}</p>
  }

  return (
    <div className="page-shell">
      <section className="page-hero">
        <div className="page-hero__content">
          <h1 className="page-title">{t.myItems.heroTitle}</h1>
        </div>
      </section>

      <CheckoutStats active={activeItems} history={historyItems} />

      <AssignedAssetsSection
        items={activeItems}
        emptyTitle={t.myItems.currentEmptyTitle}
        emptyText={t.myItems.currentEmptyText}
        searchPlaceholder={t.myItems.currentSearchPlaceholder}
        queryKeyPrefix="current"
        enableWarningFilter
      />

      <CheckoutHistorySection
        items={historyItems}
        emptyTitle={t.myItems.historyEmptyTitle}
        emptyText={t.myItems.historyEmptyText}
        searchPlaceholder={t.myItems.historySearchPlaceholder}
        title={t.myItems.historyTitle}
        queryKeyPrefix="history"
      />
    </div>
  )
}

export default MyItemsPage
