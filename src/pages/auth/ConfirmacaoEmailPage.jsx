import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import AuthShell from '../../components/AuthShell'
import { useAuth } from '../../hooks/useAuth'

function getErroConfirmacao() {
  const query = new URLSearchParams(window.location.search)
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))

  return query.get('error_description') || hash.get('error_description')
}

function ConfirmacaoEmailPage() {
  const { t } = useTranslation()
  const { session, loading } = useAuth()
  const erroConfirmacao = getErroConfirmacao()

  if (loading && !erroConfirmacao) {
    return (
      <AuthShell>
        <div className="auth-feedback auth-confirmation">
          <span className="auth-feedback-icon auth-feedback-loading" aria-hidden="true">◆</span>
          <span className="auth-kicker">{t('auth.emailConfirmationKicker')}</span>
          <h1>{t('auth.confirmingEmailTitle')}</h1>
          <p>{t('auth.confirmingEmailBody')}</p>
        </div>
      </AuthShell>
    )
  }

  if (session && !erroConfirmacao) {
    return (
      <AuthShell>
        <div className="auth-feedback auth-confirmation">
          <span className="auth-feedback-icon auth-feedback-success" aria-hidden="true">✓</span>
          <span className="auth-kicker">{t('auth.emailConfirmationKicker')}</span>
          <h1>{t('auth.emailConfirmedTitle')}</h1>
          <p>{t('auth.emailConfirmedBody')}</p>
          <Link className="botao-link" to="/minha-conta">
            {t('auth.startBooking')}
          </Link>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <div className="auth-feedback auth-confirmation">
        <span className="auth-feedback-icon auth-feedback-error" aria-hidden="true">!</span>
        <span className="auth-kicker">{t('auth.emailConfirmationKicker')}</span>
        <h1>{t('auth.confirmationFailedTitle')}</h1>
        <p>{t('auth.confirmationFailedBody')}</p>
        <Link className="botao-link" to="/entrar">
          {t('auth.backToLogin')}
        </Link>
      </div>
    </AuthShell>
  )
}

export default ConfirmacaoEmailPage
