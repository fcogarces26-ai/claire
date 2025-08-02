import { Twilio } from 'twilio';

// Configuración del cliente Twilio
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_WHATSAPP_NUMBER; // formato: whatsapp:+1234567890

if (!accountSid || !authToken || !twilioPhoneNumber) {
  throw new Error('Faltan variables de entorno de Twilio');
}

export const twilioClient = new Twilio(accountSid, authToken);

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
export async function sendWhatsAppMessage(message: WhatsAppMessage): Promise<any> {
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