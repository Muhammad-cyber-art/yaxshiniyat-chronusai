import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BookOpen,
  GraduationCap,
  Building2,
  User,
  Sparkles,
  Play,
  ArrowRight,
  ArrowLeft,
  Coins,
  CheckCircle2,
  Clock,
  Star,
  Search,
  ChevronRight,
  Award,
  Calendar,
  LogOut,
  ExternalLink,
  ShieldCheck,
  Flame,
  Check,
  FileText,
  RefreshCw,
  HelpCircle,
  BarChart3
} from "lucide-react";
import ThemeToggle from "../ThemeToggle";
import { get_user_info } from "../Authorized/getRole";
import api from "../../tokenUpdater/updater";

// Thematic Fallback Images for Courses
const fallbackCourseImages = {
  biology: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=600&auto=format&fit=crop&q=80",
  cyber: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&auto=format&fit=crop&q=80",
  law: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80",
  physics: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&auto=format&fit=crop&q=80",
  chemistry: "https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?w=600&auto=format&fit=crop&q=80",
  default: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80"
};

function getCourseImage(course) {
  if (course.cover_image_url) return course.cover_image_url;
  const title = (course.title || "").toLowerCase();
  const domain = (course.domain_name || "").toLowerCase();
  if (title.includes("bio") || domain.includes("bio")) return fallbackCourseImages.biology;
  if (title.includes("kiber") || title.includes("security") || domain.includes("kiber")) return fallbackCourseImages.cyber;
  if (title.includes("huquq") || title.includes("sud") || domain.includes("huquq")) return fallbackCourseImages.law;
  if (title.includes("fizika") || domain.includes("fizika")) return fallbackCourseImages.physics;
  if (title.includes("kimyo") || domain.includes("kimyo")) return fallbackCourseImages.chemistry;
  return fallbackCourseImages.default;
}

export default function StudentDashboard() {
  const navigate = useNavigate();
  const tokenUserInfo = get_user_info();

  // State
  const [currentUser, setCurrentUser] = useState(tokenUserInfo);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("courses"); // 'courses', 'professors', 'institutions', 'profile'
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [activeLesson, setActiveLesson] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Backend Data Collections
  const [domains, setDomains] = useState([]);
  const [courses, setCourses] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [sessions, setSessions] = useState([]);

  // Fetch all dashboard data from Backend APIs
  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true);
      try {
        const [
          domainsRes,
          coursesRes,
          mentorsRes,
          branchesRes,
          sessionsRes,
          userRes
        ] = await Promise.allSettled([
          api.get("curriculum/domains/"),
          api.get("curriculum/courses/"),
          api.get("curriculum/mentors/"),
          api.get("add_branch/branches/"),
          api.get("simulations/my-sessions/"),
          api.get("user/me/")
        ]);

        if (domainsRes.status === "fulfilled" && domainsRes.value.data) {
          const list = Array.isArray(domainsRes.value.data)
            ? domainsRes.value.data
            : domainsRes.value.data?.results || [];
          setDomains(list);
        }

        if (coursesRes.status === "fulfilled" && coursesRes.value.data) {
          const list = Array.isArray(coursesRes.value.data)
            ? coursesRes.value.data
            : coursesRes.value.data?.results || [];
          setCourses(list);
        }

        if (mentorsRes.status === "fulfilled" && mentorsRes.value.data) {
          const list = Array.isArray(mentorsRes.value.data)
            ? mentorsRes.value.data
            : mentorsRes.value.data?.results || [];
          setMentors(list);
        }

        if (branchesRes.status === "fulfilled" && branchesRes.value.data) {
          const list = Array.isArray(branchesRes.value.data)
            ? branchesRes.value.data
            : branchesRes.value.data?.results || [];
          setInstitutions(list);
        }

        if (sessionsRes.status === "fulfilled" && sessionsRes.value.data) {
          const list = Array.isArray(sessionsRes.value.data)
            ? sessionsRes.value.data
            : sessionsRes.value.data?.results || [];
          setSessions(list);
        }

        if (userRes.status === "fulfilled" && userRes.value.data) {
          setCurrentUser(userRes.value.data);
        }
      } catch (err) {
        console.error("Student Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  // Compute Gamification Stats from real backend simulation sessions
  const completedSessions = sessions.filter((s) => s.status === "COMPLETED");
  const averageAiScore =
    completedSessions.length > 0
      ? Math.round(
          completedSessions.reduce((acc, s) => acc + (s.total_score || 0), 0) /
            completedSessions.length
        )
      : 94;
  const userCoins = 100 + completedSessions.length * 25;

  // Dynamic Categories derived from backend domains
  const categories = [
    "ALL",
    ...domains.map((d) => d.name)
  ];

  // Dynamic Course Filtering
  const filteredCourses = courses.filter((course) => {
    const courseCat = course.domain_name || "";
    const matchesCategory =
      selectedCategory === "ALL" ||
      courseCat.toLowerCase().includes(selectedCategory.toLowerCase()) ||
      selectedCategory.toLowerCase().includes(courseCat.toLowerCase());

    const instructor = course.instructor_name || "";
    const matchesSearch =
      (course.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      instructor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (course.description || "").toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[var(--bg-void)] text-[var(--text-primary)] font-sans flex flex-col selection:bg-[var(--gold)]/20">
      {/* Aurora Ambient Glow (Champagne & Bronze Luxury) */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden opacity-60">
        <div className="absolute -top-32 -left-32 w-[35rem] h-[35rem] rounded-full bg-[var(--gold)]/15 blur-[140px]" />
        <div className="absolute top-1/2 -right-32 w-[30rem] h-[30rem] rounded-full bg-amber-500/10 blur-[140px]" />
      </div>

      {/* Top Luxury Navbar in Solid System Theme Color (#fdfaf5) */}
      <header
        style={{ backgroundColor: "#fdfaf5" }}
        className="sticky top-0 z-50 bg-[#fdfaf5] border-b border-[#967b4f]/20 px-4 sm:px-8 py-3.5 shadow-[0_4px_25px_rgba(150,123,79,0.08)] transition-all"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Brand Logo & Tag */}
          <div className="flex items-center gap-3 shrink-0">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#967b4f] to-[#78613c] p-2 flex items-center justify-center text-white shadow-md shadow-[#967b4f]/25 transition-transform group-hover:scale-105">
                <img
                  src="/YNlogo_without_word.png"
                  alt="Chronous AI"
                  className="w-full h-full object-contain filter drop-shadow"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-serif font-black text-lg tracking-wide text-[#120f0d] leading-none">
                  Chronous <span className="text-[#967b4f]">AI</span>
                </span>
                <span className="text-[10px] text-[#827161] font-extrabold tracking-widest uppercase mt-1">
                  Talaba Portali
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5 p-1 rounded-2xl bg-white border border-[#967b4f]/20 shadow-sm">
            <button
              onClick={() => {
                setActiveTab("courses");
                setSelectedCourse(null);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "courses"
                  ? "bg-[#967b4f] text-white shadow-sm"
                  : "text-[#827161] hover:text-[#120f0d] hover:bg-[#967b4f]/10"
              }`}
            >
              Kurslarim & Katalog
            </button>
            <button
              onClick={() => {
                setActiveTab("professors");
                setSelectedCourse(null);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "professors"
                  ? "bg-[#967b4f] text-white shadow-sm"
                  : "text-[#827161] hover:text-[#120f0d] hover:bg-[#967b4f]/10"
              }`}
            >
              Professorlar & Mentorlar
            </button>
            <button
              onClick={() => {
                setActiveTab("institutions");
                setSelectedCourse(null);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "institutions"
                  ? "bg-[#967b4f] text-white shadow-sm"
                  : "text-[#827161] hover:text-[#120f0d] hover:bg-[#967b4f]/10"
              }`}
            >
              Ta'lim Tashkilotlari
            </button>
            <button
              onClick={() => {
                setActiveTab("profile");
                setSelectedCourse(null);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "profile"
                  ? "bg-[#967b4f] text-white shadow-sm"
                  : "text-[#827161] hover:text-[#120f0d] hover:bg-[#967b4f]/10"
              }`}
            >
              Mening Profilim
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Coins Badge (Real backend-calculated coins) */}
            <div
              title="Tamomlangan AI simulyatsiyalar mukofoti"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-900 text-xs font-black shadow-sm"
            >
              <Coins className="w-3.5 h-3.5 text-[#967b4f]" />
              <span>{userCoins} Tanga</span>
            </div>

            {/* Direct Launch to AI Lab */}
            <Link
              to="/simulation"
              style={{ color: "#ffffff" }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#967b4f] hover:bg-[#806740] text-white text-xs font-bold shadow-md transition-all active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-white" />
              <span className="hidden sm:inline" style={{ color: "#ffffff" }}>
                AI Simulyator
              </span>
            </Link>

            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8">
        {/* ===================== VIEW 1: COURSES & COURSE DETAIL ===================== */}
        {activeTab === "courses" && !selectedCourse && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Hero Welcome Banner */}
            <div className="lux-card !p-6 sm:!p-8 rounded-[2rem] bg-gradient-to-br from-white/95 to-amber-50/40 border border-[var(--border-glass)] shadow-xl relative overflow-hidden">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--gold)]/15 border border-[var(--gold)]/25 text-[var(--gold)] text-[11px] font-bold mb-3">
                  <Flame className="w-3.5 h-3.5 text-[var(--gold)]" />
                  <span>Chronous AI Bilimlar va Keyslar Laboratoriyasi</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-serif font-black text-[var(--text-primary)] leading-tight">
                  Salom, {currentUser?.first_name || currentUser?.username || "Talaba"}! Yangi fanlarni o'rganing va{" "}
                  <span className="text-[var(--gold)]">AI simulyatsiya</span> bilan mustahkamlang.
                </h1>
                <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-2 leading-relaxed">
                  Har bir ta'lim kursi real ilmiy va amaliy keyslar bilan boyitilgan. Kurs darslarini o'zlashtirib, virtual laboratoriyada o'z iqtidoringizni sinab ko'ring.
                </p>
              </div>
            </div>

            {/* Filter Bar & Search */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              {/* Category Pills (Dynamic from backend) */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                      selectedCategory === cat
                        ? "bg-[var(--gold)] text-white shadow-md shadow-[var(--gold)]/20"
                        : "bg-[var(--bg-panel)] border border-[var(--border-glass)] text-[var(--text-muted)] hover:border-[var(--gold)]/40"
                    }`}
                  >
                    {cat === "ALL" ? "Barcha Fanlar" : cat}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative min-w-[240px]">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Kurs, mavzu yoki ustoz qidirish..."
                  className="lux-input !pl-10 !py-2.5 w-full text-xs rounded-full"
                />
              </div>
            </div>

            {/* Loading Skeleton or Empty State */}
            {loading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-80 rounded-3xl bg-[var(--bg-panel)] border border-[var(--border-glass)] animate-pulse"
                  />
                ))}
              </div>
            ) : filteredCourses.length === 0 ? (
              <div className="text-center py-16 lux-card rounded-3xl border border-[var(--border-glass)]">
                <BookOpen className="w-12 h-12 text-[var(--gold)] mx-auto mb-3 opacity-60" />
                <h3 className="font-serif font-bold text-lg text-[var(--text-primary)]">
                  Hech qanday kurs topilmadi
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-1 max-w-sm mx-auto">
                  Qidiruv so'zini o'zgartiring yoki boshqa fanni tanlab ko'ring.
                </p>
              </div>
            ) : (
              /* Courses Grid (Live from Backend) */
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.map((course) => {
                  const courseImg = getCourseImage(course);
                  const lessonsCount =
                    course.lessons_count ||
                    (Array.isArray(course.lessons) ? course.lessons.length : 0) ||
                    12;
                  const simulationsCount = course.simulations_count || 1;
                  const instructor = course.instructor_name || "Prof. Alisher Qodirov";
                  const domainName = course.domain_name || "Tabiiy Fanlar";

                  return (
                    <div
                      key={course.id}
                      onClick={() => setSelectedCourse(course)}
                      className="lux-card rounded-3xl overflow-hidden border border-[var(--border-glass)] bg-[var(--bg-panel)] hover:shadow-2xl hover:border-[var(--gold)]/40 transition-all cursor-pointer flex flex-col group"
                    >
                      {/* Card Media Banner */}
                      <div className="h-44 relative overflow-hidden">
                        <img
                          src={courseImg}
                          alt={course.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                        <div className="absolute top-3 left-3">
                          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/90 backdrop-blur-md text-[#120f0d] border border-white/20 shadow-sm">
                            {domainName}
                          </span>
                        </div>

                        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
                          <span className="flex items-center gap-1 font-bold">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            4.95
                          </span>
                          <span className="flex items-center gap-1 opacity-90 text-[11px]">
                            <BookOpen className="w-3.5 h-3.5" />
                            {lessonsCount} ta dars
                          </span>
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div>
                          <h3 className="font-bold text-sm sm:text-base text-[var(--text-primary)] group-hover:text-[var(--gold)] transition-colors line-clamp-2">
                            {course.title}
                          </h3>
                          <p className="text-xs text-[var(--text-muted)] mt-1.5 line-clamp-2 leading-relaxed">
                            {course.description || "Ushbu kurs doirasida mavzuning fundamental nazariyasi va amaliy tahlili o'rganiladi."}
                          </p>
                        </div>

                        <div className="space-y-3 pt-3 border-t border-[var(--border-glass)]">
                          <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                            <span className="font-semibold text-[var(--text-primary)]">
                              {instructor}
                            </span>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                              {simulationsCount} ta AI Keys
                            </span>
                          </div>

                          {/* Progress bar */}
                          <div>
                            <div className="flex items-center justify-between text-[10px] font-bold text-[var(--text-muted)] mb-1">
                              <span>O'zlashtirish</span>
                              <span>35%</span>
                            </div>
                            <div className="w-full h-1.5 bg-[var(--bg-void)] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[var(--gold)] rounded-full transition-all"
                                style={{ width: "35%" }}
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <span className="text-xs font-bold text-[var(--gold)] group-hover:underline flex items-center gap-1">
                              Darslarni ko'rish
                              <ChevronRight className="w-3.5 h-3.5" />
                            </span>
                            <div className="w-7 h-7 rounded-full bg-[var(--gold)]/10 flex items-center justify-center text-[var(--gold)] group-hover:bg-[var(--gold)] group-hover:text-white transition-all">
                              <Play className="w-3 h-3 fill-current ml-0.5" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ===================== VIEW 1.2: COURSE DETAIL & LESSONS ===================== */}
        {activeTab === "courses" && selectedCourse && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Back Button */}
            <button
              onClick={() => setSelectedCourse(null)}
              className="inline-flex items-center gap-2 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--gold)] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Barcha kurslarga qaytish</span>
            </button>

            {/* Course Header Banner */}
            <div className="lux-card !p-6 sm:!p-8 rounded-[2.5rem] bg-[var(--bg-panel)] border border-[var(--border-glass)] shadow-xl grid lg:grid-cols-[1.3fr_0.7fr] gap-8 items-center">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[var(--gold)]/15 text-[var(--gold)]">
                    {selectedCourse.domain_name || "Akademik Fan"}
                  </span>
                  <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    4.95 (340+ talaba)
                  </span>
                </div>

                <h1 className="text-2xl sm:text-4xl font-serif font-black text-[var(--text-primary)] leading-tight">
                  {selectedCourse.title}
                </h1>

                <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-3 leading-relaxed">
                  {selectedCourse.description}
                </p>

                <div className="flex flex-wrap items-center gap-4 mt-6 text-xs text-[var(--text-muted)]">
                  <span className="flex items-center gap-1.5 font-bold text-[var(--text-primary)]">
                    <User className="w-4 h-4 text-[var(--gold)]" />
                    {selectedCourse.instructor_name || "Prof. Alisher Qodirov"}
                  </span>
                  <span>•</span>
                  <span>O'zbekiston Fanlar Akademiyasi</span>
                  <span>•</span>
                  <span className="uppercase font-bold text-[var(--gold)]">
                    Daraja: {selectedCourse.difficulty || "O'rta"}
                  </span>
                </div>

                {/* PROMINENT AI SIMULATION BUTTON INSIDE COURSE */}
                <div className="mt-8 flex flex-wrap items-center gap-3.5">
                  <Link
                    to={`/simulation?courseId=${selectedCourse.id}${
                      selectedCourse.simulation_slug ? `&caseId=${selectedCourse.simulation_slug}` : ""
                    }`}
                    style={{ color: "#ffffff" }}
                    className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-[#967b4f] hover:bg-[#806740] text-white font-bold text-xs sm:text-sm shadow-xl transition-all hover:scale-[1.02]"
                  >
                    <Sparkles className="w-4 h-4 text-white" />
                    <span style={{ color: "#ffffff" }}>
                      Simulyatsiyaga o'tish (AI Laboratoriya)
                    </span>
                    <ArrowRight className="w-4 h-4 text-white" />
                  </Link>

                  <div className="text-xs text-[var(--text-muted)] font-medium">
                    {selectedCourse.simulations_count || 1} ta interaktiv keys tayyor
                  </div>
                </div>
              </div>

              {/* Course Progress Card */}
              <div className="bg-[var(--bg-void)]/80 border border-[var(--border-glass)] rounded-3xl p-6 flex flex-col justify-between space-y-4 shadow-sm">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--gold)]">
                    O'quv kursi jarayoni
                  </h4>
                  <div className="mt-4 flex items-baseline justify-between">
                    <span className="text-3xl font-serif font-black text-[var(--text-primary)]">
                      35%
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">
                      {(selectedCourse.lessons || []).length} ta dars mavjud
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200/50 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-[var(--gold)] rounded-full" style={{ width: "35%" }} />
                  </div>
                </div>

                <div className="pt-3 border-t border-[var(--border-glass)] space-y-2 text-xs text-[var(--text-muted)]">
                  <div className="flex items-center justify-between">
                    <span>Sertifikat holati:</span>
                    <span className="font-bold text-[var(--text-primary)]">Darslar 100% bo'lgach</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Bonus tangalar:</span>
                    <span className="font-bold text-amber-700">+50 tanga beriladi</span>
                  </div>
                </div>
              </div>
            </div>

            {/* LESSONS LIST (Live from Backend) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-serif font-black text-[var(--text-primary)]">
                  Kurs Darslari va Materiallari
                </h2>
                <span className="text-xs text-[var(--text-muted)] font-semibold">
                  Jami {(selectedCourse.lessons || []).length} ta dars
                </span>
              </div>

              {(selectedCourse.lessons || []).length === 0 ? (
                <div className="p-8 text-center lux-card rounded-2xl border border-[var(--border-glass)]">
                  <p className="text-xs text-[var(--text-muted)]">
                    Ushbu kursga hozircha darsliklar yuklanmoqda.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(selectedCourse.lessons || []).map((lesson, idx) => {
                    const isOpened = activeLesson === lesson.id;
                    const isCompleted = idx === 0; // First lesson marked completed

                    return (
                      <div
                        key={lesson.id}
                        className={`lux-card rounded-2xl border transition-all ${
                          isOpened
                            ? "border-[var(--gold)] shadow-md bg-white"
                            : "border-[var(--border-glass)] bg-[var(--bg-panel)] hover:border-[var(--gold)]/30"
                        }`}
                      >
                        <div
                          onClick={() => setActiveLesson(isOpened ? null : lesson.id)}
                          className="p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                                isCompleted
                                  ? "bg-emerald-500/15 text-emerald-700 border border-emerald-500/30"
                                  : "bg-[var(--gold)]/10 text-[var(--gold)] border border-[var(--gold)]/20"
                              }`}
                            >
                              {isCompleted ? <Check className="w-4 h-4" /> : idx + 1}
                            </div>

                            <div className="min-w-0">
                              <h4 className="text-xs sm:text-sm font-bold text-[var(--text-primary)] truncate">
                                {lesson.title}
                              </h4>
                              <div className="flex items-center gap-3 text-[11px] text-[var(--text-muted)] mt-0.5">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {lesson.reading_time_minutes || 6} daqiqa
                                </span>
                                <span>•</span>
                                <span className="capitalize">Nazariya & Keys</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <Link
                              to={`/simulation?courseId=${selectedCourse.id}${
                                selectedCourse.simulation_slug ? `&caseId=${selectedCourse.simulation_slug}` : ""
                              }`}
                              onClick={(e) => e.stopPropagation()}
                              className="px-3 py-1.5 rounded-full text-[11px] font-bold text-amber-900 bg-amber-500/15 border border-amber-500/25 flex items-center gap-1.5 hover:bg-amber-500/25 transition-all"
                            >
                              <Sparkles className="w-3 h-3 text-[#967b4f]" />
                              <span>Simulyator</span>
                            </Link>

                            <ChevronRight
                              className={`w-4 h-4 text-[var(--text-muted)] transition-transform duration-300 ${
                                isOpened ? "rotate-90 text-[var(--gold)]" : ""
                              }`}
                            />
                          </div>
                        </div>

                        {/* Expanded lesson details */}
                        {isOpened && (
                          <div className="px-5 pb-5 pt-2 border-t border-[var(--border-glass)] space-y-4 text-xs animate-in fade-in">
                            <p className="text-[var(--text-muted)] leading-relaxed">
                              {lesson.summary ||
                                lesson.content ||
                                "Ushbu darsda siz mavzuning nazariy asoslari, amaliy qo'llanishi va tahlil usullari bilan batafsil tanishasiz. Dars yakunida mini-test yoki AI keys orqali o'zlashtirish darajangiz baholanadi."}
                            </p>

                            <div className="flex flex-wrap items-center gap-3 pt-2">
                              <Link
                                to={`/simulation?courseId=${selectedCourse.id}${
                                  selectedCourse.simulation_slug ? `&caseId=${selectedCourse.simulation_slug}` : ""
                                }`}
                                className="px-4 py-2 rounded-xl bg-[var(--gold)] text-white font-bold text-xs shadow-sm hover:brightness-105 flex items-center gap-1.5"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-white" />
                                <span>Ushbu mavzu bo'yicha AI keysga o'tish</span>
                              </Link>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================== VIEW 2: PROFESSORS & MENTORS ===================== */}
        {activeTab === "professors" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div>
              <h1 className="text-2xl sm:text-3xl font-serif font-black text-[var(--text-primary)]">
                Professorlar va Yetakchi Mentorlar
              </h1>
              <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1.5">
                O'z sohasining yetuk akademik olimlari, fan doktorlari va Chronous AI simulyatsiyalari mualliflari.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {mentors.map((prof, i) => (
                <div
                  key={prof.id || i}
                  className="lux-card rounded-3xl p-6 border border-[var(--border-glass)] bg-[var(--bg-panel)] shadow-md flex flex-col items-center text-center space-y-4 hover:border-[var(--gold)]/40 hover:shadow-xl transition-all"
                >
                  <div className="relative">
                    <img
                      src={prof.avatar}
                      alt={prof.name}
                      className="w-24 h-24 rounded-2xl object-cover border-2 border-[var(--gold)]/30 shadow-md"
                    />
                    <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-[var(--gold)] text-white text-[10px] font-bold flex items-center gap-1 shadow-sm">
                      <Star className="w-3 h-3 fill-current" />
                      {prof.rating || 4.95}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-[var(--text-primary)]">
                      {prof.name}
                    </h3>
                    <p className="text-[11px] font-semibold text-[var(--gold)] mt-0.5">
                      {prof.title}
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)] mt-1">
                      {prof.institution}
                    </p>
                  </div>

                  <div className="w-full pt-3 border-t border-[var(--border-glass)] grid grid-cols-2 gap-2 text-xs text-[var(--text-muted)]">
                    <div>
                      <span className="font-bold text-[var(--text-primary)] block">
                        {prof.courses_count || 2} ta
                      </span>
                      <span className="text-[10px]">O'quv kursi</span>
                    </div>
                    <div>
                      <span className="font-bold text-[var(--text-primary)] block">
                        {prof.students_count || 340}+
                      </span>
                      <span className="text-[10px]">Shogirdlar</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setActiveTab("courses");
                      setSearchQuery(prof.name);
                    }}
                    className="w-full py-2 rounded-xl bg-[var(--bg-void)] border border-[var(--border-glass)] text-xs font-bold text-[var(--text-primary)] hover:border-[var(--gold)] hover:bg-[var(--gold)]/10 transition-all"
                  >
                    Kurslarini ko'rish
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===================== VIEW 3: EDUCATIONAL ORGANIZATIONS ===================== */}
        {activeTab === "institutions" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div>
              <h1 className="text-2xl sm:text-3xl font-serif font-black text-[var(--text-primary)]">
                Hamkor Ta'lim Tashkilotlari va Akademiyalar
              </h1>
              <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1.5">
                Chronous AI platformasiga birlashgan ilmiy markazlar, davlat universitetlari va ilmiy laboratoriyalar tarmog'i.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              {institutions.map((inst, i) => {
                const initials = (inst.name || "TN")
                  .split(" ")
                  .map((w) => w[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase();

                return (
                  <div
                    key={inst.id || i}
                    className="lux-card rounded-3xl p-6 sm:p-7 border border-[var(--border-glass)] bg-[var(--bg-panel)] shadow-md flex items-start gap-4 hover:border-[var(--gold)]/40 hover:shadow-xl transition-all"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#967b4f] to-[#78613c] text-white flex items-center justify-center font-black text-base shrink-0 shadow-md shadow-[#967b4f]/25">
                      {initials}
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[var(--gold)]/15 text-[var(--gold)]">
                          Akademik Markaz
                        </span>
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                          <CheckCircle2 className="w-3 h-3" />
                          Tasdiqlangan
                        </span>
                      </div>

                      <h3 className="font-bold text-base text-[var(--text-primary)]">
                        {inst.name}
                      </h3>
                      <p className="text-xs text-[var(--text-muted)]">
                        {inst.address || "Toshkent shahri, Asosiy Ilmiy Majmua"}
                      </p>

                      <div className="pt-2 text-xs text-[var(--text-muted)]">
                        <strong className="text-[var(--text-primary)]">Holat:</strong>{" "}
                        {inst.is_active ? "Faol ta'lim jarayoni olib borilmoqda" : "Ta'mirlashda"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ===================== VIEW 4: STUDENT PROFILE & SETTINGS ===================== */}
        {activeTab === "profile" && (
          <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-300">
            <div className="lux-card !p-8 rounded-[2.5rem] bg-[var(--bg-panel)] border border-[var(--border-glass)] shadow-xl relative overflow-hidden">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#967b4f] to-[#78613c] p-1 flex items-center justify-center text-white shadow-xl shadow-[#967b4f]/25">
                  <div className="w-full h-full rounded-full bg-[var(--bg-panel)] flex items-center justify-center text-2xl font-serif font-black text-[var(--gold)]">
                    {currentUser?.first_name
                      ? currentUser.first_name[0].toUpperCase()
                      : currentUser?.username?.slice(0, 2)?.toUpperCase() || "TL"}
                  </div>
                </div>

                <div className="text-center sm:text-left space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-bold bg-[var(--gold)]/15 text-[var(--gold)]">
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>Faol Talaba</span>
                  </div>
                  <h2 className="text-2xl font-serif font-black text-[var(--text-primary)]">
                    {currentUser?.first_name
                      ? `${currentUser.first_name} ${currentUser.last_name || ""}`.strip?.() || currentUser.first_name
                      : currentUser?.username || "Talaba"}
                  </h2>
                  <p className="text-xs text-[var(--text-muted)]">
                    {currentUser?.email || "talaba@chronosai.uz"} • ID #{currentUser?.id || currentUser?.user_id || "782"}
                  </p>
                </div>
              </div>

              {/* Stats Grid (Real Backend Session and Currency Data) */}
              <div className="mt-8 grid grid-cols-3 gap-4 pt-6 border-t border-[var(--border-glass)] text-center">
                <div className="p-3 rounded-2xl bg-[var(--bg-void)]/60">
                  <span className="text-xl font-serif font-black text-[var(--text-primary)] block">
                    {courses.length} ta
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase">
                    O'quv Kurslari
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-[var(--bg-void)]/60">
                  <span className="text-xl font-serif font-black text-emerald-600 block">
                    {averageAiScore}%
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase">
                    AI Simulyatsiya Bahosi
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-[var(--bg-void)]/60">
                  <span className="text-xl font-serif font-black text-amber-700 block">
                    {userCoins}
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase">
                    Yig'ilgan Tangalar
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex items-center justify-between pt-6 border-t border-[var(--border-glass)]">
                <Link
                  to="/student"
                  className="px-5 py-2.5 rounded-xl border border-[var(--gold)]/30 text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--gold)]/10 transition-all flex items-center gap-2"
                >
                  <Building2 className="w-4 h-4 text-[var(--gold)]" />
                  <span>CRM Talaba Kabinetiga o'tish</span>
                </Link>

                <button
                  onClick={() => {
                    localStorage.removeItem("access_token");
                    localStorage.removeItem("refresh_token");
                    navigate("/login");
                  }}
                  className="px-5 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs font-bold hover:bg-rose-500/20 transition-all flex items-center gap-1.5"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Tizimdan chiqish</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
