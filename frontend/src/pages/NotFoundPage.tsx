import { useLanguage } from '../context/LanguageContext'

function NotFoundPage() {
  const { t } = useLanguage()

  return (
    <div className="page-shell">
      <section className="empty-state">
        <span className="section-heading__eyebrow">{t.notFound.kicker}</span>
        <h1 className="page-title">{t.notFound.title}</h1>
        <p>{t.notFound.text}</p>
      </section>
    </div>
  )
}

export default NotFoundPage
