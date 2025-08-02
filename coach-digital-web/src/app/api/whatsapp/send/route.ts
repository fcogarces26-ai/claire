import { NextRequest, NextResponse } from 'next/server';
import { sendWhatsAppMessage, formatWhatsAppNumber } from '@/lib/twilio';
import { sendProactiveMessage } from '@/lib/whatsapp-handler';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, phoneNumber, message, type = 'direct' } = body;

    // Validar datos requeridos
    if (!message) {
      return NextResponse.json(
        { error: 'El mensaje es requerido' },
        { status: 400 }
      );
    }

    let result;

    if (type === 'proactive' && userId) {
      // Envío proactivo usando userId (busca el teléfono en la BD)
      result = await sendProactiveMessage(userId, message);
      
      if (!result) {
        return NextResponse.json(
          { error: 'Error enviando mensaje proactivo' },
          { status: 500 }
        );
      }

    } else if (type === 'direct' && phoneNumber) {
      // Envío directo usando número de teléfono
      const formattedNumber = formatWhatsAppNumber(phoneNumber);
      
      result = await sendWhatsAppMessage({
        to: formattedNumber,
        body: message,
      });

    } else {
      return NextResponse.json(
        { error: 'Se requiere userId (para proactivo) o phoneNumber (para directo)' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Mensaje enviado exitosamente',
      data: result,
    });

  } catch (error) {
    console.error('Error enviando mensaje:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Endpoint para enviar mensajes masivos (opcional)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userIds, message } = body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: 'Se requiere un array de userIds' },
        { status: 400 }
      );
    }

    if (!message) {
      return NextResponse.json(
        { error: 'El mensaje es requerido' },
        { status: 400 }
      );
    }

    // Enviar mensaje a todos los usuarios
    const results = await Promise.allSettled(
      userIds.map(userId => sendProactiveMessage(userId, message))
    );

    // Contar éxitos y fallos
    const successful = results.filter(r => r.status === 'fulfilled' && r.value === true).length;
    const failed = results.length - successful;

    return NextResponse.json({
      success: true,
      message: `Mensajes enviados: ${successful} exitosos, ${failed} fallidos`,
      data: {
        total: results.length,
        successful,
        failed,
      },
    });

  } catch (error) {
    console.error('Error enviando mensajes masivos:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}   