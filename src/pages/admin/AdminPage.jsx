import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSession } from '../../hooks/useSession'
import { signOut } from '../../lib/auth'
import { listBarbeiros } from '../../lib/barbeiros'
import LoginForm from './LoginForm'
import ServicosManager from './ServicosManager'
import GerarHorarios from './GerarHorarios'
import Agenda from './Agenda'

function AdminPage() {
  const { t } = useTranslation()
  const session = useSession()
  const [barbeiros, setBarbeiros] = useState([])

  useEffect(() => {
    if (session) listBarbeiros().then(setBarbeiros)
  }, [session])

  if (session === undefined) {
    return (
      <main className="page page-admin">
        <p>{t('admin.loading')}</p>
      </main>
    )
  }

  if (!session) {
    return <LoginForm />
  }

  return (
    <main className="page page-admin">
      <header className="admin-header">
        <h1>{t('admin.title')}</h1>
        <button type="button" onClick={() => signOut()}>
          {t('admin.logout')}
        </button>
      </header>

      <Agenda barbeiros={barbeiros} />
      <GerarHorarios barbeiros={barbeiros} />
      <ServicosManager />
    </main>
  )
}

export default AdminPage
