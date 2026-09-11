import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Gabarito } from '../types';
import { Printer, ArrowLeft } from 'lucide-react';

interface PrintViewProps {
  gabarito: Gabarito;
  onBack: () => void;
}

export const PrintView: React.FC<PrintViewProps> = ({ gabarito, onBack }) => {
  const handlePrint = () => {
    window.print();
  };

  // Construct data for the QR code
  // Format: "OMR-v1|[ID]|[AnswersJoined]"
  const qrData = `OMR-v1|${gabarito.id}|${gabarito.questions.map(q => q.correctAnswer).join('')}`;

  return (
    <div className="min-h-screen bg-white">
      {/* Non-printable UI */}
      <div className="print:hidden p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors font-medium"
        >
          <ArrowLeft size={20} /> Voltar
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg font-bold hover:bg-slate-900 transition-all shadow-md"
        >
          <Printer size={20} /> Imprimir Folha
        </button>
      </div>

      {/* Printable Sheet */}
      <div className="max-w-[140mm] mx-auto p-8 bg-white text-slate-900 overflow-hidden">
        <div className="bg-white p-6 min-h-[160mm] flex flex-col relative border border-slate-100">
          
          {/* ANCHOR POINTS - TOP */}
          <div className="absolute top-0 left-0 w-8 h-8 bg-black"></div>
          <div className="absolute top-0 right-0 w-8 h-8 bg-black"></div>
          
          {/* ANCHOR POINTS - BOTTOM */}
          <div className="absolute bottom-0 left-0 w-8 h-8 bg-black"></div>
          <div className="absolute bottom-0 right-0 w-8 h-8 bg-black"></div>

          {/* Header */}
          <div className="text-center mt-4 mb-4">
            <h1 className="text-xl font-black uppercase tracking-tight text-slate-900">FOLHA DE RESPOSTAS</h1>
            <p className="text-sm text-slate-700 font-bold mt-1">{gabarito.name}</p>
            <p className="text-[10px] text-slate-500 mt-1 italic">Preencha a bolha (MC) ou escreva a resposta na linha (aberta).</p>
          </div>

          {/* User Info */}
          <div className="mb-8 flex items-end gap-3 px-4">
            <span className="text-sm font-black uppercase tracking-wider">Nome:</span>
            <div className="flex-1 border-b-2 border-slate-300 h-6"></div>
          </div>

          <div className="flex gap-10 px-4 mb-8">
            {/* QR Code on the left */}
            <div className="shrink-0">
              <div className="p-2 bg-white">
                <QRCodeSVG value={qrData} size={150} level="H" includeMargin={false} />
              </div>
            </div>

            {/* MC Grid - Circles arranged vertically like the model */}
            <div className="flex-1 flex gap-x-8 gap-y-6 flex-wrap">
              {gabarito.questions.filter(q => q.type === 'MC').map((q) => (
                <div key={q.id} className="flex flex-col items-center">
                  <span className="text-sm font-black mb-2">{q.id}.</span>
                  <div className="flex flex-col gap-1.5">
                    {['A', 'B', 'C', 'D', 'E'].map((alt) => (
                      <div key={alt} className="notranslate flex items-center justify-center w-8 h-8 rounded-full border-2 border-slate-900 text-xs font-black text-slate-900">
                        {alt}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Open Questions as Grids */}
          <div className="mt-4 space-y-6 px-4">
            {gabarito.questions.filter(q => q.type === 'OPEN').map((q) => (
              <div key={q.id} className="flex items-start gap-4">
                <span className="text-sm font-black mt-2">{q.id}.</span>
                <div className="flex-1">
                  <div className="grid grid-cols-12 border-2 border-black">
                    {Array.from({ length: 24 }).map((_, i) => (
                      <div key={`cell-${i}`} className="aspect-square border border-black/30"></div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Small Footer Info */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 opacity-20">
            <p className="text-[8px] font-mono font-bold tracking-widest uppercase">
              ID: {gabarito.id} • CORRETOR FÁCIL PRO
            </p>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body { background: white !important; margin: 0; padding: 0; }
          .print\\:hidden { display: none !important; }
        }
        @page {
          size: A4;
          margin: 10mm;
        }
      ` }} />
    </div>
  );
};
