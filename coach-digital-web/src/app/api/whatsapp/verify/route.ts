import { NextRequest, NextResponse } from 'next/server';
import { 
  verifyPhoneNumber, 
  formatWhatsAppNumber, 
  sendVerificationCode, 
  checkVerificationCode 
} from '@/lib/twilio';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber, action, code } = body;

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'El número de teléfono es requerido' },
        { status: 400 }
      );
    }

    // Acción: Enviar código de verificación
    if (action === 'send_code') {
      try {
        // Primero verificar que el número sea válido
        const isValid = await verifyPhoneNumber(phoneNumber);
        
        if (!isValid) {
          return NextResponse.json(
            { 
              success: false,
              error: 'Número de teléfono inválido o no es un número de WhatsApp',
              phoneNumber 
            },
            { status: 400 }
          );
        }

        // Enviar código de verificación via SMS
        const verificationResult = await sendVerificationCode(phoneNumber);
        
        if (verificationResult.success) {
          return NextResponse.json({
            success: true,
            codeSent: true,
            phoneNumber: phoneNumber,
            message: 'Código de verificación enviado exitosamente',
            sid: verificationResult.sid
          });
        } else {
          return NextResponse.json(
            { 
              success: false,
              error: verificationResult.error || 'Error enviando código de verificación'
            },
            { status: 400 }
          );
        }
        
      } catch (error) {
        console.error('Error enviando código:', error);
        return NextResponse.json(
          { 
            success: false,
            error: 'Error del servicio al enviar código de verificación'
          },
          { status: 500 }
        );
      }
    }

    // Acción: Verificar código
    if (action === 'verify_code') {
      if (!code) {
        return NextResponse.json(
          { error: 'El código de verificación es requerido' },
          { status: 400 }
        );
      }

      try {
        // Verificar el código usando la función de Twilio
        const codeVerification = await checkVerificationCode(phoneNumber, code);
        
        if (codeVerification.success) {
          const formattedWhatsAppNumber = formatWhatsAppNumber(phoneNumber);
          
          return NextResponse.json({
            success: true,
            verified: true,
            phoneNumber: phoneNumber,
            whatsappFormat: formattedWhatsAppNumber,
            message: 'Número verificado exitosamente'
          });
        } else {
          return NextResponse.json(
            { 
              success: false,
              error: codeVerification.error || 'Código de verificación incorrecto'
            },
            { status: 400 }
          );
        }
        
      } catch (error) {
        console.error('Error verificando código:', error);
        return NextResponse.json(
          { 
            success: false,
            error: 'Error del servicio al verificar código'
          },
          { status: 500 }
        );
      }
    }

    // Verificación básica sin código (comportamiento original)
    if (!action) {
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

      const formattedNumber = formatWhatsAppNumber(phoneNumber);

      return NextResponse.json({
        valid: true,
        phoneNumber: phoneNumber,
        whatsappFormat: formattedNumber,
        message: 'Número verificado exitosamente',
      });
    }

    // Acción no reconocida
    return NextResponse.json(
      { error: 'Acción no válida. Usa "send_code" o "verify_code"' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error en API de verificación:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Error interno del servidor'
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
    actions: ['send_code', 'verify_code', 'basic_validation']
  });
}