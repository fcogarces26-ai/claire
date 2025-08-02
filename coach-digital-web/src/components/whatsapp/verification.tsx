'use client';

import { useState } from 'react';
import { CheckCircle, AlertCircle, Phone, Loader2 } from 'lucide-react';

interface VerificationResult {
  valid: boolean;
  phoneNumber?: string;
  whatsappFormat?: string;
  error?: string;
}

export default function WhatsAppVerification() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);

  const handleVerification = async () => {
    if (!phoneNumber.trim()) {
      setResult({
        valid: false,
        error: 'Por favor ingresa un número de teléfono'
      });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/whatsapp/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber: phoneNumber.trim() }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        valid: false,
        error: 'Error de conexión. Intenta nuevamente.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatPhoneNumber = (value: string) => {
    // Remover caracteres no numéricos excepto +
    const cleaned = value.replace(/[^\d+]/g, '');
    
    // Si no empieza con +, agregarlo
    if (cleaned && !cleaned.startsWith('+')) {
      return '+' + cleaned;
    }
    
    return cleaned;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
    
    // Limpiar resultado anterior si se cambia el número
    if (result) {
      setResult(null);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Phone className="h-5 w-5" />
          Verificar Número de WhatsApp
        </h3>
      </div>
      
      <div className="p-6 space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Número de teléfono
          </label>
          <input
            type="tel"
            placeholder="+1234567890"
            value={phoneNumber}
            onChange={handleInputChange}
            disabled={isLoading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono disabled:bg-gray-100"
          />
          <p className="text-xs text-gray-500">
            Incluye el código de país (ej: +52 para México)
          </p>
        </div>

        <button 
          onClick={handleVerification}
          disabled={isLoading || !phoneNumber.trim()}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Verificando...
            </>
          ) : (
            'Verificar Número'
          )}
        </button>

        {result && (
          <div className={`p-4 rounded-md border ${result.valid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
            <div className="flex items-start gap-2">
              {result.valid ? (
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
              )}
              <div className="flex-1">
                {result.valid ? (
                  <div className="space-y-2">
                    <p className="font-medium text-green-800">
                      ✅ Número válido
                    </p>
                    <div className="text-sm text-green-700 space-y-1">
                      <p><strong>Número:</strong> {result.phoneNumber}</p>
                      <p><strong>Formato WhatsApp:</strong> {result.whatsappFormat}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-red-800">
                    ❌ {result.error}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-gray-200">
          <h4 className="font-medium text-sm mb-2">Formatos válidos:</h4>
          <ul className="text-xs text-gray-500 space-y-1">
            <li>• +1234567890 (con código de país)</li>
            <li>• +52 55 1234 5678 (con espacios)</li>
            <li>• +34 (91) 123-4567 (con paréntesis y guiones)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}