import { useState } from 'react'
import { changePassword } from '../api/authApi'
import { FeedbackMessage } from '../components/shared/FeedbackMessage'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { getApiErrorMessage } from '../utils/apiErrors'
import { getApiMessage } from '../utils/apiMessages'
import { getRoleLabel } from '../utils/labels'

function ProfilePage() {
  const { user, updateToken } = useAuth()
  const { language, t } = useLanguage()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!user) {
    return null
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (newPassword !== confirmNewPassword) {
      setErrorMessage(t.profile.passwordMismatch)
      setSuccessMessage('')
      return
    }

    try {
      setIsSubmitting(true)
      setErrorMessage('')
      const response = await changePassword({
        currentPassword,
        newPassword,
        confirmNewPassword,
      })

      if (response.token) {
        updateToken(response.token)
      }

      setSuccessMessage(getApiMessage(response.code, language) ?? response.message)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmNewPassword('')
    } catch (error: unknown) {
      setErrorMessage(getApiErrorMessage(error, t.profile.passwordChangeError, language))
      setSuccessMessage('')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="page-shell">
      <section className="page-hero">
        <div className="page-hero__content">
          <h1 className="page-title">{t.profile.pageTitle}</h1>
        </div>
      </section>

      <section className="details-layout">
        <article className="section-card">
          <div className="section-heading section-heading--tight">
            <h2 className="section-heading__title">{t.profile.securityTitle}</h2>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-field">
              <label htmlFor="current-password">{t.profile.currentPasswordLabel}</label>
              <input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                placeholder={t.auth.passwordPlaceholder}
                autoComplete="current-password"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-field">
                <label htmlFor="new-password">{t.profile.newPasswordLabel}</label>
                <input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder={t.auth.minPasswordPlaceholder}
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="confirm-new-password">{t.profile.confirmNewPasswordLabel}</label>
                <input
                  id="confirm-new-password"
                  type="password"
                  value={confirmNewPassword}
                  onChange={(event) => setConfirmNewPassword(event.target.value)}
                  placeholder={t.auth.minPasswordPlaceholder}
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
              </div>
            </div>

            {errorMessage && <FeedbackMessage type="error" message={errorMessage} />}
            {successMessage && <FeedbackMessage type="success" message={successMessage} />}

            <div className="form-actions">
              <button type="submit" className="form-submit" disabled={isSubmitting}>
                {isSubmitting ? t.profile.passwordChangeSubmitting : t.profile.passwordChangeSubmit}
              </button>
            </div>
          </form>
        </article>

        <aside className="section-card section-card--compact">
          <div className="section-heading section-heading--tight">
            <h2 className="section-heading__title">{t.profile.accountTitle}</h2>
          </div>

          <dl className="details-props__list">
            <div>
              <dt>{t.profile.nameLabel}</dt>
              <dd>{user.name}</dd>
            </div>
            <div>
              <dt>{t.profile.emailLabel}</dt>
              <dd>{user.email}</dd>
            </div>
            <div>
              <dt>{t.profile.roleLabel}</dt>
              <dd>{getRoleLabel(user.role, language)}</dd>
            </div>
          </dl>
        </aside>
      </section>
    </div>
  )
}

export default ProfilePage
