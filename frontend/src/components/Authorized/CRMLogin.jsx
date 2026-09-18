import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../tokenUpdater/updater.js";
import { get_user_info } from "./getRole";
import { jwtDecode } from "jwt-decode";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Building2,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import ThemeToggle from "../ThemeToggle";

export default function CRMLogin() {
  const navigate = useNavigate();
  const user_info = get_user_info();

  // Agar allaqachon CRM useri bo'lsa, tegishli dashboardga yo'naltiramiz
  useEffect(() => {
    if (user_info) {
      if (user_info.role === "admin") navigate("/admin");
      else if (user_info.role === "super_admin") navigate("/super_admin");
      else if (user_info.role === "mentor") navigate("/mentor");
    }
  }, [user_info, navigate]);

  const [form, setForm] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.username.trim() || !form.password.trim()) {
      setError("Username va parol to'ldirilishi shart.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await api.post("/crm/login/", {
        username: form.username.trim(),
        password: form.password,
      });

      localStorage.setItem("access_token", res.data.access);
      localStorage.setItem("refresh_token", res.data.refresh);

      const access = res.data.access;
      let role = res.data.user?.role;

      if (!role && access) {
        try {
          const payload = jwtDecode(access);
          role = payload.role;
          if (payload.is_superuser) role = "super_admin";
        } catch (_) {}
      }

      setSuccess("CRM tizimiga muvaffaqiyatli kirdingiz! Yo'naltirilmoqda...");

      setTimeout(() => {
        if (role === "super_admin") navigate("/super_admin");
        else if (role === "admin") navigate("/admin");
        else if (role === "mentor") navigate("/mentor");
        else navigate("/");
      }, 700);
    } catch (err) {
      const detail = err.response?.data?.detail;
      const status = err.response?.status;
      if (status === 403) {
        setError(
          detail ||
            "Bu tizimga kirish huquqingiz yo'q. CRM faqat admin va mentorlar uchun."
        );
      } else if (status === 401) {
        setError(detail || "Username yoki parol noto'g'ri.");
      } else {
        setError(detail || "Server bilan bog'lanishda xatolik yuz berdi.");
      }
      setTimeout(() => setError(""), 6000);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-8 relative overflow-hidden font-sans"
      style={{ background: "var(--bg-void)" }}
    >
      {/* Premium dark atmosphere */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute top-0 left-0 w-full h-full"
          style={{
            background:
              "radial-gradient(ellipse at 20% 20%, rgba(59,130,246,0.07) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(139,92,246,0.06) 0%, transparent 60%)",
          }}
        />
        {/* Grid lines */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="w-full max-w-[440px] relative z-10 space-y-5">
        {/* CRM Brand Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div
              className="relative w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{
                background:
                  "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.2))",
                border: "1px solid rgba(99,102,241,0.3)",
                boxShadow:
                  "0 0 40px rgba(99,102,241,0.15), inset 0 1px 0 rgba(255,255,255,0.05)",
              }}
            >
              <Building2 size={28} style={{ color: "#818cf8" }} />
              {/* Pulse ring */}
              <div
                className="absolute inset-0 rounded-2xl animate-ping opacity-20"
                style={{ background: "rgba(99,102,241,0.3)" }}
              />
            </div>
          </div>

          <div>
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              Chronous{" "}
              <span
                style={{
                  background: "linear-gradient(135deg, #818cf8, #6366f1)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                CRM
              </span>
            </h1>
            <p
              className="text-[10px] font-bold uppercase tracking-[0.4em] mt-1"
              style={{ color: "rgba(129,140,248,0.7)" }}
            >
              Boshqaruv Tizimi • Xodimlar Kirishi
            </p>
          </div>
        </div>

        {/* CRM Role Badge */}
        <div className="flex justify-center">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-bold"
            style={{
              background: "rgba(99,102,241,0.1)",
              border: "1px solid rgba(99,102,241,0.25)",
              color: "#818cf8",
            }}
          >
            <ShieldCheck size={13} />
            <span>Faqat Admin • Mentor • Super Admin</span>
          </div>
        </div>

        {/* Main Card */}
        <div
          className="rounded-3xl p-8"
          style={{
            background: "rgba(15,23,42,0.6)",
            backdropFilter: "blur(32px)",
            border: "1px solid rgba(99,102,241,0.2)",
            boxShadow:
              "0 25px 50px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)",
          }}
        >
          <div className="mb-6">
            <h2
              className="text-base font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              Tizimga kirish
            </h2>
            <p
              className="text-[11px] mt-1"
              style={{ color: "var(--text-muted)" }}
            >
              CRM xodimlari uchun xavfsiz kirish eshigi
            </p>
          </div>

          {/* Error */}
          {error && (
            <div
              className="mb-5 p-3.5 rounded-2xl flex items-start gap-2.5 text-xs font-semibold"
              style={{
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.25)",
                color: "#f87171",
              }}
            >
              <AlertTriangle size={15} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Success */}
          {success && (
            <div
              className="mb-5 p-3.5 rounded-2xl flex items-center gap-2.5 text-xs font-semibold"
              style={{
                background: "rgba(16,185,129,0.08)",
                border: "1px solid rgba(16,185,129,0.25)",
                color: "#34d399",
              }}
            >
              <CheckCircle2 size={15} className="shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username field */}
            <div className="relative group">
              <div
                className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: "var(--text-muted)" }}
              >
                <User size={17} />
              </div>
              <input
                id="crm-username"
                required
                type="text"
                name="username"
                value={form.username}
                onChange={handleChange}
                placeholder="Username"
                autoComplete="username"
                disabled={loading}
                className="w-full text-xs pl-11 pr-4 py-3.5 rounded-2xl outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(99,102,241,0.2)",
                  color: "var(--text-primary)",
                  fontFamily: "inherit",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "rgba(99,102,241,0.6)";
                  e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(99,102,241,0.2)";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Password field */}
            <div className="relative group">
              <div
                className="absolute left-4 top-1/2 -translate-y-1/2"
                style={{ color: "var(--text-muted)" }}
              >
                <Lock size={17} />
              </div>
              <input
                id="crm-password"
                required
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Parol"
                autoComplete="current-password"
                disabled={loading}
                className="w-full text-xs pl-11 pr-12 py-3.5 rounded-2xl outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(99,102,241,0.2)",
                  color: "var(--text-primary)",
                  fontFamily: "inherit",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "rgba(99,102,241,0.6)";
                  e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(99,102,241,0.2)";
                  e.target.style.boxShadow = "none";
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors hover:opacity-80"
                style={{ color: "var(--text-muted)" }}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>

            {/* Submit */}
            <button
              id="crm-login-submit"
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl text-xs font-black tracking-[0.15em] transition-all mt-2"
              style={{
                background: loading
                  ? "rgba(99,102,241,0.3)"
                  : "linear-gradient(135deg, #6366f1, #818cf8)",
                color: "white",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: loading
                  ? "none"
                  : "0 8px 25px rgba(99,102,241,0.35)",
                transform: loading ? "none" : undefined,
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none";
              }}
            >
              {loading ? (
                <>
                  <div
                    className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"
                    style={{ animation: "spin 0.8s linear infinite" }}
                  />
                  <span>TEKSHIRILMOQDA...</span>
                </>
              ) : (
                <>
                  <span>CRM TIZIMIGA KIRISH</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div
            className="mt-6 pt-5 flex items-center justify-between"
            style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
          >
            <div
              className="flex items-center gap-1.5 text-[10px] font-bold"
              style={{ color: "var(--text-muted)" }}
            >
              <ShieldCheck size={13} style={{ color: "#818cf8" }} />
              <span>Xavfsiz kirish • JWT</span>
            </div>
            <ThemeToggle />
          </div>
        </div>

        {/* Back link */}
        <div className="text-center">
          <a
            href="/login"
            className="text-[10px] font-bold tracking-widest uppercase transition-opacity hover:opacity-100 opacity-50"
            style={{ color: "var(--text-muted)" }}
          >
            ← Talabalar uchun kirish
          </a>
        </div>

        <p
          className="text-center text-[9px] font-bold tracking-[0.3em] opacity-30"
          style={{ color: "var(--text-muted)" }}
        >
          CHRONOUS CRM • version 4.2.0
        </p>
      </div>

      {/* Spin keyframes for loading */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
