// Crear archivo: src/app/api/debug/settings/route.ts

import { createClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(_request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Obtener usuario actual
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({
        error: 'No authenticated user',
        userError: userError?.message
      }, { status: 401 })
    }

    // Obtener datos de user_settings
    const { data: userSettings, error: settingsError } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // Obtener datos de user_profiles
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email
      },
      user_settings: {
        data: userSettings,
        error: settingsError?.message,
        exists: !!userSettings,
        new_fields_present: {
          presence_level: userSettings?.presence_level !== undefined,
          directness_level: userSettings?.directness_level !== undefined,
          communication_tone: userSettings?.communication_tone !== undefined,
          notifications_enabled: userSettings?.notifications_enabled !== undefined,
          quiet_hours: userSettings?.quiet_hours !== undefined,
          coaching_frequency: userSettings?.coaching_frequency !== undefined,
          preferred_contact_method: userSettings?.preferred_contact_method !== undefined,
          auto_responses: userSettings?.auto_responses !== undefined
        }
      },
      user_profiles: {
        data: userProfile,
        error: profileError?.message,
        exists: !!userProfile
      },
      schema_info: {
        user_settings_columns: [
          'id', 'user_id', 'reminder_frequency', 'reminder_time', 
          'proactive_messages', 'coaching_style', 'reminder_schedule',
          'presence_level', 'directness_level', 'communication_tone',
          'notifications_enabled', 'quiet_hours', 'coaching_frequency',
          'preferred_contact_method', 'auto_responses', 'created_at', 'updated_at'
        ],
        user_profiles_columns: [
          'id', 'email', 'name', 'phone_number', 'whatsapp_verified',
          'country', 'timezone', 'language', 'coaching_focus', 
          'created_at', 'updated_at'
        ]
      }
    })

  } catch (error) {
    return NextResponse.json({
      error: 'Server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}