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

export function emailJaCadastrado(data, error) {
  const codigo = error?.code?.toLowerCase() || ''
  const mensagem = error?.message?.toLowerCase() || ''
  const semNovaIdentidade = data?.user && Array.isArray(data.user.identities)
    && data.user.identities.length === 0

  return semNovaIdentidade
    || codigo === 'user_already_exists'
    || mensagem.includes('already registered')
    || mensagem.includes('already exists')
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
