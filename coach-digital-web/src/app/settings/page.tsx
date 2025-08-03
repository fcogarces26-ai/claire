'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// Importar constantes y tipos
import {
  COUNTRIES,
  TIMEZONES,
  LANGUAGES,
  COACHING_FOCUSES,
  COMMUNICATION_TONES,
  WEEK_DAYS,
  DIRECTNESS_LEVELS,
  getCountryByCode
} from '@/lib/constants'

import {
  UserSettings,
  User,
  UserProfile
} from '@/lib/types'

export default function Settings() {
  const [user, setUser] = useState<User | null>(null)
  const [activeTab, setActiveTab] = useState('coaching-focus')
  const [settings, setSettings] = useState<UserSettings>({
    reminder_frequency: 'daily',
    reminder_time: '09:00:00',
    proactive_messages: true,
    coaching_style: 'balanced',
    directness_level: 3,
    communication_tone: 'motivational',
    presence_level: 'daily',
    coaching_focus: 'bienestar_personal',
    coaching_frequency: 'daily',
    notifications_enabled: true,
    auto_responses: true,
    preferred_contact_method: 'whatsapp',
    quiet_hours_enabled: false,
    quiet_hours_start: '22:00',
    quiet_hours_end: '08:00'
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

  const [selectedDays, setSelectedDays] = useState<string[]>(['monday', 'tuesday', 'wednesday', 'thursday', 'friday'])
  const [timeRange, setTimeRange] = useState({ start: '09:00', end: '18:00' })
  const [customFrequencyDays, setCustomFrequencyDays] = useState<number>(3)

  const tabs = [
    {
      id: 'coaching-focus',
      label: 'Enfoque de tu Coaching',
      icon: '🎯'
    },
    {
      id: 'personality',
      label: 'Personalidad de tu Coach',
      icon: '🤖'
    },
    {
      id: 'reminders',
      label: 'Recordatorios y Presencia',
      icon: '⏰'
    },
    {
      id: 'regional',
      label: 'Configuración Regional',
      icon: '🌍'
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

      // Cargar TODAS las configuraciones desde user_settings
      const { data: settingsData } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (settingsData) {
        setSettings({
          reminder_frequency: settingsData.reminder_frequency || 'daily',
          reminder_time: settingsData.reminder_time || '09:00:00',
          proactive_messages: settingsData.proactive_messages ?? true,
          coaching_style: settingsData.coaching_style || 'balanced',
          directness_level: settingsData.directness_level || 3,
          communication_tone: settingsData.communication_tone || 'motivational',
          presence_level: settingsData.presence_level || 'daily',
          coaching_frequency: settingsData.coaching_frequency || 'daily',
          notifications_enabled: settingsData.notifications_enabled ?? true,
          auto_responses: settingsData.auto_responses ?? true,
          preferred_contact_method: settingsData.preferred_contact_method || 'whatsapp',
          coaching_focus: 'bienestar_personal' // Mantenemos en user_profiles por ahora
        })
        
        // Cargar horarios silenciosos
        if (settingsData.quiet_hours) {
          setSettings(prev => ({
            ...prev,
            quiet_hours_enabled: settingsData.quiet_hours.enabled || false,
            quiet_hours_start: settingsData.quiet_hours.start || '22:00',
            quiet_hours_end: settingsData.quiet_hours.end || '08:00'
          }))
        }
        
        // Cargar horarios de recordatorios
        if (settingsData.reminder_schedule) {
          if (settingsData.reminder_schedule.days) {
            setSelectedDays(settingsData.reminder_schedule.days)
          }
          if (settingsData.reminder_schedule.timeRange) {
            setTimeRange(settingsData.reminder_schedule.timeRange)
          }
          if (settingsData.reminder_schedule.customFrequencyDays) {
            setCustomFrequencyDays(settingsData.reminder_schedule.customFrequencyDays)
          }
        }
      }

      // Solo cargar información personal básica desde user_profiles
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('phone_number, whatsapp_verified, country, timezone, language, coaching_focus')
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
        
        // coaching_focus sigue en user_profiles
        setSettings(prev => ({
          ...prev,
          coaching_focus: profileData.coaching_focus || 'bienestar_personal'
        }))
      }

      setLoading(false)
    }
    
    loadUserData()
  }, [supabase, router])

  const handleCountryChange = (countryCode: string) => {
    const country = getCountryByCode(countryCode)
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
      console.log('💾 Guardando configuraciones centralizadas...')
      
      // Preparar datos completos para user_settings
      const reminderSchedule = {
        days: selectedDays,
        timeRange: timeRange,
        timezone: profile.timezone,
        maxMessagesPerDay: 3,
        customFrequencyDays: settings.presence_level === 'custom' ? customFrequencyDays : null
      }

      const quietHours = {
        enabled: settings.quiet_hours_enabled || false,
        start: settings.quiet_hours_start || '22:00',
        end: settings.quiet_hours_end || '08:00'
      }

      // Verificar si ya existe configuración para este usuario
      const { data: existingSettings } = await supabase
        .from('user_settings')
        .select('id')
        .eq('user_id', user.id)
        .single()

      let settingsResult
      
      if (existingSettings) {
        // Actualizar configuración existente
        console.log('🔄 Actualizando configuración existente...')
        settingsResult = await supabase
          .from('user_settings')
          .update({
            reminder_frequency: settings.reminder_frequency,
            reminder_time: settings.reminder_time,
            proactive_messages: settings.proactive_messages,
            coaching_style: settings.coaching_style,
            presence_level: settings.presence_level,
            directness_level: settings.directness_level,
            communication_tone: settings.communication_tone,
            coaching_frequency: settings.presence_level, // Usamos presence_level como coaching_frequency
            notifications_enabled: settings.notifications_enabled ?? true,
            auto_responses: settings.auto_responses ?? true,
            preferred_contact_method: settings.preferred_contact_method || 'whatsapp',
            quiet_hours: quietHours,
            reminder_schedule: reminderSchedule,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)
      } else {
        // Crear nueva configuración
        console.log('➕ Creando nueva configuración...')
        settingsResult = await supabase
          .from('user_settings')
          .insert({
            user_id: user.id,
            reminder_frequency: settings.reminder_frequency,
            reminder_time: settings.reminder_time,
            proactive_messages: settings.proactive_messages,
            coaching_style: settings.coaching_style,
            presence_level: settings.presence_level,
            directness_level: settings.directness_level,
            communication_tone: settings.communication_tone,
            coaching_frequency: settings.presence_level, // Usamos presence_level como coaching_frequency
            notifications_enabled: settings.notifications_enabled ?? true,
            auto_responses: settings.auto_responses ?? true,
            preferred_contact_method: settings.preferred_contact_method || 'whatsapp',
            quiet_hours: quietHours,
            reminder_schedule: reminderSchedule,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
      }

      const { error: settingsError } = settingsResult

      if (settingsError) {
        console.error('❌ Error guardando user_settings:', settingsError)
        throw settingsError
      }

      console.log('✅ user_settings guardado exitosamente')

      // Solo información personal básica en user_profiles
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          country: profile.country,
          timezone: profile.timezone,
          language: profile.language,
          coaching_focus: settings.coaching_focus,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (profileError) {
        console.error('❌ Error guardando user_profiles:', profileError)
        throw profileError
      }

      console.log('✅ user_profiles guardado exitosamente')

      setMessage('Configuración guardada exitosamente')
      setTimeout(() => setMessage(''), 3000)
      
    } catch (error) {
      console.error('💥 Error completo:', error)
      
      let errorMessage = 'Error al guardar la configuración'
      if (error && typeof error === 'object' && 'message' in error) {
        errorMessage += `: ${error.message}`
      }
      
      setMessage(errorMessage)
      setTimeout(() => setMessage(''), 5000)
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

  const renderCoachingFocusTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Selecciona el área principal en la que quieres que se enfoque tu coach personal
        </h3>
        
        <div className="grid md:grid-cols-2 gap-4">
          {COACHING_FOCUSES.map((focus) => (
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
                  <h4 className="font-semibold text-gray-900">{focus.label}</h4>
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
    </div>
  )

  const renderPersonalityTab = () => (
    <div className="space-y-8">
      {/* Nivel de Directividad */}
      <div>
        <label className="block text-lg font-semibold text-gray-900 mb-4">
          ¿Qué tan directo quieres que sea contigo?
        </label>
        <div className="space-y-3">
          {DIRECTNESS_LEVELS.map((option) => (
            <label key={option.value} className="flex items-start p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="radio"
                name="directness"
                value={option.value}
                checked={settings.directness_level === option.value}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  directness_level: parseInt(e.target.value)
                }))}
                className="mr-3 mt-1"
              />
              <div>
                <span className="font-medium text-gray-900">{option.label}</span>
                <p className="text-sm text-gray-600 mt-1">{option.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Tono de Comunicación */}
      <div>
        <label className="block text-lg font-semibold text-gray-900 mb-4">
          Tono de comunicación
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {COMMUNICATION_TONES.map((tone) => (
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
              <h4 className="font-semibold text-sm text-gray-900">{tone.label}</h4>
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
  )

  const renderRemindersTab = () => (
    <div className="space-y-8">
      {/* Frecuencia de Presencia */}
      <div>
        <label className="block text-lg font-semibold text-gray-900 mb-4">
          ¿Qué tan presente quieres que esté tu coach?
        </label>
        <select
          value={settings.presence_level}
          onChange={(e) => setSettings(prev => ({
            ...prev,
            presence_level: e.target.value
          }))}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
        >
          <option value="daily">Diario - Check-ins todos los días</option>
          <option value="weekly">Semanal - Check-ins semanales</option>
          <option value="custom">Personalizado</option>
          <option value="minimal">Mínimo - Solo cuando lo solicite</option>
        </select>
        
        {/* Mostrar input para frecuencia personalizada */}
        {settings.presence_level === 'custom' && (
          <div className="mt-4 flex items-center space-x-2">
            <span className="text-gray-700">Cada</span>
            <input
              type="number"
              min="1"
              max="30"
              value={customFrequencyDays}
              onChange={(e) => setCustomFrequencyDays(parseInt(e.target.value) || 3)}
              className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
            />
            <span className="text-gray-700">días</span>
          </div>
        )}
      </div>

      {/* Días permitidos */}
      <div>
        <label className="block text-lg font-semibold text-gray-900 mb-4">
          Días en los que puede escribirte
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {WEEK_DAYS.map((day) => (
            <label key={day.id} className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedDays.includes(day.id)}
                onChange={() => toggleDay(day.id)}
                className="mr-3"
              />
              <span>{day.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Horarios */}
      <div>
        <label className="block text-lg font-semibold text-gray-900 mb-4">
          Horarios permitidos
        </label>
        <div className="flex items-center space-x-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Desde</label>
            <input
              type="time"
              value={timeRange.start}
              onChange={(e) => setTimeRange(prev => ({ ...prev, start: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <span className="text-gray-500 pt-6">hasta</span>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Hasta</label>
            <input
              type="time"
              value={timeRange.end}
              onChange={(e) => setTimeRange(prev => ({ ...prev, end: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Método de contacto preferido */}
      <div>
        <label className="block text-lg font-semibold text-gray-900 mb-4">
          Método de contacto preferido
        </label>
        <select
          value={settings.preferred_contact_method}
          onChange={(e) => setSettings(prev => ({
            ...prev,
            preferred_contact_method: e.target.value
          }))}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="whatsapp">Solo WhatsApp</option>
          <option value="email">Solo Email</option>
          <option value="both">WhatsApp y Email</option>
        </select>
      </div>

      {/* Horarios Silenciosos */}
      <div className="border-t pt-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span className="text-2xl mr-2">🌙</span>
          Horarios Silenciosos
        </h4>
        
        <div className="space-y-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.quiet_hours_enabled}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                quiet_hours_enabled: e.target.checked
              }))}
              className="mr-3"
            />
            <span className="font-medium text-gray-700">
              Habilitar horarios silenciosos
            </span>
          </label>

          {settings.quiet_hours_enabled && (
            <div className="flex items-center space-x-4 ml-6">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Desde</label>
                <input
                  type="time"
                  value={settings.quiet_hours_start || "22:00"}
                  onChange={(e) => setSettings(prev => ({ 
                    ...prev, 
                    quiet_hours_start: e.target.value 
                  }))}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <span className="text-gray-500 pt-6">hasta</span>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Hasta</label>
                <input
                  type="time"
                  value={settings.quiet_hours_end || "08:00"}
                  onChange={(e) => setSettings(prev => ({ 
                    ...prev, 
                    quiet_hours_end: e.target.value 
                  }))}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          <p className="text-sm text-gray-600 ml-6">
            Durante estos horarios, tu coach no enviará mensajes automáticos
          </p>
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
            className="mr-3"
          />
          <span className="font-medium text-gray-700">
            Permitir mensajes proactivos (tu coach puede iniciar conversaciones)
          </span>
        </label>
      </div>
    </div>
  )

  const renderRegionalTab = () => (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-6">
        {/* País */}
        <div>
          <label className="block text-lg font-semibold text-gray-900 mb-3">
            País
          </label>
          <select
            value={profile.country}
            onChange={(e) => handleCountryChange(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {COUNTRIES.map((country) => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>
        </div>

        {/* Zona Horaria */}
        <div>
          <label className="block text-lg font-semibold text-gray-900 mb-3">
            Zona Horaria
          </label>
          <select
            value={profile.timezone}
            onChange={(e) => setProfile(prev => ({
              ...prev,
              timezone: e.target.value
            }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {TIMEZONES.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz.label} ({tz.offset})
              </option>
            ))}
          </select>
        </div>

        {/* Idioma */}
        <div>
          <label className="block text-lg font-semibold text-gray-900 mb-3">
            Idioma
          </label>
          <select
            value={profile.language}
            onChange={(e) => setProfile(prev => ({
              ...prev,
              language: e.target.value
            }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.flag} {lang.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )

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

      {/* Tabs Navigation */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            {activeTab === 'coaching-focus' && renderCoachingFocusTab()}
            {activeTab === 'personality' && renderPersonalityTab()}
            {activeTab === 'reminders' && renderRemindersTab()}
            {activeTab === 'regional' && renderRegionalTab()}
          </div>

          {/* Mensaje de confirmación */}
          {message && (
            <div className={`mt-6 p-4 rounded-md ${message.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
              {message}
            </div>
          )}

          {/* Botón de guardar */}
          <div className="flex justify-end mt-8">
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