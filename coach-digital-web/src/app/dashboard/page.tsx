'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  email?: string
  user_metadata?: {
    phone_number?: string
  }
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    
    getUser()
  }, [supabase.auth])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-blue-600">Coach Digital</h1>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">Hola, {user?.email}</span>
              <Button variant="outline" onClick={handleLogout}>
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Welcome Section */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              ¡Bienvenido a tu Coach Digital! 🚀
            </h2>
            <p className="text-gray-600 text-lg mb-6">
              Tu asistente personal está listo para ayudarte a crecer. Comienza configurando tu experiencia.
            </p>
            
            {/* Quick Actions */}
            <div className="grid md:grid-cols-3 gap-4">
              <Link href="/settings">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 hover:bg-blue-100 transition-colors cursor-pointer">
                  <div className="text-3xl mb-2">⚙️</div>
                  <h3 className="font-semibold text-blue-900">Configuración</h3>
                  <p className="text-sm text-blue-700">Personaliza tu experiencia</p>
                </div>
              </Link>
              
              <Link href="/memory">
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 hover:bg-green-100 transition-colors cursor-pointer">
                  <div className="text-3xl mb-2">🧠</div>
                  <h3 className="font-semibold text-green-900">Memoria</h3>
                  <p className="text-sm text-green-700">Guarda tus pensamientos</p>
                </div>
              </Link>
              
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 hover:bg-purple-100 transition-colors cursor-pointer">
                <div className="text-3xl mb-2">💬</div>
                <h3 className="font-semibold text-purple-900">WhatsApp</h3>
                <p className="text-sm text-purple-700">Próximamente</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Notas Guardadas</h3>
              <p className="text-3xl font-bold text-blue-600">0</p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Días Activo</h3>
              <p className="text-3xl font-bold text-green-600">1</p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Metas Completadas</h3>
              <p className="text-3xl font-bold text-purple-600">0</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
