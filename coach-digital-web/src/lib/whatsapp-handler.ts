import { createClient } from '@supabase/supabase-js';
import { sendWhatsAppMessage, extractPhoneNumber, IncomingWhatsAppMessage, isTwilioConfigured } from './twilio';
import { AIMemoryProcessor } from './ai-memory-processor';

// Cliente de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Supabase no está configurado completamente');
}

const supabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// 🧠 Instancia del procesador de memoria
const memoryProcessor = new AIMemoryProcessor();

export interface ConversationMessage {
  id?: string;
  user_id: string;
  phone_number?: string;
  message_type: string; // 'incoming' | 'outgoing' - REQUERIDO
  content: string;
  sender?: 'user' | 'coach';
  metadata?: Record<string, unknown>;
  created_at?: string;
  message_sid?: string;
}

export interface UserProfile {
  id: string;
  phone_number?: string;
  name?: string;
  whatsapp_verified: boolean;
  coaching_preferences?: Record<string, unknown>;
  timezone?: string;
  created_at: string;
  coaching_focus?: string;
}

// Procesar mensaje entrante de WhatsApp
export async function handleIncomingMessage(twilioData: IncomingWhatsAppMessage) {
  try {
    // Verificar configuración de Twilio
    if (!isTwilioConfigured()) {
      console.error('Twilio no está configurado');
      return { success: false, error: 'Twilio no configurado' };
    }

    const phoneNumber = extractPhoneNumber(twilioData.From);
    
    // Buscar o crear usuario
    const user = await findOrCreateUser(phoneNumber, twilioData.ProfileName);
    
    // Guardar mensaje del usuario en la BD
    const userInteraction = await saveMessage({
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
    const coachInteraction = await saveMessage({
      user_id: user.id,
      phone_number: phoneNumber,
      content: coachResponse,
      sender: 'coach',
      message_type: 'outgoing',
    });

    // 🧠 NUEVO: Procesar memoria automáticamente
    await processMemoryExtraction({
      userMessage: twilioData.Body,
      coachResponse,
      userId: user.id,
      userInteractionId: userInteraction?.id,
      _coachInteractionId: coachInteraction?.id,
      userProfile: user
    });

    return { success: true, response: coachResponse };
  } catch (error) {
    console.error('Error procesando mensaje:', error);
    throw error;
  }
}

// 🧠 NUEVA FUNCIÓN: Procesar y extraer información para memory_notes
async function processMemoryExtraction({
  userMessage,
  coachResponse,
  userId,
  userInteractionId,
  _coachInteractionId,
  userProfile
}: {
  userMessage: string
  coachResponse: string
  userId: string
  userInteractionId?: string
  _coachInteractionId?: string
  userProfile: UserProfile
}) {
  try {
    if (!supabase) {
      console.warn('Supabase no configurado, omitiendo procesamiento de memoria');
      return;
    }

    // Obtener configuraciones del usuario para el contexto
    const { data: userSettings } = await supabase
      .from('user_settings')
      .select('communication_tone, coaching_style')
      .eq('user_id', userId)
      .single();

    // Procesar con IA para extraer información memorable
    const extractions = await memoryProcessor.processConversation({
      userMessage,
      coachResponse,
      userSettings: {
        coaching_focus: userProfile.coaching_focus,
        communication_tone: userSettings?.communication_tone
      }
    });

    // Guardar cada extracción como memory_note
    for (const extraction of extractions) {
      if (extraction.shouldStore) {
        await saveMemoryNote({
          userId,
          title: extraction.title,
          content: extraction.content,
          category: extraction.category,
          tags: extraction.tags,
          priority: extraction.priority,
          sourceInteractionId: userInteractionId,
          metadata: {
            ...extraction.metadata,
            extracted_at: new Date().toISOString(),
            ai_processed: true,
            source_interaction_id: userInteractionId
          }
        });

        console.log(`💾 Memory note saved: ${extraction.category} - ${extraction.title}`);
      }
    }

  } catch (error) {
    console.error('Error processing memory extraction:', error);
    // No fallar la conversación si hay error en memoria
  }
}

// 🧠 NUEVA FUNCIÓN: Guardar memory note en la base de datos
async function saveMemoryNote({
  userId,
  title,
  content,
  category,
  tags,
  priority,
  sourceInteractionId,
  metadata
}: {
  userId: string
  title?: string
  content: string
  category: string
  tags: string[]
  priority: number
  sourceInteractionId?: string
  metadata: Record<string, unknown>
}) {
  if (!supabase) {
    console.warn('Supabase no configurado, no se puede guardar memory note');
    return;
  }

  const { data, error } = await supabase
    .from('memory_notes')
    .insert({
      user_id: userId,
      title,
      content,
      category,
      tags,
      priority,
      source_interaction_id: sourceInteractionId,
      metadata
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving memory note:', error);
    throw error;
  }

  return data;
}

// 🧠 NUEVA FUNCIÓN: Obtener memoria relevante del usuario
async function getRelevantMemory(userId: string, userMessage: string): Promise<Record<string, unknown>[]> {
  try {
    if (!supabase) return [];

    // Buscar memory notes relevantes por keywords
    const keywords = userMessage.toLowerCase().split(' ').filter(word => word.length > 3);
    
    if (keywords.length === 0) return [];

    // Buscar en títulos y contenido
    const searchTerms = keywords.slice(0, 3); // Limitar para evitar queries muy complejas
    
    let query = supabase
      .from('memory_notes')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active');

    // Crear condición OR para buscar en title y content
    const searchConditions = searchTerms.map(term => 
      `title.ilike.%${term}%,content.ilike.%${term}%`
    ).join(',');

    if (searchConditions) {
      query = query.or(searchConditions);
    }

    const { data, error } = await query
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(3);

    if (error) {
      console.error('Error fetching relevant memory:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getRelevantMemory:', error);
    return [];
  }
}

// Buscar o crear usuario
async function findOrCreateUser(phoneNumber: string, profileName?: string): Promise<UserProfile> {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }

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
async function saveMessage(message: ConversationMessage): Promise<ConversationMessage | undefined> {
  if (!supabase) {
    console.warn('Supabase no está configurado, no se puede guardar mensaje');
    return;
  }

  const { data, error } = await supabase
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
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Error guardando mensaje: ${error.message}`);
  }

  return data;
}

// Obtener historial de conversación
async function getConversationHistory(userId: string, limit: number = 20): Promise<ConversationMessage[]> {
  if (!supabase) {
    console.warn('Supabase no está configurado, retornando historial vacío');
    return [];
  }

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

// Generar respuesta del coach usando OpenAI API directamente - MEJORADO con memoria
async function generateCoachResponse(
  userMessage: string, 
  conversationHistory: ConversationMessage[],
  user: UserProfile
): Promise<string> {
  try {
    // 🧠 NUEVO: Obtener memoria relevante del usuario
    const relevantMemory = await getRelevantMemory(user.id, userMessage);
    
    // Construir contexto con memoria
    let memoryContext = '';
    if (relevantMemory.length > 0) {
      memoryContext = '\n\nInformación relevante sobre el usuario:\n' + 
        relevantMemory.map(note => 
          `- ${(note.category as string).toUpperCase()}: ${note.title || (note.content as string).substring(0, 100)}`
        ).join('\n');
    }

    // Construir contexto de la conversación
    const messages = [
      {
        role: 'system',
        content: `Eres un coach personal experto que ayuda a las personas a través de WhatsApp. 
        Tu objetivo es motivar, guiar y apoyar al usuario en sus metas personales y profesionales.
        
        Características del usuario:
        - Nombre: ${user.name || 'No especificado'}
        - Teléfono: ${user.phone_number}
        ${memoryContext}
        
        Responde de manera empática, motivadora y práctica. Mantén tus respuestas concisas 
        pero significativas, ideales para WhatsApp (máximo 2-3 párrafos). 
        
        Si tienes información previa del usuario, úsala para personalizar tu respuesta.`
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
    // Verificar configuración de Twilio
    if (!isTwilioConfigured()) {
      console.error('Twilio no está configurado');
      return false;
    }

    // Verificar configuración de Supabase
    if (!supabase) {
      console.error('Supabase no está configurado');
      return false;
    }

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