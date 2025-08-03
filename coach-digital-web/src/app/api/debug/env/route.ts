// Crea este archivo: src/app/api/debug/env/route.ts

import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID ? '✅ Configurado' : '❌ Faltante',
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN ? '✅ Configurado' : '❌ Faltante',
    TWILIO_WHATSAPP_NUMBER: process.env.TWILIO_WHATSAPP_NUMBER ? '✅ Configurado' : '❌ Faltante',
    TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER ? '✅ Configurado' : '❌ Faltante',
    // Valores reales (solo para debug - ELIMINAR después)
    TWILIO_PHONE_NUMBER_VALUE: process.env.TWILIO_PHONE_NUMBER || 'undefined',
    TWILIO_WHATSAPP_NUMBER_VALUE: process.env.TWILIO_WHATSAPP_NUMBER || 'undefined'
  })
}