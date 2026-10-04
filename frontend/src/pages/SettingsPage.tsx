import { SegmentedControl } from '../components/shared/SegmentedControl'
import { useAppearance } from '../context/AppearanceContext'
import { useLanguage } from '../context/LanguageContext'

function SettingsPage() {
  const { language, setLanguage, t } = useLanguage()
  const { appearance, setAppearance } = useAppearance()

  return (
    <div className="page-shell">
      <section className="page-hero">
        <div className="page-hero__content">
          <h1 className="page-title">{t.settings.heroTitle}</h1>
        </div>
      </section>

      <section className="section-card section-card--compact settings-card">
        <div className="section-heading section-heading--tight">
          <h2 className="section-heading__title">{t.settings.preferencesTitle}</h2>
        </div>

        <dl className="details-props__list">
          <div>
            <dt>{t.nav.language}</dt>
            <dd>
              <SegmentedControl
                compact
                label={t.nav.language}
                value={language}
                onChange={setLanguage}
                options={[
                  { value: 'hu', label: 'HU' },
                  { value: 'en', label: 'EN' },
                ]}
              />
            </dd>
          </div>
          <div>
            <dt>{t.nav.theme}</dt>
            <dd>
              <SegmentedControl
                compact
                label={t.nav.theme}
                value={appearance}
                onChange={setAppearance}
                options={[
                  { value: 'light', label: t.nav.lightMode },
                  { value: 'dark', label: t.nav.darkMode },
                ]}
              />
            </dd>
          </div>
        </dl>
      </section>
    </div>
  )
}

export default SettingsPage
