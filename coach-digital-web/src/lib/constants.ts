// src/lib/constants.ts

export interface Country {
  code: string
  name: string
  timezone: string
  language: string
  dialCode?: string
}

export interface Timezone {
  value: string
  label: string
  offset: string
}

export interface Language {
  code: string
  name: string
  flag: string
}

export interface CoachingFocus {
  value: string
  label: string
  description: string
  icon: string
  category?: string
}

export interface CommunicationTone {
  value: string
  label: string
  emoji: string
  description: string
  category?: string
}

// Países disponibles (expandible)
export const COUNTRIES: Country[] = [
  { 
    code: 'CO', 
    name: 'Colombia', 
    timezone: 'America/Bogota', 
    language: 'es',
    dialCode: '+57'
  },
  { 
    code: 'MX', 
    name: 'México', 
    timezone: 'America/Mexico_City', 
    language: 'es',
    dialCode: '+52'
  },
  { 
    code: 'AR', 
    name: 'Argentina', 
    timezone: 'America/Buenos_Aires', 
    language: 'es',
    dialCode: '+54'
  },
  { 
    code: 'ES', 
    name: 'España', 
    timezone: 'Europe/Madrid', 
    language: 'es',
    dialCode: '+34'
  },
  { 
    code: 'US', 
    name: 'Estados Unidos', 
    timezone: 'America/New_York', 
    language: 'en',
    dialCode: '+1'
  },
  { 
    code: 'BR', 
    name: 'Brasil', 
    timezone: 'America/Sao_Paulo', 
    language: 'pt',
    dialCode: '+55'
  },
  { 
    code: 'PE', 
    name: 'Perú', 
    timezone: 'America/Lima', 
    language: 'es',
    dialCode: '+51'
  },
  { 
    code: 'CL', 
    name: 'Chile', 
    timezone: 'America/Santiago', 
    language: 'es',
    dialCode: '+56'
  },
  { 
    code: 'EC', 
    name: 'Ecuador', 
    timezone: 'America/Guayaquil', 
    language: 'es',
    dialCode: '+593'
  },
  { 
    code: 'VE', 
    name: 'Venezuela', 
    timezone: 'America/Caracas', 
    language: 'es',
    dialCode: '+58'
  },
  // Fácil agregar más países
  { 
    code: 'CA', 
    name: 'Canadá', 
    timezone: 'America/Toronto', 
    language: 'en',
    dialCode: '+1'
  },
  { 
    code: 'GB', 
    name: 'Reino Unido', 
    timezone: 'Europe/London', 
    language: 'en',
    dialCode: '+44'
  }
]

// Zonas horarias disponibles (expandible)
export const TIMEZONES: Timezone[] = [
  { value: 'America/Bogota', label: 'Bogotá', offset: 'GMT-5' },
  { value: 'America/Mexico_City', label: 'Ciudad de México', offset: 'GMT-6' },
  { value: 'America/Buenos_Aires', label: 'Buenos Aires', offset: 'GMT-3' },
  { value: 'Europe/Madrid', label: 'Madrid', offset: 'GMT+1' },
  { value: 'America/New_York', label: 'Nueva York', offset: 'GMT-5' },
  { value: 'America/Sao_Paulo', label: 'São Paulo', offset: 'GMT-3' },
  { value: 'America/Lima', label: 'Lima', offset: 'GMT-5' },
  { value: 'America/Santiago', label: 'Santiago', offset: 'GMT-3' },
  { value: 'America/Guayaquil', label: 'Guayaquil', offset: 'GMT-5' },
  { value: 'America/Caracas', label: 'Caracas', offset: 'GMT-4' },
  { value: 'America/Toronto', label: 'Toronto', offset: 'GMT-5' },
  { value: 'Europe/London', label: 'Londres', offset: 'GMT+0' },
  // Fácil agregar más zonas
  { value: 'Asia/Tokyo', label: 'Tokio', offset: 'GMT+9' },
  { value: 'Australia/Sydney', label: 'Sídney', offset: 'GMT+10' }
]

// Idiomas disponibles (expandible)
export const LANGUAGES: Language[] = [
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  // Fácil agregar más idiomas
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' }
]

// Enfoques de coaching (expandible)
export const COACHING_FOCUSES: CoachingFocus[] = [
  { 
    value: 'deportista', 
    label: 'Deportista', 
    description: 'Enfoque en rendimiento físico, disciplina y metas deportivas',
    icon: '🏃‍♂️',
    category: 'salud'
  },
  { 
    value: 'carrera_profesional', 
    label: 'Carrera Profesional', 
    description: 'Desarrollo de habilidades profesionales y crecimiento laboral',
    icon: '👔',
    category: 'profesional'
  },
  { 
    value: 'emprendimiento', 
    label: 'Emprendimiento', 
    description: 'Crear y hacer crecer tu propio negocio desde cero',
    icon: '🚀',
    category: 'negocio'
  },
  { 
    value: 'empresario', 
    label: 'Empresario', 
    description: 'Liderazgo, gestión de equipos y crecimiento empresarial',
    icon: '💼',
    category: 'negocio'
  },
  { 
    value: 'bienestar_personal', 
    label: 'Bienestar Personal', 
    description: 'Equilibrio vida-trabajo, hábitos saludables y crecimiento personal',
    icon: '🌱',
    category: 'personal'
  },
  // Fácil agregar más enfoques
  { 
    value: 'estudiante', 
    label: 'Estudiante', 
    description: 'Técnicas de estudio, organización y rendimiento académico',
    icon: '📚',
    category: 'educacion'
  },
  { 
    value: 'artista', 
    label: 'Artista/Creativo', 
    description: 'Desarrollo creativo, inspiración y carrera artística',
    icon: '🎨',
    category: 'creativo'
  }
]

// Tonos de comunicación (expandible)
export const COMMUNICATION_TONES: CommunicationTone[] = [
  { 
    value: 'motivational', 
    label: 'Motivacional', 
    emoji: '🔥',
    description: 'Energético e inspirador',
    category: 'energetico'
  },
  { 
    value: 'empathetic', 
    label: 'Empático', 
    emoji: '🤗',
    description: 'Comprensivo y cálido',
    category: 'emocional'
  },
  { 
    value: 'professional', 
    label: 'Profesional', 
    emoji: '💼',
    description: 'Formal y estructurado',
    category: 'formal'
  },
  { 
    value: 'friendly', 
    label: 'Amigable', 
    emoji: '😊',
    description: 'Casual y cercano',
    category: 'casual'
  },
  // Fácil agregar más tonos
  { 
    value: 'direct', 
    label: 'Directo', 
    emoji: '🎯',
    description: 'Claro y sin rodeos',
    category: 'directo'
  },
  { 
    value: 'analytical', 
    label: 'Analítico', 
    emoji: '📊',
    description: 'Basado en datos y lógica',
    category: 'logico'
  }
]

// Días de la semana
export const WEEK_DAYS = [
  { id: 'monday', label: 'Lunes', short: 'L' },
  { id: 'tuesday', label: 'Martes', short: 'M' },
  { id: 'wednesday', label: 'Miércoles', short: 'X' },
  { id: 'thursday', label: 'Jueves', short: 'J' },
  { id: 'friday', label: 'Viernes', short: 'V' },
  { id: 'saturday', label: 'Sábado', short: 'S' },
  { id: 'sunday', label: 'Domingo', short: 'D' }
]

// Opciones de directividad
export const DIRECTNESS_LEVELS = [
  { value: 1, label: 'Muy suave y comprensivo', description: 'Máxima paciencia y comprensión' },
  { value: 2, label: 'Suave pero claro', description: 'Gentil pero con claridad en los objetivos' },
  { value: 3, label: 'Equilibrado', description: 'Balance entre apoyo y exigencia' },
  { value: 4, label: 'Directo y firme', description: 'Claro en expectativas y feedback directo' },
  { value: 5, label: 'Muy directo y retador', description: 'Máximo nivel de exigencia y desafío' }
]

// Funciones utilitarias
export const getCountryByCode = (code: string): Country | undefined => {
  return COUNTRIES.find(country => country.code === code)
}

export const getTimezoneByValue = (value: string): Timezone | undefined => {
  return TIMEZONES.find(tz => tz.value === value)
}

export const getLanguageByCode = (code: string): Language | undefined => {
  return LANGUAGES.find(lang => lang.code === code)
}

export const getCoachingFocusByValue = (value: string): CoachingFocus | undefined => {
  return COACHING_FOCUSES.find(focus => focus.value === value)
}

export const getCommunicationToneByValue = (value: string): CommunicationTone | undefined => {
  return COMMUNICATION_TONES.find(tone => tone.value === value)
}

// Funciones para filtrar por categoría (útil para UI agrupada)
export const getCoachingFocusesByCategory = (category: string): CoachingFocus[] => {
  return COACHING_FOCUSES.filter(focus => focus.category === category)
}

export const getCommunicationTonesByCategory = (category: string): CommunicationTone[] => {
  return COMMUNICATION_TONES.filter(tone => tone.category === category)
}