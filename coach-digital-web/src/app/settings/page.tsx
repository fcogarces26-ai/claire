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
  coaching_focus?: string
  reminder_schedule?: {
    days: string[]
    timeRange: { start: string; end: string }
  }
}

interface User {
  id: string
  email?: string
}

interface UserProfile {
  phone_number: string | null
  whatsapp_verified: boolean
  country: string
  timezone: string
  language: string
}

// Datos para los selects
const countries = [
  { code: 'CO', name: 'Colombia', timezone: 'America/Bogota', language: 'es' },
  { code: 'MX', name: 'México', timezone: 'America/Mexico_City', language: 'es' },
  { code: 'AR', name: 'Argentina', timezone: 'America/Buenos_Aires', language: 'es' },
  { code: 'ES', name: 'España', timezone: 'Europe/Madrid', language: 'es' },
  { code: 'US', name: 'Estados Unidos', timezone: 'America/New_York', language: 'en' },
  { code: 'BR', name: 'Brasil', timezone: 'America/Sao_Paulo', language: 'pt' },
  { code: 'PE', name: 'Perú', timezone: 'America/Lima', language: 'es' },
  { code: 'CL', name: 'Chile', timezone: 'America/Santiago', language: 'es' },
  { code: 'EC', name: 'Ecuador', timezone: 'America/Guayaquil', language: 'es' },
  { code: 'VE', name: 'Venezuela', timezone: 'America/Caracas', language: 'es' }
]

const timezones = [
  { value: 'America/Bogota', label: 'Bogotá (GMT-5)' },
  { value: 'America/Mexico_City', label: 'Ciudad de México (GMT-6)' },
  { value: 'America/Buenos_Aires', label: 'Buenos Aires (GMT-3)' },
  { value: 'Europe/Madrid', label: 'Madrid (GMT+1)' },
  { value: 'America/New_York', label: 'Nueva York (GMT-5)' },
  { value: 'America/Sao_Paulo', label: 'São Paulo (GMT-3)' },
  { value: 'America/Lima', label: 'Lima (GMT-5)' },
  { value: 'America/Santiago', label: 'Santiago (GMT-3)' },
  { value: 'America/Guayaquil', label: 'Guayaquil (GMT-5)' },
  { value: 'America/Caracas', label: 'Caracas (GMT-4)' }
]

const languages = [
  { code: 'es', name: 'Español' },
  { code: 'en', name: 'English' },
  { code: 'pt', name: 'Português' }
]

const coachingFocuses = [
  { 
    value: 'deportista', 
    label: 'Deportista', 
    description: 'Enfoque en rendimiento físico, disciplina y metas deportivas',
    icon: '🏃‍♂️'
  },
  { 
    value: 'carrera_profesional', 
    label: 'Carrera Profesional', 
    description: 'Desarrollo de habilidades profesionales y crecimiento laboral',
    icon: '👔'
  },
  { 
    value: 'emprendimiento', 
    label: 'Emprendimiento', 
    description: 'Crear y hacer crecer tu propio negocio desde cero',
    icon: '🚀'
  },
  { 
    value: 'empresario', 
    label: 'Empresario', 
    description: 'Liderazgo, gestión de equipos y crecimiento empresarial',
    icon: '💼'
  },
  { 
    value: 'bienestar_personal', 
    label: 'Bienestar Personal', 
    description: 'Equilibrio vida-trabajo, hábitos saludables y crecimiento personal',
    icon: '🌱'
  }
]

export default function Settings() {
  const [user, setUser] = useState<User | null>(null)
  const [settings, setSettings] = useState<UserSettings>({
    reminder_frequency: 'daily',
    reminder_time: '09:00:00',
    proactive_messages: true,
    coaching_style: 'balanced',
    directness_level: 3,
    communication_tone: 'motivational',
    presence_level: 'daily',
    coaching_focus: 'bienestar_personal'
  })
  const [profile, setProfile] = useState<UserProfile>({
    phone_number: null,
    whatsapp_verified: false,
    country: 'CO',
    timezone: 'America/Bogota',
    language: 'es'
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

  // Tonos de comunicación con imágenes
  const communicationTones = [
    { 
      value: 'motivational', 
      label: 'Motivacional', 
      emoji: '🔥',
      description: 'Energético y inspirador'
    },
    { 
      value: 'empathetic', 
      label: 'Empático', 
      emoji: '🤗',
      description: 'Comprensivo y cálido'
    },
    { 
      value: 'professional', 
      label: 'Profesional', 
      emoji: '💼',
      description: 'Formal y estructurado'
    },
    { 
      value: 'friendly', 
      label: 'Amigable', 
      emoji: '😊',
      description: 'Casual y cercano'
    }
  ]

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
        if (settingsData.reminder_schedule?.days) {
          setSelectedDays(settingsData.reminder_schedule.days)
        }
        if (settingsData.reminder_schedule?.timeRange) {
          setTimeRange(settingsData.reminder_schedule.timeRange)
        }
      }

      // Cargar perfil
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileData) {
        setProfile({
          phone_number: profileData.phone_number,
          whatsapp_verified: profileData.whatsapp_verified,
          country: profileData.country || 'CO',
          timezone: profileData.timezone || 'America/Bogota',
          language: profileData.language || 'es'
        })
        
        // Cargar configuraciones desde el perfil
        if (profileData.coaching_preferences) {
          setSettings(prev => ({
            ...prev,
            directness_level: profileData.coaching_preferences.directness_level || 3,
            communication_tone: profileData.coaching_preferences.communication_tone || 'motivational',
            presence_level: profileData.coaching_preferences.presence_level || 'daily',
            coaching_focus: profileData.coaching_focus || 'bienestar_personal'
          }))
        }
      }

      setLoading(false)
    }
    
    loadUserData()
  }, [supabase, router])

  // Función para detectar país por código de área
  const detectCountryFromPhone = (phoneNumber: string): string | null => {
    const cleaned = phoneNumber.replace(/\D/g, '')
    
    if (cleaned.startsWith('57')) return 'CO' // Colombia
    if (cleaned.startsWith('52')) return 'MX' // México
    if (cleaned.startsWith('54')) return 'AR' // Argentina
    if (cleaned.startsWith('34')) return 'ES' // España
    if (cleaned.startsWith('1')) return 'US' // Estados Unidos
    if (cleaned.startsWith('55')) return 'BR' // Brasil
    if (cleaned.startsWith('51')) return 'PE' // Perú
    if (cleaned.startsWith('56')) return 'CL' // Chile
    if (cleaned.startsWith('593')) return 'EC' // Ecuador
    if (cleaned.startsWith('58')) return 'VE' // Venezuela
    
    return null
  }

  const handleCountryChange = (countryCode: string) => {
    const country = countries.find(c => c.code === countryCode)
    if (country) {
      setProfile(prev => ({
        ...prev,
        country: country.code,
        timezone: country.timezone,
        language: country.language
      }))
    }
  }

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
          coaching_focus: settings.coaching_focus,
          reminder_schedule: reminderSchedule
        })

      if (settingsError) throw settingsError

      // Actualizar user_profiles con toda la información
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          country: profile.country,
          timezone: profile.timezone,
          language: profile.language,
          coaching_focus: settings.coaching_focus,
          coaching_preferences: {
            directness_level: settings.directness_level,
            communication_tone: settings.communication_tone,
            presence_level: settings.presence_level
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

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
          
          {/* Foco del Coaching */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <span className="text-3xl mr-3">🎯</span>
              Enfoque de tu Coaching
            </h2>
            <p className="text-gray-600 mb-6">
              Selecciona el área principal en la que quieres que se enfoque tu coach personal
            </p>
            
            <div className="grid md:grid-cols-2 gap-4">
              {coachingFocuses.map((focus) => (
                <label 
                  key={focus.value} 
                  className={`relative flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    settings.coaching_focus === focus.value 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="coaching_focus"
                    value={focus.value}
                    checked={settings.coaching_focus === focus.value}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      coaching_focus: e.target.value
                    }))}
                    className="sr-only"
                  />
                  <div className="flex items-start">
                    <div className="text-3xl mr-4">{focus.icon}</div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{focus.label}</h3>
                      <p className="text-sm text-gray-600 mt-1">{focus.description}</p>
                    </div>
                  </div>
                  {settings.coaching_focus === focus.value && (
                    <div className="absolute top-2 right-2">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm">✓</span>
                      </div>
                    </div>
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Configuración Regional */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <span className="text-3xl mr-3">🌍</span>
              Configuración Regional
            </h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              {/* País */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  País
                </label>
                <select
                  value={profile.country}
                  onChange={(e) => handleCountryChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {countries.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Zona Horaria */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Zona Horaria
                </label>
                <select
                  value={profile.timezone}
                  onChange={(e) => setProfile(prev => ({
                    ...prev,
                    timezone: e.target.value
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {timezones.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Idioma */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Idioma
                </label>
                <select
                  value={profile.language}
                  onChange={(e) => setProfile(prev => ({
                    ...prev,
                    language: e.target.value
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {languages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Configuración del Coach */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <span className="text-3xl mr-3">🤖</span>
              Personalidad de tu Coach
            </h2>
            
            <div className="space-y-8">
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

              {/* Tono de Comunicación - Barra horizontal */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Tono de comunicación
                </label>
                <div className="grid grid-cols-4 gap-4">
                  {communicationTones.map((tone) => (
                    <button
                      key={tone.value}
                      type="button"
                      onClick={() => setSettings(prev => ({
                        ...prev,
                        communication_tone: tone.value
                      }))}
                      className={`relative p-4 border-2 rounded-lg transition-all text-center ${
                        settings.communication_tone === tone.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-4xl mb-2">{tone.emoji}</div>
                      <h3 className="font-semibold text-sm text-gray-900">{tone.label}</h3>
                      <p className="text-xs text-gray-600 mt-1">{tone.description}</p>
                      {settings.communication_tone === tone.value && (
                        <div className="absolute -top-2 -right-2">
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
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