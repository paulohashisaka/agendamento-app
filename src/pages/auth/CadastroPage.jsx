import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import AuthShell from '../../components/AuthShell'
import { signUp } from '../../lib/auth'

function CadastroPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    nome: '',
    telefone: '',
    email: '',
    password: '',
    confirmarPassword: '',
  })
  const [error, setError] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [aguardandoEmail, setAguardandoEmail] = useState(false)

  function atualizarCampo(campo, valor) {
    setForm((atual) => ({ ...atual, [campo]: valor }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)

    if (form.password.length < 6) {
      setError(t('auth.passwordMinLength'))
      return
    }

    if (form.password !== form.confirmarPassword) {
      setError(t('auth.passwordMismatch'))
      return
    }

    setEnviando(true)

    const { data, error: authError } = await signUp({
      nome: form.nome,
      telefone: form.telefone,
      email: form.email.trim(),
      password: form.password,
    })

    if (authError) {
      setError(t('auth.signupError'))
    } else if (data.session) {
      navigate('/minha-conta', { replace: true })
    } else {
      setAguardandoEmail(true)
    }

    setEnviando(false)
  }

  if (aguardandoEmail) {
    return (
      <AuthShell>
        <div className="auth-feedback">
          <span className="auth-feedback-icon" aria-hidden="true">✉</span>
          <h1>{t('auth.checkEmailTitle')}</h1>
          <p>{t('auth.checkEmailBody', { email: form.email })}</p>
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
        <span className="auth-kicker">{t('auth.clientArea')}</span>
        <h1>{t('auth.signupTitle')}</h1>
        <p>{t('auth.signupSubtitle')}</p>
      </div>

      <form className="form-login" onSubmit={handleSubmit}>
        <label>
          {t('auth.nameLabel')}
          <input
            type="text"
            value={form.nome}
            onChange={(event) => atualizarCampo('nome', event.target.value)}
            autoComplete="name"
            minLength="2"
            required
          />
        </label>

        <label>
          {t('auth.phoneLabel')}
          <input
            type="tel"
            value={form.telefone}
            onChange={(event) => atualizarCampo('telefone', event.target.value)}
            autoComplete="tel"
            minLength="8"
            required
          />
        </label>

        <label>
          {t('auth.emailLabel')}
          <input
            type="email"
            value={form.email}
            onChange={(event) => atualizarCampo('email', event.target.value)}
            autoComplete="email"
            required
          />
        </label>

        <label>
          {t('auth.passwordLabel')}
          <input
            type="password"
            value={form.password}
            onChange={(event) => atualizarCampo('password', event.target.value)}
            autoComplete="new-password"
            minLength="6"
            required
          />
          <span className="field-help">{t('auth.passwordHelp')}</span>
        </label>

        <label>
          {t('auth.confirmPasswordLabel')}
          <input
            type="password"
            value={form.confirmarPassword}
            onChange={(event) => atualizarCampo('confirmarPassword', event.target.value)}
            autoComplete="new-password"
            minLength="6"
            required
          />
        </label>

        {error && <p role="alert" className="mensagem-erro">{error}</p>}

        <button type="submit" disabled={enviando}>
          {enviando ? t('auth.signingUp') : t('auth.signupButton')}
        </button>
      </form>

      <p className="auth-switch">
        {t('auth.hasAccount')}{' '}
        <Link to="/entrar">{t('auth.loginLink')}</Link>
      </p>
    </AuthShell>
  )
}

export default CadastroPage
