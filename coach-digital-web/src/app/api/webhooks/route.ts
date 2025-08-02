import { NextRequest, NextResponse } from 'next/server';
import { handleIncomingMessage } from '@/lib/whatsapp-handler';
import { IncomingWhatsAppMessage } from '@/lib/twilio';

export async function POST(request: NextRequest) {
  try {
    // Obtener datos del formulario
    const formData = await request.formData();
    
    // Convertir FormData a objeto
    const twilioData: IncomingWhatsAppMessage = {
      MessageSid: formData.get('MessageSid') as string,
      AccountSid: formData.get('AccountSid') as string,
      From: formData.get('From') as string,
      To: formData.get('To') as string,
      Body: formData.get('Body') as string || '',
      NumMedia: formData.get('NumMedia') as string || '0',
      MediaUrl0: formData.get('MediaUrl0') as string,
      MediaContentType0: formData.get('MediaContentType0') as string,
      ProfileName: formData.get('ProfileName') as string,
      WaId: formData.get('WaId') as string,
    };

    console.log('Mensaje recibido de WhatsApp:', {
      from: twilioData.From,
      body: twilioData.Body,
      profileName: twilioData.ProfileName,
    });

    // Validar que es un mensaje de WhatsApp
    if (!twilioData.From.startsWith('whatsapp:')) {
      return NextResponse.json(
        { error: 'No es un mensaje de WhatsApp' },
        { status: 400 }
      );
    }

    // Procesar mensaje
    const result = await handleIncomingMessage(twilioData);

    console.log('Mensaje procesado exitosamente:', result);

    // Responder a Twilio con TwiML vacío (200 OK)
    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      {
        status: 200,
        headers: {
          'Content-Type': 'text/xml',
        },
      }
    );

  } catch (error) {
    console.error('Error en webhook de WhatsApp:', error);
    
    // Importante: Siempre responder 200 a Twilio para evitar reintentos
    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      {
        status: 200,
        headers: {
          'Content-Type': 'text/xml',
        },
      }
    );
  }
}

// Endpoint para verificación del webhook (GET)
export async function GET() {
  return NextResponse.json({ 
    status: 'WhatsApp webhook activo',
    timestamp: new Date().toISOString(),
  });
}