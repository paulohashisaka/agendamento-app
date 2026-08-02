import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { getMeuPerfil } from '../lib/auth'
import AuthContext from './auth-context'

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined)
  const [perfil, setPerfil] = useState(undefined)
  const [erroPerfil, setErroPerfil] = useState(null)

  useEffect(() => {
    let ativo = true

    supabase.auth.getSession().then(({ data }) => {
      if (ativo) setSession(data.session)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, novaSession) => {
      setSession(novaSession)
    })

    return () => {
      ativo = false
      listener.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    let ativo = true

    if (session === undefined) return undefined

    if (!session) {
      setPerfil(null)
      setErroPerfil(null)
      return undefined
    }

    setPerfil(undefined)
    setErroPerfil(null)

    getMeuPerfil(session.user.id)
      .then((dados) => {
        if (ativo) setPerfil(dados)
      })
      .catch((error) => {
        if (ativo) {
          setPerfil(null)
          setErroPerfil(error.message)
        }
      })

    return () => {
      ativo = false
    }
  }, [session])

  const loading = session === undefined || (Boolean(session) && perfil === undefined)

  return (
    <AuthContext.Provider value={{ session, perfil, loading, erroPerfil }}>
      {children}
    </AuthContext.Provider>
  )
}
