import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { signIn } from '../../lib/auth'
import Header from '../../components/Header'

function LoginForm() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await signIn(email, password)
    if (error) setError(error.message)
    setLoading(false)
  }

  return (
    <>
      <Header />
      <main className="page page-admin">
        <h1>{t('admin.title')}</h1>
        <form onSubmit={handleSubmit} className="form-login">
          <label>
            {t('login.emailLabel')}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label>
            {t('login.senhaLabel')}
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {error && <p role="alert">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? t('login.entrando') : t('login.entrar')}
          </button>
        </form>
      </main>
    </>
  )
}

export default LoginForm
