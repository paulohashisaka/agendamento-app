import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { listServicos } from '../../lib/servicos'
import { listBarbeiros } from '../../lib/barbeiros'
import Header from '../../components/Header'
import AgendamentoForm from './AgendamentoForm'
import logo from '../../assets/logo_exemplo.png'

const formatarPreco = (preco) =>
  new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(preco)

function ClientePage() {
  const { t } = useTranslation()
  const location = useLocation()
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

  useEffect(() => {
    if (!location.hash || loading) return
    document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: 'smooth' })
  }, [location.hash, loading])

  return (
    <>
      <Header />

      <main className="page page-cliente">
        <section className="hero">
          <img src={logo} alt={t('header.logoAlt')} className="hero-logo" />
          <h1>{t('cliente.title')}</h1>
          <p>{t('cliente.subtitle')}</p>
          <div className="ornament-divider">
            <span />
          </div>
        </section>

        {loading && <p>{t('common.loading')}</p>}
        {error && <p role="alert">{t('cliente.errorLoading', { error })}</p>}

        {!loading && !error && (
          <>
            <section id="servicos" className="secao-servicos">
              <h2>{t('servicos.titulo')}</h2>
              <ul className="lista-servicos">
                {servicos.map((servico) => (
                  <li key={servico.id}>
                    <span>{servico.nome}</span>
                    <span>{t('common.minutes', { count: servico.duracao_minutos })}</span>
                    <span>{formatarPreco(servico.preco)}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section id="agendamento">
              <AgendamentoForm servicos={servicos} barbeiros={barbeiros} />
            </section>
          </>
        )}
      </main>
    </>
  )
}

export default ClientePage
