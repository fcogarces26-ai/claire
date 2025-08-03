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

interface DashboardStats {
  savedNotes: number
  activeDays: number
  completedGoals: number
  whatsappMessages: number
  lastMessageDate: string | null
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [stats, setStats] = useState<DashboardStats>({
    savedNotes: 0,
    activeDays: 1,
    completedGoals: 0,
    whatsappMessages: 0,
    lastMessageDate: null
  })
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)
      await loadDashboardStats(user.id)
      setLoading(false)
    }
    
    getUser()
  }, [supabase.auth, router])

  const loadDashboardStats = async (userId: string) => {
    try {
      // Cargar estadísticas de WhatsApp
      const { data: whatsappData } = await supabase
        .from('whatsapp_interactions')
        .select('created_at, message_type')
        .eq('user_id', userId)

      const whatsappMessages = whatsappData?.length || 0
      const lastMessage = whatsappData?.[0]?.created_at || null

      // Aquí puedes agregar más consultas para otras estadísticas
      // Por ejemplo: notas guardadas, metas completadas, etc.

      setStats({
        savedNotes: 0, // Implementar cuando tengas la tabla de notas
        activeDays: 1,
        completedGoals: 0, // Implementar cuando tengas la tabla de metas
        whatsappMessages,
        lastMessageDate: lastMessage
      })
    } catch (error) {
      console.error('Error loading dashboard stats:', error)
    }
  }

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

  const formatLastMessageDate = (dateString: string | null) => {
    if (!dateString) return 'Nunca'
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'short', 
      hour: '2-digit', 
      minute: '2-digit' 
    })
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
              
              <Link href="/numero">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 hover:bg-purple-100 transition-colors cursor-pointer">
                  <div className="text-3xl mb-2">💬</div>
                  <h3 className="font-semibold text-purple-900">WhatsApp</h3>
                  <p className="text-sm text-purple-700">
                    {stats.whatsappMessages > 0 ? 'Ver configuración' : 'Configurar número'}
                  </p>
                </div>
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Notas Guardadas</h3>
              <p className="text-3xl font-bold text-blue-600">{stats.savedNotes}</p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Días Activo</h3>
              <p className="text-3xl font-bold text-green-600">{stats.activeDays}</p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Metas Completadas</h3>
              <p className="text-3xl font-bold text-purple-600">{stats.completedGoals}</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Mensajes WhatsApp</h3>
              <p className="text-3xl font-bold text-orange-600">{stats.whatsappMessages}</p>
              <p className="text-xs text-gray-500 mt-1">
                Último: {formatLastMessageDate(stats.lastMessageDate)}
              </p>
            </div>
          </div>

          {/* WhatsApp Status */}
          {stats.whatsappMessages > 0 && (
            <div className="mt-8 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    WhatsApp Conectado ✅
                  </h3>
                  <p className="text-gray-600">
                    Tu coach está activo y listo para ayudarte por WhatsApp
                  </p>
                </div>
                <Link href="/numero">
                  <Button variant="outline">
                    Gestionar
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}