'use client';

import { useState } from 'react';
import { CheckCircle, AlertCircle, Phone, Loader2, MessageSquare } from 'lucide-react';

interface VerificationResult {
  valid: boolean;
  phoneNumber?: string;
  whatsappFormat?: string;
  error?: string;
  codeSent?: boolean;
}

interface WhatsAppVerificationProps {
  onVerificationSuccess?: (phoneNumber: string) => void;
  initialPhone?: string | null;
  showSuccessCallback?: boolean;
}

type VerificationStep = 'phone' | 'code' | 'success';

export default function WhatsAppVerification({ 
  onVerificationSuccess, 
  initialPhone = '',
  showSuccessCallback = true 
}: WhatsAppVerificationProps) {
  const [phoneNumber, setPhoneNumber] = useState(initialPhone || '');
  const [verificationCode, setVerificationCode] = useState('');
  const [currentStep, setCurrentStep] = useState<VerificationStep>('phone');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);

  const sendVerificationCode = async () => {
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
        body: JSON.stringify({ 
          phoneNumber: phoneNumber.trim(),
          action: 'send_code'
        }),
      });

      const data = await response.json();

      if (data.success || data.codeSent) {
        setResult({
          valid: true,
          phoneNumber: phoneNumber.trim(),
          codeSent: true
        });
        setCurrentStep('code');
      } else {
        setResult({
          valid: false,
          error: data.error || 'Error enviando código de verificación'
        });
      }
    } catch (error) {
      console.error('Error enviando código:', error);
      setResult({
        valid: false,
        error: 'Error de conexión. Intenta nuevamente.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!verificationCode.trim()) {
      setResult({
        valid: false,
        error: 'Por favor ingresa el código de verificación'
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
        body: JSON.stringify({ 
          phoneNumber: phoneNumber.trim(),
          code: verificationCode.trim(),
          action: 'verify_code'
        }),
      });

      const data = await response.json();

      if (data.success || data.verified) {
        setResult({
          valid: true,
          phoneNumber: phoneNumber.trim(),
          whatsappFormat: phoneNumber.trim()
        });
        setCurrentStep('success');

        // Llamar callback si existe
        if (onVerificationSuccess && showSuccessCallback) {
          onVerificationSuccess(phoneNumber.trim());
        }
      } else {
        setResult({
          valid: false,
          error: data.error || 'Código incorrecto. Inténtalo de nuevo.'
        });
      }
    } catch (error) {
      console.error('Error verificando código:', error);
      setResult({
        valid: false,
        error: 'Error de conexión. Intenta nuevamente.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetVerification = () => {
    setCurrentStep('phone');
    setVerificationCode('');
    setResult(null);
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

  const handlePhoneInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
          {currentStep === 'phone' && 'Verificar Número de WhatsApp'}
          {currentStep === 'code' && 'Código de Verificación'}
          {currentStep === 'success' && 'Verificación Completada'}
        </h3>
      </div>
      
      <div className="p-6 space-y-4">
        
        {/* Paso 1: Ingresar número */}
        {currentStep === 'phone' && (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Número de teléfono
              </label>
              <input
                type="tel"
                placeholder="+1234567890"
                value={phoneNumber}
                onChange={handlePhoneInputChange}
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono disabled:bg-gray-100"
              />
              <p className="text-xs text-gray-500">
                Incluye el código de país (ej: +52 para México)
              </p>
            </div>

            <button 
              onClick={sendVerificationCode}
              disabled={isLoading || !phoneNumber.trim()}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enviando código...
                </>
              ) : (
                <>
                  <MessageSquare className="h-4 w-4" />
                  Enviar código de verificación
                </>
              )}
            </button>
          </>
        )}

        {/* Paso 2: Ingresar código */}
        {currentStep === 'code' && (
          <>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <MessageSquare className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-blue-800">
                Código enviado a <strong>{phoneNumber}</strong>
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Revisa tu WhatsApp para el código de verificación
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Código de verificación
              </label>
              <input
                type="text"
                placeholder="123456"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-center text-lg disabled:bg-gray-100"
                maxLength={6}
              />
              <p className="text-xs text-gray-500">
                Ingresa el código de 6 dígitos que recibiste
              </p>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={verifyCode}
                disabled={isLoading || verificationCode.length !== 6}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  'Verificar código'
                )}
              </button>
              
              <button 
                onClick={resetVerification}
                disabled={isLoading}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Cambiar número
              </button>
            </div>

            <button 
              onClick={sendVerificationCode}
              disabled={isLoading}
              className="w-full px-4 py-2 text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
            >
              ¿No recibiste el código? Reenviar
            </button>
          </>
        )}

        {/* Paso 3: Éxito */}
        {currentStep === 'success' && (
          <div className="text-center p-6">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-green-800 mb-2">
              ¡Verificación Exitosa!
            </h4>
            <p className="text-sm text-green-700 mb-4">
              Tu número <strong>{phoneNumber}</strong> ha sido verificado correctamente
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <p className="text-xs text-green-600">
                ✓ WhatsApp conectado y guardado en tu perfil
              </p>
            </div>
            
            {/* Botón para continuar */}
            <button
              onClick={() => {
                // Forzar llamada al callback después de mostrar éxito
                if (onVerificationSuccess && showSuccessCallback) {
                  onVerificationSuccess(phoneNumber.trim());
                }
              }}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Continuar al Dashboard
            </button>
          </div>
        )}

        {/* Mostrar errores */}
        {result && !result.valid && (
          <div className="p-4 rounded-md border border-red-200 bg-red-50">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
              <p className="text-red-800 text-sm">
                {result.error}
              </p>
            </div>
          </div>
        )}

        {/* Información adicional */}
        {currentStep === 'phone' && (
          <div className="pt-4 border-t border-gray-200">
            <h4 className="font-medium text-sm mb-2">Formatos válidos:</h4>
            <ul className="text-xs text-gray-500 space-y-1">
              <li>• +1234567890 (con código de país)</li>
              <li>• +52 55 1234 5678 (con espacios)</li>
              <li>• +34 (91) 123-4567 (con paréntesis y guiones)</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}