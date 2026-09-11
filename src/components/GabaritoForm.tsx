import React, { useState } from 'react';
import { X, Plus, Trash2, Save, ListChecks, Type } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Gabarito, Question, QuestionType } from '../types';

interface GabaritoFormProps {
  onSave: (gabarito: Gabarito) => void;
  onCancel: () => void;
  initialData?: Gabarito;
}

const ALTERNATIVES = ['A', 'B', 'C', 'D', 'E'];

export const GabaritoForm: React.FC<GabaritoFormProps> = ({ onSave, onCancel, initialData }) => {
  const [name, setName] = useState(initialData?.name || '');
  const [questions, setQuestions] = useState<Question[]>(
    initialData?.questions || [{ id: 1, type: 'MC', correctAnswer: 'A' }]
  );

  const addQuestion = (type: QuestionType = 'MC') => {
    setQuestions([
      ...questions,
      { 
        id: questions.length + 1, 
        type, 
        correctAnswer: type === 'MC' ? 'A' : undefined,
        correctText: type === 'OPEN' ? '' : undefined
      }
    ]);
  };

  const removeQuestion = (id: number) => {
    if (questions.length > 1) {
      const updated = questions
        .filter(q => q.id !== id)
        .map((q, idx) => ({ ...q, id: idx + 1 }));
      setQuestions(updated);
    }
  };

  const updateMCAnswer = (id: number, answer: string) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, correctAnswer: answer } : q));
  };

  const updateOpenText = (id: number, text: string) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, correctText: text.toUpperCase().slice(0, 20) } : q));
  };

  const toggleType = (id: number) => {
    setQuestions(questions.map(q => {
      if (q.id === id) {
        const newType = q.type === 'MC' ? 'OPEN' : 'MC';
        return {
          ...q,
          type: newType,
          correctAnswer: newType === 'MC' ? 'A' : undefined,
          correctText: newType === 'OPEN' ? '' : undefined
        };
      }
      return q;
    }));
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || isSaving) return;
    setIsSaving(true);
    try {
      const id = initialData?.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15));
      await onSave({
        id,
        name,
        questions,
        createdAt: initialData?.createdAt || Date.now(),
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="bg-[#0f172a] rounded-2xl md:rounded-3xl shadow-2xl p-4 md:p-8 w-full max-w-2xl mx-auto border border-slate-800"
    >
      <div className="flex justify-between items-center mb-4 md:mb-8">
        <h2 className="text-xl md:text-2xl font-bold text-white">
          {initialData ? 'Editar Gabarito' : 'Novo Gabarito'}
        </h2>
        <button
          onClick={onCancel}
          className="p-1.5 md:p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-500"
        >
          <X size={20} className="md:w-6 md:h-6" />
        </button>
      </div>

      <div className="space-y-4 md:space-y-8">
        <div>
          <label className="block text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5 md:mb-2">
            Nome da Prova / Turma
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Matemática - 2º Ano A"
            className="w-full px-3 py-2.5 md:px-4 md:py-3 rounded-lg md:rounded-xl border border-slate-800 bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-white placeholder:text-slate-600 text-sm md:text-base"
          />
        </div>

        <div className="space-y-3 md:space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs md:text-sm font-bold uppercase tracking-widest text-slate-400">Questões ({questions.length})</h3>
            <div className="flex gap-2">
              <button
                onClick={() => addQuestion('MC')}
                className="flex items-center gap-1 px-2 py-1 md:px-3 md:py-1.5 bg-emerald-950/30 text-emerald-400 rounded-lg font-bold hover:bg-emerald-950/50 transition-colors text-[10px] md:text-xs border border-emerald-900/50"
              >
                <Plus size={12} /> Múltipla
              </button>
              <button
                onClick={() => addQuestion('OPEN')}
                className="flex items-center gap-1 px-2 py-1 md:px-3 md:py-1.5 bg-blue-950/30 text-blue-400 rounded-lg font-bold hover:bg-blue-950/50 transition-colors text-[10px] md:text-xs border border-blue-900/50"
              >
                <Plus size={12} /> Aberta
              </button>
            </div>
          </div>

          <div className="max-h-[300px] md:max-h-[400px] overflow-y-auto pr-1 md:pr-2 space-y-2 md:space-y-3 custom-scrollbar">
            {questions.map((q) => (
              <motion.div
                layout
                key={q.id}
                className="p-2 md:p-3 bg-slate-900/50 rounded-xl border border-slate-800/50 space-y-2"
              >
                <div className="flex items-center gap-2 md:gap-4">
                  <span className="w-6 h-6 md:w-8 md:h-8 flex items-center justify-center bg-slate-800 rounded-full border border-slate-700 text-[10px] md:text-sm font-bold text-slate-500 shrink-0">
                    {q.id}
                  </span>
                  
                  <div className="flex-1 min-w-0">
                    {q.type === 'MC' ? (
                      <div className="flex gap-1 md:gap-2">
                        {ALTERNATIVES.map((alt) => (
                          <button
                            key={alt}
                            onClick={() => updateMCAnswer(q.id, alt)}
                            className={`flex-1 aspect-square md:w-9 md:h-9 flex items-center justify-center rounded md:rounded-lg font-black transition-all text-xs md:text-base ${
                              q.correctAnswer === alt
                                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/40'
                                : 'bg-slate-800 text-slate-500 hover:bg-slate-700 border border-slate-700'
                            }`}
                          >
                            {alt}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1">
                        <input
                          type="text"
                          value={q.correctText}
                          onChange={(e) => updateOpenText(q.id, e.target.value)}
                          placeholder="Resposta esperada"
                          className="w-full px-2 py-1.5 md:px-3 md:py-2 rounded md:rounded-lg border border-slate-700 bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none text-xs md:text-sm font-mono uppercase text-white"
                          maxLength={20}
                        />
                        <span className="text-[8px] md:text-[10px] text-slate-600 font-bold uppercase tracking-wider">Questão Aberta</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-0.5 md:gap-1 shrink-0">
                    <button
                      onClick={() => toggleType(q.id)}
                      className="p-1.5 md:p-2 text-slate-600 hover:text-slate-400 transition-colors"
                      title="Alternar tipo"
                    >
                      <RefreshCcw size={14} className="md:w-4 md:h-4" />
                    </button>
                    <button
                      onClick={() => removeQuestion(q.id)}
                      className="p-1.5 md:p-2 text-slate-600 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={16} className="md:w-[18px] md:h-[18px]" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="pt-2 md:pt-4">
          <button
            onClick={handleSave}
            disabled={!name.trim() || isSaving}
            className="w-full flex items-center justify-center gap-2 py-3 md:py-4 bg-emerald-600 text-white rounded-xl md:rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-950/20 disabled:opacity-30 disabled:grayscale disabled:shadow-none text-sm md:text-base"
          >
            {isSaving ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
              />
            ) : (
              <Save size={18} className="md:w-5 md:h-5" />
            )}
            {isSaving ? 'Salvando...' : 'Salvar Gabarito'}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

import { RefreshCcw } from 'lucide-react';
