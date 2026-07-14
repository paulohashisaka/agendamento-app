import { supabase } from './supabaseClient'

export async function listBarbeiros() {
  const { data, error } = await supabase
    .from('barbeiros')
    .select('*')
    .order('nome')

  if (error) throw error
  return data
}
