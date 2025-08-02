import twilio from 'twilio';

// Configuración del cliente Twilio
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_WHATSAPP_NUMBER; // formato: whatsapp:+1234567890

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