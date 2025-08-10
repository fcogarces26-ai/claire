import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Parámetros de consulta opcionales
    const category = searchParams.get('category')
    const status = searchParams.get('status') || 'active'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const search = searchParams.get('search')

    // Construir consulta base
    let query = supabase
      .from('memory_notes')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', status)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Agregar filtros opcionales
    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`)
    }

    const { data: notes, error } = await query

    if (error) {
      console.error('Error fetching memory notes:', error)
      return NextResponse.json({ error: 'Error al cargar las notas' }, { status: 500 })
    }

    // Obtener estadísticas si se solicita
    const includeStats = searchParams.get('include_stats') === 'true'
    let stats = null

    if (includeStats) {
      const { data: allNotes, error: statsError } = await supabase
        .from('memory_notes')
        .select('category, status')
        .eq('user_id', user.id)
        .eq('status', 'active')

      if (!statsError && allNotes) {
        const categories: { [key: string]: number } = {}
        allNotes.forEach(note => {
          categories[note.category] = (categories[note.category] || 0) + 1
        })

        stats = {
          totalNotes: allNotes.length,
          categories,
          recentActivity: notes?.slice(0, 5) || []
        }
      }
    }

    return NextResponse.json({
      notes: notes || [],
      stats
    })

  } catch (error) {
    console.error('Error in memory notes API:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { title, content, category = 'general', tags = [], priority = 0, metadata = {} } = body

    // Validaciones básicas
    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'El contenido es requerido' }, { status: 400 })
    }

    if (content.length > 5000) {
      return NextResponse.json({ error: 'El contenido es demasiado largo (máximo 5000 caracteres)' }, { status: 400 })
    }

    // Validar categoría
    const validCategories = ['goals', 'reminders', 'ideas', 'projects', 'feelings', 'insights', 'general']
    if (!validCategories.includes(category)) {
      return NextResponse.json({ error: 'Categoría inválida' }, { status: 400 })
    }

    // Crear la nota
    const { data: note, error } = await supabase
      .from('memory_notes')
      .insert({
        user_id: user.id,
        title: title?.trim() || null,
        content: content.trim(),
        category,
        tags: Array.isArray(tags) ? tags : [],
        priority: Math.max(0, Math.min(10, priority)), // Limitar entre 0-10
        metadata
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating memory note:', error)
      return NextResponse.json({ error: 'Error al crear la nota' }, { status: 500 })
    }

    return NextResponse.json({ note }, { status: 201 })

  } catch (error) {
    console.error('Error in POST memory notes API:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { id, title, content, category, tags, priority, status, metadata } = body

    if (!id) {
      return NextResponse.json({ error: 'ID de la nota es requerido' }, { status: 400 })
    }

    // Preparar datos para actualizar (solo campos proporcionados)
    const updateData: any = {}
    
    if (title !== undefined) updateData.title = title?.trim() || null
    if (content !== undefined) {
      if (!content || content.trim().length === 0) {
        return NextResponse.json({ error: 'El contenido es requerido' }, { status: 400 })
      }
      updateData.content = content.trim()
    }
    if (category !== undefined) {
      const validCategories = ['goals', 'reminders', 'ideas', 'projects', 'feelings', 'insights', 'general']
      if (!validCategories.includes(category)) {
        return NextResponse.json({ error: 'Categoría inválida' }, { status: 400 })
      }
      updateData.category = category
    }
    if (tags !== undefined) updateData.tags = Array.isArray(tags) ? tags : []
    if (priority !== undefined) updateData.priority = Math.max(0, Math.min(10, priority))
    if (status !== undefined) {
      const validStatuses = ['active', 'completed', 'archived']
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: 'Estado inválido' }, { status: 400 })
      }
      updateData.status = status
    }
    if (metadata !== undefined) updateData.metadata = metadata

    // Actualizar la nota
    const { data: note, error } = await supabase
      .from('memory_notes')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id) // Asegurar que solo puede actualizar sus propias notas
      .select()
      .single()

    if (error) {
      console.error('Error updating memory note:', error)
      return NextResponse.json({ error: 'Error al actualizar la nota' }, { status: 500 })
    }

    if (!note) {
      return NextResponse.json({ error: 'Nota no encontrada' }, { status: 404 })
    }

    return NextResponse.json({ note })

  } catch (error) {
    console.error('Error in PUT memory notes API:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID de la nota es requerido' }, { status: 400 })
    }

    // Eliminar la nota
    const { error } = await supabase
      .from('memory_notes')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id) // Asegurar que solo puede eliminar sus propias notas

    if (error) {
      console.error('Error deleting memory note:', error)
      return NextResponse.json({ error: 'Error al eliminar la nota' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Nota eliminada correctamente' })

  } catch (error) {
    console.error('Error in DELETE memory notes API:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}