import { supabase } from './supabaseClient'
import { traduzirErro } from './errosSupabase'

export async function criarAgendamento({ horarioId, servicoId, clienteNome, clienteTelefone }) {
  const { data, error } = await supabase.rpc('criar_agendamento', {
    p_horario_id: horarioId,
    p_servico_id: servicoId,
    p_cliente_nome: clienteNome,
    p_cliente_telefone: clienteTelefone,
  })

  if (error) throw new Error(traduzirErro(error.message))
  return data
}

export async function listAgendamentos({ barbeiroId, data } = {}) {
  let query = supabase
    .from('agendamentos')
    .select('*, servicos(nome), horarios!inner(data, hora_inicio, hora_fim)')
    .eq('status', 'confirmado')

  if (barbeiroId) query = query.eq('barbeiro_id', barbeiroId)
  if (data) query = query.eq('horarios.data', data)

  const { data: rows, error } = await query
  if (error) throw new Error(traduzirErro(error.message))

  return [...rows].sort((a, b) => a.horarios.hora_inicio.localeCompare(b.horarios.hora_inicio))
}

export async function cancelarAgendamento(agendamentoId) {
  const { error } = await supabase.rpc('cancelar_agendamento', { p_agendamento_id: agendamentoId })
  if (error) throw new Error(traduzirErro(error.message))
}
