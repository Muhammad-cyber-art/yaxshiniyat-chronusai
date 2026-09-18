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
  Plus,
  Users,
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
  FileText,
  UserPlus,
  Trash2,
  Layers,
  Edit,
  BarChart3
} from "lucide-react";
import ThemeToggle from "../ThemeToggle";
import { get_user_info } from "../Authorized/getRole";

const STORAGE_KEY_GROUPS = "chronous_mentor_custom_groups_v1";

const initialMentorCourses = [
  {
    id: "mentor-course-1",
    title: "Molekulyar Biologiya va Hujayra Genetikasi",
    category: "Biologiya",
    lessonsCount: 16,
    studentsCount: 68,
    groupsCount: 2,
    rating: 4.95,
    status: "Faol",
    createdAt: "2026-08-15",
    description: "DNK replikatsiyasi, genetik muhandislik va fermentativ katalizatorlar bo'yicha chuqur amaliy kurs."
  },
  {
    id: "mentor-course-2",
    title: "Genetik Muhandislik va Biotexnologiya",
    category: "Biologiya",
    lessonsCount: 12,
    studentsCount: 45,
    groupsCount: 1,
    rating: 4.9,
    status: "Faol",
    createdAt: "2026-09-01",
    description: "CRISPR-Cas9 texnologiyasi, rekombinant plazmidlar va zamonaviy bioinformatika usullari."
  }
];

const initialMentorLessons = [
  { id: 101, title: "DNK replikatsiyasi va replikativ vilka tahlili", course: "Molekulyar Biologiya", duration: "45 daqiqa", type: "Video & Ma'ruza", views: 184 },
  { id: 102, title: "DNK-polimeraza fermentining proofreading faolligi", course: "Molekulyar Biologiya", duration: "50 daqiqa", type: "Interaktiv Keys", views: 162 },
  { id: 103, title: "CRISPR-Cas9 mexanizmi va maqsadli gen modifikatsiyasi", course: "Genetik Muhandislik", duration: "60 daqiqa", type: "AI Simulyatsiya", views: 210 },
  { id: 104, title: "Hujayra membranasining biofizik transporti", course: "Molekulyar Biologiya", duration: "40 daqiqa", type: "Laboratoriya tahlili", views: 135 },
  { id: 105, title: "Rekombinant oqsillarning bakterial ekspressiyasi", course: "Genetik Muhandislik", duration: "55 daqiqa", type: "Amaliy Mashg'ulot", views: 120 }
];

const defaultCustomGroups = [
  {
    id: "omni-grp-1",
    name: "Biologiya Olimpiada 2026 (Iqtidorli)",
    course: "Molekulyar Biologiya va Hujayra Genetikasi",
    schedule: "Dush / Chor / Juma • 16:00",
    maxStudents: 25,
    students: [
      { id: 1, name: "Ali Valiyev", email: "ali@gmail.com", progress: 85, aiScore: "96/100", joinedDate: "2026-09-02" },
      { id: 2, name: "Zuhra Karimova", email: "zuhra@gmail.com", progress: 92, aiScore: "98/100", joinedDate: "2026-09-05" },
      { id: 3, name: "Jasur Rahimov", email: "jasur@gmail.com", progress: 70, aiScore: "88/100", joinedDate: "2026-09-08" }
    ]
  },
  {
    id: "omni-grp-2",
    name: "Genomika & CRISPR Intensive",
    course: "Genetik Muhandislik va Biotexnologiya",
    schedule: "Sesh / Pay / Shanba • 18:30",
    maxStudents: 20,
    students: [
      { id: 4, name: "Madina Saidova", email: "madina@gmail.com", progress: 65, aiScore: "91/100", joinedDate: "2026-09-10" },
      { id: 5, name: "Bekzod Umarov", email: "bekzod@gmail.com", progress: 78, aiScore: "94/100", joinedDate: "2026-09-12" }
    ]
  }
];

export default function MentorDashboard() {
  const navigate = useNavigate();
  const userInfo = get_user_info();

  const [activeTab, setActiveTab] = useState("overview"); // 'overview', 'courses', 'lessons', 'groups'
  const [courses, setCourses] = useState(initialMentorCourses);
  const [lessons, setLessons] = useState(initialMentorLessons);
  const [groups, setGroups] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_GROUPS);
      return saved ? JSON.parse(saved) : defaultCustomGroups;
    } catch (e) {
      return defaultCustomGroups;
    }
  });

  // Modals state
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [selectedGroupForStudent, setSelectedGroupForStudent] = useState(null);

  // New Group Form State
  const [newGroupForm, setNewGroupForm] = useState({
    name: "",
    course: "Molekulyar Biologiya va Hujayra Genetikasi",
    schedule: "Dush / Chor / Juma • 15:00",
    maxStudents: 20,
  });

  // New Student Form State
  const [newStudentForm, setNewStudentForm] = useState({
    name: "",
    email: "",
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_GROUPS, JSON.stringify(groups));
    } catch (e) {}
  }, [groups]);

  function handleCreateGroup(e) {
    e.preventDefault();
    if (!newGroupForm.name) return;

    const newGroup = {
      id: `omni-grp-${Date.now()}`,
      name: newGroupForm.name,
      course: newGroupForm.course,
      schedule: newGroupForm.schedule,
      maxStudents: Number(newGroupForm.maxStudents) || 20,
      students: []
    };

    setGroups([newGroup, ...groups]);
    setShowCreateGroupModal(false);
    setNewGroupForm({
      name: "",
      course: "Molekulyar Biologiya va Hujayra Genetikasi",
      schedule: "Dush / Chor / Juma • 15:00",
      maxStudents: 20,
    });
  }

  function handleAddStudent(e) {
    e.preventDefault();
    if (!newStudentForm.name || !selectedGroupForStudent) return;

    const newStudent = {
      id: Date.now(),
      name: newStudentForm.name,
      email: newStudentForm.email || `${newStudentForm.name.toLowerCase().replace(/\s+/g, '_')}@student.uz`,
      progress: 0,
      aiScore: "Yangi",
      joinedDate: new Date().toISOString().split("T")[0]
    };

    setGroups(groups.map(grp => {
      if (grp.id === selectedGroupForStudent.id) {
        return {
          ...grp,
          students: [...grp.students, newStudent]
        };
      }
      return grp;
    }));

    setShowAddStudentModal(false);
    setNewStudentForm({ name: "", email: "" });
  }

  function handleDeleteGroup(groupId) {
    if (window.confirm("Haqiqatdan ham ushbu Omni guruhni o'chirmoqchimisiz?")) {
      setGroups(groups.filter(g => g.id !== groupId));
    }
  }

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
                <img src="/YNlogo_without_word.png" alt="Chronous AI" className="w-full h-full object-contain filter drop-shadow" />
              </div>
              <div className="flex flex-col">
                <span className="font-serif font-black text-lg tracking-wide text-[#120f0d] leading-none">
                  Chronous <span className="text-[#967b4f]">AI</span>
                </span>
                <span className="text-[10px] text-[#827161] font-extrabold tracking-widest uppercase mt-1">
                  Mentor Portali
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5 p-1 rounded-2xl bg-white border border-[#967b4f]/20 shadow-sm">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "overview"
                  ? "bg-[#967b4f] text-white shadow-sm"
                  : "text-[#827161] hover:text-[#120f0d] hover:bg-[#967b4f]/10"
              }`}
            >
              Mentor Kabineti
            </button>
            <button
              onClick={() => setActiveTab("courses")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "courses"
                  ? "bg-[#967b4f] text-white shadow-sm"
                  : "text-[#827161] hover:text-[#120f0d] hover:bg-[#967b4f]/10"
              }`}
            >
              <span>Kurslarim</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${activeTab === "courses" ? "bg-white/25 text-white" : "bg-[#967b4f]/15 text-[#967b4f]"}`}>
                {courses.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("lessons")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "lessons"
                  ? "bg-[#967b4f] text-white shadow-sm"
                  : "text-[#827161] hover:text-[#120f0d] hover:bg-[#967b4f]/10"
              }`}
            >
              <span>Darsliklar</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${activeTab === "lessons" ? "bg-white/25 text-white" : "bg-[#967b4f]/15 text-[#967b4f]"}`}>
                {lessons.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("groups")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "groups"
                  ? "bg-[#967b4f] text-white shadow-sm"
                  : "text-[#827161] hover:text-[#120f0d] hover:bg-[#967b4f]/10"
              }`}
            >
              <span>Chronous Guruhlarim</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${activeTab === "groups" ? "bg-white/25 text-white" : "bg-[#967b4f]/15 text-[#967b4f]"}`}>
                {groups.length}
              </span>
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Direct Link to AI Lab Simulator */}
            <Link
              to="/simulation"
              style={{ color: "#ffffff" }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#967b4f] hover:bg-[#806740] text-white text-xs font-bold shadow-md transition-all active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-white" />
              <span className="hidden sm:inline" style={{ color: "#ffffff" }}>AI Simulyator</span>
            </Link>

            {/* IMPORTANT: Header Button "Boshqaruvga o'tish" to Mentor's CRM Profile */}
            <Link
              to="/mentor/profile"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-[#967b4f]/35 bg-[#967b4f]/10 hover:bg-[#967b4f]/20 text-[#120f0d] text-xs font-bold transition-all shadow-sm active:scale-95 group"
              title="Mentorning CRM dagi shaxsiy profiliga o'tish"
            >
              <Building2 className="w-3.5 h-3.5 text-[#967b4f] group-hover:scale-110 transition-transform" />
              <span>Boshqaruvga o'tish</span>
              <ExternalLink className="w-3 h-3 text-[#967b4f] opacity-70" />
            </Link>

            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 space-y-8">
        {/* ===================== VIEW 1: OVERVIEW & PROFILE ===================== */}
        {activeTab === "overview" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Mentor Profile Hero Card */}
            <div className="lux-card !p-6 sm:!p-8 rounded-[2.5rem] bg-gradient-to-br from-white/95 via-[#fdfbf9] to-amber-50/30 border border-[var(--border-glass)] shadow-xl relative overflow-hidden">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-[#967b4f] to-[#78613c] p-1 shadow-xl shadow-[#967b4f]/25 shrink-0">
                  <div className="w-full h-full rounded-[1.3rem] bg-[var(--bg-panel)] flex items-center justify-center text-3xl font-serif font-black text-[var(--gold)]">
                    {userInfo?.username?.slice(0, 2)?.toUpperCase() || "MN"}
                  </div>
                </div>

                <div className="flex-1 text-center sm:text-left space-y-2">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                    <span className="px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[var(--gold)]/15 text-[var(--gold)] border border-[var(--gold)]/25">
                      Akademik Mentor & Tadqiqotchi
                    </span>
                    <span className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-500/10 px-2.5 py-0.5 rounded-full">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      4.95 Reyting
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-serif font-black text-[var(--text-primary)]">
                    {userInfo?.first_name ? `${userInfo.first_name} ${userInfo.last_name || ''}` : userInfo?.username || "Mentor Ustoz"}
                  </h1>

                  <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed max-w-2xl">
                    Molekulyar biologiya, tabiiy va gumanitar fanlar yo'nalishida iqtidorli yoshlar bilan ishlovchi yetakchi mutaxassis.
                    Chronous AI simulyatsiyalari muallifi.
                  </p>

                  <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-[var(--text-muted)]">
                    <span>Email: <strong className="text-[var(--text-primary)]">{userInfo?.email || "mentor@yaxshiniyat.uz"}</strong></span>
                    <span>•</span>
                    <span>Tizimdagi ID: <strong className="text-[var(--text-primary)]">#{userInfo?.user_id || "102"}</strong></span>
                  </div>
                </div>
              </div>

              {/* KPI Stat Cards */}
              <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-[var(--border-glass)]">
                <div className="p-4 rounded-2xl bg-[var(--bg-void)]/70 border border-[var(--border-glass)] text-center">
                  <span className="text-2xl font-serif font-black text-[var(--text-primary)] block">
                    {courses.length} ta
                  </span>
                  <span className="text-[11px] text-[var(--text-muted)] font-semibold mt-0.5 block">
                    Mening Kurslarim
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-[var(--bg-void)]/70 border border-[var(--border-glass)] text-center">
                  <span className="text-2xl font-serif font-black text-[var(--text-primary)] block">
                    {lessons.length} ta
                  </span>
                  <span className="text-[11px] text-[var(--text-muted)] font-semibold mt-0.5 block">
                    Tayyor Darsliklar
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-[var(--bg-void)]/70 border border-[var(--border-glass)] text-center">
                  <span className="text-2xl font-serif font-black text-[var(--gold)] block">
                    {groups.reduce((acc, g) => acc + g.students.length, 0)} ta
                  </span>
                  <span className="text-[11px] text-[var(--text-muted)] font-semibold mt-0.5 block">
                    Chronous Talabalar
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-[var(--bg-void)]/70 border border-[var(--border-glass)] text-center">
                  <span className="text-2xl font-serif font-black text-emerald-600 block">
                    94%
                  </span>
                  <span className="text-[11px] text-[var(--text-muted)] font-semibold mt-0.5 block">
                    AI O'zlashtirish Natijasi
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action Navigation Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Groups & Students Teaser */}
              <div className="lux-card rounded-3xl p-6 border border-[var(--border-glass)] bg-[var(--bg-panel)] shadow-md flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--gold)]">
                      Chronous Guruhlarim
                    </span>
                    <button
                      onClick={() => setShowCreateGroupModal(true)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[var(--gold)] hover:underline"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Yangi guruh
                    </button>
                  </div>
                  <h3 className="text-lg font-serif font-black text-[var(--text-primary)] mt-2">
                    Shaxsiy O'quv Guruhlaringiz ({groups.length})
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    Bu guruhlar filial CRM tizimidan mustaqil bo'lib, o'zingiz yaratgan fan va darslaringizga biriktiriladi.
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  {groups.slice(0, 2).map((g) => (
                    <div key={g.id} className="p-3 rounded-xl bg-[var(--bg-void)] flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-[var(--text-primary)]">{g.name}</div>
                        <div className="text-[11px] text-[var(--text-muted)]">{g.students.length} ta o'quvchi</div>
                      </div>
                      <button
                        onClick={() => setActiveTab("groups")}
                        className="text-[var(--gold)] font-bold hover:underline"
                      >
                        Batafsil →
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setActiveTab("groups")}
                  className="w-full py-2.5 rounded-xl bg-[var(--gold)]/10 text-[var(--gold)] hover:bg-[var(--gold)]/15 font-bold text-xs transition-all"
                >
                  Barcha guruhlarni ko'rish
                </button>
              </div>

              {/* CRM Bridge Banner */}
              <div className="lux-card rounded-3xl p-6 border border-[var(--border-glass)] bg-gradient-to-br from-amber-50/40 via-[var(--bg-panel)] to-amber-50/20 shadow-md flex flex-col justify-between space-y-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--gold)]">
                    Markaz Boshqaruvi
                  </span>
                  <h3 className="text-lg font-serif font-black text-[var(--text-primary)] mt-2">
                    Filial CRM Tizimiga O'tish
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    Markazdagi rasmiy guruhlaringiz, filial kassa hisob-kitoblari, oylik maosh va davomat tekshiruvini CRM orqali boshqaring.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[var(--bg-panel)] border border-[var(--border-glass)] space-y-1.5 text-xs text-[var(--text-muted)]">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Filial dars jadvallari va xonalar taqsimoti</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Avtomatik refund va oylik hisob moduli</span>
                  </div>
                </div>

                <Link
                  to="/mentor"
                  className="w-full py-3 rounded-xl bg-[#967b4f] hover:bg-[#806740] text-white font-bold text-xs text-center shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Building2 className="w-4 h-4" />
                  <span>Haqiqiy CRM Sahifalariga O'tish</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ===================== VIEW 2: MY COURSES ===================== */}
        {activeTab === "courses" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-serif font-black text-[var(--text-primary)]">
                  Mening O'quv Kurslarim
                </h2>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Siz tomoningizdan ishlab chiqilgan ta'lim kurslari va ularning metrikalari.
                </p>
              </div>

              <button
                onClick={() => alert("Yangi kurs qo'shish moduli: kurs nomi va dasturini kiriting.")}
                className="px-4 py-2 rounded-xl bg-[var(--gold)] text-white font-bold text-xs shadow-md hover:brightness-105 flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Yangi Kurs Yaratish</span>
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="lux-card rounded-3xl p-6 border border-[var(--border-glass)] bg-[var(--bg-panel)] shadow-md space-y-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-3 py-0.5 rounded-full text-[10px] font-bold bg-[var(--gold)]/15 text-[var(--gold)]">
                        {course.category}
                      </span>
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                        {course.status}
                      </span>
                    </div>

                    <h3 className="font-serif font-bold text-base text-[var(--text-primary)]">
                      {course.title}
                    </h3>
                    <p className="text-xs text-[var(--text-muted)] mt-1.5 leading-relaxed">
                      {course.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[var(--border-glass)] grid grid-cols-3 gap-2 text-center text-xs text-[var(--text-muted)]">
                    <div>
                      <span className="font-bold text-[var(--text-primary)] block">{course.lessonsCount} ta</span>
                      <span className="text-[10px]">Darslar</span>
                    </div>
                    <div>
                      <span className="font-bold text-[var(--text-primary)] block">{course.studentsCount} ta</span>
                      <span className="text-[10px]">Talabalar</span>
                    </div>
                    <div>
                      <span className="font-bold text-[var(--text-primary)] block">{course.groupsCount} ta</span>
                      <span className="text-[10px]">Guruhlar</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===================== VIEW 3: ALL LESSONS ===================== */}
        {activeTab === "lessons" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-serif font-black text-[var(--text-primary)]">
                  Jami Darsliklar va Materiallar
                </h2>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Barcha kurslar bo'yicha shakllantirilgan mavzular va AI keyslar ro'yxati.
                </p>
              </div>

              <button
                onClick={() => alert("Yangi darslik qo'shish moduli")}
                className="px-4 py-2 rounded-xl bg-[var(--gold)] text-white font-bold text-xs shadow-md hover:brightness-105 flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Dars Qo'shish</span>
              </button>
            </div>

            <div className="lux-card rounded-3xl border border-[var(--border-glass)] bg-[var(--bg-panel)] shadow-md overflow-hidden">
              <div className="divide-y divide-[var(--border-glass)]">
                {lessons.map((lesson, idx) => (
                  <div key={lesson.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[var(--bg-void)]/40 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-[var(--gold)]/10 text-[var(--gold)] flex items-center justify-center font-bold text-xs shrink-0">
                        {idx + 1}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs sm:text-sm text-[var(--text-primary)] truncate">
                          {lesson.title}
                        </h4>
                        <div className="flex items-center gap-3 text-[11px] text-[var(--text-muted)] mt-0.5">
                          <span>{lesson.course}</span>
                          <span>•</span>
                          <span>{lesson.duration}</span>
                          <span>•</span>
                          <span className="font-semibold text-amber-800 bg-amber-500/10 px-2 py-0.5 rounded-md">
                            {lesson.type}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] self-end sm:self-center">
                      <span>{lesson.views} marta ko'rildi</span>
                      <button className="px-3 py-1 rounded-lg border border-[var(--border-glass)] hover:border-[var(--gold)] hover:text-[var(--gold)] font-semibold transition-all">
                        Tahrirlash
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===================== VIEW 4: MENTOR'S CUSTOM GROUPS & ENROLLED STUDENTS ===================== */}
        {activeTab === "groups" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* IMPORTANT NOTICE BANNER */}
            <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3.5">
              <ShieldCheck className="w-5 h-5 text-[#967b4f] shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <span className="font-bold text-amber-900 block">
                  Muhim eslatma: Ushbu guruhlar sizning shaxsiy Chronous AI o'quv guruhlaringizdir!
                </span>
                <p className="text-[var(--text-muted)] leading-relaxed">
                  Bu guruhlar filial kassa va refund tizimi (CRM) guruhlari bilan bir xil emas. Ular sizning mustaqil ilmiy kurslaringiz va AI simulyatsiya o'quvchilaringiz uchun xizmat qiladi.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-serif font-black text-[var(--text-primary)]">
                  Mening Chronous Guruhlarim va Shogirdlarim
                </h2>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Jami {groups.length} ta guruh va {groups.reduce((acc, g) => acc + g.students.length, 0)} ta ro'yxatdan o'tgan talaba.
                </p>
              </div>

              <button
                onClick={() => setShowCreateGroupModal(true)}
                className="px-4 py-2.5 rounded-xl bg-[var(--gold)] text-white font-bold text-xs shadow-md hover:brightness-105 flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>+ Yangi Guruh Yaratish</span>
              </button>
            </div>

            {/* Groups Grid */}
            <div className="grid lg:grid-cols-2 gap-6">
              {groups.map((grp) => (
                <div
                  key={grp.id}
                  className="lux-card rounded-3xl p-6 border border-[var(--border-glass)] bg-[var(--bg-panel)] shadow-md flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-0.5 rounded-full text-[10px] font-bold bg-[var(--gold)]/15 text-[var(--gold)]">
                        {grp.course}
                      </span>
                      <button
                        onClick={() => handleDeleteGroup(grp.id)}
                        className="text-gray-400 hover:text-rose-500 transition-colors p-1"
                        title="Guruhni o'chirish"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <h3 className="font-serif font-bold text-base sm:text-lg text-[var(--text-primary)]">
                      {grp.name}
                    </h3>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-muted)]">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[var(--gold)]" />
                        {grp.schedule}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {grp.students.length} / {grp.maxStudents} talaba
                      </span>
                    </div>
                  </div>

                  {/* Enrolled Students in this Group */}
                  <div className="space-y-2 pt-3 border-t border-[var(--border-glass)]">
                    <div className="flex items-center justify-between text-xs font-bold text-[var(--text-muted)]">
                      <span>Biriktirilgan Talabalar:</span>
                      <button
                        onClick={() => {
                          setSelectedGroupForStudent(grp);
                          setShowAddStudentModal(true);
                        }}
                        className="text-[var(--gold)] hover:underline flex items-center gap-1 font-bold text-[11px]"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        + Talaba qo'shish
                      </button>
                    </div>

                    {grp.students.length === 0 ? (
                      <p className="text-xs text-[var(--text-muted)] py-3 text-center italic">
                        Bu guruhga hali talabalar biriktirilmagan.
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                        {grp.students.map((student) => (
                          <div
                            key={student.id}
                            className="p-2.5 rounded-xl bg-[var(--bg-void)]/60 border border-[var(--border-glass)] flex items-center justify-between text-xs"
                          >
                            <div>
                              <div className="font-bold text-[var(--text-primary)]">{student.name}</div>
                              <div className="text-[10px] text-[var(--text-muted)]">{student.email}</div>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] font-bold text-emerald-600 block">
                                Baho: {student.aiScore}
                              </span>
                              <span className="text-[9px] text-[var(--text-muted)]">
                                {student.progress}% darslar
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* ===================== MODAL: CREATE CUSTOM GROUP ===================== */}
      {showCreateGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="lux-card !p-6 sm:!p-8 !bg-[var(--bg-panel)] w-full max-w-md rounded-3xl border border-[var(--gold)]/30 shadow-2xl relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif font-black text-lg text-[var(--text-primary)]">
                Yangi Chronous Guruh Yaratish
              </h3>
              <button
                onClick={() => setShowCreateGroupModal(false)}
                className="text-gray-400 hover:text-[var(--text-primary)] text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[var(--text-muted)] mb-5">
              Ushbu guruh sizning mustaqil o'quv dasturingiz va AI laboratoriyangiz uchun xizmat qiladi.
            </p>

            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[var(--text-muted)] block mb-1">
                  Guruh Nomi:
                </label>
                <input
                  required
                  type="text"
                  placeholder="Masalan: Kvant Mexanikasi 2026"
                  value={newGroupForm.name}
                  onChange={(e) => setNewGroupForm({ ...newGroupForm, name: e.target.value })}
                  className="lux-input !py-2.5 !px-3.5 w-full text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--text-muted)] block mb-1">
                  O'quv Kursi:
                </label>
                <select
                  value={newGroupForm.course}
                  onChange={(e) => setNewGroupForm({ ...newGroupForm, course: e.target.value })}
                  className="lux-input !py-2.5 !px-3.5 w-full text-xs cursor-pointer"
                >
                  <option value="Molekulyar Biologiya va Hujayra Genetikasi">Molekulyar Biologiya va Hujayra Genetikasi</option>
                  <option value="Genetik Muhandislik va Biotexnologiya">Genetik Muhandislik va Biotexnologiya</option>
                  <option value="Kvant Mexanikasi va Atom Fizikasi">Kvant Mexanikasi va Atom Fizikasi</option>
                  <option value="Xalqaro Tijorat va Sud Huquqi">Xalqaro Tijorat va Sud Huquqi</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--text-muted)] block mb-1">
                  Dars Vaqtlari (Jadval):
                </label>
                <input
                  type="text"
                  placeholder="Masalan: Dush / Chor / Juma • 17:00"
                  value={newGroupForm.schedule}
                  onChange={(e) => setNewGroupForm({ ...newGroupForm, schedule: e.target.value })}
                  className="lux-input !py-2.5 !px-3.5 w-full text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--text-muted)] block mb-1">
                  Maksimal Talabalar Sig'imi:
                </label>
                <input
                  type="number"
                  min="5"
                  max="100"
                  value={newGroupForm.maxStudents}
                  onChange={(e) => setNewGroupForm({ ...newGroupForm, maxStudents: e.target.value })}
                  className="lux-input !py-2.5 !px-3.5 w-full text-xs"
                />
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateGroupModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[var(--border-glass)] text-xs font-bold text-[var(--text-muted)] hover:bg-[var(--bg-void)]"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[var(--gold)] text-white text-xs font-bold shadow-md hover:brightness-105"
                >
                  Guruhni Yaratish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL: ADD STUDENT TO GROUP ===================== */}
      {showAddStudentModal && selectedGroupForStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="lux-card !p-6 sm:!p-8 !bg-[var(--bg-panel)] w-full max-w-sm rounded-3xl border border-[var(--gold)]/30 shadow-2xl relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif font-black text-base text-[var(--text-primary)]">
                Talaba Qo'shish
              </h3>
              <button
                onClick={() => setShowAddStudentModal(false)}
                className="text-gray-400 hover:text-[var(--text-primary)] text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[var(--text-muted)] mb-4">
              Guruh: <strong className="text-[var(--text-primary)]">{selectedGroupForStudent.name}</strong>
            </p>

            <form onSubmit={handleAddStudent} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-[var(--text-muted)] block mb-1">
                  Talaba Ism-Familiyasi:
                </label>
                <input
                  required
                  type="text"
                  placeholder="Masalan: Sardor Aliyev"
                  value={newStudentForm.name}
                  onChange={(e) => setNewStudentForm({ ...newStudentForm, name: e.target.value })}
                  className="lux-input !py-2.5 !px-3.5 w-full text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--text-muted)] block mb-1">
                  Email yoki Telegram ID (ixtiyoriy):
                </label>
                <input
                  type="email"
                  placeholder="talaba@gmail.com"
                  value={newStudentForm.email}
                  onChange={(e) => setNewStudentForm({ ...newStudentForm, email: e.target.value })}
                  className="lux-input !py-2.5 !px-3.5 w-full text-xs"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[var(--border-glass)] text-xs font-bold text-[var(--text-muted)] hover:bg-[var(--bg-void)]"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[var(--gold)] text-white text-xs font-bold shadow-md hover:brightness-105"
                >
                  Qo'shish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
