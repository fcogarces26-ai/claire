// Crear archivo: src/app/api/auth/check-email/route.ts

import { createClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email es requerido' },
        { status: 400 }
      )
    }

    const supabase = createClient()
    
    console.log('🔍 Verificando disponibilidad del email:', email)

    // Como no podemos acceder directamente a auth.users, verificamos en user_profiles
    const { data: profileUsers, error: profileError } = await supabase
      .from('user_profiles')
      .select('email')
      .eq('email', email.trim().toLowerCase())
      .limit(1)

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error verificando email en perfiles:', profileError)
      return NextResponse.json(
        { error: 'Error verificando disponibilidad del email' },
        { status: 500 }
      )
    }

    const emailExists = profileUsers && profileUsers.length > 0

    if (emailExists) {
      console.log('❌ Email ya está en uso')
      return NextResponse.json({
        available: false,
        message: 'Este email ya está registrado'
      })
    }

    console.log('✅ Email disponible')
    return NextResponse.json({
      available: true,
      message: 'Email disponible'
    })

  } catch (error) {
    console.error('Error en check-email:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}