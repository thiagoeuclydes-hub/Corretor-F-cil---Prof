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
      <div className="max-w-[105mm] mx-auto p-2 bg-white text-slate-900 overflow-hidden">
        <div className="border-2 border-slate-900 p-3 min-h-[138mm] flex flex-col relative">
          {/* Header */}
          <div className="text-center mb-2">
            <h1 className="text-sm font-black uppercase tracking-tight">FOLHA DE RESPOSTAS</h1>
            <p className="text-[10px] text-slate-600 font-bold">{gabarito.name}</p>
            <p className="text-[8px] text-slate-400">Preencha a bolha (MC) ou escreva na linha (aberta).</p>
          </div>

          <div className="border-b border-slate-300 pb-1 mb-4 flex items-end">
            <span className="text-[10px] font-bold mr-2">Nome:</span>
            <div className="flex-1 h-px bg-slate-300"></div>
          </div>

          <div className="flex gap-4 mb-4 items-start">
            {/* QR Code on the left */}
            <div className="shrink-0 flex flex-col items-center gap-1">
              <div className="p-1 border-2 border-slate-900 rounded bg-white">
                <QRCodeSVG value={qrData} size={80} level="H" includeMargin={false} />
              </div>
              <p className="text-[6px] font-mono text-slate-400">Scan to Correct</p>
            </div>

            {/* MC Grid as columns */}
            <div className="flex-1 flex flex-wrap gap-x-4 gap-y-2">
              {gabarito.questions.filter(q => q.type === 'MC').map((q) => (
                <div key={q.id} className="flex flex-col items-center">
                  <span className="text-[10px] font-bold mb-1">{q.id}.</span>
                  <div className="flex flex-col gap-1">
                    {['A', 'B', 'C', 'D', 'E'].map((alt) => (
                      <div key={alt} className="flex items-center justify-center w-5 h-5 rounded-full border border-slate-400 text-[8px] font-bold text-slate-400">
                        {alt}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Open Questions at the bottom */}
          <div className="mt-auto space-y-4">
            {gabarito.questions.filter(q => q.type === 'OPEN').map((q) => (
              <div key={q.id} className="flex items-start gap-2">
                <span className="text-[10px] font-bold mt-1">{q.id}.</span>
                <div className="flex-1">
                  <div className="flex border-t border-l border-slate-900">
                    {Array.from({ length: 14 }).map((_, i) => (
                      <div key={`r1-${i}`} className="flex-1 aspect-square border-r border-b border-slate-900"></div>
                    ))}
                  </div>
                  <div className="flex border-l border-slate-900">
                    {Array.from({ length: 14 }).map((_, i) => (
                      <div key={`r2-${i}`} className="flex-1 aspect-square border-r border-b border-slate-900"></div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer Markers */}
          <div className="mt-4 flex justify-between items-end opacity-20">
            <div className="w-2 h-2 border border-slate-900 border-t-0 border-r-0"></div>
            <p className="text-[6px] font-mono">ID: {gabarito.id.slice(0,8)}</p>
            <div className="w-2 h-2 border border-slate-900 border-t-0 border-l-0"></div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body { background: white !important; margin: 0; padding: 0; }
          .print\\:hidden { display: none !important; }
        }
        @page {
          size: A6;
          margin: 0;
        }
      ` }} />
    </div>
  );
};
