import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import AuthShell from '../../components/AuthShell'
import { enviarRecuperacaoSenha } from '../../lib/auth'

function RecuperarSenhaPage() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [error, setError] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setEnviando(true)
    setError(null)

    const { error: authError } = await enviarRecuperacaoSenha(email.trim())
    if (authError) {
      setError(t('auth.recoveryError'))
    } else {
      setEnviado(true)
    }

    setEnviando(false)
  }

  if (enviado) {
    return (
      <AuthShell>
        <div className="auth-feedback">
          <span className="auth-feedback-icon" aria-hidden="true">✉</span>
          <h1>{t('auth.recoverySentTitle')}</h1>
          <p>{t('auth.recoverySentBody')}</p>
          <Link className="botao-link" to="/entrar">
            {t('auth.backToLogin')}
          </Link>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <div className="auth-heading">
        <h1>{t('auth.recoveryTitle')}</h1>
        <p>{t('auth.recoverySubtitle')}</p>
      </div>

      <form className="form-login" onSubmit={handleSubmit}>
        <label>
          {t('auth.emailLabel')}
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
        </label>

        {error && <p role="alert" className="mensagem-erro">{error}</p>}

        <button type="submit" disabled={enviando}>
          {enviando ? t('auth.sendingRecovery') : t('auth.sendRecovery')}
        </button>
      </form>

      <p className="auth-switch">
        <Link to="/entrar">{t('auth.backToLogin')}</Link>
      </p>
    </AuthShell>
  )
}

export default RecuperarSenhaPage
