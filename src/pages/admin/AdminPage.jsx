import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../hooks/useAuth'
import { signOut } from '../../lib/auth'
import { listBarbeiros } from '../../lib/barbeiros'
import Header from '../../components/Header'
import LoginForm from './LoginForm'
import ServicosManager from './ServicosManager'
import GerarHorarios from './GerarHorarios'
import Agenda from './Agenda'
import NovaReserva from './NovaReserva'

function AdminPage() {
  const { t } = useTranslation()
  const { session, perfil, loading, erroPerfil } = useAuth()
  const [barbeiros, setBarbeiros] = useState([])
  const [agendaVersao, setAgendaVersao] = useState(0)

  useEffect(() => {
    if (perfil?.papel === 'admin') listBarbeiros().then(setBarbeiros)
  }, [perfil])

  if (loading) {
    return (
      <>
        <Header />
        <main className="page page-admin">
          <p>{t('admin.loading')}</p>
        </main>
      </>
    )
  }

  if (!session) {
    return <LoginForm />
  }

  if (perfil?.papel !== 'admin') {
    return (
      <>
        <Header />
        <main className="page page-admin">
          <section className="auth-card acesso-restrito">
            <h1>{t('auth.restrictedTitle')}</h1>
            <p>{erroPerfil ? t('auth.profileError') : t('auth.restrictedBody')}</p>
            <div className="conta-acoes">
              <Link className="botao-link" to="/minha-conta">
                {t('auth.goToAccount')}
              </Link>
              <button type="button" className="botao-secundario" onClick={() => signOut()}>
                {t('header.logout')}
              </button>
            </div>
          </section>
        </main>
      </>
    )
  }

  return (
    <>
      <Header />
      <main className="page page-admin">
        <header className="admin-header">
          <h1>{t('admin.title')}</h1>
          <button type="button" onClick={() => signOut()}>
            {t('admin.logout')}
          </button>
        </header>

        <NovaReserva
          barbeiros={barbeiros}
          onReservaCriada={() => setAgendaVersao((versao) => versao + 1)}
        />
        <Agenda barbeiros={barbeiros} refreshKey={agendaVersao} />
        <GerarHorarios barbeiros={barbeiros} />
        <ServicosManager />
      </main>
    </>
  )
}

export default AdminPage
