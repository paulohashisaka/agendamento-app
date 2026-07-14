import { supabase } from './supabaseClient'

export async function listServicos() {
  const { data, error } = await supabase
    .from('servicos')
    .select('*')
    .order('nome')

  if (error) throw error
  return data
}

export async function createServico({ nome, duracao_minutos, preco }) {
  const { data, error } = await supabase
    .from('servicos')
    .insert({ nome, duracao_minutos, preco })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateServico(id, { nome, duracao_minutos, preco }) {
  const { data, error } = await supabase
    .from('servicos')
    .update({ nome, duracao_minutos, preco })
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
