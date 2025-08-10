// src/lib/ai-memory-processor.ts

interface MemoryExtraction {
  shouldStore: boolean
  category: 'goals' | 'reminders' | 'ideas' | 'projects' | 'feelings' | 'insights' | 'general'
  title?: string
  content: string
  tags: string[]
  priority: number
  metadata: {
    context?: string
    reminderDate?: string
    goalDeadline?: string
    projectStatus?: string
    emotionalState?: string
  }
}

interface ConversationContext {
  userMessage: string
  coachResponse: string
  previousContext?: string
  userSettings?: {
    coaching_focus?: string
    communication_tone?: string
  }
}

export class AIMemoryProcessor {
  
  /**
   * Analiza una conversación y determina si debe generar memory_notes
   */
  async processConversation(context: ConversationContext): Promise<MemoryExtraction[]> {
    const extractions: MemoryExtraction[] = []
    
    // Analizar mensaje del usuario
    const userExtraction = await this.analyzeUserMessage(context)
    if (userExtraction) {
      extractions.push(userExtraction)
    }
    
    // Analizar respuesta del coach si contiene información importante
    const coachExtraction = await this.analyzeCoachResponse(context)
    if (coachExtraction) {
      extractions.push(coachExtraction)
    }
    
    return extractions
  }

  /**
   * Analiza el mensaje del usuario para extraer información memorizable
   */
  private async analyzeUserMessage(context: ConversationContext): Promise<MemoryExtraction | null> {
    const message = context.userMessage.toLowerCase().trim()
    
    // Filtrar mensajes muy cortos o saludos
    if (message.length < 10 || this.isGreetingOrSmallTalk(message)) {
      return null
    }

    // Detectar objetivos
    if (this.containsGoalKeywords(message)) {
      return {
        shouldStore: true,
        category: 'goals',
        title: this.extractGoalTitle(context.userMessage),
        content: context.userMessage,
        tags: this.extractTags(context.userMessage, 'goals'),
        priority: this.calculatePriority(context.userMessage, 'goals'),
        metadata: {
          context: 'objetivo_mencionado_por_usuario',
          goalDeadline: this.extractDateMention(context.userMessage)
        }
      }
    }

    // Detectar recordatorios
    if (this.containsReminderKeywords(message)) {
      return {
        shouldStore: true,
        category: 'reminders',
        title: this.extractReminderTitle(context.userMessage),
        content: context.userMessage,
        tags: this.extractTags(context.userMessage, 'reminders'),
        priority: this.calculatePriority(context.userMessage, 'reminders'),
        metadata: {
          context: 'recordatorio_solicitado',
          reminderDate: this.extractDateMention(context.userMessage)
        }
      }
    }

    // Detectar ideas o insights
    if (this.containsIdeaKeywords(message)) {
      return {
        shouldStore: true,
        category: 'ideas',
        title: this.extractIdeaTitle(context.userMessage),
        content: context.userMessage,
        tags: this.extractTags(context.userMessage, 'ideas'),
        priority: this.calculatePriority(context.userMessage, 'ideas'),
        metadata: {
          context: 'idea_compartida'
        }
      }
    }

    // Detectar proyectos
    if (this.containsProjectKeywords(message)) {
      return {
        shouldStore: true,
        category: 'projects',
        title: this.extractProjectTitle(context.userMessage),
        content: context.userMessage,
        tags: this.extractTags(context.userMessage, 'projects'),
        priority: this.calculatePriority(context.userMessage, 'projects'),
        metadata: {
          context: 'proyecto_mencionado',
          projectStatus: this.extractProjectStatus(context.userMessage)
        }
      }
    }

    // Detectar sentimientos importantes
    if (this.containsEmotionalContent(message)) {
      return {
        shouldStore: true,
        category: 'feelings',
        title: this.extractEmotionalTitle(context.userMessage),
        content: context.userMessage,
        tags: this.extractTags(context.userMessage, 'feelings'),
        priority: this.calculatePriority(context.userMessage, 'feelings'),
        metadata: {
          context: 'estado_emocional',
          emotionalState: this.extractEmotionalState(context.userMessage)
        }
      }
    }

    // Si no encaja en categorías específicas pero es contenido sustancial
    if (message.length > 50 && this.isSubstantialContent(message)) {
      return {
        shouldStore: true,
        category: 'general',
        title: this.extractGeneralTitle(context.userMessage),
        content: context.userMessage,
        tags: this.extractTags(context.userMessage, 'general'),
        priority: 3,
        metadata: {
          context: 'conversacion_general'
        }
      }
    }

    return null
  }

  /**
   * Analiza la respuesta del coach para extraer compromisos o planes
   */
  private async analyzeCoachResponse(context: ConversationContext): Promise<MemoryExtraction | null> {
    const response = context.coachResponse.toLowerCase()
    
    // Detectar cuando el coach establece un plan o compromiso
    if (this.coachSuggestsAction(response)) {
      return {
        shouldStore: true,
        category: 'reminders',
        title: 'Plan sugerido por el coach',
        content: context.coachResponse,
        tags: ['plan_coach', 'seguimiento'],
        priority: 7,
        metadata: {
          context: 'plan_del_coach',
          reminderDate: this.extractDateMention(context.coachResponse)
        }
      }
    }

    return null
  }

  // ===== MÉTODOS DE DETECCIÓN =====

  private isGreetingOrSmallTalk(message: string): boolean {
    const greetingPatterns = [
      /^(hola|hi|hello|hey|buenas|buenos días|buenas tardes|buenas noches)$/i,
      /^(gracias|thank you|ok|vale|perfecto|genial)$/i,
      /^(sí|si|no|maybe|quizás)$/i
    ]
    return greetingPatterns.some(pattern => pattern.test(message))
  }

  private containsGoalKeywords(message: string): boolean {
    const goalKeywords = [
      'quiero', 'mi objetivo', 'mi meta', 'propósito', 'lograr', 'conseguir',
      'alcanzar', 'planear', 'objetivo de', 'meta de', 'aspiro', 'busco',
      'pretendo', 'espero lograr', 'mi plan es'
    ]
    return goalKeywords.some(keyword => message.includes(keyword))
  }

  private containsReminderKeywords(message: string): boolean {
    const reminderKeywords = [
      'recordar', 'no olvides', 'recuérdame', 'tengo que', 'debo',
      'necesito hacer', 'mañana', 'la próxima semana', 'el lunes',
      'recordatorio', 'avísame', 'que no se me olvide'
    ]
    return reminderKeywords.some(keyword => message.includes(keyword))
  }

  private containsIdeaKeywords(message: string): boolean {
    const ideaKeywords = [
      'se me ocurre', 'tengo una idea', 'qué tal si', 'podría', 'pienso que',
      'se me ocurrió', 'una idea sería', 'tal vez podríamos', 'insight',
      'reflexión', 'me di cuenta'
    ]
    return ideaKeywords.some(keyword => message.includes(keyword))
  }

  private containsProjectKeywords(message: string): boolean {
    const projectKeywords = [
      'proyecto', 'trabajando en', 'desarrollando', 'construyendo',
      'creando', 'iniciativa', 'emprendimiento', 'startup', 'negocio',
      'colaboración', 'equipo'
    ]
    return projectKeywords.some(keyword => message.includes(keyword))
  }

  private containsEmotionalContent(message: string): boolean {
    const emotionalKeywords = [
      'me siento', 'estoy', 'me encuentro', 'emocionalmente', 'ansiedad',
      'estrés', 'feliz', 'triste', 'frustrado', 'motivado', 'desanimado',
      'preocupado', 'entusiasmado', 'nervioso', 'relajado'
    ]
    return emotionalKeywords.some(keyword => message.includes(keyword))
  }

  private coachSuggestsAction(response: string): boolean {
    const actionPatterns = [
      'te sugiero', 'recomiendo que', 'podrías', 'sería bueno que',
      'vamos a', 'plan:', 'próximos pasos', 'te propongo'
    ]
    return actionPatterns.some(pattern => response.includes(pattern))
  }

  private isSubstantialContent(message: string): boolean {
    // Verificar que no sea solo preguntas simples o respuestas cortas
    const substantialIndicators = [
      message.split(' ').length > 10,
      message.includes('.') || message.includes(','),
      /[a-zA-Z]/.test(message) // Contiene letras
    ]
    return substantialIndicators.filter(Boolean).length >= 2
  }

  // ===== MÉTODOS DE EXTRACCIÓN =====

  private extractGoalTitle(message: string): string {
    // Intentar extraer una versión corta del objetivo
    const goalMatch = message.match(/(quiero|mi objetivo es|mi meta es)\s+(.{1,50})/i)
    if (goalMatch) {
      return goalMatch[2].trim().split('.')[0]
    }
    return message.length > 50 ? message.substring(0, 50) + '...' : message
  }

  private extractReminderTitle(message: string): string {
    const reminderMatch = message.match(/(recordar|recuérdame|tengo que|debo)\s+(.{1,50})/i)
    if (reminderMatch) {
      return reminderMatch[2].trim().split('.')[0]
    }
    return message.length > 50 ? message.substring(0, 50) + '...' : message
  }

  private extractIdeaTitle(message: string): string {
    const ideaMatch = message.match(/(idea|se me ocurre|pienso que)\s+(.{1,50})/i)
    if (ideaMatch) {
      return ideaMatch[2].trim().split('.')[0]
    }
    return 'Nueva idea'
  }

  private extractProjectTitle(message: string): string {
    const projectMatch = message.match(/(proyecto|trabajando en|desarrollando)\s+(.{1,50})/i)
    if (projectMatch) {
      return projectMatch[2].trim().split('.')[0]
    }
    return 'Proyecto mencionado'
  }

  private extractEmotionalTitle(message: string): string {
    const emotionMatch = message.match(/(me siento|estoy)\s+(.{1,30})/i)
    if (emotionMatch) {
      return `Estado: ${emotionMatch[2].trim().split('.')[0]}`
    }
    return 'Estado emocional'
  }

  private extractGeneralTitle(message: string): string {
    return message.length > 50 ? message.substring(0, 50) + '...' : message
  }

  private extractTags(message: string, category: string): string[] {
    const tags: string[] = [category]
    
    // Tags específicos por categoría
    if (category === 'goals') {
      if (message.includes('ejercicio') || message.includes('fitness')) tags.push('salud')
      if (message.includes('trabajo') || message.includes('carrera')) tags.push('profesional')
      if (message.includes('dinero') || message.includes('financiero')) tags.push('finanzas')
    }
    
    if (category === 'projects') {
      if (message.includes('personal')) tags.push('personal')
      if (message.includes('trabajo')) tags.push('trabajo')
      if (message.includes('startup') || message.includes('negocio')) tags.push('emprendimiento')
    }

    // Tags de urgencia
    if (message.includes('urgente') || message.includes('importante')) {
      tags.push('urgente')
    }

    return tags
  }

  private calculatePriority(message: string, category: string): number {
    let priority = 5 // Prioridad base

    // Ajustar por categoría
    if (category === 'goals') priority = 7
    if (category === 'reminders') priority = 6
    if (category === 'feelings') priority = 4

    // Ajustar por palabras clave de urgencia
    if (message.includes('urgente') || message.includes('hoy')) priority += 2
    if (message.includes('importante') || message.includes('prioridad')) priority += 1
    if (message.includes('mañana') || message.includes('esta semana')) priority += 1

    return Math.min(10, Math.max(1, priority))
  }

  private extractDateMention(message: string): string | undefined {
    const datePatterns = [
      /mañana/i,
      /pasado mañana/i,
      /la próxima semana/i,
      /el próximo (lunes|martes|miércoles|jueves|viernes|sábado|domingo)/i,
      /en (\d+) días?/i,
      /(\d{1,2})\/(\d{1,2})/,
      /(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/i
    ]

    for (const pattern of datePatterns) {
      const match = message.match(pattern)
      if (match) {
        return match[0]
      }
    }

    return undefined
  }

  private extractProjectStatus(message: string): string {
    if (message.includes('empezando') || message.includes('iniciando')) return 'iniciado'
    if (message.includes('progreso') || message.includes('avanzando')) return 'en_progreso'
    if (message.includes('terminando') || message.includes('finalizando')) return 'finalizando'
    if (message.includes('terminé') || message.includes('completé')) return 'completado'
    return 'activo'
  }

  private extractEmotionalState(message: string): string {
    const emotions = {
      'feliz': ['feliz', 'contento', 'alegre', 'bien', 'genial'],
      'triste': ['triste', 'deprimido', 'bajo', 'mal'],
      'ansioso': ['ansioso', 'nervioso', 'preocupado', 'estresado'],
      'motivado': ['motivado', 'energético', 'entusiasmado', 'inspirado'],
      'frustrado': ['frustrado', 'molesto', 'irritado', 'enojado']
    }

    for (const [emotion, keywords] of Object.entries(emotions)) {
      if (keywords.some(keyword => message.includes(keyword))) {
        return emotion
      }
    }

    return 'neutral'
  }
}