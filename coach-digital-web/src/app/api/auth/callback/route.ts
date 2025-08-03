import { createClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || 'dashboard'

  if (code) {
    const supabase = createClient()
    
    try {
      // Intercambiar el código por una sesión
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Error en auth callback:', error)
        return NextResponse.redirect(`${requestUrl.origin}/login?error=auth_callback_error`)
      }

      if (data.user) {
        // Verificar si el usuario ya tiene un perfil
        const { data: existingProfile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', data.user.id)
          .single()

        const isNewUser = !existingProfile

        // Si no existe perfil, crearlo (usuario nuevo)
        if (isNewUser) {
          const { error: profileError } = await supabase
            .from('user_profiles')
            .upsert({
              id: data.user.id,
              phone_number: data.user.user_metadata?.phone_number || null,
              whatsapp_verified: false,
              timezone: 'America/Bogota', // Default timezone
              language: 'es', // Default language
              country: 'CO' // Default country
            })

          if (profileError) {
            console.error('Error creando perfil en callback:', profileError)
          }
        }

        // Lógica de redirección:
        if (next === 'numero' && isNewUser) {
          // Usuario nuevo desde registro - configurar WhatsApp
          return NextResponse.redirect(`${requestUrl.origin}/numero`)
        } else if (next === 'dashboard' || !isNewUser) {
          // Usuario existente desde login - ir al dashboard
          return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
        } else {
          // Fallback - ir al dashboard
          return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
        }
      }
    } catch (error) {
      console.error('Error procesando callback:', error)
      return NextResponse.redirect(`${requestUrl.origin}/login?error=callback_processing_error`)
    }
  }

  // Si no hay código, redirigir a login
  return NextResponse.redirect(`${requestUrl.origin}/login?error=no_code_provided`)
}