import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import AuthShell from '../../components/AuthShell'
import { useAuth } from '../../hooks/useAuth'
import { signIn, signOut } from '../../lib/auth'

function LoginPage() {
  const { t } = useTranslation()
  const { session, perfil, loading, erroPerfil } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    if (loading || !session || !perfil) return

    const destino =
      perfil.papel === 'admin' ? '/admin' : (location.state?.from ?? '/minha-conta')
    navigate(destino, { replace: true })
  }, [loading, location.state, navigate, perfil, session])

  async function handleSubmit(event) {
    event.preventDefault()
    setEnviando(true)
    setError(null)

    const { error: authError } = await signIn(email.trim(), password)
    if (authError) setError(t('auth.loginError'))

    setEnviando(false)
  }

  if (!loading && session && !perfil) {
    return (
      <AuthShell>
        <div className="auth-feedback">
          <h1>{t('auth.profileLoadTitle')}</h1>
          <p>{erroPerfil || t('auth.profileLoadBody')}</p>
          <button type="button" className="botao-secundario" onClick={() => signOut()}>
            {t('header.logout')}
          </button>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <div className="auth-heading">
        <span className="auth-kicker">{t('auth.clientArea')}</span>
        <h1>{t('auth.loginTitle')}</h1>
        <p>{t('auth.loginSubtitle')}</p>
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

        <label>
          {t('auth.passwordLabel')}
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        <Link className="auth-inline-link" to="/recuperar-senha">
          {t('auth.forgotPassword')}
        </Link>

        {error && <p role="alert" className="mensagem-erro">{error}</p>}

        <button type="submit" disabled={enviando}>
          {enviando ? t('auth.loggingIn') : t('auth.loginButton')}
        </button>
      </form>

      <p className="auth-switch">
        {t('auth.noAccount')}{' '}
        <Link to="/cadastro">{t('auth.createAccountLink')}</Link>
      </p>
    </AuthShell>
  )
}

export default LoginPage
