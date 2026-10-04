import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'

function NotFoundPage() {
  const { t } = useLanguage()

  return (
    <div className="page-shell">
      <section className="not-found">
        <span className="not-found__code" aria-hidden="true">404</span>
        <h1 className="page-title">{t.notFound.title}</h1>
        <p className="not-found__text">{t.notFound.text}</p>
        <Link to="/" className="button-link button-secondary button-form not-found__link">
          {t.notFound.backLink}
        </Link>
      </section>
    </div>
  )
}

export default NotFoundPage
