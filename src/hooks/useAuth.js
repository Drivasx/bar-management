import { useState, useEffect, useCallback } from 'react'
import supabase from '../utils/SupabaseClient'

export const useAuth = () => {
  const [user, setUser] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [loading, setLoading] = useState(true)

  const checkAuth = useCallback(async () => {
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
  }, [])

  useEffect(() => {
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
  }, [checkAuth])

  // Efecto para recargar la página automáticamente al volver
  useEffect(() => {
    let wasHidden = false

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // La página se ocultó (cambió de pestaña o minimizó)
        wasHidden = true
        console.log('Page hidden - marking for reload on return')
      } else if (wasHidden && user) {
        // La página volvió a ser visible y había usuario logueado
        console.log('Page became visible - reloading page...')
        window.location.reload()
      }
    }

    const handleFocus = () => {
      if (wasHidden && user) {
        console.log('Window focused after being hidden - reloading page...')
        window.location.reload()
      }
    }

    // Solo agregar listeners si hay usuario autenticado
    if (user) {
      document.addEventListener('visibilitychange', handleVisibilityChange)
      window.addEventListener('focus', handleFocus)
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [user])

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

