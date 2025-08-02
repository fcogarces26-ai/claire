import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="text-2xl font-bold text-blue-600">Coach Digital</div>
        <div className="space-x-4">
          <Link href="/login">
            <Button variant="ghost">Iniciar Sesión</Button>
          </Link>
          <Link href="/register">
            <Button>Registrarse</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Tu <span className="text-blue-600">Coach Personal</span><br />
            Directo en WhatsApp
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Recibe coaching personalizado, guarda tus insights y alcanza tus metas con la ayuda de IA avanzada, 
            todo através de WhatsApp de forma proactiva pero no invasiva.
          </p>

          <div className="space-x-4 mb-16">
            <Link href="/register">
              <Button size="lg" className="px-8 py-4 text-lg">
                Comenzar Gratis
              </Button>
            </Link>
            <Link href="#features">
              <Button variant="outline" size="lg" className="px-8 py-4 text-lg">
                Ver Funciones
              </Button>
            </Link>
          </div>

          {/* Features Preview */}
          <div className="grid md:grid-cols-3 gap-8 mt-20" id="features">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="text-3xl mb-4">💬</div>
              <h3 className="text-xl font-semibold mb-2">WhatsApp Nativo</h3>
              <p className="text-gray-600">Interactúa naturalmente por WhatsApp sin apps adicionales</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="text-3xl mb-4">��</div>
              <h3 className="text-xl font-semibold mb-2">Memoria Inteligente</h3>
              <p className="text-gray-600">Guarda pensamientos, tareas e insights que se conectan</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="text-3xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold mb-2">Coaching Proactivo</h3>
              <p className="text-gray-600">Recordatorios y sugerencias personalizadas en el momento justo</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-gray-600">
        <p>&copy; 2025 Coach Digital. Transformando vidas, un mensaje a la vez.</p>
      </footer>
    </div>
  )
}
