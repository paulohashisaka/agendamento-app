import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { listServicos } from '../../lib/servicos'
import { listBarbeiros } from '../../lib/barbeiros'
import AgendamentoForm from './AgendamentoForm'

const formatarPreco = (preco) =>
  new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(preco)

function ClientePage() {
  const { t } = useTranslation()
  const [servicos, setServicos] = useState([])
  const [barbeiros, setBarbeiros] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([listServicos(), listBarbeiros()])
      .then(([listaServicos, listaBarbeiros]) => {
        setServicos(listaServicos)
        setBarbeiros(listaBarbeiros)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <main className="page page-cliente">
      <h1>{t('cliente.title')}</h1>
      <p>{t('cliente.subtitle')}</p>

      {loading && <p>{t('common.loading')}</p>}
      {error && <p role="alert">{t('cliente.errorLoading', { error })}</p>}

      {!loading && !error && (
        <>
          <ul className="lista-servicos">
            {servicos.map((servico) => (
              <li key={servico.id}>
                <span>{servico.nome}</span>
                <span>{t('common.minutes', { count: servico.duracao_minutos })}</span>
                <span>{formatarPreco(servico.preco)}</span>
              </li>
            ))}
          </ul>

          <AgendamentoForm servicos={servicos} barbeiros={barbeiros} />
        </>
      )}
    </main>
  )
}

export default ClientePage
