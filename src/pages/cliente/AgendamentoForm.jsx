import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { listHorariosDisponiveis } from '../../lib/horarios'
import { criarAgendamento } from '../../lib/agendamentos'
import { hojeLocal as hoje, formatarDataExibicao } from '../../lib/dateUtils'
import { gerarLinkWhatsapp } from '../../lib/whatsapp'
import { nomeServico } from '../../lib/servicos'

function AgendamentoForm({ servicos, barbeiros, perfil }) {
  const { t, i18n } = useTranslation()
  const [barbeiroId, setBarbeiroId] = useState('')
  const [servicoId, setServicoId] = useState(servicos[0]?.id ?? '')
  const [data, setData] = useState(hoje())
  const [horarios, setHorarios] = useState([])
  const [horarioId, setHorarioId] = useState('')
  const [loadingHorarios, setLoadingHorarios] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState(null)
  const [confirmado, setConfirmado] = useState(null)

  // evita que uma resposta antiga (de uma data/barbeiro já trocados) sobrescreva
  // a lista de horários atual — só a última requisição disparada é aplicada
  const requisicaoAtualRef = useRef(0)

  function nomeBarbeiro(id) {
    return barbeiros.find((b) => b.id === id)?.nome ?? ''
  }

  function recarregarHorarios() {
    const idRequisicao = ++requisicaoAtualRef.current
    setLoadingHorarios(true)
    setHorarioId('')
    return listHorariosDisponiveis(data, barbeiroId || undefined)
      .then((rows) => {
        if (requisicaoAtualRef.current === idRequisicao) setHorarios(rows)
      })
      .catch((err) => {
        if (requisicaoAtualRef.current === idRequisicao) setErro(err.message)
      })
      .finally(() => {
        if (requisicaoAtualRef.current === idRequisicao) setLoadingHorarios(false)
      })
  }

  useEffect(() => {
    recarregarHorarios()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, barbeiroId])

  async function handleSubmit(e) {
    e.preventDefault()
    setErro(null)
    setEnviando(true)

    const horario = horarios.find((h) => h.id === horarioId)

    try {
      await criarAgendamento({ horarioId, servicoId })
      setConfirmado({
        servicoNome: nomeServico(
          servicos.find((s) => s.id === servicoId),
          i18n.language
        ),
        barbeiroNome: nomeBarbeiro(horario?.barbeiro_id),
        data: horario?.data ?? data,
        horaInicio: horario?.hora_inicio,
        clienteNome: perfil.nome,
        clienteTelefone: perfil.telefone,
      })
    } catch (err) {
      setErro(err.message)
      recarregarHorarios()
    } finally {
      setEnviando(false)
    }
  }

  if (confirmado) {
    const dataFormatada = formatarDataExibicao(confirmado.data, i18n.language)
    const horaFormatada = confirmado.horaInicio?.slice(0, 5)
    const linkWhatsapp = gerarLinkWhatsapp(
      t('whatsapp.mensagem', {
        servico: confirmado.servicoNome,
        barbeiro: confirmado.barbeiroNome,
        data: dataFormatada,
        hora: horaFormatada,
        nome: confirmado.clienteNome,
        telefone: confirmado.clienteTelefone,
      })
    )

    return (
      <section className="agendamento-confirmado">
        <h2>{t('agendamento.confirmadoTitulo')}</h2>
        <p>
          {t('agendamento.confirmadoResumo', {
            servico: confirmado.servicoNome,
            barbeiro: confirmado.barbeiroNome,
          })}
        </p>
        <p>
          {t('agendamento.confirmadoDataHora', {
            data: dataFormatada,
            hora: horaFormatada,
          })}
        </p>
        <a className="botao-whatsapp" href={linkWhatsapp} target="_blank" rel="noopener noreferrer">
          {t('whatsapp.enviar')}
        </a>
      </section>
    )
  }

  return (
    <form className="form-agendamento" onSubmit={handleSubmit}>
      <h2>{t('agendamento.formTitle')}</h2>

      <label>
        {t('agendamento.barbeiroLabel')}
        <select value={barbeiroId} onChange={(e) => setBarbeiroId(e.target.value)}>
          <option value="">{t('agendamento.qualquerBarbeiro')}</option>
          {barbeiros.map((b) => (
            <option key={b.id} value={b.id}>
              {b.nome}
            </option>
          ))}
        </select>
      </label>

      <label>
        {t('agendamento.servicoLabel')}
        <select value={servicoId} onChange={(e) => setServicoId(e.target.value)} required>
          {servicos.map((s) => (
            <option key={s.id} value={s.id}>
              {nomeServico(s, i18n.language)}
            </option>
          ))}
        </select>
      </label>

      <label>
        {t('agendamento.dataLabel')}
        <input
          type="date"
          value={data}
          min={hoje()}
          onChange={(e) => setData(e.target.value)}
          required
        />
      </label>

      <label>
        {t('agendamento.horarioLabel')}
        {loadingHorarios ? (
          <p>{t('agendamento.loadingHorarios')}</p>
        ) : horarios.length === 0 ? (
          <p>{t('agendamento.semHorarios')}</p>
        ) : (
          <select value={horarioId} onChange={(e) => setHorarioId(e.target.value)} required>
            <option value="" disabled>
              {t('common.select')}
            </option>
            {horarios.map((h) => (
              <option key={h.id} value={h.id}>
                {t('agendamento.opcaoHorario', {
                  hora: h.hora_inicio.slice(0, 5),
                  barbeiro: nomeBarbeiro(h.barbeiro_id),
                })}
              </option>
            ))}
          </select>
        )}
      </label>

      <div className="dados-cliente-agendamento">
        <span>{t('agendamento.bookingFor')}</span>
        <strong>{perfil.nome}</strong>
        <small>{perfil.telefone}</small>
      </div>

      {erro && <p role="alert">{erro}</p>}

      <button type="submit" disabled={enviando || !horarioId}>
        {enviando ? t('agendamento.confirmando') : t('agendamento.confirmar')}
      </button>
    </form>
  )
}

export default AgendamentoForm
