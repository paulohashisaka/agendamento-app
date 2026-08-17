import { supabase } from './supabaseClient'

export function signIn(email, password) {
  return supabase.auth.signInWithPassword({ email, password })
}

export function signUp({ nome, telefone, email, password }) {
  return supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/confirmacao-email`,
      data: {
        nome: nome.trim(),
        telefone: telefone.trim(),
      },
    },
  })
}

export function signOut() {
  return supabase.auth.signOut()
}

export function enviarRecuperacaoSenha(email) {
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/redefinir-senha`,
  })
}

export function atualizarSenha(password) {
  return supabase.auth.updateUser({ password })
}

export async function getMeuPerfil(userId) {
  const { data, error } = await supabase
    .from('perfis')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) throw error
  return data
}
