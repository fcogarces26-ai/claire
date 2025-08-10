// Crear archivo: src/app/api/debug/profile/route.ts

import { createClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(_request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Obtener usuario actual
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({
        error: 'No authenticated user',
        userError: userError?.message
      }, { status: 401 })
    }

    // Intentar obtener perfil
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    // Intentar crear/actualizar perfil de prueba
    const testData = {
      phone_number: '+1234567890',
      whatsapp_verified: false,
      updated_at: new Date().toISOString()
    }

    const { data: updateResult, error: updateError } = await supabase
      .from('user_profiles')
      .upsert({
        id: user.id,
        email: user.email,
        ...testData
      })
      .select()

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      },
      existingProfile: profile,
      profileError: profileError?.message,
      testUpdate: {
        data: updateResult,
        error: updateError?.message,
        errorCode: updateError?.code,
        errorDetails: updateError?.details
      }
    })

  } catch (error) {
    return NextResponse.json({
      error: 'Server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}