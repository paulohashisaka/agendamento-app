import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { listAgendamentos, cancelarAgendamento } from '../../lib/agendamentos'
import { hojeLocal as hoje } from '../../lib/dateUtils'

function Agenda({ barbeiros, refreshKey = 0 }) {
  const { t } = useTranslation()
  const [barbeiroId, setBarbeiroId] = useState('')
  const [data, setData] = useState(hoje())
  const [agendamentos, setAgendamentos] = useState([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState(null)

  // evita que uma resposta antiga (de um filtro já trocado) sobrescreva a lista atual
  const requisicaoAtualRef = useRef(0)

  async function reload() {
    const idRequisicao = ++requisicaoAtualRef.current
    setLoading(true)
    try {
      const rows = await listAgendamentos({ barbeiroId: barbeiroId || undefined, data })
      if (requisicaoAtualRef.current === idRequisicao) setAgendamentos(rows)
    } catch (err) {
      if (requisicaoAtualRef.current === idRequisicao) setErro(err.message)
    } finally {
      if (requisicaoAtualRef.current === idRequisicao) setLoading(false)
    }
  }

  useEffect(() => {
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [barbeiroId, data, refreshKey])

  function nomeBarbeiro(id) {
    return barbeiros.find((b) => b.id === id)?.nome ?? ''
  }

  async function handleCancelar(id) {
    try {
      await cancelarAgendamento(id)
      await reload()
    } catch (err) {
      setErro(err.message)
    }
  }

  return (
    <section className="agenda">
      <h2>{t('agenda.titulo')}</h2>
      <div className="agenda-filtros">
        <select value={barbeiroId} onChange={(e) => setBarbeiroId(e.target.value)}>
          <option value="">{t('agenda.todosBarbeiros')}</option>
          {barbeiros.map((b) => (
            <option key={b.id} value={b.id}>
              {b.nome}
            </option>
          ))}
        </select>
        <input type="date" value={data} onChange={(e) => setData(e.target.value)} />
      </div>

      {erro && <p role="alert">{erro}</p>}

      {loading ? (
        <p>{t('agenda.loading')}</p>
      ) : agendamentos.length === 0 ? (
        <p>{t('agenda.vazio')}</p>
      ) : (
        <ul className="lista-servicos">
          {agendamentos.map((a) => (
            <li key={a.id}>
              <div className="lista-servicos-info">
                <span>{a.horarios.hora_inicio.slice(0, 5)}</span>
                <span>{a.servicos.nome}</span>
                <span>{nomeBarbeiro(a.barbeiro_id)}</span>
                <span>{a.cliente_nome}</span>
                {a.criado_por_admin && (
                  <span className="agenda-origem">{t('agenda.criadoPeloBarbeiro')}</span>
                )}
              </div>
              <div className="lista-servicos-acoes">
                <button type="button" onClick={() => handleCancelar(a.id)}>
                  {t('common.cancelButton')}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default Agenda
