import { useState, useEffect } from 'react'
import supabase from '../utils/SupabaseClient'

export const useAuth = () => {
  const [user, setUser] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        // Verificar si el usuario está autorizado
        const { data: authorizedUser } = await supabase
          .from('authorized_users')
          .select('*')
          .eq('email', session.user.email)
          .eq('is_active', true)
          .single()

        if (authorizedUser) {
          setUser(session.user)
          setUserRole(authorizedUser.role)
        } else {
          // Usuario no autorizado
          await supabase.auth.signOut()
          setUser(null)
          setUserRole(null)
          alert('Usuario no autorizado para acceder a esta aplicación')
        }
      }
      
      setLoading(false)
    }

    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const { data: authorizedUser } = await supabase
            .from('authorized_users')
            .select('*')
            .eq('email', session.user.email)
            .eq('is_active', true)
            .single()

          if (authorizedUser) {
            setUser(session.user)
            setUserRole(authorizedUser.role)
          } else {
            await supabase.auth.signOut()
            setUser(null)
            setUserRole(null)
            alert('Usuario no autorizado para acceder a esta aplicación')
          }
        } else {
          setUser(null)
          setUserRole(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    setUser(null)
    setUserRole(null)
    return { error }
  }

  return { user, userRole, loading, signIn, signOut }
}
