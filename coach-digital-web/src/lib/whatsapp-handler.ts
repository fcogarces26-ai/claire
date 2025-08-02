import { createClient } from '@supabase/supabase-js';
import { sendWhatsAppMessage, extractPhoneNumber, IncomingWhatsAppMessage } from './twilio';
// Cliente de Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface ConversationMessage {
  id?: string;
  user_id: string;
  phone_number?: string;
  message_type: string; // 'incoming' | 'outgoing' - REQUERIDO
  content: string;
  sender?: 'user' | 'coach';
  metadata?: any;
  created_at?: string;
  message_sid?: string;
}

export interface UserProfile {
  id: string;
  phone_number?: string;
  name?: string;
  whatsapp_verified: boolean;
  coaching_preferences?: any;
  timezone?: string;
  created_at: string;
}

// Procesar mensaje entrante de WhatsApp
export async function handleIncomingMessage(twilioData: IncomingWhatsAppMessage) {
  try {
    const phoneNumber = extractPhoneNumber(twilioData.From);
    
    // Buscar o crear usuario
    let user = await findOrCreateUser(phoneNumber, twilioData.ProfileName);
    
    // Guardar mensaje del usuario en la BD
    await saveMessage({
      user_id: user.id,
      phone_number: phoneNumber,
      content: twilioData.Body,
      sender: 'user',
      message_type: 'incoming',
      message_sid: twilioData.MessageSid,
    });

    // Obtener historial de conversación
    const conversationHistory = await getConversationHistory(user.id);
    
    // Generar respuesta del coach con OpenAI
    const coachResponse = await generateCoachResponse(twilioData.Body, conversationHistory, user);
    
    // Enviar respuesta
    await sendWhatsAppMessage({
      to: twilioData.From,
      body: coachResponse,
    });

    // Guardar respuesta del coach en la BD
    await saveMessage({
      user_id: user.id,
      phone_number: phoneNumber,
      content: coachResponse,
      sender: 'coach',
      message_type: 'outgoing',
    });

    return { success: true, response: coachResponse };
  } catch (error) {
    console.error('Error procesando mensaje:', error);
    throw error;
  }
}

// Buscar o crear usuario
async function findOrCreateUser(phoneNumber: string, profileName?: string): Promise<UserProfile> {
  // Buscar usuario existente por teléfono
  const { data: existingProfile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('phone_number', phoneNumber)
    .single();

  if (existingProfile) {
    return existingProfile;
  }

  // Si no existe, crear en auth.users primero y luego en user_profiles
  // Nota: En un caso real, esto requiere más lógica para crear auth.users
  // Por ahora, asumimos que el usuario ya existe en auth.users
  
  // Buscar en auth.users si existe un usuario sin perfil
  const { data: authUsers } = await supabase.auth.admin.listUsers();
  const existingAuthUser = authUsers.users.find(user => 
    user.phone === phoneNumber || user.user_metadata?.phone === phoneNumber
  );

  if (existingAuthUser) {
    // Crear perfil para usuario existente
    const { data: newProfile, error } = await supabase
      .from('user_profiles')
      .insert({
        id: existingAuthUser.id,
        phone_number: phoneNumber,
        name: profileName,
        whatsapp_verified: true,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Error creando perfil: ${error.message}`);
    }

    return newProfile;
  }

  throw new Error('Usuario no encontrado. Debe registrarse primero en la plataforma.');
}

// Guardar mensaje en la base de datos
async function saveMessage(message: ConversationMessage): Promise<void> {
  const { error } = await supabase
    .from('whatsapp_interactions')
    .insert({
      user_id: message.user_id,
      message_type: message.sender === 'user' ? 'incoming' : 'outgoing',
      content: message.content,
      phone_number: message.phone_number,
      sender: message.sender,
      message_sid: message.message_sid,
      metadata: {
        timestamp: new Date().toISOString(),
        ...message.metadata
      }
    });

  if (error) {
    throw new Error(`Error guardando mensaje: ${error.message}`);
  }
}

// Obtener historial de conversación
async function getConversationHistory(userId: string, limit: number = 20): Promise<ConversationMessage[]> {
  const { data, error } = await supabase
    .from('whatsapp_interactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Error obteniendo historial: ${error.message}`);
  }

  // Convertir al formato esperado
  return data?.reverse().map(msg => ({
    id: msg.id,
    user_id: msg.user_id,
    content: msg.content,
    message_type: msg.message_type,
    sender: msg.sender || (msg.message_type === 'incoming' ? 'user' : 'coach'),
    phone_number: msg.phone_number,
    message_sid: msg.message_sid,
    created_at: msg.created_at,
    metadata: msg.metadata
  })) || [];
}

// Generar respuesta del coach usando OpenAI API directamente
async function generateCoachResponse(
  userMessage: string, 
  conversationHistory: ConversationMessage[],
  user: UserProfile
): Promise<string> {
  try {
    // Construir contexto de la conversación
    const messages = [
      {
        role: 'system',
        content: `Eres un coach personal experto que ayuda a las personas a través de WhatsApp. 
        Tu objetivo es motivar, guiar y apoyar al usuario en sus metas personales y profesionales.
        
        Características del usuario:
        - Nombre: ${user.name || 'No especificado'}
        - Teléfono: ${user.phone_number}
        
        Responde de manera empática, motivadora y práctica. Mantén tus respuestas concisas 
        pero significativas, ideales para WhatsApp (máximo 2-3 párrafos).`
      },
      // Agregar historial de conversación
      ...conversationHistory.slice(-10).map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      // Mensaje actual del usuario
      {
        role: 'user',
        content: userMessage
      }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: messages,
        max_tokens: 500,
        temperature: 0.7,
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'Lo siento, no pude generar una respuesta en este momento.';
  } catch (error) {
    console.error('Error generando respuesta:', error);
    return 'Disculpa, estoy teniendo dificultades técnicas. Por favor intenta nuevamente en unos minutos.';
  }
}

// Enviar mensaje proactivo
export async function sendProactiveMessage(userId: string, message: string): Promise<boolean> {
  try {
    // Obtener datos del usuario
    const { data: userProfile, error } = await supabase
      .from('user_profiles')
      .select('phone_number')
      .eq('id', userId)
      .single();

    if (error || !userProfile) {
      throw new Error('Usuario no encontrado');
    }

    // Enviar mensaje
    await sendWhatsAppMessage({
      to: `whatsapp:${userProfile.phone_number}`,
      body: message,
    });

    // Guardar en la BD
    await saveMessage({
      user_id: userId,
      phone_number: userProfile.phone_number,
      content: message,
      sender: 'coach',
      message_type: 'outgoing',
    });

    return true;
  } catch (error) {
    console.error('Error enviando mensaje proactivo:', error);
    return false;
  }
}