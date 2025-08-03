'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const router = useRouter()
  const supabase = createClient()

  // Verificar si el usuario ya está autenticado y redirigir
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Si el usuario ya está autenticado, verificar si tiene número configurado
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('whatsapp_verified')
          .eq('id', user.id)
          .single()

        if (profile?.whatsapp_verified) {
          router.push('/dashboard')
        } else {
          router.push('/numero')
        }
      }
    }
    
    checkUser()
  }, [supabase, router])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      // Registrar usuario
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            phone_number: phone,
          }
        }
      })

      if (signUpError) {
        setError(signUpError.message)
        setLoading(false)
        return
      }

      if (data.user) {
        // Crear perfil de usuario en la base de datos
        const { error: profileError } = await supabase
          .from('user_profiles')
          .upsert({
            id: data.user.id,
            phone_number: phone || null,
            whatsapp_verified: false,
            timezone: 'America/Bogota', // Default timezone
            language: 'es', // Default language
            country: 'CO' // Default country
          })

        if (profileError) {
          console.error('Error creando perfil:', profileError)
        }

        // Si el usuario necesita confirmar email
        if (!data.session) {
          setMessage('¡Registro exitoso! Revisa tu email para confirmar tu cuenta antes de continuar.')
          // No redirigir inmediatamente, esperar confirmación
          return
        }

        // Si el registro fue exitoso y ya está autenticado
        setMessage('¡Cuenta creada exitosamente! Configuremos tu WhatsApp...')
        setTimeout(() => {
          router.push('/numero')
        }, 2000)
      }
    } catch (error) {
      console.error('Error en registro:', error)
      setError('Error inesperado durante el registro')
    }
    
    setLoading(false)
  }

  const handleGoogleRegister = async () => {
    setGoogleLoading(true)
    setError('')

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback?next=numero`
        }
      })

      if (error) {
        setError(error.message)
        setGoogleLoading(false)
      }
      // No need to set loading to false here as the user will be redirected
    } catch (error) {
      console.error('Error en Google OAuth:', error)
      setError('Error conectando con Google')
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-blue-600">
            Coach Digital
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Comienza tu transformación</h1>
          <p className="text-gray-600 mt-2">Crea tu cuenta para acceder a tu coach personal</p>
        </div>

        {/* Register Form */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          
          {/* Google Register Button */}
          <div className="mb-6">
            <Button 
              type="button"
              variant="outline"
              className="w-full border-gray-300 hover:bg-gray-50 flex items-center justify-center space-x-2"
              onClick={handleGoogleRegister}
              disabled={googleLoading || loading}
            >
              {googleLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              <span>{googleLoading ? 'Conectando...' : 'Registrarse con Google'}</span>
            </Button>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">O regístrate con email</span>
            </div>
          </div>

          <form onSubmit={handleRegister} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="tu@email.com"
                required
                disabled={loading || googleLoading}
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                WhatsApp (opcional)
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+57 300 123 4567"
                disabled={loading || googleLoading}
              />
              <p className="text-xs text-gray-500 mt-1">Lo configuraremos después del registro</p>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
                required
                minLength={6}
                disabled={loading || googleLoading}
              />
              <p className="text-xs text-gray-500 mt-1">Mínimo 6 caracteres</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {message && (
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <p className="text-sm text-green-600">{message}</p>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full"
              disabled={loading || googleLoading}
            >
              {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
            </Button>
          </form>

          {/* Next Steps Info */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">📱 Después del registro:</h3>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Configurarás tu número de WhatsApp</li>
              <li>• Personalizarás tu experiencia de coaching</li>
              <li>• ¡Comenzarás a recibir apoyo de tu coach personal!</li>
            </ul>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              ¿Ya tienes cuenta?{' '}
              <Link href="/login" className="text-blue-600 hover:underline">
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}