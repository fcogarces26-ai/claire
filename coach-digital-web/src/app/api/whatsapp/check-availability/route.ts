// Crear archivo: src/app/api/whatsapp/check-availability/route.ts

import { createClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, email } = await request.json()
    const supabase = createClient()

    // Obtener usuario actual para excluirlo de la búsqueda
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      )
    }

    // Verificar disponibilidad de número de teléfono
    if (phoneNumber) {
      console.log('🔍 Verificando disponibilidad del número:', phoneNumber)
      
      const { data: existingPhoneUser, error: phoneError } = await supabase
        .from('user_profiles')
        .select('id, phone_number')
        .eq('phone_number', phoneNumber.trim())
        .neq('id', user.id) // Excluir al usuario actual
        .single()

      if (phoneError && phoneError.code !== 'PGRST116') {
        console.error('Error verificando número:', phoneError)
        return NextResponse.json(
          { error: 'Error verificando disponibilidad del número' },
          { status: 500 }
        )
      }

      if (existingPhoneUser) {
        console.log('❌ Número ya en uso por otro usuario')
        return NextResponse.json({
          available: false,
          field: 'phone',
          message: 'Este número de WhatsApp ya está registrado por otro usuario'
        })
      }

      console.log('✅ Número disponible')
      return NextResponse.json({
        available: true,
        field: 'phone',
        message: 'Número disponible'
      })
    }

    // Verificar disponibilidad de email
    if (email) {
      console.log('🔍 Verificando disponibilidad del email:', email)
      
      const { data: existingEmailUser, error: emailError } = await supabase
        .from('user_profiles')
        .select('id, email')
        .eq('email', email.trim().toLowerCase())
        .neq('id', user.id) // Excluir al usuario actual
        .single()

      if (emailError && emailError.code !== 'PGRST116') {
        console.error('Error verificando email:', emailError)
        return NextResponse.json(
          { error: 'Error verificando disponibilidad del email' },
          { status: 500 }
        )
      }

      if (existingEmailUser) {
        console.log('❌ Email ya en uso por otro usuario')
        return NextResponse.json({
          available: false,
          field: 'email',
          message: 'Este email ya está registrado por otro usuario'
        })
      }

      console.log('✅ Email disponible')
      return NextResponse.json({
        available: true,
        field: 'email',
        message: 'Email disponible'
      })
    }

    return NextResponse.json(
      { error: 'Se requiere phoneNumber o email' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error en check-availability:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}