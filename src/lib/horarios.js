import { supabase } from './supabaseClient'
import { paraISOLocal } from './dateUtils'

const SLOT_MINUTOS = 30
const ABERTURA = '09:00'
const FECHAMENTO = '19:00'
const ALMOCO_INICIO = '12:00'
const ALMOCO_FIM = '13:00'

function pad(n) {
  return String(n).padStart(2, '0')
}

function gerarSlotsDoDia() {
  const slots = []
  let [h, m] = ABERTURA.split(':').map(Number)
  const [hFim, mFim] = FECHAMENTO.split(':').map(Number)

  while (h < hFim || (h === hFim && m < mFim)) {
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
    if (dia.getDay() === 0) continue // domingo fechado

    const dataStr = paraISOLocal(dia)
    for (const slot of gerarSlotsDoDia()) {
      linhas.push({ barbeiro_id: barbeiroId, data: dataStr, ...slot, disponivel: true })
    }
  }

  const { error } = await supabase
    .from('horarios')
    .upsert(linhas, { onConflict: 'barbeiro_id,data,hora_inicio', ignoreDuplicates: true })

  if (error) throw error
  return linhas.length
}

export async function listHorariosDisponiveis(data, barbeiroId) {
  let query = supabase.from('horarios').select('*').eq('data', data).order('hora_inicio')
  if (barbeiroId) query = query.eq('barbeiro_id', barbeiroId)

  const { data: rows, error } = await query
  if (error) throw error
  return rows
}
