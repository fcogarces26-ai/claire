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
          .select('onboarding_completed, whatsapp_verified')
          .eq('id', data.user.id)
          .single()

        const isNewUser = !existingProfile

        // Si no existe perfil, el trigger lo creará automáticamente
        // Pero podemos agregar información adicional del OAuth
        if (isNewUser && data.user.user_metadata) {
          const { error: profileError } = await supabase
            .from('user_profiles')
            .update({
              name: data.user.user_metadata.full_name || data.user.user_metadata.name,
              avatar_url: data.user.user_metadata.avatar_url,
              updated_at: new Date().toISOString()
            })
            .eq('id', data.user.id)

          if (profileError) {
            console.error('Error actualizando perfil OAuth:', profileError)
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