'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  email?: string
}

interface MemoryNote {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  created_at: string
  updated_at: string
}

interface MemoryStats {
  totalNotes: number
  categories: { [key: string]: number }
  recentActivity: MemoryNote[]
}

export default function Memory() {
  const [user, setUser] = useState<User | null>(null)
  const [memories, setMemories] = useState<MemoryNote[]>([])
  const [stats, setStats] = useState<MemoryStats>({
    totalNotes: 0,
    categories: {},
    recentActivity: []
  })
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('all')
  const router = useRouter()
  const supabase = createClient()

  // Categorías predefinidas con emojis
  const categoryConfig = {
    goals: { label: 'Objetivos', emoji: '🎯', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    reminders: { label: 'Recordatorios', emoji: '⏰', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
    ideas: { label: 'Ideas', emoji: '💡', color: 'bg-purple-50 text-purple-700 border-purple-200' },
    projects: { label: 'Proyectos', emoji: '📂', color: 'bg-green-50 text-green-700 border-green-200' },
    feelings: { label: 'Sentimientos', emoji: '❤️', color: 'bg-pink-50 text-pink-700 border-pink-200' },
    insights: { label: 'Insights', emoji: '✨', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    general: { label: 'General', emoji: '📝', color: 'bg-gray-50 text-gray-700 border-gray-200' }
  }

  useEffect(() => {
    const loadMemoryData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      
      setUser(user as User)

      // Cargar todas las notas de memoria
      const { data: memoryData, error } = await supabase
        .from('memory_notes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading memory:', error)
      } else {
        setMemories(memoryData || [])
        
        // Calcular estadísticas
        const categories: { [key: string]: number } = {}
        memoryData?.forEach(note => {
          categories[note.category] = (categories[note.category] || 0) + 1
        })

        setStats({
          totalNotes: memoryData?.length || 0,
          categories,
          recentActivity: memoryData?.slice(0, 5) || []
        })
      }

      setLoading(false)
    }
    
    loadMemoryData()
  }, [supabase, router])

  const filteredMemories = activeFilter === 'all' 
    ? memories 
    : memories.filter(memory => memory.category === activeFilter)

  const getCategoryInfo = (category: string) => {
    return categoryConfig[category as keyof typeof categoryConfig] || categoryConfig.general
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando tu memoria...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Redirigiendo...</p>
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
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-2xl font-bold text-blue-600">
                Coach Digital
              </Link>
              <span className="text-gray-400">→</span>
              <h1 className="text-xl font-semibold text-gray-700">Mi Memoria</h1>
            </div>
            <Button variant="outline" onClick={() => router.push('/dashboard')}>
              Volver al Dashboard
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          
          {/* Stats Overview */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Total de Notas</h3>
              <p className="text-3xl font-bold text-blue-600">{stats.totalNotes}</p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Objetivos</h3>
              <p className="text-3xl font-bold text-blue-600">{stats.categories.goals || 0}</p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Recordatorios</h3>
              <p className="text-3xl font-bold text-yellow-600">{stats.categories.reminders || 0}</p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Ideas</h3>
              <p className="text-3xl font-bold text-purple-600">{stats.categories.ideas || 0}</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Filtros y Lista Principal */}
            <div className="lg:col-span-2">
              {/* Filtros por categoría */}
              <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Filtrar por categoría</h2>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setActiveFilter('all')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      activeFilter === 'all' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Todas ({stats.totalNotes})
                  </button>
                  {Object.entries(categoryConfig).map(([key, config]) => {
                    const count = stats.categories[key] || 0
                    if (count === 0) return null
                    
                    return (
                      <button
                        key={key}
                        onClick={() => setActiveFilter(key)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center space-x-1 ${
                          activeFilter === key 
                            ? 'bg-blue-600 text-white' 
                            : `${config.color} hover:opacity-80`
                        }`}
                      >
                        <span>{config.emoji}</span>
                        <span>{config.label} ({count})</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Lista de Memorias */}
              <div className="space-y-4">
                {filteredMemories.length === 0 ? (
                  <div className="bg-white rounded-lg shadow p-8 text-center">
                    <div className="text-6xl mb-4">🤖</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {activeFilter === 'all' ? 'Tu memoria está vacía' : 'No hay notas en esta categoría'}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Comienza a chatear con tu coach por WhatsApp y tu memoria se irá llenando automáticamente con tus conversaciones, objetivos e ideas.
                    </p>
                    <Button onClick={() => router.push('/dashboard')}>
                      Volver al Dashboard
                    </Button>
                  </div>
                ) : (
                  filteredMemories.map((memory) => {
                    const categoryInfo = getCategoryInfo(memory.category)
                    return (
                      <div key={memory.id} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${categoryInfo.color}`}>
                              {categoryInfo.emoji} {categoryInfo.label}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatDate(memory.created_at)}
                            </span>
                          </div>
                        </div>
                        
                        {memory.title && (
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {memory.title}
                          </h3>
                        )}
                        
                        <p className="text-gray-700 leading-relaxed mb-3">
                          {memory.content.length > 200 
                            ? `${memory.content.substring(0, 200)}...` 
                            : memory.content
                          }
                        </p>
                        
                        {memory.tags && memory.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {memory.tags.map((tag, index) => (
                              <span 
                                key={index}
                                className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* Sidebar con Resumen */}
            <div className="space-y-6">
              {/* Resumen Actual */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <span className="text-2xl mr-2">📊</span>
                  Tu Resumen Actual
                </h2>
                
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-2">Estado Actual</h4>
                    <p className="text-sm text-blue-700">
                      {stats.totalNotes > 0 
                        ? "Tienes información valiosa guardada en tu memoria. Tu coach puede acceder a todo esto para darte mejor acompañamiento personalizado."
                        : "Aún no tienes información en tu memoria. Comienza a chatear con tu coach para que vaya aprendiendo sobre ti."
                      }
                    </p>
                  </div>

                  {stats.categories.goals > 0 && (
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <h4 className="font-semibold text-green-900 mb-2">Objetivos Activos</h4>
                      <p className="text-sm text-green-700">
                        Tienes {stats.categories.goals} objetivo{stats.categories.goals > 1 ? 's' : ''} registrado{stats.categories.goals > 1 ? 's' : ''}. 
                        Tu coach te ayudará a mantener el foco en ellos.
                      </p>
                    </div>
                  )}

                  {stats.categories.reminders > 0 && (
                    <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <h4 className="font-semibold text-yellow-900 mb-2">Recordatorios Pendientes</h4>
                      <p className="text-sm text-yellow-700">
                        Tienes {stats.categories.reminders} recordatorio{stats.categories.reminders > 1 ? 's' : ''} configurado{stats.categories.reminders > 1 ? 's' : ''}. 
                        Tu coach te los recordará en el momento adecuado.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Actividad Reciente */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <span className="text-2xl mr-2">🕒</span>
                  Actividad Reciente
                </h2>
                
                {stats.recentActivity.length === 0 ? (
                  <p className="text-gray-500 text-sm">No hay actividad reciente</p>
                ) : (
                  <div className="space-y-3">
                    {stats.recentActivity.map((note) => {
                      const categoryInfo = getCategoryInfo(note.category)
                      return (
                        <div key={note.id} className="border-l-4 border-blue-200 pl-3 py-2">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-sm">{categoryInfo.emoji}</span>
                            <span className="text-xs text-gray-500">
                              {formatDate(note.created_at)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 line-clamp-2">
                            {note.title || note.content.substring(0, 60)}...
                          </p>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Información sobre WhatsApp */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow-lg p-6 border border-green-200">
                <h2 className="text-xl font-bold text-green-900 mb-4 flex items-center">
                  <span className="text-2xl mr-2">💬</span>
                  Tu Coach en WhatsApp
                </h2>
                
                <p className="text-sm text-green-800 mb-4">
                  Tu memoria se llena automáticamente cuando chateas con tu coach. Él recuerda todo lo que compartes:
                </p>
                
                <ul className="text-sm text-green-700 space-y-2">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    Tus objetivos y metas
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    Ideas y pensamientos
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    Recordatorios importantes
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    Tu progreso y logros
                  </li>
                </ul>

                <div className="mt-4 p-3 bg-white rounded-lg border border-green-300">
                  <p className="text-xs text-green-600 font-medium">
                    💡 Próximamente: Podrás iniciar conversaciones con tu coach directamente desde aquí
                  </p>
                </div>
              </div>

              {/* Tips */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow-lg p-6 border border-purple-200">
                <h2 className="text-xl font-bold text-purple-900 mb-4 flex items-center">
                  <span className="text-2xl mr-2">💡</span>
                  Tips para tu Memoria
                </h2>
                
                <div className="space-y-3">
                  <div className="p-3 bg-white rounded-lg border border-purple-200">
                    <p className="text-sm text-purple-800">
                      <strong>Sé específico:</strong> Comparte detalles sobre tus objetivos para que tu coach pueda darte mejor seguimiento.
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-purple-200">
                    <p className="text-sm text-purple-800">
                      <strong>Actualiza regularmente:</strong> Mantén a tu coach informado sobre tus avances y cambios.
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-purple-200">
                    <p className="text-sm text-purple-800">
                      <strong>Usa categorías:</strong> Menciona si algo es un objetivo, recordatorio o simplemente una idea.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}