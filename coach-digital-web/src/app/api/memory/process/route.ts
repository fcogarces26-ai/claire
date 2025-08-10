// src/app/api/memory/process/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { AIMemoryProcessor } from '@/lib/ai-memory-processor'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const memoryProcessor = new AIMemoryProcessor()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      userMessage, 
      coachResponse = '', 
      forceProcess = false,
      interactionId = null 
    } = body

    // Validaciones
    if (!userMessage || userMessage.trim().length === 0) {
      return NextResponse.json({ error: 'Mensaje del usuario requerido' }, { status: 400 })
    }

    // Obtener configuraciones del usuario
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('coaching_focus')
      .eq('id', user.id)
      .single()

    const { data: userSettings } = await supabase
      .from('user_settings')
      .select('communication_tone, coaching_style')
      .eq('user_id', user.id)
      .single()

    // Procesar con IA
    const extractions = await memoryProcessor.processConversation({
      userMessage,
      coachResponse,
      userSettings: {
        coaching_focus: userProfile?.coaching_focus,
        communication_tone: userSettings?.communication_tone
      }
    })

    const savedNotes = []
    let skippedCount = 0

    // Guardar cada extracción como memory_note
    for (const extraction of extractions) {
      if (extraction.shouldStore || forceProcess) {
        try {
          const { data: note, error } = await supabase
            .from('memory_notes')
            .insert({
              user_id: user.id,
              title: extraction.title,
              content: extraction.content,
              category: extraction.category,
              tags: extraction.tags,
              priority: extraction.priority,
              source_interaction_id: interactionId,
              metadata: {
                ...extraction.metadata,
                processed_manually: true,
                processed_at: new Date().toISOString(),
                ai_processed: true
              }
            })
            .select()
            .single()

          if (error) {
            console.error('Error saving memory note:', error)
          } else {
            savedNotes.push(note)
          }
        } catch (error) {
          console.error('Error processing extraction:', error)
        }
      } else {
        skippedCount++
      }
    }

    return NextResponse.json({
      message: 'Procesamiento completado',
      results: {
        totalExtractions: extractions.length,
        savedNotes: savedNotes.length,
        skipped: skippedCount,
        notes: savedNotes
      }
    })

  } catch (error) {
    console.error('Error in process memory API:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const processPending = searchParams.get('process_pending') === 'true'
    const limit = parseInt(searchParams.get('limit') || '10')

    if (processPending) {
      // Obtener conversaciones recientes sin procesar
      const { data: interactions, error } = await supabase
        .from('whatsapp_interactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('sender', 'user')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        return NextResponse.json({ error: 'Error al obtener conversaciones' }, { status: 500 })
      }

      // Verificar cuáles ya tienen memory_notes
      const processedInteractions = []
      if (interactions) {
        for (const interaction of interactions) {
          const { data: existingNote } = await supabase
            .from('memory_notes')
            .select('id')
            .eq('source_interaction_id', interaction.id)
            .single()

          if (!existingNote) {
            processedInteractions.push({
              id: interaction.id,
              content: interaction.content,
              created_at: interaction.created_at,
              processed: false
            })
          }
        }
      }

      return NextResponse.json({
        pendingInteractions: processedInteractions,
        message: `${processedInteractions.length} conversaciones pendientes de procesar`
      })
    }

    // Obtener estadísticas de procesamiento
    const { data: totalInteractions } = await supabase
      .from('whatsapp_interactions')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('sender', 'user')

    const { data: processedInteractions } = await supabase
      .from('memory_notes')
      .select('source_interaction_id', { count: 'exact' })
      .eq('user_id', user.id)
      .not('source_interaction_id', 'is', null)

    const { data: recentMemories } = await supabase
      .from('memory_notes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)

    return NextResponse.json({
      stats: {
        totalInteractions: totalInteractions?.length || 0,
        processedInteractions: processedInteractions?.length || 0,
        processingRate: totalInteractions?.length 
          ? Math.round((processedInteractions?.length || 0) / totalInteractions.length * 100)
          : 0
      },
      recentMemories: recentMemories || []
    })

  } catch (error) {
    console.error('Error in GET process memory API:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}