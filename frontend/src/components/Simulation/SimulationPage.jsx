import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../tokenUpdater/updater';
import {
  Bot,
  Sparkles,
  Cpu,
  Zap,
  ShieldCheck,
  Scale,
  Terminal,
  ArrowRight,
  ArrowLeft,
  Play,
  Send,
  CheckCircle2,
  AlertCircle,
  Trophy,
  Award,
  Coins,
  LogOut,
  RotateCcw,
  BookOpen,
  User,
  Flame,
  HelpCircle,
  Layers,
  Target
} from 'lucide-react';

export default function SimulationPage() {
  const [searchParams] = useSearchParams();

  // State: Case Selection & Active Session
  const [cases, setCases] = useState([]);
  const [loadingCases, setLoadingCases] = useState(true);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [selectedCase, setSelectedCase] = useState(null);
  const [session, setSession] = useState(null);
  const [history, setHistory] = useState([]);
  const [studentInput, setStudentInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [completedSession, setCompletedSession] = useState(null);
  const [userCoins, setUserCoins] = useState(120);

  const turnsEndRef = useRef(null);

  useEffect(() => {
    turnsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, isSubmitting]);

  // Load available simulation cases
  useEffect(() => {
    async function loadCases() {
      setLoadingCases(true);
      try {
        const res = await api.get('simulations/cases/');
        const data = res.data;
        const list = Array.isArray(data) ? data : data?.results || [];
        setCases(list);

        const preselectedId = searchParams.get('caseId');
        if (preselectedId) {
          const found = list.find((c) => c.id === preselectedId);
          if (found) setSelectedCase(found);
        }
      } catch (err) {
        console.error('Failed to load simulation cases:', err);
        setErrorMessage("Simulyatsiyalarni yuklashda xatolik yuz berdi. Backend bilan aloqani tekshiring.");
      } finally {
        setLoadingCases(false);
      }
    }
    loadCases();
  }, [searchParams]);

  // Start a new simulation session
  async function handleStartSession(caseObj) {
    setSelectedCase(caseObj);
    setErrorMessage('');
    setIsSubmitting(true);
    try {
      const res = await api.post('simulations/start/', { case_id: caseObj.id });
      const sessionData = res.data?.data || res.data;
      setSession(sessionData);
      if (Array.isArray(sessionData.step_logs) && sessionData.step_logs.length > 0) {
        setHistory(sessionData.step_logs);
      } else {
        setHistory([]);
      }
      setCompletedSession(null);
    } catch (err) {
      console.error('Start session failed:', err);
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.detail ||
        "Simulyatsiyani boshlashda xatolik yuz berdi.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Submit student turn to AI
  async function handleSendTurn(e) {
    e?.preventDefault();
    if (!studentInput.trim() || isSubmitting || !session) return;

    const currentText = studentInput.trim();
    setStudentInput('');
    setIsSubmitting(true);
    setErrorMessage('');

    const tempStepNumber = history.length + 1;
    const pendingStep = {
      step_number: tempStepNumber,
      student_input: currentText,
      loading: true,
    };
    setHistory((prev) => [...prev, pendingStep]);

    try {
      const sessionId = session.session_id || session.id;
      const res = await api.post(`simulations/sessions/${sessionId}/turn/`, {
        student_input: currentText,
      });
      const data = res.data?.data || res.data;

      setHistory((prev) =>
        prev.map((item, idx) =>
          idx === prev.length - 1 ? { ...data, student_input: currentText, loading: false } : item
        )
      );

      if (data.is_final) {
        const finalScore = data.running_total_score ?? data.step_score ?? 0;
        const passReq = session.passing_score || 70;
        const passed = finalScore >= passReq;
        const earned = passed ? (session.coin_reward || 25) : 5;
        setUserCoins((prev) => prev + earned);

        setCompletedSession({
          ...session,
          final_score: finalScore,
          is_passed: passed,
          coins_earned: earned,
        });
      }
    } catch (err) {
      console.error('Submit turn failed:', err);
      const msg = err.response?.data?.error?.message || "AI javobni tahlil qilishda xatolik yuz berdi. Iltimos qayta urinib ko'ring.";
      setErrorMessage(msg);
      setHistory((prev) => prev.slice(0, -1));
      setStudentInput(currentText);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Abandon active session
  async function handleAbandonSession() {
    if (!window.confirm("Rostdan ham ushbu simulyatsiyani yakunlamasdan to'xtatmoqchimisiz?")) return;
    if (session) {
      try {
        const sessionId = session.session_id || session.id;
        await api.post(`simulations/sessions/${sessionId}/abandon/`);
      } catch (err) {
        console.error('Abandon error:', err);
      }
    }
    setSession(null);
    setHistory([]);
    setSelectedCase(null);
    setCompletedSession(null);
  }

  // Helper for case category icon
  function getCaseIcon(c) {
    const slug = (c.slug || c.title || '').toLowerCase();
    if (slug.includes('sql') || slug.includes('kiber') || slug.includes('security') || slug.includes('hujum')) {
      return ShieldCheck;
    }
    if (slug.includes('sud') || slug.includes('shartnoma') || slug.includes('huquq') || slug.includes('qonun')) {
      return Scale;
    }
    return Terminal;
  }

  // Filter cases by tab
  const filteredCases = cases.filter((c) => {
    if (activeCategory === 'ALL') return true;
    const slug = (c.slug || c.title || '').toLowerCase();
    if (activeCategory === 'SECURITY') {
      return slug.includes('sql') || slug.includes('kiber') || slug.includes('security');
    }
    if (activeCategory === 'LAW') {
      return slug.includes('sud') || slug.includes('shartnoma') || slug.includes('huquq');
    }
    return true;
  });

  const latestTurn = history[history.length - 1];
  const currentRunningScore = latestTurn?.running_total_score ?? null;

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Background radial glow */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-indigo-600/15 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[400px] bg-blue-600/10 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <header className="h-16 border-b border-slate-800/80 bg-[#070b14]/80 backdrop-blur-xl sticky top-0 z-30 px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700/60 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Bosh sahifa</span>
          </Link>
          <div className="h-4 w-px bg-slate-800 hidden sm:block" />
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
                ChronosAI <span className="text-xs text-indigo-400 font-normal hidden sm:inline">| Virtual AI Lab</span>
              </span>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              <Sparkles className="w-3 h-3" />
              Gemini 2.5 Flash
            </span>
          </div>
        </div>

        {/* User Stats & Controls */}
        <div className="flex items-center gap-3">
          {session && !completedSession && (
            <button
              onClick={handleAbandonSession}
              className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 px-3 py-1.5 rounded-xl border border-rose-500/30 hover:bg-rose-500/10 transition-all font-medium"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Chiqish</span>
            </button>
          )}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-amber-500/30 text-xs font-semibold text-amber-300 shadow-sm">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span>{userCoins} Tanga</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col">
        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-950/40 border border-rose-800/60 text-rose-200 text-sm flex items-center justify-between animate-fadeIn shadow-lg">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage('')}
              className="text-rose-400 hover:text-rose-200 text-xs font-bold px-2 py-1 rounded-lg hover:bg-rose-900/40 transition-all"
            >
              Yopish
            </button>
          </div>
        )}

        {/* VIEW 1: COMPLETED SESSION MODAL/CARD */}
        {completedSession ? (
          <div className="flex-1 flex items-center justify-center py-8 animate-fadeIn">
            <div className="max-w-md w-full bg-slate-900/90 border border-slate-800/80 rounded-3xl p-8 shadow-2xl text-center flex flex-col items-center backdrop-blur-xl relative overflow-hidden">
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl" />
              <div
                className={`w-20 h-20 rounded-2xl flex items-center justify-center shadow-xl mb-6 ${
                  completedSession.is_passed
                    ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-emerald-500/25'
                    : 'bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-amber-500/25'
                }`}
              >
                {completedSession.is_passed ? (
                  <Trophy className="w-10 h-10" />
                ) : (
                  <Award className="w-10 h-10" />
                )}
              </div>

              <h2 className="text-2xl font-bold text-white tracking-tight">
                {completedSession.is_passed ? "Simulyatsiya Muvaffaqiyatli Yakunlandi!" : "Simulyatsiya Yakunlandi"}
              </h2>
              <p className="text-slate-400 text-sm mt-2 mb-6 leading-relaxed">
                {completedSession.is_passed
                  ? "Siz vaziyatni muvaffaqiyatli tahlil qildingiz va belgilangan me'yorlarni bajardingiz!"
                  : "O'tish talabiga biroz yetmadi. Tavsiyalarni o'rganib, qayta urinib ko'ring."}
              </p>

              {/* Score breakdown */}
              <div className="w-full bg-slate-950/60 border border-slate-800 rounded-2xl p-5 mb-6 text-center">
                <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">
                  Yakuniy Mahorat Bali
                </div>
                <div className="text-4xl font-black text-indigo-400">
                  {Math.round(completedSession.final_score)}%
                </div>
                <div className="mt-2 text-xs text-slate-400">
                  O'tish chegarasi: <span className="font-bold text-slate-200">{completedSession.passing_score || 70}%</span>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-center gap-2 text-amber-300 font-bold text-sm">
                  <Coins className="w-4 h-4 text-amber-400" />
                  <span>+{completedSession.coins_earned} Tanga hisobingizga qo'shildi!</span>
                </div>
              </div>

              <div className="flex gap-3 w-full">
                <button
                  onClick={() => {
                    setSession(null);
                    setCompletedSession(null);
                    setHistory([]);
                    setSelectedCase(null);
                  }}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition-all flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Boshqa Keys</span>
                </button>
                <Link
                  to="/"
                  className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/30"
                >
                  <span>Bosh Sahifa</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        ) : !session ? (
          /* VIEW 2: CASE SELECTION CATALOG */
          <div className="flex-1 flex flex-col animate-fadeIn">
            {/* Hero Banner */}
            <div className="mb-10 text-center max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-4">
                <Cpu className="w-3.5 h-3.5" />
                <span>Interaktiv Gemini 2.5 Flash Simulyatsiyasi</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Haqiqiy Vaziyatlar Simulyatsiyasi
              </h1>
              <p className="text-slate-400 text-sm sm:text-base mt-3 leading-relaxed">
                Nazariy bilimlarni real amaliyotga aylantiring. Har bir qadamingiz Gemini AI tomonidan baholanadi va RAG bilimlar bazasi orqali xatolaringiz ko'rsatib beriladi.
              </p>

              {/* Category Filter Pills */}
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => setActiveCategory('ALL')}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    activeCategory === 'ALL'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Barchasi ({cases.length})
                </button>
                <button
                  onClick={() => setActiveCategory('SECURITY')}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    activeCategory === 'SECURITY'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Kiberxavfsizlik</span>
                </button>
                <button
                  onClick={() => setActiveCategory('LAW')}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    activeCategory === 'LAW'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Scale className="w-3.5 h-3.5" />
                  <span>Huquqshunoslik</span>
                </button>
              </div>
            </div>

            {loadingCases ? (
              <div className="grid md:grid-cols-2 gap-6">
                {[1, 2].map((i) => (
                  <div key={i} className="h-64 rounded-3xl bg-slate-900/40 border border-slate-800/80 animate-pulse" />
                ))}
              </div>
            ) : filteredCases.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/40 border border-slate-800/80 rounded-3xl p-8 max-w-lg mx-auto">
                <div className="w-14 h-14 rounded-2xl bg-slate-800/80 flex items-center justify-center mx-auto mb-4 text-slate-400">
                  <HelpCircle className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-slate-200">Keyslar mavjud emas</h3>
                <p className="text-slate-400 text-sm mt-1">Ushbu bo'limda hozircha faol simulyatsiyalar topilmadi.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {filteredCases.map((c) => {
                  const IconComp = getCaseIcon(c);
                  return (
                    <div
                      key={c.id}
                      className="bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800/80 hover:border-indigo-500/50 rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 group relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-bl-[100px] pointer-events-none group-hover:bg-indigo-500/10 transition-colors" />

                      <div>
                        {/* Top tags */}
                        <div className="flex items-center justify-between gap-2 mb-5">
                          <span
                            className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                              c.difficulty === 'EASY'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : c.difficulty === 'HARD'
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}
                          >
                            {c.difficulty || 'MEDIUM'}
                          </span>
                          <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
                            <Coins className="w-3.5 h-3.5" />
                            <span>+{c.coin_reward || 25} tanga</span>
                          </div>
                        </div>

                        {/* Title & Icon */}
                        <div className="flex items-start gap-4 mb-3">
                          <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center shrink-0 text-indigo-400 group-hover:scale-105 transition-transform">
                            <IconComp className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-white group-hover:text-indigo-300 transition-colors leading-snug">
                              {c.title}
                            </h3>
                            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                              <span>Rol:</span>
                              <span className="text-indigo-300 font-medium">{c.role_context}</span>
                            </p>
                          </div>
                        </div>

                        <p className="text-slate-300 text-sm leading-relaxed mb-6 line-clamp-3">
                          {c.description}
                        </p>
                      </div>

                      {/* Footer Specs & Launch button */}
                      <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                        <div className="flex items-center gap-4 text-xs text-slate-400">
                          <div>
                            Qadamlar: <span className="text-slate-200 font-semibold">{c.max_steps || 4} ta</span>
                          </div>
                          <div>
                            O'tish bali: <span className="text-slate-200 font-semibold">{c.passing_score || 70}%</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleStartSession(c)}
                          disabled={isSubmitting}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/30 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                        >
                          <Play className="w-4 h-4 fill-white" />
                          <span>Boshlash</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* VIEW 3: ACTIVE SIMULATION WORKSPACE */
          <div className="flex-1 flex flex-col bg-slate-900/60 border border-slate-800/80 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl animate-fadeIn">
            {/* Active Session Header Bar */}
            <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold">
                    <Bot className="w-3 h-3" />
                    Jonli Simulyatsiya
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    Qadam: {history.length} / {session.max_steps || 4}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-white tracking-tight">
                  {session.case_title || selectedCase?.title}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Rolingiz: <span className="text-indigo-300 font-semibold">{session.role_context}</span>
                </p>
              </div>

              {/* Running Score Meter */}
              {currentRunningScore !== null && (
                <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-slate-900 border border-slate-800">
                  <Target className="w-4 h-4 text-indigo-400" />
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                      Joriy Ball
                    </div>
                    <div className="text-base font-black text-indigo-400">
                      {Math.round(currentRunningScore)}%
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Turns Conversation Stream */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6 max-h-[580px]">
              {/* Initial Case Briefing Card */}
              <div className="p-5 rounded-2xl bg-indigo-950/25 border border-indigo-900/40 text-slate-300 text-sm shadow-inner">
                <div className="flex items-center gap-2 font-bold text-indigo-400 text-xs uppercase tracking-wider mb-2">
                  <BookOpen className="w-4 h-4" />
                  <span>Dastlabki Vaziyat Tavsifi</span>
                </div>
                <p className="leading-relaxed whitespace-pre-wrap">{session.description}</p>
              </div>

              {/* History Turns */}
              {history.map((step, idx) => (
                <div key={idx} className="space-y-4 animate-fadeIn">
                  {/* Student Response Turn */}
                  <div className="flex justify-end">
                    <div className="max-w-[85%] bg-indigo-600 text-white p-4 rounded-2xl rounded-br-sm shadow-md text-sm">
                      <div className="text-[11px] text-indigo-200 font-semibold mb-1 flex items-center gap-1.5">
                        <User className="w-3 h-3" />
                        <span>Sizning javobingiz (Qadam #{step.step_number || idx + 1})</span>
                      </div>
                      <p className="whitespace-pre-wrap leading-relaxed">{step.student_input}</p>
                    </div>
                  </div>

                  {/* AI Evaluation Turn */}
                  {step.loading ? (
                    <div className="flex justify-start">
                      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl rounded-bl-sm flex items-center gap-3 text-slate-300 text-sm shadow-lg">
                        <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                        <span className="flex items-center gap-2">
                          <Cpu className="w-4 h-4 text-indigo-400 animate-pulse" />
                          Gemini AI tahlil qilmoqda va RAG bilimlar bazasini tekshirmoqda...
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-start">
                      <div className="max-w-[95%] w-full bg-slate-900/90 border border-slate-800/80 p-5 rounded-2xl rounded-bl-sm shadow-xl space-y-4">
                        {/* AI Score Header */}
                        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                              <Bot className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-xs font-bold text-slate-200">AI Mutaxassis Bahosi</span>
                          </div>
                          <div
                            className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                              step.step_score >= 70
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            Baho: {step.step_score}/100
                          </div>
                        </div>

                        {/* Feedback Text */}
                        <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
                          {step.feedback}
                        </p>

                        {/* Strengths & Weaknesses */}
                        {(step.strengths?.length > 0 || step.error_flags?.length > 0) && (
                          <div className="grid sm:grid-cols-2 gap-3 pt-2">
                            {step.strengths?.length > 0 && (
                              <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-800/30">
                                <div className="text-[11px] font-bold text-emerald-400 mb-2 flex items-center gap-1.5">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Kuchli tomonlar:</span>
                                </div>
                                <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                                  {step.strengths.map((s, i) => (
                                    <li key={i}>{s}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {step.error_flags?.length > 0 && (
                              <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-800/30">
                                <div className="text-[11px] font-bold text-rose-400 mb-2 flex items-center gap-1.5">
                                  <AlertCircle className="w-3.5 h-3.5" />
                                  <span>E'tibor qaratish kerak:</span>
                                </div>
                                <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                                  {step.error_flags.map((e, i) => (
                                    <li key={i}>{e}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Next Scenario Prompt */}
                        {step.next_scenario && !step.is_final && (
                          <div className="p-3.5 rounded-xl bg-indigo-900/20 border border-indigo-800/40 text-indigo-200 text-xs leading-relaxed">
                            <span className="font-bold text-indigo-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                              <Zap className="w-3 h-3" />
                              Keyingi vaziyat / Savol:
                            </span>
                            {step.next_scenario}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div ref={turnsEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendTurn} className="p-4 bg-slate-950 border-t border-slate-800/80 flex flex-col gap-2.5">
              <div className="relative">
                <textarea
                  rows={3}
                  value={studentInput}
                  onChange={(e) => setStudentInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendTurn();
                    }
                  }}
                  placeholder="Vaziyatni tahlil qiling, o'z qaroringiz yoki javobingizni asoslab yozing..."
                  disabled={isSubmitting || latestTurn?.is_final}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-2xl p-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none disabled:opacity-50"
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[11px] text-slate-500">
                    Shift + Enter yangi qator, Enter yuborish
                  </span>
                  <button
                    type="submit"
                    disabled={!studentInput.trim() || isSubmitting || latestTurn?.is_final}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <span>Yuborish</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
