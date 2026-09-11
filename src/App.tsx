/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Plus, BookOpen, Trash2, Printer, Camera, Edit2, Info, LogOut, LogIn } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Gabarito, ScanResult } from './types';
import { GabaritoForm } from './components/GabaritoForm';
import { PrintView } from './components/PrintView';
import { Scanner } from './components/Scanner';
import { ResultView } from './components/ResultView';
import { auth, db, googleProvider } from './lib/firebase';
import { signOut, onAuthStateChanged, User, signInWithPopup } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, setDoc, deleteDoc, orderBy, Timestamp } from 'firebase/firestore';

type ViewState = 'dashboard' | 'form' | 'print' | 'scan' | 'result';

export default function App() {
  const [view, setView] = useState<ViewState>('dashboard');
  const [gabaritos, setGabaritos] = useState<Gabarito[]>([]);
  const [activeGabarito, setActiveGabarito] = useState<Gabarito | null>(null);
  const [lastScanResult, setLastScanResult] = useState<ScanResult | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [passError, setPassError] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(() => {
    return localStorage.getItem('app_authorized') === 'true';
  });

  const ACCESS_PASSWORD = '100529';

  // Auth listener
  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ACCESS_PASSWORD) {
      setIsAuthorized(true);
      localStorage.setItem('app_authorized', 'true');
      setPassError(false);
    } else {
      setPassError(true);
      setPassword('');
    }
  };

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Login failed', error);
    }
  };

  const handleLogout = () => {
    setIsAuthorized(false);
    localStorage.removeItem('app_authorized');
    signOut(auth);
  };

  // Check if the logged in user is the owner
  const isOwner = user?.email === 'thiagoeuclydes@gmail.com';

  // Firestore listener
  useEffect(() => {
    if (!user || !isAuthorized) {
      setGabaritos([]);
      return;
    }

    const q = query(
      collection(db, 'gabaritos'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        createdAt: (doc.data().createdAt as Timestamp).toMillis()
      })) as Gabarito[];
      setGabaritos(data);
    });
  }, [user, isAuthorized]);

  const handleSaveGabarito = async (gabarito: Gabarito) => {
    if (!user) return;
    
    try {
      const docRef = doc(db, 'gabaritos', gabarito.id);
      await setDoc(docRef, {
        ...gabarito,
        userId: user.uid,
        createdAt: Timestamp.fromMillis(gabarito.createdAt)
      });
      setView('dashboard');
      setActiveGabarito(null);
    } catch (error) {
      console.error('Failed to save', error);
    }
  };

  const deleteGabarito = async (id: string) => {
    if (confirm('Deseja excluir este gabarito?')) {
      try {
        await deleteDoc(doc(db, 'gabaritos', id));
      } catch (error) {
        console.error('Failed to delete', error);
      }
    }
  };

  const startScanning = (gabarito: Gabarito) => {
    setActiveGabarito(gabarito);
    setView('scan');
  };

  const handleScanResult = (result: ScanResult) => {
    setLastScanResult(result);
    setView('result');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-[#0f172a] p-8 rounded-3xl border border-slate-800 text-center shadow-2xl"
        >
          <div className="bg-emerald-600 text-white w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-950/20">
            <BookOpen size={48} />
          </div>
          <h1 className="text-3xl font-black text-white mb-2 tracking-tighter uppercase">CORRETOR FÁCIL</h1>
          <p className="text-slate-500 mb-8 font-medium">Acesso restrito ao administrador.</p>
          
          <button
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-3 py-4 bg-white text-slate-900 rounded-2xl font-bold hover:bg-slate-100 transition-all shadow-lg"
          >
            <LogIn size={20} /> Entrar com Google
          </button>
        </motion.div>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#0f172a] p-8 rounded-3xl border border-red-900/30 text-center">
          <h2 className="text-xl font-bold text-red-500 mb-2">Acesso Negado</h2>
          <p className="text-slate-500 mb-6">Este aplicativo é de uso exclusivo de Thiago Euclydes.</p>
          <button onClick={handleLogout} className="text-blue-500 font-bold underline">Trocar conta</button>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-[#0f172a] p-8 rounded-3xl border border-slate-800 text-center shadow-2xl"
        >
          <div className="w-16 h-16 bg-blue-600/20 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <LogIn size={32} />
          </div>
          <h1 className="text-2xl font-black text-white mb-2 uppercase">Verificação de PIN</h1>
          <p className="text-slate-500 mb-8 font-medium">Bem-vindo, Thiago. Digite sua senha para acessar os gabaritos.</p>
          
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPassError(false);
              }}
              placeholder="Digite sua senha"
              className={`w-full px-4 py-4 rounded-2xl bg-slate-900 border ${passError ? 'border-red-500' : 'border-slate-800'} text-white text-center text-2xl tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-700 placeholder:tracking-normal placeholder:text-base`}
              autoFocus
            />
            {passError && (
              <p className="text-red-500 text-xs font-bold uppercase tracking-widest">Senha incorreta</p>
            )}
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-3 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-950/40"
            >
              Confirmar PIN
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] font-sans text-slate-100">
      <AnimatePresence mode="wait">
        {view === 'dashboard' && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-4xl mx-auto p-4 md:p-12"
          >
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 mb-8 md:mb-12">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-600 text-white p-1.5 md:p-2 rounded-lg md:rounded-xl shadow-lg shadow-emerald-950/20 shrink-0">
                  <BookOpen size={24} className="md:w-8 md:h-8" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-4xl font-black tracking-tighter text-white leading-none">
                    CORRETOR FÁCIL
                  </h1>
                  <p className="text-slate-500 text-xs md:text-base font-medium mt-0.5">Olá, {user.displayName?.split(' ')[0]}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleLogout}
                  className="p-3 text-slate-500 hover:text-white transition-colors"
                  title="Sair"
                >
                  <LogOut size={20} />
                </button>
                <button
                  onClick={() => { setActiveGabarito(null); setView('form'); }}
                  className="flex items-center justify-center gap-2 px-5 py-3 md:px-6 md:py-4 bg-blue-600 text-white rounded-xl md:rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-950/20 group text-sm md:text-base"
                >
                  <Plus size={20} className="group-hover:rotate-90 transition-transform md:w-6 md:h-6" />
                  Novo Gabarito
                </button>
              </div>
            </div>

            {/* Empty State */}
            {gabaritos.length === 0 ? (
              <div className="bg-[#0f172a] rounded-2xl md:rounded-3xl p-8 md:p-12 text-center border border-slate-800 shadow-sm">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
                  <BookOpen size={32} className="md:w-10 md:h-10 text-slate-700" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-200 mb-2">Nenhum gabarito salvo</h2>
                <p className="text-slate-500 text-sm md:text-base mb-6 md:mb-8 max-w-xs md:max-w-sm mx-auto">Comece criando um gabarito para gerar sua folha de resposta e realizar as correções.</p>
                <button
                  onClick={() => setView('form')}
                  className="px-6 py-2.5 md:px-8 md:py-3 bg-emerald-600 text-white rounded-lg md:rounded-xl font-bold hover:bg-emerald-700 transition-all text-sm md:text-base"
                >
                  Criar Primeiro Gabarito
                </button>
              </div>
            ) : (
              <div className="space-y-4 md:space-y-6">
                <div className="flex items-center gap-2 text-slate-600 font-bold uppercase tracking-widest text-[10px] md:text-xs">
                  <span>{gabaritos.length} Gabaritos Salvos</span>
                </div>
                <div className="grid gap-4 md:gap-6">
                  {gabaritos.map((g) => (
                    <motion.div
                      layout
                      key={g.id}
                      className="bg-[#0f172a] rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-sm border border-slate-800 hover:border-blue-500/50 transition-all group"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg md:text-xl font-bold text-white mb-0.5 md:mb-1 truncate">{g.name}</h3>
                          <div className="flex items-center gap-3 text-[10px] md:text-sm text-slate-500 font-medium">
                            <span className="flex items-center gap-1">
                              {g.questions.length} questões
                            </span>
                            <span>•</span>
                            <span>Criado em {new Date(g.createdAt).toLocaleDateString()}</span>
                          </div>
                          
                          {/* Answer chips preview */}
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {g.questions.slice(0, 6).map((q) => (
                              <div key={q.id} className="text-[9px] md:text-[10px] font-black bg-slate-900 text-slate-500 px-1.5 py-0.5 md:px-2 md:py-1 rounded md:rounded-md border border-slate-800">
                                {q.id}:{q.type === 'MC' ? q.correctAnswer : '✏️'}
                              </div>
                            ))}
                            {g.questions.length > 6 && (
                              <div className="text-[9px] md:text-[10px] font-bold text-slate-700 px-1.5 py-0.5">
                                +{g.questions.length - 6}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 md:gap-3 justify-end">
                          <button
                            onClick={() => { setActiveGabarito(g); setView('form'); }}
                            className="p-2 md:p-3 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg md:rounded-xl transition-all"
                            title="Editar"
                          >
                            <Edit2 size={18} className="md:w-5 md:h-5" />
                          </button>
                          <button
                            onClick={() => deleteGabarito(g.id)}
                            className="p-2 md:p-3 text-slate-500 hover:text-red-400 hover:bg-red-950/30 rounded-lg md:rounded-xl transition-all"
                            title="Excluir"
                          >
                            <Trash2 size={18} className="md:w-5 md:h-5" />
                          </button>
                          <div className="h-8 md:h-10 w-px bg-slate-800 mx-1 hidden md:block"></div>
                          <button
                            onClick={() => { setActiveGabarito(g); setView('print'); }}
                            className="flex items-center gap-2 px-3 py-2 md:px-5 md:py-3 border-2 border-slate-700 text-slate-300 rounded-lg md:rounded-xl font-bold hover:bg-slate-800 hover:text-white transition-all text-xs md:text-sm"
                          >
                            <Printer size={16} className="md:w-[18px] md:h-[18px]" /> Folha
                          </button>
                          <button
                            onClick={() => startScanning(g)}
                            className="flex items-center gap-2 px-3 py-2 md:px-5 md:py-3 bg-emerald-600 text-white rounded-lg md:rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-950/20 text-xs md:text-sm"
                          >
                            <Camera size={16} className="md:w-[18px] md:h-[18px]" /> Escanear
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Instructions Card */}
            <div className="mt-8 md:mt-12 bg-[#0f172a] rounded-2xl md:rounded-3xl p-6 md:p-8 border border-slate-800 shadow-sm">
              <h3 className="text-lg md:text-xl font-bold text-white mb-4 md:mb-6 flex items-center gap-2">
                <Info size={20} className="text-emerald-500 md:w-6 md:h-6" />
                Como funciona?
              </h3>
              <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
                {[
                  { step: '1', title: 'Crie', desc: 'Monte seu gabarito com as respostas corretas.' },
                  { step: '2', title: 'Imprima', desc: 'Gere a folha de respostas com QR Code.' },
                  { step: '3', title: 'Aplique', desc: 'O aluno preenche os círculos com caneta.' },
                  { step: '4', title: 'Corrija', desc: 'Use a câmera do app para ler e dar a nota instantânea.' },
                ].map((item) => (
                  <div key={item.step} className="relative">
                    <span className="text-4xl md:text-5xl font-black text-slate-900 absolute -top-3 md:-top-4 -left-1 md:-left-2 select-none">
                      {item.step}
                    </span>
                    <div className="relative">
                      <h4 className="font-bold text-slate-200 text-sm md:text-base mb-1">{item.title}</h4>
                      <p className="text-xs md:text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {view === 'form' && (
          <div key="form" className="min-h-screen p-6 flex items-center justify-center">
            <GabaritoForm
              onSave={handleSaveGabarito}
              onCancel={() => { setView('dashboard'); setActiveGabarito(null); }}
              initialData={activeGabarito || undefined}
            />
          </div>
        )}

        {view === 'print' && activeGabarito && (
          <PrintView
            key="print"
            gabarito={activeGabarito}
            onBack={() => { setView('dashboard'); setActiveGabarito(null); }}
          />
        )}

        {view === 'scan' && activeGabarito && (
          <Scanner
            key="scan"
            onBack={() => { setView('dashboard'); setActiveGabarito(null); }}
            onResult={handleScanResult}
            gabarito={activeGabarito}
          />
        )}

        {view === 'result' && activeGabarito && lastScanResult && (
          <ResultView
            key="result"
            gabarito={activeGabarito}
            result={lastScanResult}
            onRetry={() => { setLastScanResult(null); setView('scan'); }}
            onClose={() => { setLastScanResult(null); setView('dashboard'); setActiveGabarito(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

