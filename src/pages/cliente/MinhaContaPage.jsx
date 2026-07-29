import { Link, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Header from '../../components/Header'
import MeusAgendamentos from '../../components/MeusAgendamentos'
import { useAuth } from '../../hooks/useAuth'
import { signOut } from '../../lib/auth'

function MinhaContaPage() {
  const { t } = useTranslation()
  const { session, perfil, loading, erroPerfil } = useAuth()

  if (loading) {
    return (
      <>
        <Header />
        <main className="page">
          <p>{t('common.loading')}</p>
        </main>
      </>
    )
  }

  if (!session) {
    return <Navigate to="/entrar" state={{ from: '/minha-conta' }} replace />
  }

  if (perfil?.papel === 'admin') {
    return <Navigate to="/admin" replace />
  }

  if (!perfil) {
    return (
      <>
        <Header />
        <main className="page">
          <section className="auth-card acesso-restrito">
            <h1>{t('auth.profileLoadTitle')}</h1>
            <p className="mensagem-erro">{erroPerfil || t('auth.profileLoadBody')}</p>
            <button type="button" className="botao-secundario" onClick={() => signOut()}>
              {t('header.logout')}
            </button>
          </section>
        </main>
      </>
    )
  }

  return (
    <>
      <Header />
      <main className="page page-conta">
        <section className="conta-resumo">
          <span className="auth-kicker">{t('auth.clientArea')}</span>
          <h1>{t('conta.greeting', { name: perfil?.nome })}</h1>
          <p>{t('conta.subtitle')}</p>

          <dl className="perfil-dados">
            <div>
              <dt>{t('conta.emailLabel')}</dt>
              <dd>{session.user.email}</dd>
            </div>
            <div>
              <dt>{t('conta.phoneLabel')}</dt>
              <dd>{perfil?.telefone}</dd>
            </div>
          </dl>

          <div className="conta-acoes">
            <Link className="botao-link" to="/#agendamento">
              {t('conta.bookButton')}
            </Link>
            <button type="button" className="botao-secundario" onClick={() => signOut()}>
              {t('conta.logoutButton')}
            </button>
          </div>
        </section>

        <section className="conta-agendamentos">
          <h2>{t('conta.appointmentsTitle')}</h2>
          <p>{t('conta.appointmentsSubtitle')}</p>
          <MeusAgendamentos />
        </section>
      </main>
    </>
  )
}

export default MinhaContaPage
