import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { gerarHorarios } from '../../lib/horarios'
import { hojeLocal as hoje } from '../../lib/dateUtils'

function GerarHorarios({ barbeiros }) {
  const { t } = useTranslation()
  const [barbeiroId, setBarbeiroId] = useState('')
  const [dataInicio, setDataInicio] = useState(hoje())
  const [dias, setDias] = useState(7)
  const [status, setStatus] = useState(null)
  const [gerando, setGerando] = useState(false)

  useEffect(() => {
    if (!barbeiroId && barbeiros.length > 0) {
      setBarbeiroId(barbeiros[0].id)
    }
  }, [barbeiros, barbeiroId])

  async function handleSubmit(e) {
    e.preventDefault()
    setGerando(true)
    setStatus(null)
    try {
      await gerarHorarios(barbeiroId, dataInicio, Number(dias))
      setStatus(t('gerarHorarios.sucesso'))
    } catch (err) {
      setStatus(t('gerarHorarios.erro', { mensagem: err.message }))
    } finally {
      setGerando(false)
    }
  }

  return (
    <section className="gerar-horarios">
      <h2>{t('gerarHorarios.titulo')}</h2>
      <form onSubmit={handleSubmit} className="form-servico">
        <select value={barbeiroId} onChange={(e) => setBarbeiroId(e.target.value)}>
          {barbeiros.map((b) => (
            <option key={b.id} value={b.id}>
              {b.nome}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={dataInicio}
          min={hoje()}
          onChange={(e) => setDataInicio(e.target.value)}
        />
        <input
          type="number"
          min="1"
          max="60"
          value={dias}
          onChange={(e) => setDias(e.target.value)}
        />
        <button type="submit" disabled={gerando || !barbeiroId}>
          {gerando ? t('gerarHorarios.gerando') : t('gerarHorarios.gerar')}
        </button>
      </form>
      {status && <p>{status}</p>}
    </section>
  )
}

export default GerarHorarios
