import twilio from 'twilio';

// Configuración del cliente Twilio
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_WHATSAPP_NUMBER; // formato: whatsapp:+1234567890
const twilioSmsNumber = process.env.TWILIO_PHONE_NUMBER; // formato: +1234567890 (para SMS)

// Cliente de Twilio (solo se inicializa si las variables están disponibles)
export const twilioClient = accountSid && authToken ? twilio(accountSid, authToken) : null;

// Función para verificar si Twilio está configurado
export function isTwilioConfigured(): boolean {
  return !!(accountSid && authToken && twilioPhoneNumber);
}

// Tipos para mensajes de WhatsApp
export interface WhatsAppMessage {
  to: string; // formato: whatsapp:+1234567890
  from?: string;
  body: string;
  mediaUrl?: string[];
}

export interface IncomingWhatsAppMessage {
  MessageSid: string;
  AccountSid: string;
  From: string; // formato: whatsapp:+1234567890
  To: string;
  Body: string;
  NumMedia: string;
  MediaUrl0?: string;
  MediaContentType0?: string;
  ProfileName?: string;
  WaId: string; // WhatsApp ID del usuario
}

// Función para enviar mensaje de WhatsApp
export async function sendWhatsAppMessage(message: WhatsAppMessage): Promise<unknown> {
  if (!twilioClient || !twilioPhoneNumber) {
    throw new Error('Twilio no está configurado. Verifica las variables de entorno.');
  }

  try {
    const result = await twilioClient.messages.create({
      from: message.from || twilioPhoneNumber,
      to: message.to,
      body: message.body,
      mediaUrl: message.mediaUrl,
    });
    
    console.log('Mensaje enviado:', result.sid);
    return result;
  } catch (error) {
    console.error('Error enviando mensaje:', error);
    throw error;
  }
}

// Función para verificar número de teléfono
export async function verifyPhoneNumber(phoneNumber: string): Promise<boolean> {
  if (!twilioClient) {
    console.warn('Twilio no está configurado. Retornando verificación simulada.');
    return true; // En desarrollo, simular que es válido
  }

  try {
    const lookup = await twilioClient.lookups.v1.phoneNumbers(phoneNumber).fetch();
    return lookup.phoneNumber !== null;
  } catch (error) {
    console.error('Error verificando número:', error);
    return false;
  }
}

// Función para formatear número de teléfono para WhatsApp
export function formatWhatsAppNumber(phoneNumber: string): string {
  // Remover espacios, guiones y paréntesis
  const cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '');
  
  // Agregar + si no lo tiene
  const withPlus = cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
  
  // Formato para WhatsApp
  return `whatsapp:${withPlus}`;
}

// Función para extraer número limpio del formato WhatsApp
export function extractPhoneNumber(whatsappNumber: string): string {
  return whatsappNumber.replace('whatsapp:', '');
}

// ========== NUEVAS FUNCIONES DE VERIFICACIÓN ==========

/**
 * Envía un código de verificación via SMS al número de teléfono
 */
export async function sendVerificationCode(phoneNumber: string): Promise<{
  success: boolean;
  error?: string;
  sid?: string;
}> {
  if (!twilioClient) {
    console.warn('Twilio no está configurado. Simulando envío de código.');
    // En desarrollo, simular envío exitoso
    return {
      success: true,
      sid: 'simulated_' + Date.now()
    };
  }

  if (!twilioSmsNumber) {
    return {
      success: false,
      error: 'Número SMS de Twilio no configurado. Agrega TWILIO_PHONE_NUMBER al .env'
    };
  }

  try {
    // Limpiar y formatear el número
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    const formattedNumber = cleanNumber.startsWith('+') ? cleanNumber : `+${cleanNumber}`;

    // Generar código de 6 dígitos
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Mensaje de verificación
    const message = `Tu código de verificación para Coach Digital es: ${verificationCode}. No lo compartas con nadie.`;

    // Enviar SMS usando Twilio
    const result = await twilioClient.messages.create({
      body: message,
      from: twilioSmsNumber,
      to: formattedNumber,
    });

    // Guardar el código temporalmente en memoria global
    if (typeof global === 'undefined') {
      (global as any) = {};
    }
    if (!(global as any).verificationCodes) {
      (global as any).verificationCodes = new Map();
    }
    
    // Guardar código con expiración de 10 minutos
    (global as any).verificationCodes.set(formattedNumber, {
      code: verificationCode,
      expires: Date.now() + 10 * 60 * 1000, // 10 minutos
      attempts: 0 // Contador de intentos
    });

    console.log(`Código de verificación enviado a ${formattedNumber}: ${verificationCode}`);

    return {
      success: true,
      sid: result.sid
    };

  } catch (error) {
    console.error('Error enviando código de verificación:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido enviando SMS'
    };
  }
}

/**
 * Verifica el código ingresado por el usuario
 */
export async function checkVerificationCode(phoneNumber: string, inputCode: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Limpiar y formatear el número
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    const formattedNumber = cleanNumber.startsWith('+') ? cleanNumber : `+${cleanNumber}`;

    // Obtener código guardado
    if (typeof global === 'undefined') {
      (global as any) = {};
    }
    if (!(global as any).verificationCodes) {
      return {
        success: false,
        error: 'No se encontró código de verificación para este número'
      };
    }

    const storedData = (global as any).verificationCodes.get(formattedNumber);
    
    if (!storedData) {
      return {
        success: false,
        error: 'No se encontró código de verificación para este número'
      };
    }

    // Verificar si el código expiró
    if (Date.now() > storedData.expires) {
      (global as any).verificationCodes.delete(formattedNumber);
      return {
        success: false,
        error: 'El código de verificación ha expirado'
      };
    }

    // Incrementar contador de intentos
    storedData.attempts = (storedData.attempts || 0) + 1;

    // Limitar intentos (máximo 5)
    if (storedData.attempts > 5) {
      (global as any).verificationCodes.delete(formattedNumber);
      return {
        success: false,
        error: 'Demasiados intentos fallidos. Solicita un nuevo código'
      };
    }

    // Verificar si el código coincide
    if (storedData.code !== inputCode.trim()) {
      // Actualizar datos con el nuevo número de intentos
      (global as any).verificationCodes.set(formattedNumber, storedData);
      
      return {
        success: false,
        error: `Código incorrecto. Intentos restantes: ${5 - storedData.attempts}`
      };
    }

    // Código correcto - limpiar de memoria
    (global as any).verificationCodes.delete(formattedNumber);

    console.log(`Código verificado exitosamente para ${formattedNumber}`);

    return {
      success: true
    };

  } catch (error) {
    console.error('Error verificando código:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido verificando código'
    };
  }
}

/**
 * Limpia códigos de verificación expirados (función de limpieza)
 */
export function cleanExpiredVerificationCodes(): void {
  if (typeof global !== 'undefined' && (global as any).verificationCodes) {
    const codes = (global as any).verificationCodes;
    const now = Date.now();
    
    for (const [phoneNumber, data] of codes.entries()) {
      if (now > data.expires) {
        codes.delete(phoneNumber);
        console.log(`Código expirado eliminado para: ${phoneNumber}`);
      }
    }
  }
}

/**
 * Obtiene estadísticas de códigos activos (para debugging)
 */
export function getVerificationStats(): {
  activeCodes: number;
  phoneNumbers: string[];
} {
  if (typeof global === 'undefined' || !(global as any).verificationCodes) {
    return { activeCodes: 0, phoneNumbers: [] };
  }

  const codes = (global as any).verificationCodes;
  return {
    activeCodes: codes.size,
    phoneNumbers: Array.from(codes.keys())
  };
}