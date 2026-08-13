import { supabase } from './supabaseClient'
import { paraISOLocal } from './dateUtils'
import { traduzirErro } from './errosSupabase'

const SLOT_MINUTOS = 15
const ABERTURA = '09:00'
const ULTIMO_HORARIO = '20:00'
const ALMOCO_INICIO = '12:00'
const ALMOCO_FIM = '13:00'

function pad(n) {
  return String(n).padStart(2, '0')
}

function gerarSlotsDoDia() {
  const slots = []
  let [h, m] = ABERTURA.split(':').map(Number)
  const [hFim, mFim] = ULTIMO_HORARIO.split(':').map(Number)

  // O limite representa o último horário que pode ser escolhido, portanto
  // 20:00 também deve gerar um slot (com término às 20:15).
  while (h < hFim || (h === hFim && m <= mFim)) {
    const inicio = `${pad(h)}:${pad(m)}`
    m += SLOT_MINUTOS
    if (m >= 60) {
      h += 1
      m -= 60
    }
    const fim = `${pad(h)}:${pad(m)}`

    const dentroAlmoco = inicio >= ALMOCO_INICIO && inicio < ALMOCO_FIM
    if (!dentroAlmoco) slots.push({ hora_inicio: inicio, hora_fim: fim })
  }

  return slots
}

export async function gerarHorarios(barbeiroId, dataInicio, dias) {
  const linhas = []
  const base = new Date(`${dataInicio}T00:00:00`)

  for (let i = 0; i < dias; i++) {
    const dia = new Date(base)
    dia.setDate(dia.getDate() + i)

    const dataStr = paraISOLocal(dia)
    for (const slot of gerarSlotsDoDia()) {
      linhas.push({
        barbeiro_id: barbeiroId,
        data: dataStr,
        ...slot,
        disponivel: true,
        ativo: true,
      })
    }
  }

  const { error } = await supabase
    .from('horarios')
    .upsert(linhas, { onConflict: 'barbeiro_id,data,hora_inicio' })

  if (error) throw error
  return linhas.length
}

export async function listHorariosDisponiveis(data, barbeiroId) {
  let query = supabase
    .from('horarios')
    .select('*')
    .eq('data', data)
    .eq('ativo', true)
    .eq('disponivel', true)
    .order('hora_inicio')
  if (barbeiroId) query = query.eq('barbeiro_id', barbeiroId)

  const { data: rows, error } = await query
  if (error) throw error
  return rows
}

// Datas (dentro do intervalo) em que o barbeiro já tem algum horário gerado,
// usado pra destacar no calendário quais dias estão marcados como "trabalho".
export async function listDiasComHorarios(barbeiroId, dataInicio, dataFim) {
  const { data, error } = await supabase
    .from('horarios')
    .select('data')
    .eq('barbeiro_id', barbeiroId)
    .eq('ativo', true)
    .gte('data', dataInicio)
    .lte('data', dataFim)

  if (error) throw error
  return [...new Set(data.map((h) => h.data))]
}

export async function contarHorariosDoDia(barbeiroId, data) {
  const { data: rows, error } = await supabase
    .from('horarios')
    .select('disponivel')
    .eq('barbeiro_id', barbeiroId)
    .eq('data', data)
    .eq('ativo', true)

  if (error) throw error
  const reservados = rows.filter((r) => !r.disponivel).length
  return { total: rows.length, reservados, livres: rows.length - reservados }
}

// Marca o dia como folga sem apagar horários ligados ao histórico de
// agendamentos. A função do banco também impede a alteração se uma reserva
// for confirmada enquanto o administrador estiver executando esta ação.
export async function limparHorariosDoDia(barbeiroId, data) {
  const { error } = await supabase.rpc('marcar_dia_folga', {
    p_barbeiro_id: barbeiroId,
    p_data: data,
  })

  if (error) throw new Error(traduzirErro(error.message))
}
