import React from 'react';
import { CheckCircle2, XCircle, TrendingUp, RotateCcw, Share2 } from 'lucide-react';
import { motion } from 'motion/react';
import { ScanResult, Gabarito } from '../types';

interface ResultViewProps {
  result: ScanResult;
  gabarito: Gabarito;
  onRetry: () => void;
  onClose: () => void;
}

export const ResultView: React.FC<ResultViewProps> = ({ result, gabarito, onRetry, onClose }) => {
  const getGradeColor = (percentage: number) => {
    if (percentage >= 70) return 'text-emerald-400 bg-emerald-950/30 border-emerald-900/50';
    if (percentage >= 50) return 'text-amber-400 bg-amber-950/30 border-amber-900/50';
    return 'text-red-400 bg-red-950/30 border-red-900/50';
  };

  return (
    <div className="fixed inset-0 bg-[#020617] flex flex-col z-[60] overflow-y-auto">
      <div className="p-4 md:p-6 max-w-lg mx-auto w-full space-y-4 md:space-y-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#0f172a] rounded-2xl md:rounded-3xl shadow-2xl p-6 md:p-8 border border-slate-800 text-center"
        >
          <div className="mb-4 md:mb-6 inline-flex p-3 md:p-4 bg-emerald-950/50 text-emerald-400 rounded-full border border-emerald-900/50">
            <CheckCircle2 size={32} className="md:w-12 md:h-12" />
          </div>
          
          <h2 className="text-xl md:text-3xl font-black text-white mb-1 md:mb-2">Correção Concluída!</h2>
          <p className="text-slate-500 text-xs md:text-base font-medium mb-6 md:mb-8 truncate px-4">{gabarito.name}</p>

          <div className={`py-4 md:py-6 rounded-xl md:rounded-2xl border-2 mb-6 md:mb-8 ${getGradeColor(result.percentage)} shadow-lg`}>
            <div className="text-4xl md:text-5xl font-black mb-0.5 md:mb-1 text-white">{result.score}/{result.total}</div>
            <div className="text-xs md:text-lg font-bold uppercase tracking-wider">Nota: {result.percentage.toFixed(1)}%</div>
          </div>

          {/* Visual Overlay - Mirroring the video request */}
          {result.capturedImage && (
            <div className="mb-6 md:mb-8 relative rounded-2xl overflow-hidden border-2 border-slate-800 bg-black">
              <img src={result.capturedImage} alt="Captured Exam" className="w-full h-auto opacity-70" />
              {/* Overlay Dots */}
              {Object.entries(result.studentAnswers).map(([id, ans]) => {
                const answer = ans as any;
                return answer.x !== undefined && answer.y !== undefined && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    key={`dot-${id}`}
                    className="absolute w-4 h-4 md:w-6 md:h-6 -ml-2 -mt-2 md:-ml-3 md:-mt-3 rounded-full bg-emerald-500 border-2 border-white shadow-lg flex items-center justify-center"
                    style={{ left: `${answer.x}%`, top: `${answer.y}%` }}
                  >
                    <span className="text-[6px] md:text-[8px] font-black text-white">{id}</span>
                  </motion.div>
                );
              })}
              <div className="absolute top-2 right-2 bg-black/60 px-2 py-1 rounded text-[8px] font-bold text-white uppercase tracking-widest border border-white/20">
                Verificação Visual
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <button
              onClick={onRetry}
              className="flex items-center justify-center gap-2 py-3 px-4 md:py-4 md:px-6 bg-slate-800 text-slate-300 rounded-lg md:rounded-xl font-bold hover:bg-slate-700 transition-all border border-slate-700 text-xs md:text-base"
            >
              <RotateCcw size={16} className="md:w-5 md:h-5" /> Novo Scan
            </button>
            <button
              onClick={onClose}
              className="flex items-center justify-center gap-2 py-3 px-4 md:py-4 md:px-6 bg-blue-600 text-white rounded-lg md:rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-950/40 text-xs md:text-base"
            >
              Concluir
            </button>
          </div>
        </motion.div>

        {/* Detailed Breakdown */}
        <div className="bg-[#0f172a] rounded-2xl md:rounded-3xl shadow-lg p-4 md:p-6 border border-slate-800">
          <h3 className="text-xs md:text-sm font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-emerald-500 md:w-5 md:h-5" />
            Detalhamento
          </h3>
          
          <div className="space-y-2 md:space-y-3">
            {gabarito.questions.map((q) => {
              const studentAnswerObj = result.studentAnswers[Number(q.id)];
              const studentValue = studentAnswerObj?.value || '';
              const isCorrect = q.type === 'MC' 
                ? studentValue === q.correctAnswer 
                : studentValue.toUpperCase() === q.correctText?.toUpperCase();
              
              return (
                <div
                  key={q.id}
                  className={`flex items-center gap-3 md:gap-4 p-2 md:p-3 rounded-xl md:rounded-2xl border-2 transition-all ${
                    isCorrect 
                    ? 'border-emerald-900/30 bg-emerald-950/20' 
                    : 'border-red-900/30 bg-red-950/20'
                  }`}
                >
                  <div className="w-6 h-6 md:w-8 md:h-8 flex items-center justify-center bg-slate-800 rounded-full border border-slate-700 text-[10px] md:text-xs font-black text-slate-500 shrink-0">
                    {q.id}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 md:gap-2">
                      <span className={`notranslate text-base md:text-lg font-black ${isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
                        {studentValue || '-'}
                      </span>
                      {isCorrect ? (
                        <CheckCircle2 size={14} className="text-emerald-500" />
                      ) : (
                        <XCircle size={14} className="text-red-500" />
                      )}
                    </div>
                    <span className="text-[8px] md:text-[10px] text-slate-600 font-bold uppercase tracking-wider block">
                      {q.type === 'MC' ? 'Múltipla' : 'Aberta'}
                    </span>
                  </div>

                  {!isCorrect && (
                    <div className="text-right shrink-0">
                      <span className="text-[8px] md:text-[10px] text-slate-600 font-bold uppercase block">Gabarito</span>
                      <span className="notranslate text-xs md:text-sm font-bold text-emerald-500">
                        {q.type === 'MC' ? q.correctAnswer : q.correctText}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
