import React, { useRef, useState, useEffect } from 'react';
import jsQR from 'jsqr';
import { Camera, RefreshCcw, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Gabarito, ScanResult } from '../types';

interface ScannerProps {
  onBack: () => void;
  onResult: (result: ScanResult) => void;
  gabarito: Gabarito;
}

export const Scanner: React.FC<ScannerProps> = ({ onBack, onResult, gabarito }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scanning, setScanning] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'searching' | 'processing' | 'done'>('searching');

  useEffect(() => {
    let animationFrameId: number;
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          videoRef.current.play();
          requestAnimationFrame(tick);
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
        setError('Não foi possível acessar a câmera. Verifique as permissões.');
      }
    };

    const tick = () => {
      // Check both local variables and current state (though state might be stale in closure)
      // We'll use a ref or just rely on the fact that handleQRCodeFound sets scanning to false
      if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA && canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.height = videoRef.current.videoHeight;
        canvas.width = videoRef.current.videoWidth;
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code && code.data.startsWith('OMR-v1|')) {
          handleQRCodeFound(code.data);
          return; // Stop the loop
        }
      }
      animationFrameId = requestAnimationFrame(tick);
    };

    startCamera();

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleQRCodeFound = async (data: string) => {
    if (!canvasRef.current || !videoRef.current) return;
    
    setScanning(false);
    setStatus('processing');
    
    try {
      // Capture the current frame as high-quality image
      const canvas = canvasRef.current;
      // High quality capture
      const imageData = canvas.toDataURL('image/jpeg', 1.0);

      const response = await fetch('/api/analyze-exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: imageData,
          gabarito: gabarito
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Servidor retornou erro desconhecido' }));
        throw new Error(errorData.error || 'Falha na comunicação com a IA');
      }

      const rawResult = await response.json();
      
      // Ensure studentAnswers uses numeric keys and add timestamp + captured image
      const result: ScanResult = {
        ...rawResult,
        studentAnswers: Object.entries(rawResult.studentAnswers).reduce((acc, [key, value]) => {
          acc[Number(key)] = value as any;
          return acc;
        }, {} as Record<number, any>),
        timestamp: Date.now(),
        capturedImage: imageData
      };

      onResult(result);
      setStatus('done');
    } catch (err: any) {
      console.error('OCR/AI error:', err);
      setError('Erro ao processar com IA: ' + err.message);
      setScanning(true);
      setStatus('searching');
    }
  };

  return (
    <div className="fixed inset-0 bg-[#020617] flex flex-col z-50">
      {/* Header */}
      <div className="absolute top-0 inset-x-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-[#020617]/80 to-transparent">
        <button
          onClick={onBack}
          className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md transition-all border border-white/10"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="text-white text-sm font-black tracking-tighter uppercase">CORRETOR FÁCIL</div>
        <div className="w-10"></div> {/* Spacer */}
      </div>

      {/* Camera View */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {error ? (
          <div className="p-6 text-center text-white max-w-xs">
            <AlertCircle size={40} className="mx-auto mb-4 text-red-500" />
            <p className="text-base font-medium mb-6">{error}</p>
            <button
              onClick={() => {
                setError(null);
                setScanning(true);
                setStatus('searching');
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg"
            >
              Tentar Novamente
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover opacity-60"
              muted
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Overlay */}
            <AnimatePresence>
              {scanning && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center"
                >
                  {/* Scanning Frame */}
                  <div className="relative w-64 h-80 md:w-80 md:h-96 border border-white/20 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                    <div className="absolute inset-0 bg-emerald-500/5" />
                    {/* Animated Line */}
                    <motion.div
                      animate={{ top: ['0%', '100%', '0%'] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                      className="absolute left-0 right-0 h-0.5 bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.8)] z-10"
                    />
                    
                    {/* Calibration corners */}
                    <div className="absolute top-4 left-4 w-6 h-6 border-t-4 border-l-4 border-blue-500" />
                    <div className="absolute top-4 right-4 w-6 h-6 border-t-4 border-r-4 border-blue-500" />
                    <div className="absolute bottom-4 left-4 w-6 h-6 border-b-4 border-l-4 border-blue-500" />
                    <div className="absolute bottom-4 right-4 w-6 h-6 border-b-4 border-r-4 border-blue-500" />

                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-8">
                      <div className="mt-auto mb-10 text-center">
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest bg-blue-950/40 px-3 py-1 rounded-full border border-blue-500/30">
                          Alinhe os 4 Quadrados
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className="mt-8 text-white text-xs md:text-sm font-bold uppercase tracking-widest bg-black/60 px-5 py-2 rounded-full backdrop-blur-md border border-white/10">
                    Posicione o QR Code e as Âncoras
                  </p>
                </motion.div>
              )}

              {status === 'processing' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute inset-0 bg-[#020617]/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="mb-6 p-4 bg-emerald-950/30 rounded-full border border-emerald-900/50"
                  >
                    <RefreshCcw size={40} className="text-emerald-500" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-white mb-2">Analisando com IA...</h3>
                  <p className="text-slate-500 text-sm max-w-[200px]">Utilizando inteligência artificial para ler a caligrafia e corrigir a prova.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>

      {/* Footer info */}
      <div className="p-6 bg-[#0f172a] border-t border-slate-800 text-center">
        <p className="text-[10px] text-slate-600 uppercase tracking-widest font-black">
          Powered by Corretor Fácil AI
        </p>
      </div>
    </div>
  );
};
