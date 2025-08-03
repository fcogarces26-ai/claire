'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ChatSimulator from '@/components/whatsapp/chat-simulator'
import WhatsAppVerification from '@/components/whatsapp/verification'

interface User {
  id: string
  email?: string
}

interface UserProfile {
  phone_number: string | null
  whatsapp_verified: boolean
  country_code: string | null
  timezone: string
}

interface WhatsAppStats {
  totalMessages: number
  lastMessageDate: string | null
  isActive: boolean
}

// Países con sus códigos de área (movido dentro de la función donde se usa)
// const countries = [...] - removido porque no se usa

export default function NumeroPage() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile>({
    phone_number: null,
    whatsapp_verified: false,
    country_code: null,
    timezone: 'UTC'
  })
  const [stats, setStats] = useState<WhatsAppStats>({
    totalMessages: 0,
    lastMessageDate: null,
    isActive: false
  })
  const [loading, setLoading] = useState(true)
  const [currentStep, setCurrentStep] = useState<'configure' | 'verify' | 'active'>('configure')
  const router = useRouter()
  const supabase = createClient()

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

  useEffect(() => {
    const loadUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      
      setUser(user as User)

      // Cargar perfil
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileData) {
        setProfile(profileData)
        
        // Determinar el paso actual
        if (profileData.whatsapp_verified) {
          setCurrentStep('active')
        } else if (profileData.phone_number) {
          setCurrentStep('verify')
        } else {
          setCurrentStep('configure')
        }
      }

      // Cargar estadísticas de WhatsApp
      await loadWhatsAppStatsInternal(user.id)
      setLoading(false)
    }
    
    loadUserData()
  }, [supabase, router]) // Removemos loadWhatsAppStats de las dependencias

  const loadWhatsAppStatsInternal = async (userId: string) => {
    try {
      const { data: interactions } = await supabase
        .from('whatsapp_interactions')
        .select('created_at, message_type')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      const totalMessages = interactions?.length || 0
      const lastMessageDate = interactions?.[0]?.created_at || null
      const isActive = totalMessages > 0 && profile.whatsapp_verified

      setStats({
        totalMessages,
        lastMessageDate,
        isActive
      })
    } catch (error) {
      console.error('Error loading WhatsApp stats:', error)
    }
  }

  const handlePhoneVerification = async (phoneNumber: string) => {
    if (!user) return

    try {
      // Detectar código de país del número
      const countryCode = detectCountryFromPhone(phoneNumber)
      
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          phone_number: phoneNumber,
          country_code: countryCode,
          whatsapp_verified: true // El componente WhatsAppVerification ya maneja la verificación
        })

      if (error) throw error

      setProfile(prev => ({
        ...prev,
        phone_number: phoneNumber,
        country_code: countryCode,
        whatsapp_verified: true
      }))

      setCurrentStep('active')
      await loadWhatsAppStatsInternal(user.id)
    } catch (error) {
      console.error('Error updating phone:', error)
    }
  }

  const handleDisconnect = async () => {
    if (!user || !confirm('¿Estás seguro de que quieres desconectar WhatsApp?')) return

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          phone_number: null,
          whatsapp_verified: false,
          country_code: null
        })
        .eq('id', user.id)

      if (error) throw error

      setProfile(prev => ({
        ...prev,
        phone_number: null,
        whatsapp_verified: false,
        country_code: null
      }))

      setCurrentStep('configure')
    } catch (error) {
      console.error('Error disconnecting WhatsApp:', error)
    }
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
      month: 'long',
      year: 'numeric',
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
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-2xl font-bold text-blue-600">
                Coach Digital
              </Link>
              <span className="text-gray-400">→</span>
              <h1 className="text-xl font-semibold text-gray-700">WhatsApp</h1>
            </div>
            <Button variant="outline" onClick={() => router.push('/dashboard')}>
              Volver al Dashboard
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          
          {/* Status Header */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 flex items-center">
                  <span className="text-4xl mr-3">💬</span>
                  Configuración de WhatsApp
                </h2>
                <p className="text-gray-600 mt-2">
                  Conecta tu número para recibir coaching personalizado
                </p>
              </div>
              
              {currentStep === 'active' && (
                <div className="text-right">
                  <div className="flex items-center text-green-600 mb-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <span className="font-semibold">Conectado</span>
                  </div>
                  <p className="text-sm text-gray-600">{profile.phone_number}</p>
                </div>
              )}
            </div>

            {/* Progress Steps */}
            <div className="flex items-center mb-8">
              <div className={`flex items-center ${currentStep !== 'configure' ? 'text-green-600' : 'text-blue-600'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold ${currentStep !== 'configure' ? 'bg-green-500' : 'bg-blue-500'}`}>
                  {currentStep !== 'configure' ? '✓' : '1'}
                </div>
                <span className="ml-2 font-medium">Configurar Número</span>
              </div>
              
              <div className={`w-16 h-1 mx-4 ${currentStep === 'active' ? 'bg-green-500' : currentStep === 'verify' ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
              
              <div className={`flex items-center ${currentStep === 'active' ? 'text-green-600' : currentStep === 'verify' ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold ${currentStep === 'active' ? 'bg-green-500' : currentStep === 'verify' ? 'bg-blue-500' : 'bg-gray-300'}`}>
                  {currentStep === 'active' ? '✓' : '2'}
                </div>
                <span className="ml-2 font-medium">Verificar</span>
              </div>
              
              <div className={`w-16 h-1 mx-4 ${currentStep === 'active' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              
              <div className={`flex items-center ${currentStep === 'active' ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold ${currentStep === 'active' ? 'bg-green-500' : 'bg-gray-300'}`}>
                  {currentStep === 'active' ? '✓' : '3'}
                </div>
                <span className="ml-2 font-medium">¡Listo!</span>
              </div>
            </div>
          </div>

          {/* Content based on current step */}
          {(currentStep === 'configure' || currentStep === 'verify') && (
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                {currentStep === 'configure' ? 'Paso 1: Verificar tu número de WhatsApp' : 'Verificando número...'}
              </h3>
              <WhatsAppVerification 
                onVerificationSuccess={handlePhoneVerification}
                initialPhone={profile.phone_number}
                showSuccessCallback={true}
              />
            </div>
          )}

          {currentStep === 'active' && (
            <>
              {/* Stats */}
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Mensajes</h3>
                  <p className="text-3xl font-bold text-blue-600">{stats.totalMessages}</p>
                </div>
                
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Último Mensaje</h3>
                  <p className="text-sm text-gray-600">{formatLastMessageDate(stats.lastMessageDate)}</p>
                </div>
                
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Estado</h3>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-green-600 font-semibold">Activo</span>
                  </div>
                </div>
              </div>

              {/* Chat Simulator */}
              <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">
                  Prueba tu Coach
                </h3>
                <ChatSimulator 
                  userPhoneNumber={profile.phone_number}
                  showPhoneInput={false}
                />
              </div>

              {/* Management */}
              <div className="bg-white rounded-lg shadow-lg p-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">
                  Gestión de WhatsApp
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Número conectado</p>
                      <p className="text-sm text-gray-600">{profile.phone_number}</p>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => setCurrentStep('configure')}
                    >
                      Cambiar número
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                    <div>
                      <p className="font-medium text-red-900">Zona de peligro</p>
                      <p className="text-sm text-red-600">Desconectar WhatsApp permanentemente</p>
                    </div>
                    <Button 
                      variant="destructive" 
                      onClick={handleDisconnect}
                    >
                      Desconectar
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}