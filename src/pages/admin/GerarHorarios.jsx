import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  gerarHorarios,
  limparHorariosDoDia,
  listDiasComHorarios,
  contarHorariosDoDia,
} from '../../lib/horarios'
import { hojeLocal as hoje, paraISOLocal } from '../../lib/dateUtils'

function primeiroDiaDoMes(ano, mes) {
  return new Date(ano, mes, 1)
}

function ultimoDiaDoMes(ano, mes) {
  return new Date(ano, mes + 1, 0)
}

function gerarGradeDoMes(ano, mes) {
  const ultimo = ultimoDiaDoMes(ano, mes)
  const offsetInicio = primeiroDiaDoMes(ano, mes).getDay() // 0 = domingo
  const dias = []
  for (let i = 0; i < offsetInicio; i++) dias.push(null)
  for (let d = 1; d <= ultimo.getDate(); d++) dias.push(new Date(ano, mes, d))
  return dias
}

function nomesDiasDaSemana(idioma) {
  // 2023-01-01 foi um domingo, usado só como referência pra pegar os nomes
  return Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat(idioma, { weekday: 'short' }).format(new Date(2023, 0, 1 + i))
  )
}

function GerarHorarios({ barbeiros }) {
  const { t, i18n } = useTranslation()
  const [barbeiroId, setBarbeiroId] = useState('')
  const [mesAtual, setMesAtual] = useState(() => {
    const d = new Date()
    return { ano: d.getFullYear(), mes: d.getMonth() }
  })
  const [diasComHorarios, setDiasComHorarios] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [diaProcessando, setDiaProcessando] = useState(null)
  const [erro, setErro] = useState(null)

  useEffect(() => {
    if (!barbeiroId && barbeiros.length > 0) {
      setBarbeiroId(barbeiros[0].id)
    }
  }, [barbeiros, barbeiroId])

  useEffect(() => {
    if (!barbeiroId) return
    carregarMes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [barbeiroId, mesAtual])

  async function carregarMes() {
    setLoading(true)
    setErro(null)
    try {
      const inicio = paraISOLocal(primeiroDiaDoMes(mesAtual.ano, mesAtual.mes))
      const fim = paraISOLocal(ultimoDiaDoMes(mesAtual.ano, mesAtual.mes))
      const dias = await listDiasComHorarios(barbeiroId, inicio, fim)
      setDiasComHorarios(new Set(dias))
    } catch (err) {
      setErro(err.message)
    } finally {
      setLoading(false)
    }
  }

  function mudarMes(delta) {
    setMesAtual(({ ano, mes }) => {
      const d = new Date(ano, mes + delta, 1)
      return { ano: d.getFullYear(), mes: d.getMonth() }
    })
  }

  async function alternarDia(dataStr, jaTrabalha) {
    setDiaProcessando(dataStr)
    setErro(null)
    try {
      if (jaTrabalha) {
        const { reservados } = await contarHorariosDoDia(barbeiroId, dataStr)
        if (reservados > 0) {
          setErro(t('gerarHorarios.diaComAgendamentos', { count: reservados }))
          return
        }
        await limparHorariosDoDia(barbeiroId, dataStr)
        setDiasComHorarios((atual) => {
          const novo = new Set(atual)
          novo.delete(dataStr)
          return novo
        })
      } else {
        await gerarHorarios(barbeiroId, dataStr, 1)
        setDiasComHorarios((atual) => new Set(atual).add(dataStr))
      }
    } catch (err) {
      setErro(err.message)
    } finally {
      setDiaProcessando(null)
    }
  }

  const grade = gerarGradeDoMes(mesAtual.ano, mesAtual.mes)
  const nomesDias = nomesDiasDaSemana(i18n.language)
  const tituloMes = new Intl.DateTimeFormat(i18n.language, { month: 'long', year: 'numeric' }).format(
    new Date(mesAtual.ano, mesAtual.mes, 1)
  )
  const hojeStr = hoje()

  return (
    <section className="gerar-horarios">
      <h2>{t('gerarHorarios.titulo')}</h2>

      <select value={barbeiroId} onChange={(e) => setBarbeiroId(e.target.value)}>
        {barbeiros.map((b) => (
          <option key={b.id} value={b.id}>
            {b.nome}
          </option>
        ))}
      </select>

      <p className="gerar-horarios-instrucao">{t('gerarHorarios.instrucao')}</p>

      <div className="calendario">
        <div className="calendario-nav">
          <button type="button" onClick={() => mudarMes(-1)}>
            ‹
          </button>
          <span className="calendario-titulo">{tituloMes}</span>
          <button type="button" onClick={() => mudarMes(1)}>
            ›
          </button>
        </div>

        <div className="calendario-grade calendario-semana">
          {nomesDias.map((nome) => (
            <span key={nome} className="calendario-dia-semana">
              {nome}
            </span>
          ))}
        </div>

        <div className="calendario-grade">
          {grade.map((dia, i) => {
            if (!dia) return <span key={`vazio-${i}`} className="calendario-dia calendario-dia--vazio" />

            const dataStr = paraISOLocal(dia)
            const jaTrabalha = diasComHorarios.has(dataStr)
            const passado = dataStr < hojeStr
            const ehHoje = dataStr === hojeStr
            const processando = diaProcessando === dataStr

            return (
              <button
                type="button"
                key={dataStr}
                data-date={dataStr}
                disabled={passado || loading || processando}
                onClick={() => alternarDia(dataStr, jaTrabalha)}
                className={[
                  'calendario-dia',
                  jaTrabalha && 'calendario-dia--trabalho',
                  ehHoje && 'calendario-dia--hoje',
                  processando && 'calendario-dia--processando',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {dia.getDate()}
              </button>
            )
          })}
        </div>
      </div>

      <div className="calendario-legenda">
        <span className="calendario-legenda-item">
          <span className="calendario-legenda-cor calendario-legenda-cor--trabalho" />
          {t('gerarHorarios.legendaTrabalho')}
        </span>
        <span className="calendario-legenda-item">
          <span className="calendario-legenda-cor" />
          {t('gerarHorarios.legendaFolga')}
        </span>
      </div>

      {erro && <p role="alert">{erro}</p>}
    </section>
  )
}

export default GerarHorarios
