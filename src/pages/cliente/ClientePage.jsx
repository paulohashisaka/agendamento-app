import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { listServicos, nomeServico } from '../../lib/servicos'
import { listBarbeiros } from '../../lib/barbeiros'
import Header from '../../components/Header'
import AgendamentoForm from './AgendamentoForm'
import { useAuth } from '../../hooks/useAuth'
import logo from '../../assets/logo_exemplo.png'

const formatarPreco = (preco) =>
  new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(preco)

function ClientePage() {
  const { t, i18n } = useTranslation()
  const { session, perfil, loading: loadingAuth, erroPerfil } = useAuth()
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
                    <span>{nomeServico(servico, i18n.language)}</span>
                    <span>{t('common.minutes', { count: servico.duracao_minutos })}</span>
                    <span>{formatarPreco(servico.preco)}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section id="agendamento">
              {loadingAuth ? (
                <p>{t('common.loading')}</p>
              ) : !session ? (
                <div className="auth-gate">
                  <span className="auth-kicker">{t('auth.clientArea')}</span>
                  <h2>{t('cliente.loginRequiredTitle')}</h2>
                  <p>{t('cliente.loginRequiredBody')}</p>
                  <div className="auth-gate-actions">
                    <Link
                      className="botao-link"
                      to="/entrar"
                      state={{ from: '/#agendamento' }}
                    >
                      {t('header.login')}
                    </Link>
                    <Link className="botao-link botao-secundario" to="/cadastro">
                      {t('header.signup')}
                    </Link>
                  </div>
                </div>
              ) : perfil?.papel === 'admin' ? (
                <div className="auth-gate">
                  <h2>{t('cliente.adminAccountTitle')}</h2>
                  <p>{t('cliente.adminAccountBody')}</p>
                  <Link className="botao-link" to="/admin">
                    {t('cliente.goToAdmin')}
                  </Link>
                </div>
              ) : erroPerfil || !perfil ? (
                <p role="alert" className="mensagem-erro">
                  {t('cliente.profileError')}
                </p>
              ) : (
                <AgendamentoForm
                  servicos={servicos}
                  barbeiros={barbeiros}
                  perfil={perfil}
                />
              )}
            </section>
          </>
        )}
      </main>
    </>
  )
}

export default ClientePage
