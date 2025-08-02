'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Smartphone, Loader2, Trash2 } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'coach';
  timestamp: Date;
  status?: 'sending' | 'sent' | 'error';
}

interface SendMessageResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export default function ChatSimulator() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: '¡Hola! Soy tu coach personal de IA. Estoy aquí para ayudarte a alcanzar tus metas. ¿En qué te gustaría trabajar hoy?',
      sender: 'coach',
      timestamp: new Date(),
      status: 'sent'
    }
  ]);
  
  const [inputMessage, setInputMessage] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('+1234567890');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage.trim(),
      sender: 'user',
      timestamp: new Date(),
      status: 'sending'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Simular envío a WhatsApp
      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: phoneNumber,
          message: inputMessage.trim(),
          type: 'direct'
        }),
      });

      const result: SendMessageResponse = await response.json();

      // Actualizar estado del mensaje del usuario
      setMessages(prev => prev.map(msg => 
        msg.id === userMessage.id 
          ? { ...msg, status: result.success ? 'sent' : 'error' }
          : msg
      ));

      if (!result.success) {
        throw new Error(result.error || 'Error enviando mensaje');
      }

      // Simular respuesta del coach (en un caso real, esto vendría del webhook)
      setTimeout(() => {
        const coachResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: 'Mensaje recibido. En un caso real, la respuesta vendría automáticamente del webhook de WhatsApp.',
          sender: 'coach',
          timestamp: new Date(),
          status: 'sent'
        };
        setMessages(prev => [...prev, coachResponse]);
      }, 1500);

    } catch (error) {
      console.error('Error enviando mensaje:', error);
      
      // Marcar mensaje como error
      setMessages(prev => prev.map(msg => 
        msg.id === userMessage.id 
          ? { ...msg, status: 'error' }
          : msg
      ));

      // Mostrar mensaje de error
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        text: 'Error: No se pudo enviar el mensaje. Verifica la configuración.',
        sender: 'coach',
        timestamp: new Date(),
        status: 'error'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: '1',
        text: '¡Hola! Soy tu coach personal de IA. Estoy aquí para ayudarte a alcanzar tus metas. ¿En qué te gustaría trabajar hoy?',
        sender: 'coach',
        timestamp: new Date(),
        status: 'sent'
      }
    ]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto h-[600px] flex flex-col bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Simulador de WhatsApp
          </h3>
          <button
            onClick={clearChat}
            className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-1"
          >
            <Trash2 className="h-4 w-4" />
            Limpiar
          </button>
        </div>
        
        <div className="flex items-center gap-2 pt-3">
          <label className="text-sm font-medium">Número de prueba:</label>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="font-mono text-sm px-2 py-1 border border-gray-300 rounded w-32 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="+1234567890"
          />
          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
            Modo Testing
          </span>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {/* Área de mensajes */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg px-3 py-2 ${
                    message.sender === 'user'
                      ? 'bg-blue-500 text-white'
                      : message.status === 'error'
                      ? 'bg-red-100 text-red-800 border border-red-200'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {message.sender === 'coach' && (
                      <Bot className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    )}
                    {message.sender === 'user' && (
                      <User className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm">{message.text}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs opacity-70">
                          {formatTime(message.timestamp)}
                        </span>
                        {message.status && message.sender === 'user' && (
                          <span className="text-xs opacity-70">
                            {message.status === 'sending' && '⏳'}
                            {message.status === 'sent' && '✓'}
                            {message.status === 'error' && '❌'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input de mensaje */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex gap-2">
            <input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Escribe tu mensaje..."
              disabled={isLoading}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            />
            <button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
          
          <p className="text-xs text-gray-500 mt-2">
            💡 Este simulador envía mensajes reales a través de la API. 
            En producción, las respuestas vendrán automáticamente del webhook.
          </p>
        </div>
      </div>
    </div>
  );
}