import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import AuthShell from '../../components/AuthShell'
import { useAuth } from '../../hooks/useAuth'
import { atualizarSenha } from '../../lib/auth'

function RedefinirSenhaPage() {
  const { t } = useTranslation()
  const { session, loading } = useAuth()
  const [password, setPassword] = useState('')
  const [confirmarPassword, setConfirmarPassword] = useState('')
  const [error, setError] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [sucesso, setSucesso] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError(t('auth.passwordMinLength'))
      return
    }

    if (password !== confirmarPassword) {
      setError(t('auth.passwordMismatch'))
      return
    }

    setEnviando(true)
    const { error: authError } = await atualizarSenha(password)

    if (authError) {
      setError(t('auth.resetError'))
    } else {
      setSucesso(true)
    }

    setEnviando(false)
  }

  if (loading) {
    return (
      <AuthShell>
        <p>{t('common.loading')}</p>
      </AuthShell>
    )
  }

  if (!session) {
    return (
      <AuthShell>
        <div className="auth-feedback">
          <h1>{t('auth.invalidLinkTitle')}</h1>
          <p>{t('auth.invalidLinkBody')}</p>
          <Link className="botao-link" to="/recuperar-senha">
            {t('auth.requestNewLink')}
          </Link>
        </div>
      </AuthShell>
    )
  }

  if (sucesso) {
    return (
      <AuthShell>
        <div className="auth-feedback">
          <span className="auth-feedback-icon" aria-hidden="true">✓</span>
          <h1>{t('auth.resetSuccessTitle')}</h1>
          <p>{t('auth.resetSuccessBody')}</p>
          <Link className="botao-link" to="/minha-conta">
            {t('auth.goToAccount')}
          </Link>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <div className="auth-heading">
        <h1>{t('auth.resetTitle')}</h1>
        <p>{t('auth.resetSubtitle')}</p>
      </div>

      <form className="form-login" onSubmit={handleSubmit}>
        <label>
          {t('auth.newPasswordLabel')}
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            minLength="6"
            required
          />
        </label>

        <label>
          {t('auth.confirmPasswordLabel')}
          <input
            type="password"
            value={confirmarPassword}
            onChange={(event) => setConfirmarPassword(event.target.value)}
            autoComplete="new-password"
            minLength="6"
            required
          />
        </label>

        {error && <p role="alert" className="mensagem-erro">{error}</p>}

        <button type="submit" disabled={enviando}>
          {enviando ? t('auth.updatingPassword') : t('auth.updatePassword')}
        </button>
      </form>
    </AuthShell>
  )
}

export default RedefinirSenhaPage
