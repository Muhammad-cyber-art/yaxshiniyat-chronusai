import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, FlaskConical, CheckCircle2, AlertTriangle } from "lucide-react";

/**
 * MentorLabEntry — CRM dan Mentor Laboratoriyasiga Parolsiz Kirish
 * Route: /mentor-lab-entry?access=...&refresh=...
 */
export default function MentorLabEntry() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const access = searchParams.get("access");
    const refresh = searchParams.get("refresh");

    if (!access || !refresh) {
      setStatus("error");
      setMessage("Token ma'lumotlari topilmadi. Bu havola yaroqsiz yoki muddati tugagan.");
      return;
    }

    try {
      localStorage.setItem("access_token", access);
      localStorage.setItem("refresh_token", refresh);
      setStatus("success");
      setMessage("Laboratoriyaga muvaffaqiyatli kirdingiz! Yo'naltirilmoqda...");
      setTimeout(() => { navigate("/mentor/dashboard", { replace: true }); }, 900);
    } catch (err) {
      setStatus("error");
      setMessage("Tokenni saqlashda xatolik yuz berdi.");
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-[var(--bg-void)] flex items-center justify-center px-4 font-sans">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-[var(--gold)]/8 rounded-full blur-[120px]" />
      </div>
      <div className="relative z-10 w-full max-w-md text-center space-y-8">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute -inset-6 bg-[var(--gold)]/15 rounded-full blur-2xl animate-pulse" />
            <div className="relative w-20 h-20 rounded-[22px] bg-[var(--bg-panel)] border border-[var(--gold)]/30 flex items-center justify-center shadow-2xl">
              <FlaskConical size={36} className="text-[var(--gold)]" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-serif text-[var(--text-primary)] tracking-wide">
              Chronous <span className="text-[var(--gold)]">Lab</span>
            </h1>
            <p className="text-[10px] text-[var(--gold)] font-bold uppercase tracking-[0.4em] opacity-70 mt-1">Mentor Laboratoriyasi</p>
          </div>
        </div>
        <div className="lux-card !p-8 !bg-[var(--bg-panel)]/60 backdrop-blur-3xl border-[var(--border-glass)] rounded-3xl shadow-2xl">
          {status === "loading" && (
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[var(--gold)]/10 border border-[var(--gold)]/20 flex items-center justify-center">
                <Loader2 size={28} className="text-[var(--gold)] animate-spin" />
              </div>
              <p className="text-sm font-bold text-[var(--text-primary)]">Kirish amalga oshirilmoqda...</p>
            </div>
          )}
          {status === "success" && (
            <div className="flex flex-col items-center gap-4 animate-in fade-in duration-500">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                <CheckCircle2 size={28} className="text-emerald-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-[var(--text-primary)]">Muvaffaqiyatli!</p>
                <p className="text-[11px] text-emerald-500 font-semibold mt-1">{message}</p>
              </div>
              <div className="w-full h-1 bg-[var(--bg-void)] rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[var(--gold)] to-emerald-500 rounded-full" style={{animation: "progressBar 0.8s ease-out forwards"}} />
              </div>
            </div>
          )}
          {status === "error" && (
            <div className="flex flex-col items-center gap-4 animate-in fade-in duration-500">
              <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                <AlertTriangle size={28} className="text-red-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-red-400">Kirish amalga oshmadi</p>
                <p className="text-[11px] text-[var(--text-muted)] mt-2 leading-relaxed">{message}</p>
              </div>
              <button onClick={() => navigate("/crm/login")} className="mt-2 px-6 py-2.5 rounded-xl bg-[var(--gold)]/10 hover:bg-[var(--gold)]/20 text-[var(--gold)] text-xs font-bold border border-[var(--gold)]/25 transition-all">
                CRM ga qaytish
              </button>
            </div>
          )}
        </div>
        <p className="text-[10px] text-[var(--text-muted)] opacity-50">Chronous AI Education Platform</p>
      </div>
      <style>{`@keyframes progressBar { from { width:0%; } to { width:100%; } }`}</style>
    </div>
  );
}
