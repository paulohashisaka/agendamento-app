import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { criarAgendamentoAdmin } from '../../lib/agendamentos'
import { hojeLocal as hoje } from '../../lib/dateUtils'
import { listHorariosDisponiveis } from '../../lib/horarios'
import { listServicos } from '../../lib/servicos'

function horarioAindaFuturo(horario) {
  return new Date(`${horario.data}T${horario.hora_inicio}`) > new Date()
}

function NovaReserva({ barbeiros, onReservaCriada }) {
  const { t } = useTranslation()
  const [aberto, setAberto] = useState(false)
  const [servicos, setServicos] = useState([])
  const [barbeiroId, setBarbeiroId] = useState('')
  const [servicoId, setServicoId] = useState('')
  const [data, setData] = useState(hoje())
  const [horarios, setHorarios] = useState([])
  const [horarioId, setHorarioId] = useState('')
  const [clienteNome, setClienteNome] = useState('')
  const [clienteTelefone, setClienteTelefone] = useState('')
  const [loadingHorarios, setLoadingHorarios] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState(null)
  const [sucesso, setSucesso] = useState(false)
  const requisicaoAtualRef = useRef(0)

  useEffect(() => {
    listServicos()
      .then((rows) => {
        setServicos(rows)
        setServicoId((atual) => atual || rows[0]?.id || '')
      })
      .catch((err) => setErro(err.message))
  }, [])

  useEffect(() => {
    if (!aberto) return

    const idRequisicao = ++requisicaoAtualRef.current
    setLoadingHorarios(true)
    setHorarioId('')
    setErro(null)

    listHorariosDisponiveis(data, barbeiroId || undefined)
      .then((rows) => {
        if (requisicaoAtualRef.current === idRequisicao) {
          setHorarios(rows.filter(horarioAindaFuturo))
        }
      })
      .catch((err) => {
        if (requisicaoAtualRef.current === idRequisicao) setErro(err.message)
      })
      .finally(() => {
        if (requisicaoAtualRef.current === idRequisicao) setLoadingHorarios(false)
      })
  }, [aberto, barbeiroId, data])

  function nomeBarbeiro(id) {
    return barbeiros.find((barbeiro) => barbeiro.id === id)?.nome ?? ''
  }

  function alternarFormulario() {
    setAberto((atual) => !atual)
    setErro(null)
    setSucesso(false)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setErro(null)
    setSucesso(false)
    setEnviando(true)

    try {
      await criarAgendamentoAdmin({
        horarioId,
        servicoId,
        clienteNome,
        clienteTelefone,
      })
      setSucesso(true)
      setClienteNome('')
      setClienteTelefone('')
      setHorarioId('')
      setHorarios((atuais) => atuais.filter((horario) => horario.id !== horarioId))
      onReservaCriada?.()
    } catch (err) {
      setErro(err.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <section className="nova-reserva-admin">
      <div className="nova-reserva-cabecalho">
        <div>
          <h2>{t('reservaAdmin.titulo')}</h2>
          <p>{t('reservaAdmin.descricao')}</p>
        </div>
        <button type="button" onClick={alternarFormulario}>
          {aberto ? t('reservaAdmin.fechar') : t('reservaAdmin.abrir')}
        </button>
      </div>

      {aberto && (
        <form className="form-agendamento form-reserva-admin" onSubmit={handleSubmit}>
          <div className="form-reserva-admin-grade">
            <label>
              {t('reservaAdmin.nomeCliente')}
              <input
                type="text"
                value={clienteNome}
                onChange={(event) => setClienteNome(event.target.value)}
                minLength={2}
                required
              />
            </label>

            <label>
              {t('reservaAdmin.telefoneCliente')}
              <input
                type="tel"
                value={clienteTelefone}
                onChange={(event) => setClienteTelefone(event.target.value)}
                minLength={8}
                required
              />
            </label>

            <label>
              {t('agendamento.barbeiroLabel')}
              <select value={barbeiroId} onChange={(event) => setBarbeiroId(event.target.value)}>
                <option value="">{t('agendamento.qualquerBarbeiro')}</option>
                {barbeiros.map((barbeiro) => (
                  <option key={barbeiro.id} value={barbeiro.id}>
                    {barbeiro.nome}
                  </option>
                ))}
              </select>
            </label>

            <label>
              {t('agendamento.servicoLabel')}
              <select
                value={servicoId}
                onChange={(event) => setServicoId(event.target.value)}
                required
              >
                {servicos.map((servico) => (
                  <option key={servico.id} value={servico.id}>
                    {servico.nome}
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
                onChange={(event) => setData(event.target.value)}
                required
              />
            </label>

            <label>
              {t('agendamento.horarioLabel')}
              {loadingHorarios ? (
                <span className="field-help">{t('agendamento.loadingHorarios')}</span>
              ) : horarios.length === 0 ? (
                <span className="field-help">{t('agendamento.semHorarios')}</span>
              ) : (
                <select
                  value={horarioId}
                  onChange={(event) => setHorarioId(event.target.value)}
                  required
                >
                  <option value="" disabled>
                    {t('common.select')}
                  </option>
                  {horarios.map((horario) => (
                    <option key={horario.id} value={horario.id}>
                      {t('agendamento.opcaoHorario', {
                        hora: horario.hora_inicio.slice(0, 5),
                        barbeiro: nomeBarbeiro(horario.barbeiro_id),
                      })}
                    </option>
                  ))}
                </select>
              )}
            </label>
          </div>

          {erro && (
            <p role="alert" className="mensagem-erro">
              {erro}
            </p>
          )}
          {sucesso && (
            <p role="status" className="mensagem-sucesso">
              {t('reservaAdmin.sucesso')}
            </p>
          )}

          <button type="submit" disabled={enviando || !horarioId || !servicoId}>
            {enviando ? t('reservaAdmin.salvando') : t('reservaAdmin.confirmar')}
          </button>
        </form>
      )}
    </section>
  )
}

export default NovaReserva
