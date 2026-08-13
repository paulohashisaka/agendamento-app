import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cancelarAgendamento, listMeusAgendamentos } from '../lib/agendamentos'
import { formatarDataExibicao } from '../lib/dateUtils'
import { nomeServico } from '../lib/servicos'

function MeusAgendamentos() {
  const { t, i18n } = useTranslation()
  const [agendamentos, setAgendamentos] = useState([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState(null)
  const [confirmandoId, setConfirmandoId] = useState(null)
  const [cancelandoId, setCancelandoId] = useState(null)

  async function carregar() {
    setLoading(true)
    setErro(null)

    try {
      setAgendamentos(await listMeusAgendamentos())
    } catch (error) {
      setErro(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  async function handleCancelar(id) {
    setCancelandoId(id)
    setErro(null)

    try {
      await cancelarAgendamento(id)
      setConfirmandoId(null)
      await carregar()
    } catch (error) {
      setErro(error.message)
    } finally {
      setCancelandoId(null)
    }
  }

  if (loading) return <p>{t('conta.loadingAppointments')}</p>

  if (erro) return <p role="alert" className="mensagem-erro">{erro}</p>

  if (agendamentos.length === 0) {
    return <p className="lista-vazia">{t('conta.emptyAppointments')}</p>
  }

  return (
    <ul className="meus-agendamentos">
      {agendamentos.map((agendamento) => {
        const confirmado = agendamento.status === 'confirmado'
        const dataFormatada = formatarDataExibicao(agendamento.horarios.data, i18n.language)

        return (
          <li key={agendamento.id} className={!confirmado ? 'agendamento-cancelado' : undefined}>
            <div className="agendamento-card-topo">
              <span className="agendamento-data">{dataFormatada}</span>
              <span className={`status-badge status-badge--${agendamento.status}`}>
                {t(`conta.status.${agendamento.status}`)}
              </span>
            </div>

            <strong>{nomeServico(agendamento.servicos, i18n.language)}</strong>

            <dl className="agendamento-detalhes">
              <div>
                <dt>{t('conta.timeLabel')}</dt>
                <dd>{agendamento.horarios.hora_inicio.slice(0, 5)}</dd>
              </div>
              <div>
                <dt>{t('conta.barberLabel')}</dt>
                <dd>{agendamento.barbeiros.nome}</dd>
              </div>
            </dl>

            {confirmado && confirmandoId !== agendamento.id && (
              <button
                type="button"
                className="botao-secundario botao-cancelar-agendamento"
                onClick={() => setConfirmandoId(agendamento.id)}
              >
                {t('conta.cancelAppointment')}
              </button>
            )}

            {confirmado && confirmandoId === agendamento.id && (
              <div className="confirmacao-cancelamento">
                <p>{t('conta.cancelConfirmation')}</p>
                <div>
                  <button
                    type="button"
                    onClick={() => handleCancelar(agendamento.id)}
                    disabled={cancelandoId === agendamento.id}
                  >
                    {cancelandoId === agendamento.id
                      ? t('conta.cancelling')
                      : t('conta.confirmCancel')}
                  </button>
                  <button
                    type="button"
                    className="botao-secundario"
                    onClick={() => setConfirmandoId(null)}
                    disabled={cancelandoId === agendamento.id}
                  >
                    {t('common.back')}
                  </button>
                </div>
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}

export default MeusAgendamentos
