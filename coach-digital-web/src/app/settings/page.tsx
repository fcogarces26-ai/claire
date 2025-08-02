'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface UserSettings {
  reminder_frequency: string
  reminder_time: string
  proactive_messages: boolean
  coaching_style: string
  directness_level?: number
  communication_tone?: string
  presence_level?: string
  reminder_schedule?: any
}

interface User {
  id: string
  email?: string
}

interface UserProfile {
  phone_number: string | null
  whatsapp_verified: boolean
  timezone: string
}

export default function Settings() {
  const [user, setUser] = useState<User | null>(null)
  const [settings, setSettings] = useState<UserSettings>({
    reminder_frequency: 'daily',
    reminder_time: '09:00:00',
    proactive_messages: true,
    coaching_style: 'balanced',
    directness_level: 3,
    communication_tone: 'motivational',
    presence_level: 'daily'
  })
  const [profile, setProfile] = useState<UserProfile>({
    phone_number: null,
    whatsapp_verified: false,
    timezone: 'UTC'
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()
  const supabase = createClient()

  // Días de la semana
  const weekDays = [
    { id: 'monday', label: 'Lunes' },
    { id: 'tuesday', label: 'Martes' },
    { id: 'wednesday', label: 'Miércoles' },
    { id: 'thursday', label: 'Jueves' },
    { id: 'friday', label: 'Viernes' },
    { id: 'saturday', label: 'Sábado' },
    { id: 'sunday', label: 'Domingo' }
  ]

  const [selectedDays, setSelectedDays] = useState<string[]>(['monday', 'tuesday', 'wednesday', 'thursday', 'friday'])
  const [timeRange, setTimeRange] = useState({ start: '09:00', end: '18:00' })

  useEffect(() => {
    const loadUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      
      setUser(user as User)

      // Cargar configuraciones
      const { data: settingsData } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (settingsData) {
        setSettings(settingsData)
      }

      // Cargar perfil
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileData) {
        setProfile(profileData)
      }

      setLoading(false)
    }
    
    loadUserData()
  }, [supabase, router])

  const handleSaveSettings = async () => {
    if (!user) {
      setMessage('Error: Usuario no autenticado')
      return
    }

    setSaving(true)
    setMessage('')

    try {
      // Preparar el horario como JSON
      const reminderSchedule = {
        days: selectedDays,
        timeRange: timeRange
      }

      // Actualizar user_settings
      const { error: settingsError } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          reminder_frequency: settings.reminder_frequency,
          reminder_time: settings.reminder_time,
          proactive_messages: settings.proactive_messages,
          coaching_style: settings.coaching_style,
          reminder_schedule: reminderSchedule
        })

      if (settingsError) throw settingsError

      // Actualizar user_profiles
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          phone_number: profile.phone_number,
          timezone: profile.timezone,
          coaching_preferences: {
            directness_level: settings.directness_level,
            communication_tone: settings.communication_tone,
            presence_level: settings.presence_level
          }
        })

      if (profileError) throw profileError

      setMessage('Configuración guardada exitosamente')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      console.error('Error:', error)
      setMessage('Error al guardar la configuración')
    }

    setSaving(false)
  }

  const toggleDay = (day: string) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando configuración...</p>
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
              <h1 className="text-xl font-semibold text-gray-700">Configuración</h1>
            </div>
            <Button variant="outline" onClick={() => router.push('/dashboard')}>
              Volver al Dashboard
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Configuración del Coach */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <span className="text-3xl mr-3">🤖</span>
              Personalidad de tu Coach
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Nivel de Directividad */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  ¿Qué tan directo quieres que sea contigo?
                </label>
                <div className="space-y-2">
                  {[
                    { value: 1, label: 'Muy suave y comprensivo' },
                    { value: 2, label: 'Suave pero claro' },
                    { value: 3, label: 'Equilibrado' },
                    { value: 4, label: 'Directo y firme' },
                    { value: 5, label: 'Muy directo y retador' }
                  ].map((option) => (
                    <label key={option.value} className="flex items-center">
                      <input
                        type="radio"
                        name="directness"
                        value={option.value}
                        checked={settings.directness_level === option.value}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          directness_level: parseInt(e.target.value)
                        }))}
                        className="mr-2"
                      />
                      <span className="text-sm">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Tono de Comunicación */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Tono de comunicación
                </label>
                <select
                  value={settings.communication_tone}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    communication_tone: e.target.value
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="motivational">Motivacional y energético</option>
                  <option value="empathetic">Comprensivo y empático</option>
                  <option value="professional">Profesional y formal</option>
                  <option value="friendly">Amigable y casual</option>
                </select>
              </div>
            </div>
          </div>

          {/* Configuración de Recordatorios */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <span className="text-3xl mr-3">⏰</span>
              Recordatorios y Presencia
            </h2>

            <div className="space-y-6">
              {/* Frecuencia de Presencia */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  ¿Qué tan presente quieres que esté tu coach?
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="presence"
                      value="daily"
                      checked={settings.presence_level === 'daily'}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        presence_level: e.target.value
                      }))}
                      className="mr-2"
                    />
                    <span>Diario - Check-ins todos los días</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="presence"
                      value="weekly"
                      checked={settings.presence_level === 'weekly'}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        presence_level: e.target.value
                      }))}
                      className="mr-2"
                    />
                    <span>Semanal - Check-ins semanales</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="presence"
                      value="custom"
                      checked={settings.presence_level === 'custom'}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        presence_level: e.target.value
                      }))}
                      className="mr-2"
                    />
                    <span>Personalizado - Cada</span>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={settings.reminder_frequency === 'custom' ? 3 : ''}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        reminder_frequency: e.target.value ? `${e.target.value}_days` : 'daily'
                      }))}
                      className="mx-2 w-16 px-2 py-1 border border-gray-300 rounded text-center"
                      disabled={settings.presence_level !== 'custom'}
                    />
                    <span>días</span>
                  </label>
                </div>
              </div>

              {/* Días permitidos */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Días en que puede enviarte recordatorios
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {weekDays.map((day) => (
                    <label key={day.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedDays.includes(day.id)}
                        onChange={() => toggleDay(day.id)}
                        className="mr-2"
                      />
                      <span className="text-sm">{day.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Horarios */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Horario permitido para recordatorios
                </label>
                <div className="flex items-center space-x-4">
                  <div>
                    <label className="block text-xs text-gray-500">Desde</label>
                    <input
                      type="time"
                      value={timeRange.start}
                      onChange={(e) => setTimeRange(prev => ({ ...prev, start: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <span className="text-gray-500">hasta</span>
                  <div>
                    <label className="block text-xs text-gray-500">Hasta</label>
                    <input
                      type="time"
                      value={timeRange.end}
                      onChange={(e) => setTimeRange(prev => ({ ...prev, end: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Mensajes proactivos */}
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.proactive_messages}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      proactive_messages: e.target.checked
                    }))}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Permitir mensajes proactivos (tu coach puede iniciar conversaciones)
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Configuración de WhatsApp */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <span className="text-3xl mr-3">📱</span>
              WhatsApp
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de WhatsApp
                </label>
                <input
                  type="tel"
                  value={profile.phone_number || ''}
                  onChange={(e) => setProfile(prev => ({
                    ...prev,
                    phone_number: e.target.value
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+57 300 123 4567"
                />
              </div>

              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${profile.whatsapp_verified ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-600">
                  {profile.whatsapp_verified ? 'WhatsApp verificado' : 'WhatsApp no verificado'}
                </span>
              </div>
            </div>
          </div>

          {/* Mensaje de confirmación */}
          {message && (
            <div className={`p-4 rounded-md ${message.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
              {message}
            </div>
          )}

          {/* Botón de guardar */}
          <div className="flex justify-end">
            <Button 
              onClick={handleSaveSettings}
              disabled={saving}
              size="lg"
            >
              {saving ? 'Guardando...' : 'Guardar Configuración'}
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}