import axios from "axios";
import { useEffect, useState, useRef } from "react";
import api from "../../tokenUpdater/updater";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { get_user_info } from "./getRole";
import { jwtDecode } from "jwt-decode";
import LoginError from "../Errors/LoginError";
import ThemeToggle from "../ThemeToggle";
import {
  User,
  Lock,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  Mail,
  Phone,
  UserPlus,
  LogIn,
  CheckCircle2,
  Sparkles,
  GraduationCap,
  UserCheck
} from "lucide-react";

export default function Login({ initialMode }) {
  const user_info = get_user_info();
  const navigate = useNavigate();
  const location = useLocation();

  const isRegisterRoute = initialMode === "register" || location.pathname === "/register";
  const [mode, setMode] = useState(isRegisterRoute ? "register" : "login");
  const [selectedRole, setSelectedRole] = useState("student"); // 'student' or 'mentor'

  useEffect(() => {
    if (user_info) {
      if (user_info.role === "student") {
        navigate("/student/dashboard");
      } else if (user_info.role === "mentor") {
        navigate("/mentor/dashboard");
      } else if (user_info.role) {
        navigate(`/${user_info.role}`);
      }
    }
  }, [user_info, navigate]);

  useEffect(() => {
    if (location.pathname === "/register") {
      setMode("register");
    } else if (location.pathname === "/login") {
      setMode("login");
    }
  }, [location.pathname]);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Login form state (username or email)
  const [loginForm, setLoginForm] = useState({
    username: "",
    password: "",
  });

  // Registration form state (Fan fieldi mentordan va registratsiyadan olib tashlandi)
  const [registerForm, setRegisterForm] = useState({
    first_name: "",
    last_name: "",
    username: "",
    email: "",
    phone_number: "",
    password: "",
    password_confirm: "",
  });

  function handleLoginChange(e) {
    setLoginForm({
      ...loginForm,
      [e.target.name]: e.target.value,
    });
  }

  function handleRegisterChange(e) {
    setRegisterForm({
      ...registerForm,
      [e.target.name]: e.target.value,
    });
  }

  function handleAuthSuccess(res) {
    localStorage.setItem("access_token", res.data.access);
    localStorage.setItem("refresh_token", res.data.refresh);
    setError("");

    const access = res.data.access;
    let role = res.data.user?.role;

    if (!role && access) {
      try {
        const payload = jwtDecode(access);
        role = payload.role;
        if (payload.is_superuser) {
          role = "super_admin";
        }
      } catch (e) {}
    }

    if (role === "admin") {
      navigate("/admin");
    } else if (role === "mentor") {
      navigate("/mentor/dashboard");
    } else if (role === "super_admin") {
      navigate("/super_admin");
    } else if (role === "student") {
      navigate("/student/dashboard");
    } else {
      navigate("/");
    }
  }

  async function handleLoginSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/login/", loginForm);
      handleAuthSuccess(res);
    } catch (errorr) {
      const detail = errorr.response?.data?.detail;
      setError(
        detail ||
          (errorr.response?.status === 401
            ? "Username / Email yoki parol noto'g'ri kiritildi"
            : "Server bilan bog'lanishda xatolik yuz berdi")
      );
      setTimeout(() => setError(""), 5000);
    } finally {
      setLoading(false);
    }
  }

  async function handleRegisterSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (registerForm.password !== registerForm.password_confirm) {
      setError("Kiritilgan parollar bir-biriga mos kelmadi!");
      setLoading(false);
      return;
    }

    if (registerForm.password.length < 8) {
      setError("Parol kamida 8 ta belgidan iborat bo'lishi shart!");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        ...registerForm,
        role: selectedRole,
      };
      const res = await api.post("/auth/register/", payload);
      setSuccess("Muvaffaqiyatli ro'yxatdan o'tdingiz! Tizimga yo'naltirilmoqda...");
      setTimeout(() => {
        handleAuthSuccess(res);
      }, 800);
    } catch (err) {
      const data = err.response?.data;
      if (typeof data === "object") {
        const firstErrKey = Object.keys(data)[0];
        const val = data[firstErrKey];
        setError(Array.isArray(val) ? val[0] : typeof val === "string" ? val : "Ro'yxatdan o'tishda xatolik yuz berdi");
      } else {
        setError("Ro'yxatdan o'tishda kutilmagan xatolik yuz berdi");
      }
      setTimeout(() => setError(""), 6000);
    } finally {
      setLoading(false);
    }
  }

  // Google OAuth handler - haqiqiy Google ID token orqali kirish / registratsiya
  async function handleGoogleToken(credential) {
    setLoading(true);
    setError("");
    try {
      const payload = {
        credential,
        role: selectedRole,
      };
      const res = await api.post("/auth/google/", payload);
      setSuccess(
        mode === "register"
          ? "Google orqali muvaffaqiyatli ro'yxatdan o'tdingiz! Tizimga yo'naltirilmoqda..."
          : "Google orqali muvaffaqiyatli kirdingiz!"
      );
      setTimeout(() => {
        handleAuthSuccess(res);
      }, 500);
    } catch (err) {
      const detail =
        err.response?.data?.detail ||
        "Google orqali kirishda xatolik yuz berdi. Iltimos, qayta urinib ko'ring.";
      setError(detail);
      setTimeout(() => setError(""), 6000);
    } finally {
      setLoading(false);
    }
  }

  const googleBtnContainerRef = useRef(null);
  const rawClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const clientId = typeof rawClientId === "string" ? rawClientId.trim() : "";
  const isRealGoogleConfigured =
    clientId.length > 25 &&
    clientId.endsWith(".apps.googleusercontent.com") &&
    !clientId.includes("educationplatform") &&
    !clientId.includes("your-client-id");

  // Google OAuth rasmiy tugmasini avtomatik render qilish
  useEffect(() => {
    if (!isRealGoogleConfigured) return;

    let isMounted = true;
    function tryRenderGoogleButton() {
      if (!window.google?.accounts?.id || !isMounted) return;

      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (response?.credential) {
              handleGoogleToken(response.credential);
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        if (googleBtnContainerRef.current) {
          googleBtnContainerRef.current.innerHTML = "";
          window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
            theme: "outline",
            size: "large",
            width: 360,
            text: mode === "register" ? "signup_with" : "signin_with",
            shape: "pill",
            logo_alignment: "left",
          });
        }
      } catch (err) {
        console.warn("Google Sign-In init error:", err);
      }
    }

    if (window.google?.accounts?.id) {
      tryRenderGoogleButton();
    } else {
      const timer = setTimeout(tryRenderGoogleButton, 800);
      return () => {
        isMounted = false;
        clearTimeout(timer);
      };
    }

    return () => {
      isMounted = false;
    };
  }, [mode, selectedRole, isRealGoogleConfigured, clientId]);

  // Google kirish va ro'yxatdan o'tishni boshlash (tugma orqali)
  function initiateGoogleAuth() {
    setError("");
    if (!isRealGoogleConfigured) {
      setError(
        "Google OAuth (Client ID) tizimda hali to'liq sozlanmagan. Iltimos, pastdagi forma orqali login va parol bilan kiring yoki ro'yxatdan o'ting."
      );
      setTimeout(() => setError(""), 7000);
      return;
    }

    if (!window.google?.accounts?.id) {
      setError("Google xizmati brauzeringizda yuklanmadi. Sahifani qayta yuklab ko'ring.");
      setTimeout(() => setError(""), 5000);
      return;
    }

    setLoading(true);
    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          if (response?.credential) {
            handleGoogleToken(response.credential);
          } else {
            setLoading(false);
            setError("Google orqali kirishda token olinmadi.");
            setTimeout(() => setError(""), 5000);
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          setLoading(false);
        }
      });
    } catch (err) {
      setLoading(false);
      setError("Google autentifikatsiyasini ishga tushirishda xatolik yuz berdi.");
      setTimeout(() => setError(""), 5000);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-void)] flex flex-col items-center justify-center px-4 py-8 font-sans relative overflow-hidden">
      {/* Background Atmosphere */}
      <div className="fixed inset-0 pointer-events-none opacity-50">
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-[var(--gold)]/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-[var(--gold)]/5 rounded-full blur-[100px]"></div>
      </div>

      <div className="w-full max-w-[480px] relative z-10 space-y-6">
        {/* Diamond Logo Section */}
        <div className="flex flex-col items-center space-y-4">
          <Link to="/" className="relative group">
            <div className="absolute -inset-4 bg-[var(--gold)]/20 rounded-full blur-2xl group-hover:bg-[var(--gold)]/30 transition-all duration-700"></div>
            <div className="relative w-20 h-20 flex items-center justify-center rounded-[22px] transition-all duration-500">
              <img
                src="/YNlogo_without_word.png"
                alt="Logo"
                className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(184,134,11,0.5)]"
              />
            </div>
          </Link>
          <div className="text-center space-y-1">
            <h1 className="text-3xl sm:text-4xl font-serif tracking-[0.05em] text-[var(--text-primary)]">
              Chronous <span className="text-[var(--gold)]">AI</span>
            </h1>
            <p className="text-[10px] text-[var(--gold)] font-bold uppercase tracking-[0.4em] opacity-80">
              {mode === "login" ? "TA'LIM PLATFORMASI • KIRISH" : "YANGI HISOB YARATISH"}
            </p>
          </div>
        </div>

        {/* Form Card */}
        <div className="lux-card !p-6 sm:!p-10 !bg-[var(--bg-panel)]/50 backdrop-blur-3xl border-[var(--border-glass)] shadow-2xl rounded-3xl">
          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 p-1.5 mb-6 rounded-2xl bg-[var(--bg-void)]/80 border border-[var(--border-glass)]">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError("");
                setSuccess("");
              }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                mode === "login"
                  ? "bg-[var(--gold)] text-white shadow-md shadow-[var(--gold)]/20"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              <LogIn size={15} />
              <span>Kirish</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setError("");
                setSuccess("");
              }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                mode === "register"
                  ? "bg-[var(--gold)] text-white shadow-md shadow-[var(--gold)]/20"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              <UserPlus size={15} />
              <span>Ro'yxatdan o'tish</span>
            </button>
          </div>

          {/* Role Selection (Talaba yoki Mentor) */}
          {mode === "register" && (
            <div className="mb-6 space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--gold)] block">
                Ro'yxatdan o'tish turi (Roli):
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedRole("student")}
                  className={`p-3.5 rounded-2xl border transition-all flex flex-col items-center text-center gap-2 ${
                    selectedRole === "student"
                      ? "bg-[var(--gold)]/15 border-[var(--gold)] shadow-md shadow-[var(--gold)]/10 text-[var(--text-primary)] ring-1 ring-[var(--gold)]/30"
                      : "bg-[var(--bg-void)]/60 border-[var(--border-glass)] text-[var(--text-muted)] hover:border-[var(--gold)]/40"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${selectedRole === "student" ? "bg-[var(--gold)] text-white" : "bg-[var(--gold)]/10 text-[var(--gold)]"}`}>
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[var(--text-primary)]">Talaba (O'quvchi)</div>
                    <div className="text-[10px] text-[var(--text-muted)] mt-0.5">AI simulyatsiya va ta'lim</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole("mentor")}
                  className={`p-3.5 rounded-2xl border transition-all flex flex-col items-center text-center gap-2 ${
                    selectedRole === "mentor"
                      ? "bg-[var(--gold)]/15 border-[var(--gold)] shadow-md shadow-[var(--gold)]/10 text-[var(--text-primary)] ring-1 ring-[var(--gold)]/30"
                      : "bg-[var(--bg-void)]/60 border-[var(--border-glass)] text-[var(--text-muted)] hover:border-[var(--gold)]/40"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${selectedRole === "mentor" ? "bg-[var(--gold)] text-white" : "bg-[var(--gold)]/10 text-[var(--gold)]"}`}>
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[var(--text-primary)]">Mentor (Ustoz)</div>
                    <div className="text-[10px] text-[var(--text-muted)] mt-0.5">Guruhlar va o'qitish</div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
              <LoginError loginErr={error} />
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Google Sign-in / Registration Section */}
          <div className="mb-6 space-y-2">
            {isRealGoogleConfigured ? (
              <div className="flex flex-col items-center justify-center w-full py-1">
                <div ref={googleBtnContainerRef} className="w-full flex justify-center min-h-[44px]" />
              </div>
            ) : (
              <button
                type="button"
                onClick={initiateGoogleAuth}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-2xl border border-[var(--border-glass)] bg-[var(--bg-panel)] hover:bg-[var(--gold)]/10 text-[var(--text-primary)] font-bold text-xs tracking-wider transition-all shadow-sm hover:scale-[1.01] active:scale-[0.99]"
              >
                {/* Google Brand SVG */}
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>
                  {mode === "register"
                    ? `Google bilan ${selectedRole === "mentor" ? "Mentor" : "Talaba"} sifatida ro'yxatdan o'tish`
                    : "Google orqali kirish"}
                </span>
              </button>
            )}

            <div className="relative flex items-center justify-center my-6">
              <div className="border-t border-[var(--border-glass)] w-full"></div>
              <span className="bg-[var(--bg-panel)] px-3 text-[10px] font-bold tracking-widest text-[var(--text-muted)] uppercase shrink-0">
                yoki login/parol orqali
              </span>
              <div className="border-t border-[var(--border-glass)] w-full"></div>
            </div>
          </div>

          {/* LOGIN FORM */}
          {mode === "login" ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="relative group/input">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within/input:text-[var(--gold)] transition-colors">
                  <User size={18} />
                </div>
                <input
                  required
                  onChange={handleLoginChange}
                  value={loginForm.username}
                  type="text"
                  name="username"
                  placeholder="Username yoki Email manzilingiz"
                  className="lux-input !pl-12 !py-3.5 group-focus-within/input:!border-[var(--gold)] transition-all w-full text-xs"
                />
              </div>

              <div className="relative group/input">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within/input:text-[var(--gold)] transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  required
                  onChange={handleLoginChange}
                  value={loginForm.password}
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Maxfiy parol"
                  className="lux-input !pl-12 !pr-12 !py-3.5 group-focus-within/input:!border-[var(--gold)] transition-all w-full text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--gold)] transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="lux-btn lux-btn-primary w-full !py-4 group shadow-[0_0_20px_rgba(184,134,11,0.2)] mt-6"
              >
                <span className="text-[12px] font-black tracking-[0.2em]">
                  {loading ? "TEKSHIRILMOQDA..." : "TIZIMGA KIRISH"}
                </span>
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          ) : (
            /* REGISTRATION FORM (Fan fieldi olib tashlangan) */
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div className="relative group/input">
                  <input
                    required
                    onChange={handleRegisterChange}
                    value={registerForm.first_name}
                    type="text"
                    name="first_name"
                    placeholder="Ismingiz"
                    className="lux-input !py-3 !px-4 group-focus-within/input:!border-[var(--gold)] transition-all w-full text-xs"
                  />
                </div>
                <div className="relative group/input">
                  <input
                    required
                    onChange={handleRegisterChange}
                    value={registerForm.last_name}
                    type="text"
                    name="last_name"
                    placeholder="Familiyangiz"
                    className="lux-input !py-3 !px-4 group-focus-within/input:!border-[var(--gold)] transition-all w-full text-xs"
                  />
                </div>
              </div>

              <div className="relative group/input">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within/input:text-[var(--gold)] transition-colors">
                  <User size={16} />
                </div>
                <input
                  required
                  onChange={handleRegisterChange}
                  value={registerForm.username}
                  type="text"
                  name="username"
                  placeholder="Username (login uchun)"
                  className="lux-input !pl-11 !py-3 group-focus-within/input:!border-[var(--gold)] transition-all w-full text-xs"
                />
              </div>

              <div className="relative group/input">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within/input:text-[var(--gold)] transition-colors">
                  <Mail size={16} />
                </div>
                <input
                  required
                  onChange={handleRegisterChange}
                  value={registerForm.email}
                  type="email"
                  name="email"
                  placeholder="Email manzilingiz"
                  className="lux-input !pl-11 !py-3 group-focus-within/input:!border-[var(--gold)] transition-all w-full text-xs"
                />
              </div>

              <div className="relative group/input">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within/input:text-[var(--gold)] transition-colors">
                  <Phone size={16} />
                </div>
                <input
                  onChange={handleRegisterChange}
                  value={registerForm.phone_number}
                  type="tel"
                  name="phone_number"
                  placeholder="Telefon raqam (+998...)"
                  className="lux-input !pl-11 !py-3 group-focus-within/input:!border-[var(--gold)] transition-all w-full text-xs"
                />
              </div>

              <div className="relative group/input">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within/input:text-[var(--gold)] transition-colors">
                  <Lock size={16} />
                </div>
                <input
                  required
                  onChange={handleRegisterChange}
                  value={registerForm.password}
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Parol (kamida 8 ta belgi)"
                  className="lux-input !pl-11 !pr-11 !py-3 group-focus-within/input:!border-[var(--gold)] transition-all w-full text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--gold)] transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <div className="relative group/input">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within/input:text-[var(--gold)] transition-colors">
                  <Lock size={16} />
                </div>
                <input
                  required
                  onChange={handleRegisterChange}
                  value={registerForm.password_confirm}
                  type={showConfirmPassword ? "text" : "password"}
                  name="password_confirm"
                  placeholder="Parolni tasdiqlang"
                  className="lux-input !pl-11 !pr-11 !py-3 group-focus-within/input:!border-[var(--gold)] transition-all w-full text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--gold)] transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="lux-btn lux-btn-primary w-full !py-3.5 group shadow-[0_0_20px_rgba(184,134,11,0.2)] mt-5"
              >
                <span className="text-[11px] font-black tracking-[0.2em]">
                  {loading
                    ? "YARATILMOQDA..."
                    : selectedRole === "mentor"
                    ? "MENTOR SIFATIDA HISOB YARATISH"
                    : "TALABA SIFATIDA HISOB YARATISH"}
                </span>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          )}

          {/* Bottom Security Note */}
          <div className="mt-8 pt-6 border-t border-[var(--border-glass)] flex items-center justify-between opacity-80 hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-2 text-[10px] font-bold text-[var(--text-muted)]">
              <ShieldCheck size={14} className="text-[var(--gold)]" />
              <span>Diamond Secure 256-bit</span>
            </div>
            <ThemeToggle />
          </div>
        </div>

        {/* System Footer */}
        <p className="text-center text-[9px] font-bold text-[var(--text-muted)] capitalize tracking-[0.3em] opacity-40">
          version 4.2.0 • build 1024
        </p>
      </div>
    </div>
  );
}
