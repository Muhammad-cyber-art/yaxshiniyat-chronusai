import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
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
  Target,
  Dna,
  Atom,
  Building2
} from 'lucide-react';
import ThemeToggle from '../ThemeToggle';
import { get_user_info } from '../Authorized/getRole';

export default function SimulationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const userInfo = get_user_info();

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
        const preselectedCourseId = searchParams.get('courseId');
        if (preselectedId) {
          const found = list.find((c) => c.id === preselectedId || c.slug === preselectedId);
          if (found) setSelectedCase(found);
        } else if (preselectedCourseId) {
          const found = list.find((c) => c.course === preselectedCourseId || String(c.course_id) === String(preselectedCourseId));
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
      setSelectedCase(null);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Submit student turn
  async function handleSendTurn(e) {
    if (e) e.preventDefault();
    if (!studentInput.trim() || isSubmitting || !session) return;

    const currentInput = studentInput.trim();
    setStudentInput('');
    setIsSubmitting(true);
    setErrorMessage('');

    // Optimistic user turn UI update
    const optimisticTurn = {
      step_number: history.length + 1,
      student_input: currentInput,
      feedback: '',
      step_score: 0,
      loading: true,
    };
    setHistory((prev) => [...prev, optimisticTurn]);

    try {
      const res = await api.post(`simulations/${session.session_id}/turn/`, {
        student_input: currentInput,
      });
      const data = res.data?.data || res.data;

      // Replace optimistic turn with server evaluation
      setHistory((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = {
          step_number: data.step_number,
          student_input: currentInput,
          feedback: data.feedback,
          strengths: data.strengths || [],
          error_flags: data.error_flags || [],
          step_score: data.step_score,
          running_total_score: data.running_total_score,
          next_scenario: data.next_scenario,
          is_final: data.is_final,
          loading: false,
        };
        return copy;
      });

      // If simulation completed
      if (data.is_final) {
        setCompletedSession({
          final_score: data.running_total_score,
          is_passed: data.is_passed,
          coins_earned: data.coins_earned || (data.is_passed ? 30 : 5),
          passing_score: session.passing_score || 70,
        });
        setUserCoins((prev) => prev + (data.coins_earned || (data.is_passed ? 30 : 5)));
      }
    } catch (err) {
      console.error('Submit turn failed:', err);
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.detail ||
        "Javobni baholashda xatolik yuz berdi.";
      setErrorMessage(msg);
      setHistory((prev) => prev.slice(0, -1));
    } finally {
      setIsSubmitting(false);
    }
  }

  // Abandon active session
  function handleAbandonSession() {
    if (window.confirm("Haqiqatdan ham joriy simulyatsiyadan chiqmoqchimisiz? To'plangan ballar saqlanmaydi.")) {
      setSession(null);
      setSelectedCase(null);
      setHistory([]);
      setCompletedSession(null);
    }
  }

  // Filter cases icon helper
  function getCaseIcon(c) {
    const slug = (c.slug || c.title || '').toLowerCase();
    if (slug.includes('dna') || slug.includes('bio') || slug.includes('gen')) return Dna;
    if (slug.includes('fizika') || slug.includes('kvant') || slug.includes('foto')) return Atom;
    if (slug.includes('sud') || slug.includes('huquq') || slug.includes('shartnoma')) return Scale;
    return Sparkles;
  }

  const filteredCases = cases.filter((c) => {
    if (activeCategory === 'ALL') return true;
    const slug = (c.slug || c.title || '').toLowerCase();
    if (activeCategory === 'SCIENCE') {
      return slug.includes('bio') || slug.includes('dnk') || slug.includes('fizika') || slug.includes('kvant') || slug.includes('kimyo');
    }
    if (activeCategory === 'HUMANITIES') {
      return slug.includes('sud') || slug.includes('shartnoma') || slug.includes('huquq') || slug.includes('tarix');
    }
    return true;
  });

  const latestTurn = history[history.length - 1];
  const currentRunningScore = latestTurn?.running_total_score ?? null;

  return (
    <div className="min-h-screen bg-[#fdfaf5] text-[#120f0d] flex flex-col font-sans selection:bg-[#967b4f]/25">
      {/* Aurora Ambient Glow (Warm Champagne & Gold Luxury) */}
      <div aria-hidden className="fixed inset-0 pointer-events-none -z-10 overflow-hidden opacity-60">
        <div className="absolute -top-32 -left-32 w-[36rem] h-[36rem] rounded-full bg-[#967b4f]/15 blur-[140px]" />
        <div className="absolute top-1/2 -right-32 w-[32rem] h-[32rem] rounded-full bg-amber-500/10 blur-[140px]" />
      </div>

      {/* Luxury Bright Header in Solid System Theme Color (#fdfaf5) */}
      <header
        style={{ backgroundColor: "#fdfaf5" }}
        className="h-16 border-b border-[#967b4f]/20 bg-[#fdfaf5] sticky top-0 z-50 px-4 sm:px-8 flex items-center justify-between shadow-[0_4px_25px_rgba(150,123,79,0.08)] transition-all"
      >
        <div className="flex items-center gap-4">
          <Link
            to={userInfo?.role === 'mentor' ? "/mentor/dashboard" : "/student/dashboard"}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white hover:bg-[#967b4f]/10 text-[#4a3d31] hover:text-[#120f0d] text-xs font-bold border border-[#967b4f]/25 transition-all shadow-sm active:scale-95"
          >
            <ArrowLeft className="w-4 h-4 text-[#967b4f]" />
            <span>Dashboardga qaytish</span>
          </Link>

          <div className="h-4 w-px bg-[#967b4f]/20 hidden sm:block" />

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#967b4f] to-[#78613c] flex items-center justify-center text-white shadow-md shadow-[#967b4f]/25">
              <Bot className="w-4.5 h-4.5" />
            </div>
            <div>
              <span className="font-serif font-black text-sm tracking-wide text-[#120f0d] flex items-center gap-1.5">
                Chronous AI <span className="text-[11px] text-[#967b4f] font-normal hidden sm:inline">| Simulyator</span>
              </span>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              Gemini 2.5 Flash
            </span>
          </div>
        </div>

        {/* User Stats & Controls */}
        <div className="flex items-center gap-3">
          {session && !completedSession && (
            <button
              onClick={handleAbandonSession}
              className="flex items-center gap-1.5 text-xs text-rose-700 hover:text-rose-900 px-3 py-1.5 rounded-full border border-rose-300 bg-rose-50 hover:bg-rose-100 transition-all font-bold"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Chiqish</span>
            </button>
          )}

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-xs font-black text-amber-900 shadow-sm">
            <Coins className="w-3.5 h-3.5 text-[#967b4f]" />
            <span>{userCoins} Tanga</span>
          </div>

          <ThemeToggle />
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col">
        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between shadow-sm animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage('')}
              className="text-rose-600 hover:text-rose-800 text-xs font-bold px-2 py-1 rounded-lg hover:bg-rose-100 transition-all"
            >
              Yopish
            </button>
          </div>
        )}

        {/* VIEW 1: COMPLETED SESSION MODAL/CARD */}
        {completedSession ? (
          <div className="flex-1 flex items-center justify-center py-8 animate-in fade-in">
            <div className="max-w-md w-full bg-white border border-[#967b4f]/25 rounded-3xl p-8 shadow-2xl text-center flex flex-col items-center backdrop-blur-xl relative overflow-hidden">
              <div
                className={`w-20 h-20 rounded-2xl flex items-center justify-center shadow-xl mb-6 ${
                  completedSession.is_passed
                    ? 'bg-emerald-600 text-white shadow-emerald-500/25'
                    : 'bg-[#967b4f] text-white shadow-amber-500/25'
                }`}
              >
                {completedSession.is_passed ? (
                  <Trophy className="w-10 h-10" />
                ) : (
                  <Award className="w-10 h-10" />
                )}
              </div>

              <h2 className="text-2xl font-serif font-black text-[#120f0d]">
                {completedSession.is_passed ? "Simulyatsiya Muvaffaqiyatli Yakunlandi!" : "Simulyatsiya Yakunlandi"}
              </h2>
              <p className="text-[#827161] text-xs sm:text-sm mt-2 mb-6 leading-relaxed">
                {completedSession.is_passed
                  ? "Siz vaziyatni muvaffaqiyatli tahlil qildingiz va ilmiy me'yorlarni to'liq bajardingiz!"
                  : "O'tish talabiga biroz yetmadi. AI tahlilini ko'rib, qayta urinib ko'ring."}
              </p>

              {/* Score breakdown */}
              <div className="w-full bg-[#fdfaf5] border border-[#967b4f]/20 rounded-2xl p-5 mb-6 text-center">
                <div className="text-[11px] text-[#827161] uppercase tracking-wider font-bold mb-1">
                  Yakuniy Mahorat Bali
                </div>
                <div className="text-4xl font-serif font-black text-[#967b4f]">
                  {Math.round(completedSession.final_score)}%
                </div>
                <div className="mt-2 text-xs text-[#827161]">
                  O'tish talabi: <span className="font-bold text-[#120f0d]">{completedSession.passing_score || 70}%</span>
                </div>

                <div className="mt-4 pt-3 border-t border-[#967b4f]/15 flex items-center justify-center gap-2 text-amber-900 font-bold text-xs sm:text-sm">
                  <Coins className="w-4 h-4 text-[#967b4f]" />
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
                  className="flex-1 py-3 px-4 rounded-xl bg-[#fdfaf5] hover:bg-[#967b4f]/10 border border-[#967b4f]/25 text-[#120f0d] font-bold text-xs transition-all flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4 text-[#967b4f]" />
                  <span>Boshqa Keys</span>
                </button>
                <Link
                  to={userInfo?.role === 'mentor' ? "/mentor/dashboard" : "/student/dashboard"}
                  style={{ color: "#ffffff" }}
                  className="flex-1 py-3 px-4 rounded-xl bg-[#967b4f] hover:bg-[#806740] text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-md"
                >
                  <span style={{ color: "#ffffff" }}>Dashboardga Qaytish</span>
                  <ArrowRight className="w-4 h-4 text-white" />
                </Link>
              </div>
            </div>
          </div>
        ) : !session ? (
          /* VIEW 2: CASE SELECTION CATALOG (Bright Luxury) */
          <div className="flex-1 flex flex-col animate-in fade-in">
            {/* Hero Banner */}
            <div className="mb-10 text-center max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-900 text-xs font-bold mb-4 shadow-sm">
                <Cpu className="w-3.5 h-3.5 text-[#967b4f]" />
                <span>Interaktiv Gemini 2.5 Flash Simulyatsiyasi</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-serif font-black text-[#120f0d] tracking-tight">
                Haqiqiy Vaziyatlar Simulyatsiyasi
              </h1>
              <p className="text-[#827161] text-xs sm:text-sm mt-3 leading-relaxed">
                Nazariy bilimlarni real ilmiy va huquqiy amaliyotga aylantiring. Har bir qadamingiz Gemini AI tomonidan baholanadi va xatolaringiz ko'rsatib beriladi.
              </p>

              {/* Category Filter Pills */}
              <div className="flex items-center justify-center gap-2.5 mt-6 flex-wrap">
                <button
                  onClick={() => setActiveCategory('ALL')}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                    activeCategory === 'ALL'
                      ? 'bg-[#967b4f] text-white shadow-md shadow-[#967b4f]/25'
                      : 'bg-white border border-[#967b4f]/20 text-[#827161] hover:border-[#967b4f]/40 hover:text-[#120f0d]'
                  }`}
                >
                  Barchasi ({cases.length})
                </button>
                <button
                  onClick={() => setActiveCategory('SCIENCE')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                    activeCategory === 'SCIENCE'
                      ? 'bg-[#967b4f] text-white shadow-md shadow-[#967b4f]/25'
                      : 'bg-white border border-[#967b4f]/20 text-[#827161] hover:border-[#967b4f]/40 hover:text-[#120f0d]'
                  }`}
                >
                  <Dna className="w-3.5 h-3.5" />
                  <span>Aniq fanlar (Biologiya, Fizika)</span>
                </button>
                <button
                  onClick={() => setActiveCategory('HUMANITIES')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                    activeCategory === 'HUMANITIES'
                      ? 'bg-[#967b4f] text-white shadow-md shadow-[#967b4f]/25'
                      : 'bg-white border border-[#967b4f]/20 text-[#827161] hover:border-[#967b4f]/40 hover:text-[#120f0d]'
                  }`}
                >
                  <Scale className="w-3.5 h-3.5" />
                  <span>Gumanitar fanlar (Huquq, Tarix)</span>
                </button>
              </div>
            </div>

            {loadingCases ? (
              <div className="grid md:grid-cols-2 gap-6">
                {[1, 2].map((i) => (
                  <div key={i} className="h-64 rounded-3xl bg-white/70 border border-[#967b4f]/15 animate-pulse" />
                ))}
              </div>
            ) : filteredCases.length === 0 ? (
              <div className="text-center py-16 bg-white border border-[#967b4f]/20 rounded-3xl p-8 max-w-lg mx-auto shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-[#fdfaf5] border border-[#967b4f]/20 flex items-center justify-center mx-auto mb-4 text-[#967b4f]">
                  <HelpCircle className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-serif font-bold text-[#120f0d]">Keyslar mavjud emas</h3>
                <p className="text-[#827161] text-xs mt-1">Ushbu bo'limda hozircha faol simulyatsiyalar topilmadi.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {filteredCases.map((c) => {
                  const IconComp = getCaseIcon(c);
                  return (
                    <div
                      key={c.id}
                      className="lux-card bg-white/95 border border-[#967b4f]/25 hover:border-[#967b4f] rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 hover:shadow-xl group relative overflow-hidden"
                    >
                      <div>
                        {/* Top tags */}
                        <div className="flex items-center justify-between gap-2 mb-5">
                          <span
                            className={`text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${
                              c.difficulty === 'EASY'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : c.difficulty === 'HARD'
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {c.difficulty || 'MEDIUM'}
                          </span>
                          <div className="flex items-center gap-1.5 text-xs text-amber-900 font-bold bg-amber-500/15 border border-amber-500/25 px-2.5 py-1 rounded-full shadow-sm">
                            <Coins className="w-3.5 h-3.5 text-[#967b4f]" />
                            <span>+{c.coin_reward || 25} tanga</span>
                          </div>
                        </div>

                        {/* Title & Icon */}
                        <div className="flex items-start gap-4 mb-3">
                          <div className="w-12 h-12 rounded-2xl bg-[#967b4f]/10 border border-[#967b4f]/20 flex items-center justify-center shrink-0 text-[#967b4f] group-hover:bg-[#967b4f] group-hover:text-white transition-all shadow-sm">
                            <IconComp className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="font-serif font-bold text-base sm:text-lg text-[#120f0d] group-hover:text-[#967b4f] transition-colors leading-snug">
                              {c.title}
                            </h3>
                            <p className="text-xs text-[#827161] mt-1 flex items-center gap-1">
                              <span>Rol:</span>
                              <span className="text-[#967b4f] font-semibold">{c.role_context}</span>
                            </p>
                          </div>
                        </div>

                        <p className="text-[#827161] text-xs sm:text-sm leading-relaxed mb-6 line-clamp-3">
                          {c.description}
                        </p>
                      </div>

                      {/* Footer Specs & Launch button */}
                      <div className="pt-4 border-t border-[#967b4f]/15 flex items-center justify-between">
                        <div className="flex items-center gap-4 text-xs text-[#827161]">
                          <div>
                            Qadamlar: <span className="text-[#120f0d] font-bold">{c.max_steps || 4} ta</span>
                          </div>
                          <div>
                            O'tish bali: <span className="text-[#120f0d] font-bold">{c.passing_score || 70}%</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleStartSession(c)}
                          disabled={isSubmitting}
                          style={{ color: "#ffffff" }}
                          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#967b4f] hover:bg-[#806740] text-white font-bold text-xs transition-all shadow-md active:scale-[0.98] disabled:opacity-50"
                        >
                          <Play className="w-3.5 h-3.5 fill-white text-white" />
                          <span style={{ color: "#ffffff" }}>Boshlash</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* VIEW 3: ACTIVE SIMULATION WORKSPACE (Bright Luxury) */
          <div className="flex-1 flex flex-col bg-white border border-[#967b4f]/25 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl animate-in fade-in">
            {/* Active Session Header Bar */}
            <div className="p-4 sm:p-5 bg-[#fdfaf5] border-b border-[#967b4f]/20 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/25 text-amber-900 text-xs font-bold">
                    <Bot className="w-3 h-3 text-[#967b4f]" />
                    Jonli Simulyatsiya
                  </span>
                  <span className="text-xs text-[#827161] font-medium">
                    Qadam: {history.length} / {session.max_steps || 4}
                  </span>
                </div>
                <h2 className="text-lg font-serif font-black text-[#120f0d] tracking-tight">
                  {session.case_title || selectedCase?.title}
                </h2>
                <p className="text-xs text-[#827161] mt-0.5">
                  Rolingiz: <span className="text-[#967b4f] font-bold">{session.role_context}</span>
                </p>
              </div>

              {/* Running Score Meter */}
              {currentRunningScore !== null && (
                <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-white border border-[#967b4f]/25 shadow-sm">
                  <Target className="w-4 h-4 text-[#967b4f]" />
                  <div className="text-right">
                    <div className="text-[10px] text-[#827161] uppercase tracking-wider font-bold">
                      Joriy Ball
                    </div>
                    <div className="text-base font-black text-[#967b4f]">
                      {Math.round(currentRunningScore)}%
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Turns Conversation Stream */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6 max-h-[580px] bg-[#fdfbf9]/50">
              {/* Initial Case Briefing Card */}
              <div className="p-5 rounded-2xl bg-amber-50/70 border border-[#967b4f]/25 text-[#120f0d] text-xs sm:text-sm shadow-sm">
                <div className="flex items-center gap-2 font-bold text-amber-900 text-xs uppercase tracking-wider mb-2">
                  <BookOpen className="w-4 h-4 text-[#967b4f]" />
                  <span>Dastlabki Vaziyat Tavsifi</span>
                </div>
                <p className="leading-relaxed whitespace-pre-wrap">{session.description}</p>
              </div>

              {/* History Turns */}
              {history.map((step, idx) => (
                <div key={idx} className="space-y-4 animate-in fade-in">
                  {/* Student Response Turn */}
                  <div className="flex justify-end">
                    <div className="max-w-[85%] bg-[#120f0d] text-white p-4 rounded-2xl rounded-br-sm shadow-md text-xs sm:text-sm">
                      <div className="text-[10px] text-amber-200 font-bold mb-1 flex items-center gap-1.5 uppercase tracking-wider">
                        <User className="w-3 h-3" />
                        <span>Sizning javobingiz (Qadam #{step.step_number || idx + 1})</span>
                      </div>
                      <p className="whitespace-pre-wrap leading-relaxed">{step.student_input}</p>
                    </div>
                  </div>

                  {/* AI Evaluation Turn */}
                  {step.loading ? (
                    <div className="flex justify-start">
                      <div className="bg-white border border-[#967b4f]/20 p-4 rounded-2xl rounded-bl-sm flex items-center gap-3 text-[#4a3d31] text-xs sm:text-sm shadow-sm">
                        <div className="w-4 h-4 border-2 border-[#967b4f] border-t-transparent rounded-full animate-spin" />
                        <span className="flex items-center gap-2 font-medium">
                          <Cpu className="w-4 h-4 text-[#967b4f] animate-pulse" />
                          Gemini AI tahlil qilmoqda va ilmiy me'yorlarni tekshirmoqda...
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-start">
                      <div className="max-w-[95%] w-full bg-white border border-[#967b4f]/25 p-5 rounded-2xl rounded-bl-sm shadow-md space-y-4">
                        {/* AI Score Header */}
                        <div className="flex items-center justify-between border-b border-[#967b4f]/15 pb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-[#967b4f]/15 flex items-center justify-center text-[#967b4f]">
                              <Bot className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-xs font-bold text-[#120f0d]">AI Mutaxassis Bahosi</span>
                          </div>
                          <div
                            className={`px-3 py-1 rounded-full text-xs font-black ${
                              step.step_score >= 70
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-amber-50 text-amber-900 border border-amber-200'
                            }`}
                          >
                            Baho: {step.step_score}/100
                          </div>
                        </div>

                        {/* Feedback Text */}
                        <p className="text-[#120f0d] text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                          {step.feedback}
                        </p>

                        {/* Strengths & Weaknesses */}
                        {(step.strengths?.length > 0 || step.error_flags?.length > 0) && (
                          <div className="grid sm:grid-cols-2 gap-3 pt-2">
                            {step.strengths?.length > 0 && (
                              <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200">
                                <div className="text-[11px] font-bold text-emerald-900 mb-1.5 flex items-center gap-1.5">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Kuchli tomonlar:</span>
                                </div>
                                <ul className="text-xs text-emerald-950 space-y-1 list-disc list-inside">
                                  {step.strengths.map((s, i) => (
                                    <li key={i}>{s}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {step.error_flags?.length > 0 && (
                              <div className="p-3.5 rounded-xl bg-rose-50/80 border border-rose-200">
                                <div className="text-[11px] font-bold text-rose-900 mb-1.5 flex items-center gap-1.5">
                                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                                  <span>E'tibor qaratish kerak:</span>
                                </div>
                                <ul className="text-xs text-rose-950 space-y-1 list-disc list-inside">
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
                          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-[#967b4f]/25 text-[#120f0d] text-xs leading-relaxed">
                            <span className="font-bold text-amber-900 uppercase tracking-wider block mb-1 flex items-center gap-1">
                              <Zap className="w-3 h-3 text-[#967b4f]" />
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
            <form onSubmit={handleSendTurn} className="p-4 bg-white border-t border-[#967b4f]/20 flex flex-col gap-2.5">
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
                  placeholder="Vaziyatni tahlil qiling, o'z ilmiy/amaliy xulosangizni asoslab yozing..."
                  disabled={isSubmitting || latestTurn?.is_final}
                  className="w-full bg-[#faf7f2] border border-[#967b4f]/30 rounded-2xl p-3.5 text-xs sm:text-sm text-[#120f0d] placeholder-[#827161] focus:outline-none focus:border-[#967b4f] focus:ring-1 focus:ring-[#967b4f] transition-all resize-none disabled:opacity-50"
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[11px] text-[#827161]">
                    Shift + Enter yangi qator, Enter yuborish
                  </span>
                  <button
                    type="submit"
                    disabled={!studentInput.trim() || isSubmitting || latestTurn?.is_final}
                    style={{ color: "#ffffff" }}
                    className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-[#967b4f] hover:bg-[#806740] text-white font-bold text-xs transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <span style={{ color: "#ffffff" }}>Yuborish</span>
                    <Send className="w-3.5 h-3.5 text-white" />
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
