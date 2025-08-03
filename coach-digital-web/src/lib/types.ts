// src/lib/types.ts

export interface UserSettings {
  reminder_frequency: string
  reminder_time: string
  proactive_messages: boolean
  coaching_style: string
  directness_level?: number
  communication_tone?: string
  presence_level?: string
  coaching_focus?: string
  coaching_frequency?: string
  notifications_enabled?: boolean
  auto_responses?: boolean
  preferred_contact_method?: string
  quiet_hours_enabled?: boolean
  quiet_hours_start?: string
  quiet_hours_end?: string
  reminder_schedule?: {
    days: string[]
    timeRange: { start: string; end: string }
  }
}

export interface User {
  id: string
  email?: string
  created_at?: string
  user_metadata?: {
    name?: string
    full_name?: string
    avatar_url?: string
    phone_number?: string
  }
}

export interface UserProfile {
  id?: string
  email?: string | null
  name?: string | null
  phone_number: string | null
  whatsapp_verified: boolean
  country: string
  timezone: string
  language: string
  avatar_url?: string | null
  coaching_focus?: string
  onboarding_completed?: boolean
  subscription_status?: string
  subscription_plan?: string | null
  trial_ends_at?: string | null
  last_active_at?: string | null
  created_at?: string
  updated_at?: string
}

export interface WhatsAppMessage {
  id: string
  text: string
  sender: 'user' | 'coach'
  timestamp: Date
  status?: 'sending' | 'sent' | 'error'
}

export interface WhatsAppStats {
  totalMessages: number
  lastMessageDate: string | null
  isActive: boolean
}

export interface VerificationResult {
  valid: boolean
  phoneNumber?: string
  whatsappFormat?: string
  error?: string
  codeSent?: boolean
}

export interface SendMessageResponse {
  success: boolean
  message?: string
  error?: string
  sid?: string
}

// Enums para mejor type safety
export enum CoachingStyle {
  BALANCED = 'balanced',
  SUPPORTIVE = 'supportive', 
  CHALLENGING = 'challenging',
  MOTIVATIONAL = 'motivational',
  ANALYTICAL = 'analytical'
}

export enum PresenceLevel {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  CUSTOM = 'custom',
  MINIMAL = 'minimal'
}

export enum CommunicationTone {
  MOTIVATIONAL = 'motivational',
  EMPATHETIC = 'empathetic',
  PROFESSIONAL = 'professional',
  FRIENDLY = 'friendly',
  DIRECT = 'direct',
  ANALYTICAL = 'analytical'
}

export enum CoachingFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  CUSTOM = 'custom',
  ON_DEMAND = 'on_demand'
}

export enum PreferredContactMethod {
  WHATSAPP = 'whatsapp',
  EMAIL = 'email',
  BOTH = 'both'
}

export enum SubscriptionStatus {
  FREE = 'free',
  TRIAL = 'trial',
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired'
}

export enum SubscriptionPlan {
  BASIC = 'basic',
  PREMIUM = 'premium',
  PRO = 'pro'
}