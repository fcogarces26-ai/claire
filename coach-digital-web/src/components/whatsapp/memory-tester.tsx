'use client'

import { useState, ChangeEvent } from 'react'
import { Button } from '@/components/ui/button'

interface MemoryNote {
  id: string
  title?: string
  content: string
  category: string
  tags: string[]
  priority: number
// En src/components/whatsapp/memory-tester.tsx línea 13:
metadata: Record<string, unknown>  // Cambiar 'any' por esto  created_at: string
}

interface ProcessResult {
  totalExtractions: number
  savedNotes: number
  skipped: number
  notes: MemoryNote[]
}

export default function MemoryTester() {
  const [userMessage, setUserMessage] = useState('')
  const [coachResponse, setCoachResponse] = useState('')
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<ProcessResult | null>(null)
  const [error, setError] = useState('')

  // Mensajes de ejemplo para testing
  const exampleMessages = [
    {
      label: 'Objetivo de ejercicio',
      user: 'Quiero empezar a hacer ejercicio 3 veces por semana para mejorar mi salud. Mi objetivo es perder 5 kilos en 3 meses.',
      coach: 'Excelente objetivo! Es específico y alcanzable. Te sugiero empezar con 30 minutos de cardio y ejercicios de fuerza. ¿Qué días de la semana te funcionan mejor?'
    },
    {
      label: 'Recordatorio importante',
      user: 'No olvides recordarme que tengo la reunión con el cliente importante el viernes a las 3pm. Es crucial para cerrar el proyecto.',
      coach: 'Por supuesto! Te recordaré sobre tu reunión del viernes. Es importante que prepares bien la presentación. ¿Ya tienes todo listo?'
    },
    {
      label: 'Idea de negocio',
      user: 'Se me ocurrió una idea para una app que conecte a freelancers con pequeñas empresas locales. Creo que podría ser muy útil en mi ciudad.',
      coach: 'Interesante idea! El mercado de freelancers está creciendo mucho. ¿Has investigado si ya existe algo similar en tu zona?'
    },
    {
      label: 'Estado emocional',
      user: 'Me siento un poco abrumado con tanto trabajo esta semana. Tengo estrés porque no logro organizarme bien con las tareas.',
      coach: 'Entiendo cómo te sientes. El estrés laboral es muy común. ¿Qué tal si revisamos juntos tu sistema de organización? Podemos encontrar estrategias que te ayuden.'
    },
    {
      label: 'Proyecto personal',
      user: 'Estoy trabajando en aprender programación Python. Quiero hacer un curso online y practicar construyendo pequeñas aplicaciones.',
      coach: 'Fantástico! Python es un excelente lenguaje para comenzar. Te recomiendo dedicar al menos 30 minutos diarios para mantener consistencia. ¿Ya elegiste el curso?'
    }
  ]

  const handleProcessMessage = async () => {
    if (!userMessage.trim()) {
      setError('El mensaje del usuario es requerido')
      return
    }

    setProcessing(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch('/api/memory/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userMessage,
          coachResponse,
          forceProcess: true
        }),
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }

      const data = await response.json()
      setResult(data.results)
      
    } catch (error) {
      console.error('Error processing message:', error)
      setError('Error al procesar el mensaje. Intenta de nuevo.')
    } finally {
      setProcessing(false)
    }
  }

  const loadExample = (example: typeof exampleMessages[0]) => {
    setUserMessage(example.user)
    setCoachResponse(example.coach)
    setResult(null)
    setError('')
  }

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      goals: 'bg-blue-100 text-blue-800 border-blue-200',
      reminders: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      ideas: 'bg-purple-100 text-purple-800 border-purple-200',
      projects: 'bg-green-100 text-green-800 border-green-200',
      feelings: 'bg-pink-100 text-pink-800 border-pink-200',
      insights: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      general: 'bg-gray-100 text-gray-800 border-gray-200'
    }
    return colors[category] || colors.general
  }

  const getCategoryEmoji = (category: string) => {
    const emojis: { [key: string]: string } = {
      goals: '🎯',
      reminders: '⏰',
      ideas: '💡',
      projects: '📂',
      feelings: '❤️',
      insights: '✨',
      general: '📝'
    }
    return emojis[category] || emojis.general
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <span className="text-2xl">🧠</span>
          <h1 className="text-2xl font-bold">Memory AI Tester</h1>
        </div>
        <p className="text-gray-600 mb-6">
          Prueba cómo el sistema de IA extrae información memorizable de las conversaciones
        </p>
        
        {/* Ejemplos rápidos */}
        <div className="mb-6">
          <h3 className="font-semibold mb-3">Ejemplos para probar:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {exampleMessages.map((example, index) => (
              <button
                key={index}
                onClick={() => loadExample(example)}
                className="text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium text-sm">{example.label}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {example.user.substring(0, 50)}...
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Inputs */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Mensaje del Usuario *
            </label>
            <textarea
              value={userMessage}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setUserMessage(e.target.value)}
              placeholder="Escribe un mensaje del usuario que contenga información memorizable..."
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Respuesta del Coach (opcional)
            </label>
            <textarea
              value={coachResponse}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setCoachResponse(e.target.value)}
              placeholder="Respuesta del coach (opcional)..."
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <Button 
            onClick={handleProcessMessage} 
            disabled={processing || !userMessage.trim()}
            className="w-full"
          >
            {processing ? 'Procesando...' : 'Procesar con IA 🤖'}
          </Button>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 mt-4">
            {error}
          </div>
        )}

        {/* Resultados */}
        {result && (
          <div className="space-y-4 mt-6">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">✅ Procesamiento completado</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">Extracciones:</span> {result.totalExtractions}
                </div>
                <div>
                  <span className="font-medium">Guardadas:</span> {result.savedNotes}
                </div>
                <div>
                  <span className="font-medium">Omitidas:</span> {result.skipped}
                </div>
              </div>
            </div>

            {/* Memory Notes creadas */}
            {result.notes.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Memory Notes creadas:</h3>
                <div className="space-y-3">
                  {result.notes.map((note, index) => (
                    <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 border-l-4 border-l-blue-500">
                      <div className="flex items-start justify-between mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getCategoryColor(note.category)}`}>
                          {getCategoryEmoji(note.category)} {note.category}
                        </span>
                        <span className="text-xs text-gray-500">
                          Prioridad: {note.priority}
                        </span>
                      </div>
                      
                      {note.title && (
                        <h4 className="font-medium text-gray-900 mb-2">
                          {note.title}
                        </h4>
                      )}
                      
                      <p className="text-gray-700 text-sm mb-3">
                        {note.content}
                      </p>
                      
                      {note.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {note.tags.map((tag, tagIndex) => (
                            <span 
                              key={tagIndex}
                              className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {note.metadata && Object.keys(note.metadata).length > 0 && (
                        <details className="mt-2">
                          <summary className="text-xs text-gray-500 cursor-pointer">
                            Ver metadata
                          </summary>
                          <pre className="text-xs bg-gray-50 p-2 mt-1 rounded overflow-auto">
                            {JSON.stringify(note.metadata, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}