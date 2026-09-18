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
  Filter,
  Layers,
  ChevronRight,
  Award,
  Calendar,
  LogOut,
  ExternalLink,
  ShieldCheck,
  Flame,
  Check,
  FileText
} from "lucide-react";
import ThemeToggle from "../ThemeToggle";
import { get_user_info } from "../Authorized/getRole";

// Initial Courses Data
const sampleCourses = [
  {
    id: "bio-101",
    title: "Molekulyar Biologiya va Hujayra Genetikasi",
    category: "Biologiya",
    instructor: "Prof. Alisher Qodirov",
    institution: "O'zbekiston Fanlar Akademiyasi",
    duration: "8 hafta",
    lessonsCount: 16,
    rating: 4.9,
    studentsCount: 340,
    progress: 45,
    simulationsCount: 3,
    simulationSlug: "bio-dna-replikatsiya",
    image: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=600&auto=format&fit=crop&q=80",
    description: "Eukariot hujayralar genetik apparati, DNK replikatsiyasi, transkripsiya va polimeraza fermentlarining tahlili.",
    lessons: [
      { id: 1, title: "1-Dars: Hujayra tuzilishi va genetik material", duration: "35 daq", completed: true, type: "video" },
      { id: 2, title: "2-Dars: DNK qo'sh spirali va nukleotidlar zanjiri", duration: "45 daq", completed: true, type: "interactive" },
      { id: 3, title: "3-Dars: DNK polimeraza va replikatsiya jarayoni", duration: "50 daq", completed: true, type: "case" },
      { id: 4, title: "4-Dars: Reparatsiya mexanizmlari va mutatsiyalar", duration: "40 daq", completed: false, type: "simulation" },
      { id: 5, title: "5-Dars: RNK sintezi va transkripsiya bosqichlari", duration: "45 daq", completed: false, type: "video" },
      { id: 6, title: "6-Dars: Translatsiya va oqsil biosintezi", duration: "55 daq", completed: false, type: "interactive" },
    ]
  },
  {
    id: "phys-201",
    title: "Kvant Mexanikasi va Atom Fizikasi",
    category: "Fizika",
    instructor: "Dr. Sardor Nazarov",
    institution: "O'zbekiston Milliy Universiteti",
    duration: "10 hafta",
    lessonsCount: 20,
    rating: 4.95,
    studentsCount: 280,
    progress: 30,
    simulationsCount: 4,
    simulationSlug: "fizika-kvant-fotoeffekt",
    image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&auto=format&fit=crop&q=80",
    description: "Foton energiyasi, fotoeffekt, to'lqin-zarra dualligi va Shredinger to'lqin tenglamalarining amaliy masalalari.",
    lessons: [
      { id: 1, title: "1-Dars: Kvant nazariyasining paydo bo'lishi", duration: "40 daq", completed: true, type: "video" },
      { id: 2, title: "2-Dars: Plank nurlanish qonuni va kvantlash", duration: "45 daq", completed: true, type: "interactive" },
      { id: 3, title: "3-Dars: Fotoeffekt va to'xtatuvchi potensial", duration: "50 daq", completed: false, type: "simulation" },
      { id: 4, title: "4-Dars: Kompton effekti va foton impulsi", duration: "45 daq", completed: false, type: "case" },
      { id: 5, title: "5-Dars: Bor atom modeli va spektrlar", duration: "55 daq", completed: false, type: "video" },
    ]
  },
  {
    id: "law-301",
    title: "Xalqaro Tijorat va Shartnomalar Huquqi",
    category: "Huquqshunoslik",
    instructor: "Dots. Nilufar Karimova",
    institution: "Toshkent Davlat Yuridik Universiteti",
    duration: "6 hafta",
    lessonsCount: 14,
    rating: 4.88,
    studentsCount: 410,
    progress: 70,
    simulationsCount: 3,
    simulationSlug: "sud-shartnoma-nizo",
    image: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80",
    description: "Tijoriy bitimlar, yetkazib berish shartnomalari bo'yicha sud nizolari, penalty va fors-major holatlari tahlili.",
    lessons: [
      { id: 1, title: "1-Dars: Tijoriy shartnomalarning tuzilishi", duration: "45 daq", completed: true, type: "video" },
      { id: 2, title: "2-Dars: Majburiyatlar buzilishi va javobgarlik", duration: "50 daq", completed: true, type: "case" },
      { id: 3, title: "3-Dars: Fors-major holatlari va isbotlash tartibi", duration: "60 daq", completed: true, type: "simulation" },
      { id: 4, title: "4-Dars: Iqtisodiy sudlarda da'vo bildirish va e'tiroz", duration: "55 daq", completed: false, type: "interactive" },
    ]
  },
  {
    id: "chem-102",
    title: "Organik Kimyo va Spektroskopik Tahlil",
    category: "Kimyo",
    instructor: "Dots. Maftuna Rahimova",
    institution: "O'zbekiston Milliy Universiteti",
    duration: "8 hafta",
    lessonsCount: 18,
    rating: 4.92,
    studentsCount: 220,
    progress: 15,
    simulationsCount: 2,
    simulationSlug: "kimyo-spektr-tahlil",
    image: "https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?w=600&auto=format&fit=crop&q=80",
    description: "Funksional guruhlar reaksiyalari, YaMR va IQ spektroskopiya orqali noma'lum moddalar tuzilishini aniqlash.",
    lessons: [
      { id: 1, title: "1-Dars: Organik birikmalar stereokimyosi", duration: "40 daq", completed: true, type: "video" },
      { id: 2, title: "2-Dars: Nukleofil almashinish mexanizmlari (SN1/SN2)", duration: "50 daq", completed: false, type: "interactive" },
      { id: 3, title: "3-Dars: IQ va YaMR spektroskopiyasi asoslari", duration: "55 daq", completed: false, type: "simulation" },
    ]
  },
  {
    id: "hist-202",
    title: "Markaziy Osiyo Tarixi va Arxeologik Manbalar",
    category: "Tarix",
    instructor: "T.f.d. Rustam Saidov",
    institution: "Abu Rayhon Beruniy nomidagi Sharqshunoslik Instituti",
    duration: "7 hafta",
    lessonsCount: 15,
    rating: 4.85,
    studentsCount: 195,
    progress: 50,
    simulationsCount: 2,
    simulationSlug: "tarix-ipak-yoli",
    image: "https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=600&auto=format&fit=crop&q=80",
    description: "Buyuk Ipak yo'li savdo munosabatlari, tangashunoslik, yozma yodgorliklar va arxeologik yodgorliklar tahlili.",
    lessons: [
      { id: 1, title: "1-Dars: Buyuk Ipak yo'lining asosiy tarmoqlari", duration: "45 daq", completed: true, type: "video" },
      { id: 2, title: "2-Dars: Sug'd yozuvi va numizmatika dalillari", duration: "50 daq", completed: true, type: "case" },
      { id: 3, title: "3-Dars: Qadimiy karvon yo'llari va bojxona nizolari", duration: "50 daq", completed: false, type: "simulation" },
    ]
  }
];

const sampleProfessors = [
  {
    name: "Prof. Alisher Qodirov",
    title: "Biologiya Fanlari Doktori, Professor",
    institution: "O'zbekiston Fanlar Akademiyasi",
    specialty: "Molekulyar Genetika va Biotexnologiya",
    rating: 4.95,
    studentsCount: 1240,
    coursesCount: 3,
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80"
  },
  {
    name: "Dr. Sardor Nazarov",
    title: "Fizika-Matematika Fanlari Nomzodi",
    institution: "O'zbekiston Milliy Universiteti",
    specialty: "Nazariy Fizika va Kvant Optikasi",
    rating: 4.92,
    studentsCount: 890,
    coursesCount: 2,
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80"
  },
  {
    name: "Dots. Nilufar Karimova",
    title: "Yuridik Fanlar Nomzodi, Dotsent",
    institution: "Toshkent Davlat Yuridik Universiteti",
    specialty: "Fuqarolik va Xalqaro Tijorat Huquqi",
    rating: 4.88,
    studentsCount: 1450,
    coursesCount: 4,
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80"
  },
  {
    name: "Dots. Maftuna Rahimova",
    title: "Kimyo Fanlari Nomzodi",
    institution: "O'zbekiston Milliy Universiteti",
    specialty: "Organik Sintez va Spektroskopiya",
    rating: 4.9,
    studentsCount: 760,
    coursesCount: 2,
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80"
  }
];

const sampleInstitutions = [
  {
    name: "O'zbekiston Fanlar Akademiyasi",
    type: "Akademik Ilmiy Tashkilot",
    location: "Toshkent shahri, Yahyo G'ulomov ko'chasi 70",
    departments: "Genomika, Bioorganik kimyo, Yadro fizikasi",
    verified: true,
    logo: "FA"
  },
  {
    name: "Toshkent Davlat Yuridik Universiteti (TDYU)",
    type: "Oliy Ta'lim Muassasasi",
    location: "Toshkent shahri, Sayilgoh ko'chasi 35",
    departments: "Xalqaro huquq, Xususiy huquq, Sud ekspertizasi",
    verified: true,
    logo: "TDYU"
  },
  {
    name: "Mirzo Ulug'bek nomidagi O'zbekiston Milliy Universiteti",
    type: "Klassik Milliy Universitet",
    location: "Toshkent shahri, Talabalar shaharchasi",
    departments: "Fizika, Kimyo, Biologiya, Tarix fakultetlari",
    verified: true,
    logo: "O'zMU"
  },
  {
    name: "Abu Rayhon Beruniy nomidagi Sharqshunoslik Instituti",
    type: "Ilmiy-Tadqiqot Instituti",
    location: "Toshkent shahri, Mirobod tumani",
    departments: "Qo'lyozmalar fondi, Sharq tillari, Manbashunoslik",
    verified: true,
    logo: "SI"
  }
];

export default function StudentDashboard() {
  const navigate = useNavigate();
  const userInfo = get_user_info();

  const [activeTab, setActiveTab] = useState("courses"); // 'courses', 'professors', 'institutions', 'profile'
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [activeLesson, setActiveLesson] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const categories = ["ALL", "Biologiya", "Fizika", "Kimyo", "Huquqshunoslik", "Tarix"];

  const filteredCourses = sampleCourses.filter((course) => {
    const matchesCategory = selectedCategory === "ALL" || course.category === selectedCategory;
    const matchesSearch =
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.instructor.toLowerCase().includes(searchQuery.toLowerCase());
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
                <img src="/YNlogo_without_word.png" alt="Chronous AI" className="w-full h-full object-contain filter drop-shadow" />
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
              onClick={() => { setActiveTab("courses"); setSelectedCourse(null); }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "courses"
                  ? "bg-[#967b4f] text-white shadow-sm"
                  : "text-[#827161] hover:text-[#120f0d] hover:bg-[#967b4f]/10"
              }`}
            >
              Kurslarim & Katalog
            </button>
            <button
              onClick={() => { setActiveTab("professors"); setSelectedCourse(null); }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "professors"
                  ? "bg-[#967b4f] text-white shadow-sm"
                  : "text-[#827161] hover:text-[#120f0d] hover:bg-[#967b4f]/10"
              }`}
            >
              Professorlar & Mentorlar
            </button>
            <button
              onClick={() => { setActiveTab("institutions"); setSelectedCourse(null); }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "institutions"
                  ? "bg-[#967b4f] text-white shadow-sm"
                  : "text-[#827161] hover:text-[#120f0d] hover:bg-[#967b4f]/10"
              }`}
            >
              Ta'lim Tashkilotlari
            </button>
            <button
              onClick={() => { setActiveTab("profile"); setSelectedCourse(null); }}
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
            {/* Coins Badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-900 text-xs font-black shadow-sm">
              <Coins className="w-3.5 h-3.5 text-[#967b4f]" />
              <span>120 Tanga</span>
            </div>

            {/* Direct Launch to AI Lab */}
            <Link
              to="/simulation"
              style={{ color: "#ffffff" }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#967b4f] hover:bg-[#806740] text-white text-xs font-bold shadow-md transition-all active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-white" />
              <span className="hidden sm:inline" style={{ color: "#ffffff" }}>AI Simulyator</span>
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
                  Salom! Yangi mavzularni o'rganing va <span className="text-[var(--gold)]">AI simulyatsiya</span> bilan bilimlarni mustahkamlang.
                </h1>
                <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-2 leading-relaxed">
                  Har bir darslik real hayotiy keyslar bilan boyitilgan. Kurs darslarini o'zlashtirib, virtual laboratoriyada o'z iqtidoringizni sinab ko'ring.
                </p>
              </div>
            </div>

            {/* Filter Bar & Search */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              {/* Category Pills */}
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
                  placeholder="Kurs yoki ustoz qidirish..."
                  className="lux-input !pl-10 !py-2.5 w-full text-xs rounded-full"
                />
              </div>
            </div>

            {/* Courses Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <div
                  key={course.id}
                  onClick={() => setSelectedCourse(course)}
                  className="lux-card rounded-3xl overflow-hidden border border-[var(--border-glass)] bg-[var(--bg-panel)] hover:shadow-2xl hover:border-[var(--gold)]/40 transition-all cursor-pointer flex flex-col group"
                >
                  {/* Card Media Banner */}
                  <div className="h-44 relative overflow-hidden">
                    <img
                      src={course.image}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    
                    <div className="absolute top-3 left-3">
                      <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/90 backdrop-blur-md text-[var(--text-primary)] border border-white/20 shadow-sm">
                        {course.category}
                      </span>
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
                      <span className="flex items-center gap-1 font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        {course.rating}
                      </span>
                      <span className="flex items-center gap-1 opacity-90 text-[11px]">
                        <BookOpen className="w-3.5 h-3.5" />
                        {course.lessonsCount} dars
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
                        {course.description}
                      </p>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-[var(--border-glass)]">
                      <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                        <span className="font-semibold">{course.instructor}</span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                          {course.simulationsCount} ta AI Simulyator
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div>
                        <div className="flex items-center justify-between text-[10px] font-bold text-[var(--text-muted)] mb-1">
                          <span>O'zlashtirish</span>
                          <span>{course.progress}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-[var(--bg-void)] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[var(--gold)] rounded-full transition-all"
                            style={{ width: `${course.progress}%` }}
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
              ))}
            </div>
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
                    {selectedCourse.category}
                  </span>
                  <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    {selectedCourse.rating} ({selectedCourse.studentsCount} talaba)
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
                    {selectedCourse.instructor}
                  </span>
                  <span>•</span>
                  <span>{selectedCourse.institution}</span>
                  <span>•</span>
                  <span>{selectedCourse.duration}</span>
                </div>

                {/* PROMINENT AI SIMULATION BUTTON INSIDE COURSE */}
                <div className="mt-8 flex flex-wrap items-center gap-3.5">
                  <Link
                    to={`/simulation?courseId=${selectedCourse.id}`}
                    style={{ color: "#ffffff" }}
                    className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-[#967b4f] hover:bg-[#806740] text-white font-bold text-xs sm:text-sm shadow-xl transition-all hover:scale-[1.02]"
                  >
                    <Sparkles className="w-4 h-4 text-white" />
                    <span style={{ color: "#ffffff" }}>Simulyatsiyaga o'tish (AI Laboratoriya)</span>
                    <ArrowRight className="w-4 h-4 text-white" />
                  </Link>

                  <div className="text-xs text-[var(--text-muted)] font-medium">
                    {selectedCourse.simulationsCount} ta interaktiv keys tayyor
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
                      {selectedCourse.progress}%
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">
                      {selectedCourse.lessons.filter(l => l.completed).length} / {selectedCourse.lessons.length} dars tamomlandi
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200/50 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-[var(--gold)] rounded-full" style={{ width: `${selectedCourse.progress}%` }} />
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

            {/* LESSONS LIST */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-serif font-black text-[var(--text-primary)]">
                  Kurs Darslari va Materiallari
                </h2>
                <span className="text-xs text-[var(--text-muted)] font-semibold">
                  Jami {selectedCourse.lessons.length} ta dars
                </span>
              </div>

              <div className="space-y-3">
                {selectedCourse.lessons.map((lesson, idx) => {
                  const isOpened = activeLesson === lesson.id;
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
                              lesson.completed
                                ? "bg-emerald-500/15 text-emerald-700 border border-emerald-500/30"
                                : "bg-[var(--gold)]/10 text-[var(--gold)] border border-[var(--gold)]/20"
                            }`}
                          >
                            {lesson.completed ? <Check className="w-4 h-4" /> : idx + 1}
                          </div>

                          <div className="min-w-0">
                            <h4 className="text-xs sm:text-sm font-bold text-[var(--text-primary)] truncate">
                              {lesson.title}
                            </h4>
                            <div className="flex items-center gap-3 text-[11px] text-[var(--text-muted)] mt-0.5">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {lesson.duration}
                              </span>
                              <span>•</span>
                              <span className="capitalize">{lesson.type}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {lesson.type === "simulation" && (
                            <Link
                              to={`/simulation?courseId=${selectedCourse.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="px-3 py-1.5 rounded-full text-[11px] font-bold text-amber-900 bg-amber-500/15 border border-amber-500/25 flex items-center gap-1.5 hover:bg-amber-500/25 transition-all"
                            >
                              <Sparkles className="w-3 h-3 text-[#967b4f]" />
                              <span>Simulyator</span>
                            </Link>
                          )}
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
                            Ushbu darsda siz mavzuning nazariy asoslari, amaliy qo'llanishi va tahlil usullari bilan batafsil tanishasiz.
                            Dars yakunida mini-test yoki AI keys orqali o'zlashtirish darajangiz baholanadi.
                          </p>

                          <div className="flex flex-wrap items-center gap-3 pt-2">
                            <button className="px-4 py-2 rounded-xl bg-[var(--gold)] text-white font-bold text-xs shadow-sm hover:brightness-105 flex items-center gap-1.5">
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span>Darsni boshlash</span>
                            </button>

                            <Link
                              to={`/simulation?courseId=${selectedCourse.id}`}
                              className="px-4 py-2 rounded-xl bg-[var(--bg-void)] border border-[var(--border-glass)] text-[var(--text-primary)] font-bold text-xs hover:border-[var(--gold)] flex items-center gap-1.5"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-[var(--gold)]" />
                              <span>Ushbu mavzu bo'yicha AI keysga o'tish</span>
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
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
                O'z sohasining yetuk akademik olimlari, fan doktorlari va amaliyotchi mutaxassislari.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {sampleProfessors.map((prof, i) => (
                <div
                  key={i}
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
                      {prof.rating}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-[var(--text-primary)]">{prof.name}</h3>
                    <p className="text-[11px] font-semibold text-[var(--gold)] mt-0.5">{prof.title}</p>
                    <p className="text-[11px] text-[var(--text-muted)] mt-1">{prof.institution}</p>
                  </div>

                  <div className="w-full pt-3 border-t border-[var(--border-glass)] grid grid-cols-2 gap-2 text-xs text-[var(--text-muted)]">
                    <div>
                      <span className="font-bold text-[var(--text-primary)] block">{prof.coursesCount} ta</span>
                      <span className="text-[10px]">O'quv kursi</span>
                    </div>
                    <div>
                      <span className="font-bold text-[var(--text-primary)] block">{prof.studentsCount}+</span>
                      <span className="text-[10px]">Shogirdlar</span>
                    </div>
                  </div>

                  <button className="w-full py-2 rounded-xl bg-[var(--bg-void)] border border-[var(--border-glass)] text-xs font-bold text-[var(--text-primary)] hover:border-[var(--gold)] hover:bg-[var(--gold)]/10 transition-all">
                    Profilni ko'rish
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
                ChronosAI platformasiga birlashgan ilmiy markazlar, davlat universitetlari va ilmiy laboratoriyalar.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              {sampleInstitutions.map((inst, i) => (
                <div
                  key={i}
                  className="lux-card rounded-3xl p-6 sm:p-7 border border-[var(--border-glass)] bg-[var(--bg-panel)] shadow-md flex items-start gap-4 hover:border-[var(--gold)]/40 hover:shadow-xl transition-all"
                >
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#967b4f] to-[#78613c] text-white flex items-center justify-center font-black text-base shrink-0 shadow-md shadow-[#967b4f]/25">
                    {inst.logo}
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[var(--gold)]/15 text-[var(--gold)]">
                        {inst.type}
                      </span>
                      {inst.verified && (
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                          <CheckCircle2 className="w-3 h-3" />
                          Akademik akkreditatsiya
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-base text-[var(--text-primary)]">{inst.name}</h3>
                    <p className="text-xs text-[var(--text-muted)]">{inst.location}</p>

                    <div className="pt-2 text-xs text-[var(--text-muted)]">
                      <strong className="text-[var(--text-primary)]">Yo'nalishlar:</strong> {inst.departments}
                    </div>
                  </div>
                </div>
              ))}
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
                    {userInfo?.username?.slice(0, 2)?.toUpperCase() || "TL"}
                  </div>
                </div>

                <div className="text-center sm:text-left space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-bold bg-[var(--gold)]/15 text-[var(--gold)]">
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>Faol Talaba</span>
                  </div>
                  <h2 className="text-2xl font-serif font-black text-[var(--text-primary)]">
                    {userInfo?.username || "Talaba"}
                  </h2>
                  <p className="text-xs text-[var(--text-muted)]">
                    {userInfo?.email || "talaba@gmail.com"} • ID #{userInfo?.user_id || "782"}
                  </p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="mt-8 grid grid-cols-3 gap-4 pt-6 border-t border-[var(--border-glass)] text-center">
                <div className="p-3 rounded-2xl bg-[var(--bg-void)]/60">
                  <span className="text-xl font-serif font-black text-[var(--text-primary)] block">3 ta</span>
                  <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase">Yozilgan Kurslar</span>
                </div>
                <div className="p-3 rounded-2xl bg-[var(--bg-void)]/60">
                  <span className="text-xl font-serif font-black text-emerald-600 block">94%</span>
                  <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase">AI Simulyatsiya Bahosi</span>
                </div>
                <div className="p-3 rounded-2xl bg-[var(--bg-void)]/60">
                  <span className="text-xl font-serif font-black text-amber-700 block">120</span>
                  <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase">Yig'ilgan Tangalar</span>
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
