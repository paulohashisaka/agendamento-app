import { supabase } from './supabaseClient'

export async function listServicos() {
  const { data, error } = await supabase
    .from('servicos')
    .select('*')
    .order('nome_pt')

  if (error) throw error
  return data
}

export function nomeServico(servico, idioma = 'pt-BR') {
  if (!servico) return ''
  return idioma.startsWith('ja')
    ? servico.nome_ja || servico.nome_pt || servico.nome
    : servico.nome_pt || servico.nome_ja || servico.nome
}

export async function createServico({ nome_pt, nome_ja, duracao_minutos, preco }) {
  const { data, error } = await supabase
    .from('servicos')
    .insert({ nome: nome_pt, nome_pt, nome_ja, duracao_minutos, preco })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateServico(id, { nome_pt, nome_ja, duracao_minutos, preco }) {
  const { data, error } = await supabase
    .from('servicos')
    .update({ nome: nome_pt, nome_pt, nome_ja, duracao_minutos, preco })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteServico(id) {
  const { error } = await supabase.from('servicos').delete().eq('id', id)
  if (error) throw error
}
