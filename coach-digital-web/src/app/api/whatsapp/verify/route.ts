import { NextRequest, NextResponse } from 'next/server';
import { verifyPhoneNumber, formatWhatsAppNumber } from '@/lib/twilio';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber } = body;

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'El número de teléfono es requerido' },
        { status: 400 }
      );
    }

    // Verificar el número
    const isValid = await verifyPhoneNumber(phoneNumber);
    
    if (!isValid) {
      return NextResponse.json(
        { 
          valid: false,
          error: 'Número de teléfono inválido',
          phoneNumber 
        },
        { status: 400 }
      );
    }

    // Formatear para WhatsApp
    const formattedNumber = formatWhatsAppNumber(phoneNumber);

    return NextResponse.json({
      valid: true,
      phoneNumber: phoneNumber,
      whatsappFormat: formattedNumber,
      message: 'Número verificado exitosamente',
    });

  } catch (error) {
    console.error('Error verificando número:', error);
    return NextResponse.json(
      { 
        valid: false,
        error: 'Error verificando el número de teléfono' 
      },
      { status: 500 }
    );
  }
}

// Endpoint GET para verificar el estado del servicio
export async function GET() {
  return NextResponse.json({
    service: 'WhatsApp Phone Verification',
    status: 'active',
    timestamp: new Date().toISOString(),
  });
}