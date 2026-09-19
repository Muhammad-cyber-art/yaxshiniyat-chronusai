import React, { useState, useEffect, useRef } from "react";
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
  BarChart3,
  Check,
  X,
<<<<<<< Updated upstream
  Copy,
  FlaskConical,
  Scale,
  Activity,
  Atom
=======
  Upload,
  File,
  ImageIcon,
  Download,
  Paperclip
>>>>>>> Stashed changes
} from "lucide-react";
import ThemeToggle from "../ThemeToggle";
import { get_user_info } from "../Authorized/getRole";
import api from "../../tokenUpdater/updater";
import PeriodicTableModal from "../Simulation/PeriodicTableModal";
import { PERIODIC_ELEMENTS, CATEGORY_COLORS } from "../Simulation/periodicTableData";

export default function MentorDashboard() {
  const navigate = useNavigate();
  const tokenUserInfo = get_user_info();

  const [currentUser, setCurrentUser] = useState(tokenUserInfo);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("overview"); // 'overview', 'courses', 'lessons', 'groups'

  // Backend Data Collections
  const [courses, setCourses] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [groups, setGroups] = useState([]);
  const [domains, setDomains] = useState([]);

  // Modals state
  const [showCreateCourseModal, setShowCreateCourseModal] = useState(false);
  const [showCreateLessonModal, setShowCreateLessonModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showGenerateSimModal, setShowGenerateSimModal] = useState(false);
  const [showPeriodicTable, setShowPeriodicTable] = useState(false);
  const [mendeleyevSearch, setMendeleyevSearch] = useState("");
  const [mendeleyevCategory, setMendeleyevCategory] = useState("all");
  const [generatingSim, setGeneratingSim] = useState(false);
  const [createdInviteModalData, setCreatedInviteModalData] = useState(null);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [selectedGroupForStudent, setSelectedGroupForStudent] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [activeCourseLesson, setActiveCourseLesson] = useState(null);

  // AI Simulator Generator Form State
  const [generateSimForm, setGenerateSimForm] = useState({
    course_id: "",
    lesson_id: "",
    subject_category: "NATURAL_SCIENCE",
    room_style: "CHEMISTRY_LAB",
    expected_duration_minutes: 15,
    max_participants: 4,
    passing_score: 80,
    lesson_material_text: "",
    custom_instructions: "",
    target_reaction: "HCl + NaOH",
    required_equivalent_ratio: "1:1 ekvivalent",
    ask_quantity_and_equivalent: true,
    enable_explosion_hazard: true,
  });

  // New Course Form State
  const [newCourseForm, setNewCourseForm] = useState({
    title: "",
    domain_name: "",
    difficulty: "INTERMEDIATE",
    description: "",
  });

  // New Lesson Form State
  const [newLessonForm, setNewLessonForm] = useState({
    course_id: "",
    title: "",
    summary: "",
    reading_time_minutes: 10,
  });
  const [lessonFile, setLessonFile] = useState(null); // Yuklash uchun fayl
  const [lessonFileDrag, setLessonFileDrag] = useState(false);
  const lessonFileInputRef = useRef(null);

  // New Group Form State
  const [newGroupForm, setNewGroupForm] = useState({
    name: "",
    course_name: "Molekulyar Biologiya va Hujayra Genetikasi",
    schedule: "Dush / Chor / Juma • 16:00",
    max_students: 20,
  });

  // New Student Form State
  const [newStudentForm, setNewStudentForm] = useState({
    name: "",
    email: "",
  });

  // Success Notification banner
  const [toastMessage, setToastMessage] = useState("");

  function triggerToast(msg) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  }

  // Fetch all mentor data from Backend APIs
  async function fetchMentorData() {
    try {
      const [coursesRes, lessonsRes, groupsRes, domainsRes, userRes] =
        await Promise.allSettled([
          api.get("curriculum/courses/"),
          api.get("curriculum/lessons/"),
          api.get("curriculum/groups/"),
          api.get("curriculum/domains/"),
          api.get("user/me/"),
        ]);

      if (coursesRes.status === "fulfilled" && coursesRes.value.data) {
        const list = Array.isArray(coursesRes.value.data)
          ? coursesRes.value.data
          : coursesRes.value.data?.results || [];
        setCourses(list);
        if (list.length > 0 && !newLessonForm.course_id) {
          setNewLessonForm((prev) => ({ ...prev, course_id: list[0].id }));
        }
        setSelectedCourse((prev) => {
          if (!prev) return null;
          return list.find((c) => c.id === prev.id) || prev;
        });
      }

      if (lessonsRes.status === "fulfilled" && lessonsRes.value.data) {
        const list = Array.isArray(lessonsRes.value.data)
          ? lessonsRes.value.data
          : lessonsRes.value.data?.results || [];
        setLessons(list);
      }

      if (groupsRes.status === "fulfilled" && groupsRes.value.data) {
        const list = Array.isArray(groupsRes.value.data)
          ? groupsRes.value.data
          : groupsRes.value.data?.results || [];
        setGroups(list);
      }

      if (domainsRes.status === "fulfilled" && domainsRes.value.data) {
        const list = Array.isArray(domainsRes.value.data)
          ? domainsRes.value.data
          : domainsRes.value.data?.results || [];
        setDomains(list);
        if (list.length > 0) {
          setNewCourseForm((prev) => ({
            ...prev,
            domain_name: prev.domain_name || list[0].name,
          }));
        }
      }

      if (userRes.status === "fulfilled" && userRes.value.data) {
        setCurrentUser(userRes.value.data);
      }
    } catch (err) {
      console.error("Failed to load mentor data:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMentorData();
  }, []);

  // 1. Handle Create Course
  async function handleCreateCourse(e) {
    e.preventDefault();
    if (!newCourseForm.title.trim()) return;
    if (!newCourseForm.domain_name.trim()) {
      alert("Iltimos, fanni kiriting yoki tanlang.");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("curriculum/courses/", {
        title: newCourseForm.title.trim(),
        domain_name: newCourseForm.domain_name.trim(),
        difficulty: newCourseForm.difficulty,
        description: newCourseForm.description.trim(),
      });

      triggerToast(`"${newCourseForm.title}" kursi muvaffaqiyatli yaratildi va barcha talabalar uchun e'lon qilindi!`);
      setShowCreateCourseModal(false);
      setNewCourseForm({
        title: "",
        domain_name: domains[0]?.name || "",
        difficulty: "INTERMEDIATE",
        description: "",
      });
      await fetchMentorData();
    } catch (err) {
      console.error("Create course error:", err);
      const msg =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        "Kurs yaratishda xatolik yuz berdi. Iltimos qaytadan urining.";
      alert(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setSubmitting(false);
    }
  }

  // 2. Handle Create Lesson
  async function handleCreateLesson(e) {
    e.preventDefault();
    if (!newLessonForm.title) return;
    setSubmitting(true);
    try {
<<<<<<< Updated upstream
      await api.post("curriculum/lessons/", {
        course_id: newLessonForm.course_id || (courses[0] ? courses[0].id : undefined),
        title: newLessonForm.title,
        summary: newLessonForm.summary,
        reading_time_minutes: Number(newLessonForm.reading_time_minutes) || 10,
=======
      // FormData — fayl bilan birga yuborish
      const formData = new FormData();
      formData.append("course_id", newLessonForm.course_id || (courses[0] ? courses[0].id : ""));
      formData.append("title", newLessonForm.title);
      formData.append("summary", newLessonForm.summary || "");
      formData.append("reading_time_minutes", String(Number(newLessonForm.reading_time_minutes) || 10));
      if (lessonFile) {
        formData.append("attachment", lessonFile);
      }

      const res = await api.post("curriculum/lessons/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
>>>>>>> Stashed changes
      });

      triggerToast(`"${newLessonForm.title}" mavzusi muvaffaqiyatli qo'shildi!${lessonFile ? " Fayl ham yuklandi." : ""}`);
      setShowCreateLessonModal(false);
      setLessonFile(null);
      setNewLessonForm({
        course_id: courses[0]?.id || "",
        title: "",
        summary: "",
        reading_time_minutes: 10,
      });
      await fetchMentorData();
    } catch (err) {
      console.error("Create lesson error:", err);
      const msg = err.response?.data?.attachment?.[0] || err.response?.data?.detail || "Dars qo'shishda xatolik yuz berdi.";
      alert(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setSubmitting(false);
    }
  }

  // 2.1 Handle AI Simulation Room Generator
  async function handleGenerateSimulation(e) {
    if (e) e.preventDefault();
    if (!generateSimForm.course_id) {
      alert("Iltimos, avval kursni tanlang.");
      return;
    }
    setGeneratingSim(true);
    try {
      const chemistryInstructions = generateSimForm.room_style === "CHEMISTRY_LAB" || generateSimForm.subject_category === "NATURAL_SCIENCE"
        ? `\n[KIMYO REAKSIYA & EKVIVALENT TALABLARI]:\n- Maqsad qilingan to'g'ri reaksiya: ${generateSimForm.target_reaction || 'HCl + NaOH -> NaCl + H2O'}\n- Talab qilinadigan ekvivalent nisbati: ${generateSimForm.required_equivalent_ratio || '1:1 ekvivalent'}\n- Xavfli/noto'g'ri moddalar (masalan, Hg + O2 yoki noto'g'ri aralashma) aralashtirilsa PORTLASH (explosion) effekti sodir bo'lishi: ${generateSimForm.enable_explosion_hazard ? 'HA (PORTLASH XAVFI BOR)' : 'YOQ'}\n- O'quvchidan miqdor (mol) va ekvivalent so'ralishi: ${generateSimForm.ask_quantity_and_equivalent ? 'HA' : 'YOQ'}`
        : "";

      const res = await api.post("simulations/generate-case/", {
        course_id: generateSimForm.course_id,
        lesson_id: generateSimForm.lesson_id || null,
        room_style: generateSimForm.room_style || "CUSTOM",
        expected_duration_minutes: Number(generateSimForm.expected_duration_minutes) || 15,
        max_participants: Number(generateSimForm.max_participants) || 4,
        passing_score: Number(generateSimForm.passing_score) || 70,
        lesson_material_text: generateSimForm.lesson_material_text || "",
        custom_instructions: `${generateSimForm.custom_instructions || ""}${chemistryInstructions}`,
        reaction_rules: {
          target_reaction: generateSimForm.target_reaction,
          required_equivalent_ratio: generateSimForm.required_equivalent_ratio,
          enable_explosion_hazard: generateSimForm.enable_explosion_hazard,
          ask_quantity_and_equivalent: generateSimForm.ask_quantity_and_equivalent,
        }
      });

      const caseData = res.data?.data?.case;
      const roomData = res.data?.data?.room;
      const inviteUrl = `${window.location.origin}/simulation?roomId=${roomData?.id || ''}&caseId=${caseData?.id || ''}`;

      triggerToast(`AI Simulyator "${caseData?.title || 'Xona'}" muvaffaqiyatli yaratildi!`);
      setShowGenerateSimModal(false);
      await fetchMentorData();

      setCreatedInviteModalData({
        case: caseData,
        room: roomData,
        inviteUrl: inviteUrl,
      });
    } catch (err) {
      console.error("Generate simulation error:", err);
      const msg = err.response?.data?.error?.message || err.response?.data?.detail || "AI Simulyator yaratishda xatolik yuz berdi.";
      alert(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setGeneratingSim(false);
    }
  }

  // 3. Handle Create Chronous Study Group
  async function handleCreateGroup(e) {
    e.preventDefault();
    if (!newGroupForm.name) return;
    setSubmitting(true);
    try {
      const res = await api.post("curriculum/groups/", {
        name: newGroupForm.name,
        course_name: newGroupForm.course_name,
        schedule: newGroupForm.schedule,
        max_students: Number(newGroupForm.max_students) || 20,
      });

      setGroups([res.data, ...groups]);
      triggerToast(`"${newGroupForm.name}" guruhi muvaffaqiyatli yaratildi!`);
      setShowCreateGroupModal(false);
      setNewGroupForm({
        name: "",
        course_name: courses[0]?.title || "Molekulyar Biologiya va Hujayra Genetikasi",
        schedule: "Dush / Chor / Juma • 16:00",
        max_students: 20,
      });
    } catch (err) {
      console.error("Create group error:", err);
      alert("Guruh yaratishda xatolik yuz berdi.");
    } finally {
      setSubmitting(false);
    }
  }

  // 4. Handle Add Student to Group
  async function handleAddStudent(e) {
    e.preventDefault();
    if (!newStudentForm.name || !selectedGroupForStudent) return;
    setSubmitting(true);
    try {
      const res = await api.post(
        `curriculum/groups/${selectedGroupForStudent.id}/students/`,
        {
          name: newStudentForm.name,
          email: newStudentForm.email,
        }
      );

      const addedStudent = res.data;
      setGroups(
        groups.map((grp) => {
          if (grp.id === selectedGroupForStudent.id) {
            return {
              ...grp,
              students: [addedStudent, ...(grp.students || [])],
            };
          }
          return grp;
        })
      );

      triggerToast(`${newStudentForm.name} guruhga muvaffaqiyatli biriktirildi!`);
      setShowAddStudentModal(false);
      setNewStudentForm({ name: "", email: "" });
    } catch (err) {
      console.error("Add student error:", err);
      alert("Talaba qo'shishda xatolik yuz berdi.");
    } finally {
      setSubmitting(false);
    }
  }

  // 5. Handle Delete Group
  async function handleDeleteGroup(groupId) {
    if (!window.confirm("Haqiqatdan ham ushbu Chronous guruhni o'chirmoqchimisiz?")) {
      return;
    }
    try {
      await api.delete(`curriculum/groups/${groupId}/`);
      setGroups(groups.filter((g) => g.id !== groupId));
      triggerToast("Guruh muvaffaqiyatli o'chirildi.");
    } catch (err) {
      console.error("Delete group error:", err);
      alert("Guruhni o'chirishda xatolik yuz berdi.");
    }
  }

  // 6. Handle Delete Student
  async function handleDeleteStudent(groupId, studentId) {
    if (!window.confirm("Ushbu talabani guruhdan o'chirmoqchimisiz?")) return;
    try {
      await api.delete(`curriculum/groups/${groupId}/students/${studentId}/`);
      setGroups(
        groups.map((grp) => {
          if (grp.id === groupId) {
            return {
              ...grp,
              students: (grp.students || []).filter((s) => s.id !== studentId),
            };
          }
          return grp;
        })
      );
      triggerToast("Talaba guruhdan o'chirildi.");
    } catch (err) {
      console.error("Delete student error:", err);
    }
  }

  // Calculated Stats
  const totalStudentsCount = groups.reduce(
    (acc, g) => acc + (Array.isArray(g.students) ? g.students.length : 0),
    0
  );

  return (
    <div className="min-h-screen bg-[var(--bg-void)] text-[var(--text-primary)] font-sans flex flex-col selection:bg-[var(--gold)]/20">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#120f0d] text-white px-5 py-3 rounded-2xl border border-[var(--gold)]/40 shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Check className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

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
              onClick={() => {
                setActiveTab("courses");
                setSelectedCourse(null);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "courses"
                  ? "bg-[#967b4f] text-white shadow-sm"
                  : "text-[#827161] hover:text-[#120f0d] hover:bg-[#967b4f]/10"
              }`}
            >
              <span>Kurslarim</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                  activeTab === "courses"
                    ? "bg-white/25 text-white"
                    : "bg-[#967b4f]/15 text-[#967b4f]"
                }`}
              >
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
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                  activeTab === "lessons"
                    ? "bg-white/25 text-white"
                    : "bg-[#967b4f]/15 text-[#967b4f]"
                }`}
              >
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
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                  activeTab === "groups"
                    ? "bg-white/25 text-white"
                    : "bg-[#967b4f]/15 text-[#967b4f]"
                }`}
              >
                {groups.length}
              </span>
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Button to Create AI Simulator */}
            <button
              onClick={() => {
                if (courses.length > 0 && !generateSimForm.course_id) {
                  setGenerateSimForm((prev) => ({ ...prev, course_id: courses[0].id }));
                }
                setShowGenerateSimModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-gradient-to-r from-amber-600 to-[#967b4f] hover:brightness-110 text-white text-xs font-bold shadow-md transition-all active:scale-95"
              title="Yangi AI Simulyator xonasi generatsiya qilish"
            >
              <Sparkles className="w-3.5 h-3.5 text-white" />
              <span className="hidden sm:inline">+ Simulyator Yaratish</span>
            </button>

            {/* Direct Link to AI Lab Simulator */}
            <Link
              to="/simulation"
              style={{ color: "#ffffff" }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#967b4f] hover:bg-[#806740] text-white text-xs font-bold shadow-md transition-all active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-white" />
              <span className="hidden sm:inline" style={{ color: "#ffffff" }}>
                AI Sahnalar
              </span>
            </Link>

            {/* Direct Link to Mentor CRM */}
            <a
              href="/mentor"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-[#967b4f]/35 bg-[#967b4f]/10 hover:bg-[#967b4f]/20 text-[#120f0d] text-xs font-bold transition-all shadow-sm active:scale-95 group"
              title="Mentorning CRM dagi boshqaruv paneliga o'tish"
            >
              <Building2 className="w-3.5 h-3.5 text-[#967b4f] group-hover:scale-110 transition-transform" />
              <span>Boshqaruvga o'tish</span>
              <ExternalLink className="w-3 h-3 text-[#967b4f] opacity-70" />
            </a>

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
                    {currentUser?.first_name
                      ? currentUser.first_name[0].toUpperCase()
                      : currentUser?.username?.slice(0, 2)?.toUpperCase() || "MN"}
                  </div>
                </div>

                <div className="flex-1 text-center sm:text-left space-y-2">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                    <span className="px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[var(--gold)]/15 text-[var(--gold)] border border-[var(--gold)]/25">
                      Akademik Mentor
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-serif font-black text-[var(--text-primary)]">
                    {currentUser?.first_name
                      ? `${currentUser.first_name} ${currentUser.last_name || ""}`.trim()
                      : currentUser?.username || "Mentor Ustoz"}
                  </h1>

                  <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed max-w-2xl">
                    {currentUser?.subject || "Chronous AI platformasida ta'lim beruvchi mentor."}
                  </p>

                  <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-[var(--text-muted)]">
                    <span>
                      Email:{" "}
                      <strong className="text-[var(--text-primary)]">
                        {currentUser?.email || ""}
                      </strong>
                    </span>
                    {currentUser?.id && (
                      <>
                        <span>•</span>
                        <span>
                          Tizimdagi ID:{" "}
                          <strong className="text-[var(--text-primary)]">
                            #{currentUser?.id || currentUser?.user_id}
                          </strong>
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* KPI Stat Cards (Live From Backend) */}
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
                    {totalStudentsCount} ta
                  </span>
                  <span className="text-[11px] text-[var(--text-muted)] font-semibold mt-0.5 block">
                    Chronous Talabalar
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-[var(--bg-void)]/70 border border-[var(--border-glass)] text-center">
                  <span className="text-2xl font-serif font-black text-emerald-600 block">
                    {courses.length > 0 ? "—" : "—"}
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
                    <div
                      key={g.id}
                      className="p-3 rounded-xl bg-[var(--bg-void)] flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-[var(--text-primary)]">{g.name}</div>
                        <div className="text-[11px] text-[var(--text-muted)]">
                          {(g.students || []).length} ta o'quvchi
                        </div>
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

                <a
                  href="/mentor"
                  className="w-full py-3 rounded-xl bg-[#967b4f] hover:bg-[#806740] text-white font-bold text-xs text-center shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Building2 className="w-4 h-4" />
                  <span>Haqiqiy CRM Sahifalariga O'tish</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* ===================== VIEW 2.1: SELECTED COURSE DETAIL & LESSONS ===================== */}
        {activeTab === "courses" && selectedCourse && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Top Navigation & Actions */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setSelectedCourse(null)}
                className="inline-flex items-center gap-2 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--gold)] transition-colors p-1.5 rounded-xl hover:bg-[var(--bg-void)] border border-transparent hover:border-[var(--border-glass)]"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Barcha kurslarimga qaytish</span>
              </button>

              <button
                onClick={() => {
                  setNewLessonForm((prev) => ({
                    ...prev,
                    course_id: selectedCourse.id,
                  }));
                  setShowCreateLessonModal(true);
                }}
                className="px-4 py-2 rounded-xl bg-[var(--gold)] text-white font-bold text-xs shadow-md hover:brightness-105 flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Ushbu Kursga Dars Qo'shish</span>
              </button>
            </div>

            {/* Course Header Banner */}
            <div className="lux-card !p-6 sm:!p-8 rounded-3xl bg-[var(--bg-panel)] border border-[var(--border-glass)] shadow-lg space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[var(--gold)]/15 text-[var(--gold)] border border-[var(--gold)]/20">
                    {selectedCourse.domain_name || "Akademik Fan"}
                  </span>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-500/10 px-2.5 py-0.5 rounded-md">
                    Holati: Faol (Ommaviy)
                  </span>
                </div>
                <span className="text-xs font-bold uppercase text-[var(--gold)]">
                  Daraja: {selectedCourse.difficulty || "O'RTA"}
                </span>
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl font-serif font-black text-[var(--text-primary)] leading-tight">
                  {selectedCourse.title}
                </h1>
                <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-2 leading-relaxed max-w-4xl">
                  {selectedCourse.description || "Ushbu kurs doirasida mavzuning fundamental nazariyasi va amaliy tahlili o'rganiladi."}
                </p>
              </div>

              {/* Course Meta Info */}
              <div className="pt-4 border-t border-[var(--border-glass)] flex flex-wrap items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-4 text-[var(--text-muted)]">
                  <span className="flex items-center gap-1.5 font-semibold text-[var(--text-primary)]">
                    <User className="w-4 h-4 text-[var(--gold)]" />
                    {selectedCourse.instructor_name || currentUser?.first_name || "Siz"}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-[var(--gold)]" />
                    {((lessons.filter((l) => l.course === selectedCourse.id || l.course_id === selectedCourse.id || l.course_title === selectedCourse.title).length) || (selectedCourse.lessons || []).length)} ta dars
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    {selectedCourse.simulations_count || 1} ta AI Keys
                  </span>
                </div>

                <Link
                  to={`/simulation?courseId=${selectedCourse.id}${selectedCourse.simulation_slug ? `&caseId=${selectedCourse.simulation_slug}` : ""}`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-900 hover:bg-amber-500/25 text-xs font-bold transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#967b4f]" />
                  <span>AI Simulyatsiyasini Ko'rish</span>
                </Link>
              </div>
            </div>

            {/* Course Lessons Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-serif font-bold text-[var(--text-primary)]">
                    Ushbu Kurs Darsliklari va Materiallari
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    Talabalar uchun yuklangan nazariy darslar, tushuntirishlar va laboratoriya materiallari.
                  </p>
                </div>
              </div>

              {(() => {
                const courseSpecificLessons = lessons.filter(
                  (l) => l.course === selectedCourse.id || l.course_id === selectedCourse.id || l.course_title === selectedCourse.title
                );
                const displayLessons = courseSpecificLessons.length > 0 
                  ? courseSpecificLessons 
                  : (Array.isArray(selectedCourse.lessons) ? selectedCourse.lessons : []);

                if (displayLessons.length === 0) {
                  return (
                    <div className="text-center py-14 lux-card rounded-3xl border border-[var(--border-glass)] bg-[var(--bg-panel)] shadow-sm">
                      <BookOpen className="w-10 h-10 text-[var(--gold)] mx-auto mb-3 opacity-60" />
                      <h4 className="font-serif font-bold text-base text-[var(--text-primary)]">
                        Ushbu kursda hali darsliklar mavjud emas
                      </h4>
                      <p className="text-xs text-[var(--text-muted)] mt-1 max-w-sm mx-auto mb-4">
                        Talabalar mustaqil o'rganishi uchun birinchi darslik materialini qo'shing.
                      </p>
                      <button
                        onClick={() => {
                          setNewLessonForm((prev) => ({
                            ...prev,
                            course_id: selectedCourse.id,
                          }));
                          setShowCreateLessonModal(true);
                        }}
                        className="px-4 py-2 rounded-xl bg-[var(--gold)] text-white font-bold text-xs shadow-md hover:brightness-105 inline-flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Birinchi Darsni Qo'shish</span>
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    {displayLessons.map((lesson, idx) => {
                      const isOpen = activeCourseLesson === lesson.id;
                      return (
                        <div
                          key={lesson.id}
                          className={`lux-card rounded-2xl border transition-all overflow-hidden ${
                            isOpen
                              ? "border-[var(--gold)] bg-white shadow-md"
                              : "border-[var(--border-glass)] bg-[var(--bg-panel)] hover:border-[var(--gold)]/40"
                          }`}
                        >
                          <div
                            onClick={() => setActiveCourseLesson(isOpen ? null : lesson.id)}
                            className="p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer"
                          >
                            <div className="flex items-center gap-3.5 min-w-0">
                              <div className="w-9 h-9 rounded-xl bg-[var(--gold)]/10 text-[var(--gold)] flex items-center justify-center font-bold text-xs shrink-0 border border-[var(--gold)]/20">
                                {idx + 1}
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-xs sm:text-sm font-bold text-[var(--text-primary)] truncate">
                                  {lesson.title}
                                </h4>
                                <div className="flex items-center gap-3 text-[11px] text-[var(--text-muted)] mt-0.5">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {lesson.reading_time_minutes || 10} daqiqa
                                  </span>
                                  <span>•</span>
                                  <span className="text-emerald-700 font-medium">Faol</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[11px] font-semibold text-[var(--gold)] hidden sm:inline">
                                {isOpen ? "Yopish" : "Ko'rish"}
                              </span>
                              <ChevronRight
                                className={`w-4 h-4 text-[var(--text-muted)] transition-transform duration-300 ${
                                  isOpen ? "rotate-90 text-[var(--gold)]" : ""
                                }`}
                              />
                            </div>
                          </div>

                          {isOpen && (
                            <div className="px-5 pb-5 pt-2 border-t border-[var(--border-glass)] bg-[var(--bg-void)]/40 space-y-3 animate-in fade-in">
                              {lesson.summary && (
                                <div>
                                  <span className="text-[11px] font-bold text-[var(--gold)] uppercase tracking-wider block mb-1">
                                    Qisqacha Mazmun:
                                  </span>
                                  <p className="text-xs text-[var(--text-primary)] leading-relaxed bg-white/70 p-3 rounded-xl border border-[var(--border-glass)]">
                                    {lesson.summary}
                                  </p>
                                </div>
                              )}

                              {lesson.content && (
                                <div>
                                  <span className="text-[11px] font-bold text-[var(--gold)] uppercase tracking-wider block mb-1">
                                    Darslik Matni / Nazariya:
                                  </span>
                                  <div className="text-xs text-[var(--text-muted)] leading-relaxed bg-white/70 p-3 rounded-xl border border-[var(--border-glass)] whitespace-pre-line font-mono text-[11px]">
                                    {lesson.content}
                                  </div>
                                </div>
                              )}

<<<<<<< Updated upstream
                              <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
=======
                              {/* Attachment fayl */}
                              {lesson.attachment_url && (
                                <div>
                                  <span className="text-[11px] font-bold text-[var(--gold)] uppercase tracking-wider block mb-1">
                                    Yuklangan Material:
                                  </span>
                                  <a
                                    href={lesson.attachment_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    download
                                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-[var(--gold)]/8 border border-[var(--gold)]/20 hover:bg-[var(--gold)]/15 transition-all group"
                                  >
                                    <div className="w-8 h-8 rounded-lg bg-[var(--gold)]/10 border border-[var(--gold)]/25 flex items-center justify-center shrink-0">
                                      {(lesson.attachment_name || lesson.attachment_url).match(/\.(jpg|jpeg|png)$/i) ? (
                                        <ImageIcon size={14} className="text-[var(--gold)]" />
                                      ) : (
                                        <FileText size={14} className="text-[var(--gold)]" />
                                      )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="text-[11px] font-bold text-[var(--text-primary)] truncate">
                                        {lesson.attachment_name || "Material yuklab olish"}
                                      </p>
                                      <p className="text-[10px] text-[var(--text-muted)]">Bosib yuklab oling</p>
                                    </div>
                                    <Download size={13} className="text-[var(--gold)] opacity-60 group-hover:opacity-100 shrink-0" />
                                  </a>
                                </div>
                              )}

                              <div className="flex items-center justify-between pt-2">
>>>>>>> Stashed changes
                                <span className="text-[11px] text-[var(--text-muted)]">
                                  Slug: <code className="text-[var(--gold)]">{lesson.slug}</code>
                                </span>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const dName = (selectedCourse?.domain_name || "").toLowerCase();
                                      const style = dName.includes("kimyo") ? "CHEMISTRY_LAB" : (dName.includes("sud") || dName.includes("huquq")) ? "COURTROOM" : dName.includes("tibbiy") ? "MEDICAL_ER" : dName.includes("kiber") ? "CYBER_DEFENSE" : "CUSTOM";
                                      setGenerateSimForm({
                                        course_id: selectedCourse.id,
                                        lesson_id: lesson.id,
                                        room_style: style,
                                        expected_duration_minutes: 15,
                                        max_participants: 4,
                                        passing_score: 80,
                                        lesson_material_text: lesson.content || lesson.summary || "",
                                        custom_instructions: "",
                                      });
                                      setShowGenerateSimModal(true);
                                    }}
                                    className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-600 to-[#967b4f] text-white hover:brightness-110 text-[11px] font-bold flex items-center gap-1.5 shadow-sm transition-all"
                                  >
                                    <Sparkles className="w-3.5 h-3.5" />
                                    <span>AI Simulyator Yaratish</span>
                                  </button>
                                  <Link
                                    to={`/simulation?courseId=${selectedCourse.id}&lessonId=${lesson.id}`}
                                    className="px-3 py-1.5 rounded-lg bg-amber-500/15 text-amber-900 hover:bg-amber-500/25 text-[11px] font-bold flex items-center gap-1.5 transition-all"
                                  >
                                    <span>Keyslar</span>
                                  </Link>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* ===================== VIEW 2.2: ALL COURSES GRID (WHEN NO COURSE SELECTED) ===================== */}
        {activeTab === "courses" && !selectedCourse && (
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
                onClick={() => setShowCreateCourseModal(true)}
                className="px-4 py-2 rounded-xl bg-[var(--gold)] text-white font-bold text-xs shadow-md hover:brightness-105 flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Yangi Kurs Yaratish</span>
              </button>
            </div>

            {courses.length === 0 ? (
              <div className="text-center py-16 lux-card rounded-3xl border border-[var(--border-glass)] bg-[var(--bg-panel)] shadow-sm">
                <BookOpen className="w-12 h-12 text-[var(--gold)] mx-auto mb-3 opacity-60" />
                <h3 className="font-serif font-bold text-lg text-[var(--text-primary)]">
                  Hozircha kurslar mavjud emas
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-1 max-w-sm mx-auto mb-5">
                  Yangi fan yo'nalishi va kurs yaratib, talabalarga bilim ulashishni boshlang!
                </p>
                <button
                  onClick={() => setShowCreateCourseModal(true)}
                  className="px-5 py-2.5 rounded-xl bg-[var(--gold)] text-white font-bold text-xs shadow-md hover:brightness-105 inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Birinchi Kursingizni Yarating</span>
                </button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-6">
                {courses.map((course) => {
                  const lessonsCount =
                    course.lessons_count ||
                    (Array.isArray(course.lessons) ? course.lessons.length : 0);

                  return (
                    <div
                      key={course.id}
                      onClick={() => setSelectedCourse(course)}
                      className="lux-card rounded-3xl p-6 border border-[var(--border-glass)] bg-[var(--bg-panel)] shadow-md space-y-4 flex flex-col justify-between cursor-pointer hover:border-[var(--gold)]/60 hover:shadow-xl transition-all group"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="px-3 py-0.5 rounded-full text-[10px] font-bold bg-[var(--gold)]/15 text-[var(--gold)]">
                            {course.domain_name || "Akademik Fan"}
                          </span>
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                            Faol
                          </span>
                        </div>

                        <h3 className="font-serif font-bold text-base text-[var(--text-primary)] group-hover:text-[var(--gold)] transition-colors">
                          {course.title}
                        </h3>
                        <p className="text-xs text-[var(--text-muted)] mt-1.5 leading-relaxed line-clamp-2">
                          {course.description || "Ushbu kurs bo'yicha darslar va AI laboratoriya keyslari tayyorlangan."}
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div className="pt-4 border-t border-[var(--border-glass)] grid grid-cols-3 gap-2 text-center text-xs text-[var(--text-muted)]">
                          <div>
                            <span className="font-bold text-[var(--text-primary)] block">
                              {lessonsCount} ta
                            </span>
                            <span className="text-[10px]">Darslar</span>
                          </div>
                          <div>
                            <span className="font-bold text-[var(--text-primary)] block">
                              {course.simulations_count || 1} ta
                            </span>
                            <span className="text-[10px]">AI Keyslar</span>
                          </div>
                          <div>
                            <span className="font-bold text-[var(--text-primary)] block uppercase text-[11px] text-[var(--gold)]">
                              {course.difficulty || "O'RTA"}
                            </span>
                            <span className="text-[10px]">Daraja</span>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-[var(--border-glass)] flex items-center justify-between text-xs font-bold text-[var(--gold)] group-hover:translate-x-1 transition-transform">
                          <span>Kurs ichiga kirish va darsliklar</span>
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
                onClick={() => setShowCreateLessonModal(true)}
                className="px-4 py-2 rounded-xl bg-[var(--gold)] text-white font-bold text-xs shadow-md hover:brightness-105 flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Dars Qo'shish</span>
              </button>
            </div>

            <div className="lux-card rounded-3xl border border-[var(--border-glass)] bg-[var(--bg-panel)] shadow-md overflow-hidden">
              <div className="divide-y divide-[var(--border-glass)]">
                {lessons.map((lesson, idx) => (
                  <div
                    key={lesson.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[var(--bg-void)]/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-[var(--gold)]/10 text-[var(--gold)] flex items-center justify-center font-bold text-xs shrink-0">
                        {idx + 1}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs sm:text-sm text-[var(--text-primary)] truncate">
                          {lesson.title}
                        </h4>
                        <div className="flex items-center gap-3 text-[11px] text-[var(--text-muted)] mt-0.5">
                          <span className="font-semibold text-[var(--gold)]">
                            {lesson.course_title || "Kurs Darsi"}
                          </span>
                          <span>•</span>
                          <span>{lesson.reading_time_minutes || 8} daqiqa</span>
                          <span>•</span>
                          <span className="font-semibold text-amber-800 bg-amber-500/10 px-2 py-0.5 rounded-md">
                            Nazariya & AI Keys
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] self-end sm:self-center">
                      <span className="text-[11px] text-emerald-600 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                        Bazada faol
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===================== VIEW 4: MENTOR'S CHRONOUS GROUPS & ENROLLED STUDENTS ===================== */}
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
                  Bu guruhlar filial kassa va refund tizimi (CRM) guruhlari bilan bir xil emas. Ular sizning mustaqil ilmiy kurslaringiz va AI simulyatsiya o'quvchilaringiz uchun to'liq backend bazasida saqlanadi.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-serif font-black text-[var(--text-primary)]">
                  Mening Chronous Guruhlarim va Shogirdlarim
                </h2>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Jami {groups.length} ta guruh va {totalStudentsCount} ta ro'yxatdan o'tgan talaba.
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

            {/* Groups Grid (Live from PostgreSQL DB) */}
            <div className="grid lg:grid-cols-2 gap-6">
              {groups.map((grp) => (
                <div
                  key={grp.id}
                  className="lux-card rounded-3xl p-6 border border-[var(--border-glass)] bg-[var(--bg-panel)] shadow-md flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-0.5 rounded-full text-[10px] font-bold bg-[var(--gold)]/15 text-[var(--gold)]">
                        {grp.course_name}
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
                        {(grp.students || []).length} / {grp.max_students || 20} talaba
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

                    {(!grp.students || grp.students.length === 0) ? (
                      <p className="text-xs text-[var(--text-muted)] py-3 text-center italic">
                        Bu guruhga hali talabalar biriktirilmagan.
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                        {grp.students.map((student) => (
                          <div
                            key={student.id}
                            className="p-2.5 rounded-xl bg-[var(--bg-void)]/60 border border-[var(--border-glass)] flex items-center justify-between text-xs group/item"
                          >
                            <div>
                              <div className="font-bold text-[var(--text-primary)]">
                                {student.name}
                              </div>
                              <div className="text-[10px] text-[var(--text-muted)]">
                                {student.email}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <span className="text-[10px] font-bold text-emerald-600 block">
                                  Baho: {student.ai_score || "95/100"}
                                </span>
                                <span className="text-[9px] text-[var(--text-muted)]">
                                  {student.progress || 80}% darslar
                                </span>
                              </div>
                              <button
                                onClick={() => handleDeleteStudent(grp.id, student.id)}
                                className="opacity-0 group-hover/item:opacity-100 text-gray-400 hover:text-rose-500 transition-opacity p-1"
                                title="Talabani o'chirish"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
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

      {/* ===================== MODAL 1: CREATE NEW COURSE ===================== */}
      {showCreateCourseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="lux-card !p-6 sm:!p-8 !bg-[var(--bg-panel)] w-full max-w-lg rounded-3xl border border-[var(--gold)]/30 shadow-2xl relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif font-black text-lg text-[var(--text-primary)]">
                Yangi Ta'lim Kursi Yaratish
              </h3>
              <button
                onClick={() => setShowCreateCourseModal(false)}
                className="text-gray-400 hover:text-[var(--text-primary)] text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[var(--text-muted)] mb-5">
              Yangi kurs yaratilgach, unga darslar va AI simulyatsiya keyslarini biriktirishingiz mumkin bo'ladi.
            </p>

            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[var(--text-muted)] block mb-1">
                  Kurs Nomi:
                </label>
                <input
                  required
                  type="text"
                  placeholder="Masalan: Kvant Fizikasi va Lazer Spektroskopiyasi"
                  value={newCourseForm.title}
                  onChange={(e) => setNewCourseForm({ ...newCourseForm, title: e.target.value })}
                  className="lux-input !py-2.5 !px-3.5 w-full text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--text-muted)] block mb-1">
                  Fan Yo'nalishi (Yangi fan yaratish yoki tanlash):
                </label>
                <div className="space-y-2">
                  <div className="relative">
                    <input
                      required
                      type="text"
                      list="existing-domains-list"
                      placeholder="Masalan: Kiberxavfsizlik, Kvant Fizikasi, Biotibbiyot..."
                      value={newCourseForm.domain_name}
                      onChange={(e) =>
                        setNewCourseForm({ ...newCourseForm, domain_name: e.target.value })
                      }
                      className="lux-input !py-2.5 !px-3.5 w-full text-xs"
                    />
                    <datalist id="existing-domains-list">
                      {domains.map((d) => (
                        <option key={d.id} value={d.name} />
                      ))}
                    </datalist>
                  </div>
                  {domains.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] text-[var(--text-muted)] font-medium">Mavjud fanlar:</span>
                      {domains.map((d) => (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => setNewCourseForm({ ...newCourseForm, domain_name: d.name })}
                          className={`text-[10px] px-2.5 py-1 rounded-lg border transition-all ${
                            newCourseForm.domain_name === d.name
                              ? "bg-[var(--gold)]/20 border-[var(--gold)] text-[var(--gold)] font-bold shadow-sm"
                              : "border-[var(--border-glass)] text-[var(--text-muted)] hover:border-[var(--gold)]/50 hover:bg-[var(--bg-void)]"
                          }`}
                        >
                          {d.name}
                        </button>
                      ))}
                    </div>
                  )}
                  <p className="text-[10px] text-[var(--text-muted)] italic">
                    💡 Agar yangi fan nomini kiritsangiz, u avtomatik tarzda tizimga qo'shiladi va barcha talabalar uchun global bo'ladi.
                  </p>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--text-muted)] block mb-1">
                  Murakkablik Darajasi:
                </label>
                <select
                  value={newCourseForm.difficulty}
                  onChange={(e) => setNewCourseForm({ ...newCourseForm, difficulty: e.target.value })}
                  className="lux-input !py-2.5 !px-3.5 w-full text-xs cursor-pointer"
                >
                  <option value="BEGINNER">Boshlang'ich (Beginner)</option>
                  <option value="INTERMEDIATE">O'rta (Intermediate)</option>
                  <option value="ADVANCED">Ilg'or (Advanced)</option>
                  <option value="EXPERT">Ekspert (Expert)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--text-muted)] block mb-1">
                  Kurs Tavsifi:
                </label>
                <textarea
                  rows={3}
                  placeholder="Kurs maqsadi va o'rganiladigan asosiy ilmiy jihatlar..."
                  value={newCourseForm.description}
                  onChange={(e) => setNewCourseForm({ ...newCourseForm, description: e.target.value })}
                  className="lux-input !py-2.5 !px-3.5 w-full text-xs"
                />
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateCourseModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[var(--border-glass)] text-xs font-bold text-[var(--text-muted)] hover:bg-[var(--bg-void)]"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-[var(--gold)] text-white text-xs font-bold shadow-md hover:brightness-105 disabled:opacity-50"
                >
                  {submitting ? "Yaratilmoqda..." : "Kursni Saqlash"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL 2: ADD LESSON ===================== */}
      {showCreateLessonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="lux-card !p-6 sm:!p-8 !bg-[var(--bg-panel)] w-full max-w-xl rounded-3xl border border-[var(--gold)]/30 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-serif font-black text-lg text-[var(--text-primary)]">Yangi Darslik Qo'shish</h3>
                <p className="text-[10px] text-[var(--text-muted)] mt-0.5">PDF, DOCX, JPG, PNG fayl yuklash mumkin (max 20MB)</p>
              </div>
              <button
                onClick={() => { setShowCreateLessonModal(false); setLessonFile(null); }}
                className="text-gray-400 hover:text-[var(--text-primary)] text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateLesson} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[var(--text-muted)] block mb-1">
                  Qaysi Kursga Qo'shilsin?
                </label>
                <select
                  value={newLessonForm.course_id}
                  onChange={(e) => setNewLessonForm({ ...newLessonForm, course_id: e.target.value })}
                  className="lux-input !py-2.5 !px-3.5 w-full text-xs cursor-pointer"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--text-muted)] block mb-1">
                  Dars Mavzusi:
                </label>
                <input
                  required
                  type="text"
                  placeholder="Masalan: Foton impulsi va Kompton effekti"
                  value={newLessonForm.title}
                  onChange={(e) => setNewLessonForm({ ...newLessonForm, title: e.target.value })}
                  className="lux-input !py-2.5 !px-3.5 w-full text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--text-muted)] block mb-1">
                  O'qish / O'zlashtirish Vaqti (daqiqa):
                </label>
                <input
                  type="number"
                  min="3"
                  max="120"
                  value={newLessonForm.reading_time_minutes}
                  onChange={(e) => setNewLessonForm({ ...newLessonForm, reading_time_minutes: e.target.value })}
                  className="lux-input !py-2.5 !px-3.5 w-full text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--text-muted)] block mb-1">
                  Qisqacha Mazmuni va Keys:
                </label>
                <textarea
                  rows={3}
                  placeholder="Mavzuning nazariy tushuntirishi va talaba hal qilishi kerak bo'lgan masalalar..."
                  value={newLessonForm.summary}
                  onChange={(e) => setNewLessonForm({ ...newLessonForm, summary: e.target.value })}
                  className="lux-input !py-2.5 !px-3.5 w-full text-xs"
                />
              </div>

              {/* ─── FAYL YUKLASH ─────────────────────────────────────────── */}
              <div>
                <label className="text-xs font-bold text-[var(--text-muted)] block mb-2">
                  Qo'shimcha Material (ixtiyoriy):
                </label>

                {/* Drop Zone */}
                <div
                  onClick={() => lessonFileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setLessonFileDrag(true); }}
                  onDragLeave={() => setLessonFileDrag(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setLessonFileDrag(false);
                    const file = e.dataTransfer.files[0];
                    if (file) {
                      const allowed = ['.pdf', '.docx', '.doc', '.jpg', '.jpeg', '.png'];
                      const ext = '.' + file.name.split('.').pop().toLowerCase();
                      if (!allowed.includes(ext)) {
                        alert(`Ruxsat etilmagan format. Faqat: ${allowed.join(', ')}`);
                        return;
                      }
                      if (file.size > 20 * 1024 * 1024) {
                        alert('Fayl hajmi 20MB dan oshmasligi kerak.');
                        return;
                      }
                      setLessonFile(file);
                    }
                  }}
                  className={`relative border-2 border-dashed rounded-2xl p-5 cursor-pointer transition-all text-center ${
                    lessonFileDrag
                      ? 'border-[var(--gold)] bg-[var(--gold)]/10'
                      : lessonFile
                        ? 'border-emerald-500/60 bg-emerald-500/5'
                        : 'border-[var(--border-glass)] hover:border-[var(--gold)]/50 bg-[var(--bg-void)]/40'
                  }`}
                >
                  <input
                    ref={lessonFileInputRef}
                    type="file"
                    accept=".pdf,.docx,.doc,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) setLessonFile(file);
                    }}
                  />

                  {lessonFile ? (
                    // Fayl tanlanganda preview
                    <div className="flex items-center gap-3 justify-center">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
                        {lessonFile.name.match(/\.(jpg|jpeg|png)$/i) ? (
                          <ImageIcon size={18} className="text-emerald-500" />
                        ) : (
                          <FileText size={18} className="text-emerald-500" />
                        )}
                      </div>
                      <div className="text-left min-w-0">
                        <p className="text-xs font-bold text-[var(--text-primary)] truncate max-w-[200px]">{lessonFile.name}</p>
                        <p className="text-[10px] text-emerald-600 font-semibold">
                          {(lessonFile.size / 1024).toFixed(0)} KB • Fayl tanlandi ✓
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setLessonFile(null); if(lessonFileInputRef.current) lessonFileInputRef.current.value = ''; }}
                        className="ml-auto text-red-400 hover:text-red-600 text-[10px] font-bold shrink-0"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    // Fayl tanlanmagan — drag & drop ko'rsatish
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-[var(--gold)]/10 border border-[var(--gold)]/25 flex items-center justify-center">
                        <Upload size={18} className="text-[var(--gold)]" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[var(--text-primary)]">Fayl yuklash uchun bosing yoki sudrab tashlang</p>
                        <p className="text-[10px] text-[var(--text-muted)] mt-0.5">PDF, DOCX, DOC, JPG, PNG • Max 20MB</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => { setShowCreateLessonModal(false); setLessonFile(null); }}
                  className="flex-1 py-2.5 rounded-xl border border-[var(--border-glass)] text-xs font-bold text-[var(--text-muted)] hover:bg-[var(--bg-void)]"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-[var(--gold)] text-white text-xs font-bold shadow-md hover:brightness-105 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <><span className="animate-spin">⟳</span> Saqlanmoqda...</>
                  ) : (
                    <><Paperclip size={13} /> Darsni Saqlash</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL 2.1: AI SIMULATOR ROOM GENERATOR ===================== */}
      {showGenerateSimModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in overflow-y-auto">
          <div className="lux-card !p-6 sm:!p-8 !bg-[var(--bg-panel)] w-full max-w-2xl rounded-3xl border border-amber-500/40 shadow-2xl relative my-8">
            <div className="flex items-center justify-between mb-4 border-b border-[var(--border-glass)] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-[#967b4f] p-2 flex items-center justify-center text-white shadow-md">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-black text-lg text-[var(--text-primary)]">
                    AI Simulyator Xonasi Yaratish
                  </h3>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Elektron darslik matni asosida interaktiv storyline, rollar va ilmiy reaksiyalar generatsiyasi
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowGenerateSimModal(false)}
                className="text-gray-400 hover:text-[var(--text-primary)] text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGenerateSimulation} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[var(--text-muted)] block mb-1">
                    Kurs:
                  </label>
                  <select
                    value={generateSimForm.course_id}
                    onChange={(e) => setGenerateSimForm({ ...generateSimForm, course_id: e.target.value })}
                    className="lux-input !py-2.5 !px-3.5 w-full text-xs cursor-pointer"
                  >
                    <option value="">Kursni tanlang...</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[var(--text-muted)] block mb-1">
                    Simulyator Xonasi Uslubi (Style):
                  </label>
                  <select
                    value={generateSimForm.room_style}
                    onChange={(e) => setGenerateSimForm({ ...generateSimForm, room_style: e.target.value })}
                    className="lux-input !py-2.5 !px-3.5 w-full text-xs cursor-pointer font-bold text-amber-900"
                  >
                    <option value="CHEMISTRY_LAB">🧪 Kimyo Laboratoriyasi (Reaksiyalar & Xavfsizlik)</option>
                    <option value="COURTROOM">⚖️ Sud Zali (Sudya, Prokuror, Advokat, Guvoh)</option>
                    <option value="MEDICAL_ER">🩺 Tibbiy Reanimatsiya (Jarroh, Shifokor)</option>
                    <option value="CYBER_DEFENSE">🛡️ Kiber-Xavfsizlik Markazi (SOC Tahlilchi)</option>
                    <option value="CUSTOM">🎭 Umumiy / Erkin Simulyatsiya</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-[var(--text-muted)] block mb-1">
                    Vaqt (daqiqa):
                  </label>
                  <input
                    type="number"
                    min="3"
                    max="120"
                    value={generateSimForm.expected_duration_minutes}
                    onChange={(e) => setGenerateSimForm({ ...generateSimForm, expected_duration_minutes: e.target.value })}
                    className="lux-input !py-2.5 !px-3 w-full text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[var(--text-muted)] block mb-1">
                    Maksimal Ball:
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    value={generateSimForm.passing_score}
                    onChange={(e) => setGenerateSimForm({ ...generateSimForm, passing_score: e.target.value })}
                    className="lux-input !py-2.5 !px-3 w-full text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[var(--text-muted)] block mb-1">
                    Xona Sig'imi (Rollar):
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={generateSimForm.max_participants}
                    onChange={(e) => setGenerateSimForm({ ...generateSimForm, max_participants: e.target.value })}
                    className="lux-input !py-2.5 !px-3 w-full text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-[var(--text-muted)]">
                    Darslikning Elektron Matni / Mavzu Tafsilotlari:
                  </label>
                  <span className="text-[10px] text-amber-700 font-bold bg-amber-500/10 px-2 py-0.5 rounded">
                    AI ushbu matndan hikoya va reaksiyalarni yaratadi
                  </span>
                </div>
                <textarea
                  rows={5}
                  placeholder="Dars matnini shu yerga kiriting yoki elektron darslikdan nusxa oling (Masalan kimyo bo'lsa: HCl kislotasi va NaOH reaksiyasi, hosil bo'ladigan tuzlar...)"
                  value={generateSimForm.lesson_material_text}
                  onChange={(e) => setGenerateSimForm({ ...generateSimForm, lesson_material_text: e.target.value })}
                  className="lux-input !py-2.5 !px-3.5 w-full text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--text-muted)] block mb-1">
                  AI Uchun Qo'shimcha Ko'rsatma (Ixtiyoriy):
                </label>
                <input
                  type="text"
                  placeholder="Masalan: Reagentlar xavfsizligiga ko'proq urg'u berilsin va kutilmagan favqulodda vaziyat qo'shilsin..."
                  value={generateSimForm.custom_instructions}
                  onChange={(e) => setGenerateSimForm({ ...generateSimForm, custom_instructions: e.target.value })}
                  className="lux-input !py-2.5 !px-3.5 w-full text-xs"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-amber-950">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>AI Avtomatik Tizim Kafolati:</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  1. Agar 1-xona to'lsa, yangi o'quvchilar uchun avtomatik tarzda yangi xonalar (Multi-Room) paydo bo'ladi.<br/>
                  2. Agar talabalar soni yetishmasa, AI bo'sh qolgan rollarni (masalan Prokuror yoki Tahlilchi) o'z zimmasiga oladi.<br/>
                  3. Kimyoviy moddalar qo'shilganda yoki sud dalillari kiritilganda AI reaksiya formulasi va effektini avtomatik chiqaradi.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowGenerateSimModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[var(--border-glass)] text-xs font-bold text-[var(--text-muted)] hover:bg-[var(--bg-void)]"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={generatingSim}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-600 via-[#967b4f] to-amber-700 text-white text-xs font-black shadow-lg shadow-amber-500/25 hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {generatingSim ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>AI Simulyator Yaratmoqda (OpenAI)...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Simulyatorni Generatsiya Qilish</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL 3: CREATE CHRONOUS GROUP ===================== */}
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
              Ushbu guruh sizning mustaqil o'quv dasturingiz va AI laboratoriyangiz uchun to'g'ridan-to'g'ri backend bazasida yaratiladi.
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
                  value={newGroupForm.course_name}
                  onChange={(e) => setNewGroupForm({ ...newGroupForm, course_name: e.target.value })}
                  className="lux-input !py-2.5 !px-3.5 w-full text-xs cursor-pointer"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.title}>
                      {c.title}
                    </option>
                  ))}
                  {courses.length === 0 && (
                    <option value="Molekulyar Biologiya va Hujayra Genetikasi">
                      Molekulyar Biologiya va Hujayra Genetikasi
                    </option>
                  )}
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
                  value={newGroupForm.max_students}
                  onChange={(e) => setNewGroupForm({ ...newGroupForm, max_students: e.target.value })}
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
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-[var(--gold)] text-white text-xs font-bold shadow-md hover:brightness-105 disabled:opacity-50"
                >
                  {submitting ? "Yaratilmoqda..." : "Guruhni Yaratish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL 4: ADD STUDENT TO GROUP ===================== */}
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
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-[var(--gold)] text-white text-xs font-bold shadow-md hover:brightness-105 disabled:opacity-50"
                >
                  {submitting ? "Qo'shilmoqda..." : "Qo'shish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL 5: GENERATE AI SIMULATOR (WITH SUBJECT CATEGORY) ===================== */}
      {showGenerateSimModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in overflow-y-auto">
          <div className="lux-card !p-6 sm:!p-8 !bg-[var(--bg-panel)] w-full max-w-xl rounded-3xl border border-[var(--gold)]/40 shadow-2xl relative my-8">
            <div className="flex items-center justify-between mb-4 border-b border-[var(--border-glass)] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-[#967b4f] flex items-center justify-center text-white shadow-md">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-serif font-black text-base sm:text-lg text-[var(--text-primary)]">
                    AI Simulyator Yaratish
                  </h3>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Darslik matnidan to'liq o'yin sahnasi va interaktiv tajriba yaratish
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowGenerateSimModal(false)}
                className="text-gray-400 hover:text-[var(--text-primary)] p-1.5 rounded-full hover:bg-[var(--bg-void)]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGenerateSimulation} className="space-y-4 text-xs">
              {/* 1. Kurs va Darslik Tanlash */}
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[var(--text-muted)] block mb-1">
                    Tegishli O'quv Kursi: *
                  </label>
                  <select
                    required
                    value={generateSimForm.course_id}
                    onChange={(e) => {
                      const cId = e.target.value;
                      setGenerateSimForm({
                        ...generateSimForm,
                        course_id: cId,
                        lesson_id: "",
                      });
                    }}
                    className="lux-input !py-2.5 !px-3 w-full text-xs font-semibold"
                  >
                    <option value="">-- Kursni tanlang --</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[var(--text-muted)] block mb-1">
                    Darslik / Mavzu (ixtiyoriy):
                  </label>
                  <select
                    value={generateSimForm.lesson_id}
                    onChange={(e) => {
                      const lId = e.target.value;
                      const lessonObj = lessons.find((l) => l.id === lId);
                      setGenerateSimForm({
                        ...generateSimForm,
                        lesson_id: lId,
                        lesson_material_text: lessonObj?.summary || generateSimForm.lesson_material_text,
                      });
                    }}
                    className="lux-input !py-2.5 !px-3 w-full text-xs font-semibold"
                  >
                    <option value="">-- Kurs bo'yicha umumiy keys --</option>
                    {lessons
                      .filter((l) => !generateSimForm.course_id || l.course === generateSimForm.course_id || l.course_id === generateSimForm.course_id)
                      .map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.title}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* 2. Fan Yo'nalishi / Bo'limi (User Explicit Request!) */}
              <div>
                <label className="font-bold text-[var(--text-muted)] block mb-1.5">
                  Fan Yo'nalishi va Simulyator Turi: *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    {
                      id: "NATURAL_SCIENCE",
                      style: "CHEMISTRY_LAB",
                      title: "Tabiiy Fanlar",
                      desc: "Kimyo, Biologiya, Fizika",
                      icon: FlaskConical,
                      color: "border-amber-500/50 bg-amber-500/10 text-amber-900",
                    },
                    {
                      id: "EXACT_SCIENCE",
                      style: "CYBER_DEFENSE",
                      title: "Aniq Fanlar",
                      desc: "Kiber, Algoritm, Shifr",
                      icon: ShieldCheck,
                      color: "border-emerald-500/50 bg-emerald-500/10 text-emerald-900",
                    },
                    {
                      id: "HUMANITIES",
                      style: "COURTROOM",
                      title: "Gumanitar Fanlar",
                      desc: "Sud zali, Huquq, Tarix",
                      icon: Scale,
                      color: "border-indigo-500/50 bg-indigo-500/10 text-indigo-900",
                    },
                    {
                      id: "MEDICAL",
                      style: "MEDICAL_ER",
                      title: "Tibbiyot Fanlari",
                      desc: "Klinik tashxis, Yordam",
                      icon: Activity,
                      color: "border-rose-500/50 bg-rose-500/10 text-rose-900",
                    },
                  ].map((cat) => {
                    const isSelected = generateSimForm.room_style === cat.style;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setGenerateSimForm({
                            ...generateSimForm,
                            subject_category: cat.id,
                            room_style: cat.style,
                          });
                        }}
                        className={`p-2.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                          isSelected
                            ? "border-[var(--gold)] ring-2 ring-[var(--gold)]/40 bg-[var(--gold)]/15 shadow-md"
                            : "border-[var(--border-glass)] hover:border-[var(--gold)]/40 bg-[var(--bg-void)] opacity-80"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          {React.createElement(cat.icon, { className: "w-4 h-4 text-[var(--gold)]" })}
                          {isSelected && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
                        </div>
                        <div className="font-bold text-[11px] text-[var(--text-primary)] leading-tight">
                          {cat.title}
                        </div>
                        <div className="text-[9px] text-[var(--text-muted)] mt-0.5">
                          {cat.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2.1 Aniq Fan / Tabiiy Fan (Kimyo) Sinov Natija & Mendeleyev Jadvali Sozlamalari */}
              {(generateSimForm.room_style === "CHEMISTRY_LAB" ||
                generateSimForm.subject_category === "NATURAL_SCIENCE" ||
                generateSimForm.subject_category === "EXACT_SCIENCE") && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Atom className="w-4 h-4 text-amber-500 animate-spin-slow" />
                      <span className="font-bold text-xs text-[var(--gold)]">
                        Kimyoviy Reaksiya & Mendeleyev Jadvali Sinovi
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPeriodicTable(true)}
                      className="px-2.5 py-1 rounded-xl bg-amber-500/25 hover:bg-amber-500/40 text-amber-900 font-black text-[11px] border border-amber-500/40 flex items-center gap-1.5 transition-all shadow-sm"
                    >
                      <Atom className="w-3.5 h-3.5" />
                      <span>🧪 Mendeleyev Jadvalini Ko'rish</span>
                    </button>
                  </div>

                  {/* Reaksiya Formula Quruvchisi va Boshqaruv Tugmalari */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-[11px] text-[var(--text-muted)] block">
                        To'g'ri Reaksiya / Kutilgan Moddalar Formulasi: *
                      </label>
                      <div className="flex items-center gap-1 text-[10px]">
                        <button
                          type="button"
                          onClick={() => {
                            setGenerateSimForm((prev) => {
                              const cur = (prev.target_reaction || "").trim();
                              if (!cur) return prev;
                              return { ...prev, target_reaction: `${cur} + ` };
                            });
                          }}
                          className="px-2 py-0.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/40 text-amber-900 dark:text-amber-300 font-black border border-amber-500/30"
                        >
                          + Qo'shish
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setGenerateSimForm((prev) => {
                              const cur = (prev.target_reaction || "").trim();
                              if (!cur) return prev;
                              return { ...prev, target_reaction: `${cur} ➔ ` };
                            });
                          }}
                          className="px-2 py-0.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/40 text-amber-900 dark:text-amber-300 font-black border border-amber-500/30"
                        >
                          ➔ Natija
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setGenerateSimForm((prev) => {
                              const cur = (prev.target_reaction || "").trim();
                              if (!cur) return prev;
                              const parts = cur.split(" ");
                              parts.pop();
                              return { ...prev, target_reaction: parts.join(" ") };
                            });
                          }}
                          className="px-2 py-0.5 rounded-lg bg-gray-500/20 hover:bg-gray-500/30 text-gray-700 dark:text-gray-300 font-bold border border-gray-500/30"
                        >
                          ⌫
                        </button>
                        <button
                          type="button"
                          onClick={() => setGenerateSimForm({ ...generateSimForm, target_reaction: "" })}
                          className="px-2 py-0.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-700 dark:text-red-300 font-bold border border-red-500/30"
                        >
                          Tozalash
                        </button>
                      </div>
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Elementlar yoki tayyor moddalarni bosib tanlang (masalan: HCl + NaOH ➔ NaCl + H2O)..."
                        value={generateSimForm.target_reaction}
                        onChange={(e) =>
                          setGenerateSimForm({
                            ...generateSimForm,
                            target_reaction: e.target.value,
                          })
                        }
                        className="lux-input !py-2 !px-3 w-full text-xs font-mono font-bold tracking-wide"
                      />
                    </div>

                    {/* Tezkor namunalar */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                      <span className="text-[var(--text-muted)] font-semibold">Namunalar:</span>
                      {[
                        { title: "HCl + NaOH ➔ NaCl + H2O", label: "Kislota + Ishqor" },
                        { title: "Hg + O2 ➔ 2HgO", label: "Simob + Kislorod (Portlash)" },
                        { title: "Zn + 2HCl ➔ ZnCl2 + H2", label: "Rux + Kislota" },
                        { title: "2H2O2 ➔ 2H2O + O2", label: "Peroksid parchalanishi" },
                      ].map((item) => (
                        <button
                          key={item.title}
                          type="button"
                          onClick={() => setGenerateSimForm({ ...generateSimForm, target_reaction: item.title })}
                          className="px-2 py-0.5 rounded-md bg-[var(--bg-void)] hover:bg-amber-500/20 text-[var(--text-muted)] hover:text-amber-900 dark:hover:text-amber-300 border border-[var(--border-glass)] transition-all font-mono"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>

                    {/* MENDELEYEV DAVRIY JADVALI - INTERAKTIV ELEMENT TANLASH */}
                    <div className="mt-2.5 p-2.5 rounded-xl bg-black/25 border border-amber-500/25 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <Atom className="w-3.5 h-3.5 text-amber-500" />
                          <span className="text-[11px] font-bold text-[var(--gold)]">
                            Mendeleyev Davriy Jadvali (Elementni bosib tanlang):
                          </span>
                        </div>

                        {/* Search in elements */}
                        <div className="relative">
                          <Search className="w-3 h-3 absolute left-2 top-2 text-[var(--text-muted)]" />
                          <input
                            type="text"
                            placeholder="Element qidirish (Hg, O, Na, Fe, H)..."
                            value={mendeleyevSearch}
                            onChange={(e) => setMendeleyevSearch(e.target.value)}
                            className="lux-input !py-1 !pl-7 !pr-2 text-[10px] w-48 rounded-lg"
                          />
                        </div>
                      </div>

                      {/* Filter toifasi */}
                      <div className="flex flex-wrap gap-1 text-[10px]">
                        {[
                          { id: "all", label: "Barcha Elementlar" },
                          { id: "compounds", label: "🧪 Tayyor Moddalar (HCl, NaOH...)" },
                          { id: "metal", label: "Metallar" },
                          { id: "nonmetal", label: "Nometallar" },
                          { id: "halogen", label: "Galogenlar" },
                          { id: "alkali", label: "Ishqoriy Metallar" },
                        ].map((tab) => (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setMendeleyevCategory(tab.id)}
                            className={`px-2 py-0.5 rounded-md border font-semibold transition-all ${
                              mendeleyevCategory === tab.id
                                ? "bg-amber-500/30 border-amber-500 text-amber-900 dark:text-amber-200"
                                : "bg-[var(--bg-void)] border-[var(--border-glass)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                            }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>

                      {/* Elementlar paneli */}
                      {mendeleyevCategory === "compounds" ? (
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 max-h-44 overflow-y-auto p-1">
                          {[
                            { formula: "HCl", name: "Xlorid kislota", type: "Kislota", color: "border-yellow-500/40 bg-yellow-500/10 text-yellow-800 dark:text-yellow-200" },
                            { formula: "NaOH", name: "Natriy ishqori", type: "Ishqor", color: "border-sky-500/40 bg-sky-500/10 text-sky-800 dark:text-sky-200" },
                            { formula: "H2SO4", name: "Sulfat kislota", type: "Kislota", color: "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-200" },
                            { formula: "HNO3", name: "Nitrat kislota", type: "Kislota", color: "border-orange-500/40 bg-orange-500/10 text-orange-800 dark:text-orange-200" },
                            { formula: "CuSO4", name: "Mis kuporosi", type: "Tuz", color: "border-cyan-500/40 bg-cyan-500/10 text-cyan-800 dark:text-cyan-200" },
                            { formula: "KMnO4", name: "Kaliy permanganat", type: "Oksidlovchi", color: "border-purple-500/40 bg-purple-500/10 text-purple-800 dark:text-purple-200" },
                            { formula: "H2O2", name: "Vodorod peroksid", type: "Peroksid", color: "border-rose-500/40 bg-rose-500/10 text-rose-800 dark:text-rose-200" },
                            { formula: "AgNO3", name: "Kumush nitrat", type: "Tuz", color: "border-slate-500/40 bg-slate-500/10 text-slate-800 dark:text-slate-200" },
                            { formula: "NaCl", name: "Osh tuzi", type: "Tuz", color: "border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200" },
                            { formula: "H2O", name: "Distillangan suv", type: "Erituvchi", color: "border-blue-500/40 bg-blue-500/10 text-blue-800 dark:text-blue-200" },
                          ].map((comp) => (
                            <button
                              key={comp.formula}
                              type="button"
                              onClick={() => {
                                setGenerateSimForm((prev) => {
                                  const cur = (prev.target_reaction || "").trim();
                                  if (!cur) return { ...prev, target_reaction: comp.formula };
                                  if (cur.endsWith("+") || cur.endsWith("➔") || cur.endsWith("->")) {
                                    return { ...prev, target_reaction: `${cur} ${comp.formula}` };
                                  }
                                  return { ...prev, target_reaction: `${cur} + ${comp.formula}` };
                                });
                                triggerToast(`"${comp.name} (${comp.formula})" reaksiya formulasiga qo'shildi!`);
                              }}
                              className={`p-2 rounded-xl border text-left transition-all hover:scale-[1.02] shadow-sm ${comp.color}`}
                            >
                              <div className="font-mono font-black text-xs">{comp.formula}</div>
                              <div className="text-[10px] truncate opacity-90">{comp.name}</div>
                              <div className="text-[8px] opacity-75">{comp.type}</div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-1.5 max-h-48 overflow-y-auto p-1">
                          {PERIODIC_ELEMENTS.filter((el) => {
                            const q = mendeleyevSearch.toLowerCase().trim();
                            const matchSearch =
                              !q ||
                              el.symbol.toLowerCase().includes(q) ||
                              el.name.toLowerCase().includes(q) ||
                              String(el.number).includes(q);
                            if (!matchSearch) return false;

                            if (mendeleyevCategory === "metal") {
                              return ["alkali", "alkaline", "transition", "post-transition"].includes(el.category);
                            }
                            if (mendeleyevCategory === "nonmetal") {
                              return ["nonmetal", "noble"].includes(el.category);
                            }
                            if (mendeleyevCategory === "halogen") {
                              return el.category === "halogen";
                            }
                            if (mendeleyevCategory === "alkali") {
                              return ["alkali", "alkaline"].includes(el.category);
                            }
                            return true;
                          }).map((el) => {
                            const catStyle = CATEGORY_COLORS[el.category] || {
                              bg: "bg-amber-500/10",
                              border: "border-amber-500/30",
                              text: "text-amber-800 dark:text-amber-300",
                            };
                            return (
                              <button
                                key={el.number}
                                type="button"
                                onClick={() => {
                                  setGenerateSimForm((prev) => {
                                    const cur = (prev.target_reaction || "").trim();
                                    if (!cur) return { ...prev, target_reaction: el.symbol };
                                    if (cur.endsWith("+") || cur.endsWith("➔") || cur.endsWith("->")) {
                                      return { ...prev, target_reaction: `${cur} ${el.symbol}` };
                                    }
                                    return { ...prev, target_reaction: `${cur} + ${el.symbol}` };
                                  });
                                  triggerToast(`"${el.name} (${el.symbol}) - ${el.valence}-valentli" qo'shildi!`);
                                }}
                                title={`${el.name} (${el.symbol})\nAtom raqami: ${el.number}\nMassasi: ${el.mass}\nValentligi: ${el.valence}\n${el.desc}`}
                                className={`p-1.5 rounded-xl border text-center transition-all hover:scale-105 hover:ring-2 hover:ring-amber-500/50 flex flex-col justify-between items-center ${catStyle.bg} ${catStyle.border} ${catStyle.text}`}
                              >
                                <div className="w-full flex items-center justify-between text-[8px] opacity-75 font-mono px-0.5">
                                  <span>#{el.number}</span>
                                  <span>v:{el.valence}</span>
                                </div>
                                <div className="font-mono font-black text-sm my-0.5 leading-none">
                                  {el.symbol}
                                </div>
                                <div className="text-[9px] font-semibold truncate max-w-full leading-tight">
                                  {el.name}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-2.5 pt-1">
                    <div>
                      <label className="font-bold text-[11px] text-[var(--text-muted)] block mb-1">
                        Talab qilinadigan Ekvivalent Nisbati:
                      </label>
                      <select
                        value={generateSimForm.required_equivalent_ratio}
                        onChange={(e) =>
                          setGenerateSimForm({
                            ...generateSimForm,
                            required_equivalent_ratio: e.target.value,
                          })
                        }
                        className="lux-input !py-2 !px-2.5 w-full text-xs font-semibold"
                      >
                        <option value="1:1 ekvivalent">1:1 ekvivalent (Stexiometrik tenglik)</option>
                        <option value="1:2 ekvivalent">1:2 ekvivalent (Asos/Kislota 2 karra)</option>
                        <option value="2:1 ekvivalent">2:1 ekvivalent (Kislota/Asos 2 karra)</option>
                        <option value="0.5 - 2.0 mol Ekvivalent">0.5 - 2.0 mol Ekvivalent doirasi</option>
                      </select>
                    </div>

                    <div className="flex flex-col justify-end">
                      <div className="text-[11px] text-[var(--text-muted)] bg-[var(--bg-void)] p-2 rounded-xl border border-[var(--border-glass)]">
                        <span className="font-bold text-[var(--gold)]">💡 Eslatma:</span> Yuqoridagi elementlarni bosganingizda, ular avtomatik formulaga ekvivalent va valentlik asosida birikadi.
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1 border-t border-amber-500/20">
                    <label className="flex items-center gap-2 cursor-pointer text-[11px] text-[var(--text-primary)] font-semibold">
                      <input
                        type="checkbox"
                        checked={generateSimForm.enable_explosion_hazard}
                        onChange={(e) =>
                          setGenerateSimForm({
                            ...generateSimForm,
                            enable_explosion_hazard: e.target.checked,
                          })
                        }
                        className="rounded border-amber-500/40 text-amber-500 focus:ring-amber-500"
                      />
                      <span>💥 Xato yoki xavfli modda qo'shilganda (masalan, Simob + Kislorod) ekranda Portlash va Ovozli effect bo'lsin</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-[11px] text-[var(--text-primary)] font-semibold">
                      <input
                        type="checkbox"
                        checked={generateSimForm.ask_quantity_and_equivalent}
                        onChange={(e) =>
                          setGenerateSimForm({
                            ...generateSimForm,
                            ask_quantity_and_equivalent: e.target.checked,
                          })
                        }
                        className="rounded border-amber-500/40 text-amber-500 focus:ring-amber-500"
                      />
                      <span>⚖️ O'quvchidan har bir modda uchun aniq Miqdor (mol) va Ekvivalent so'ralsin</span>
                    </label>
                  </div>
                </div>
              )}

              {/* 3. Parametrlar: Ishtirokchilar, Vaqt, Ball */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-[var(--text-muted)] block mb-1">
                    O'quvchilar soni:
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="10"
                    value={generateSimForm.max_participants}
                    onChange={(e) => setGenerateSimForm({ ...generateSimForm, max_participants: e.target.value })}
                    className="lux-input !py-2 !px-3 w-full text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-[var(--text-muted)] block mb-1">
                    Vaqt (daqiqa):
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="60"
                    value={generateSimForm.expected_duration_minutes}
                    onChange={(e) => setGenerateSimForm({ ...generateSimForm, expected_duration_minutes: e.target.value })}
                    className="lux-input !py-2 !px-3 w-full text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-[var(--text-muted)] block mb-1">
                    O'tish bali (%):
                  </label>
                  <input
                    type="number"
                    min="50"
                    max="100"
                    value={generateSimForm.passing_score}
                    onChange={(e) => setGenerateSimForm({ ...generateSimForm, passing_score: e.target.value })}
                    className="lux-input !py-2 !px-3 w-full text-xs font-semibold"
                  />
                </div>
              </div>

              {/* 4. O'tilgan Dars Materialining Elektron Varianti / Matni */}
              <div>
                <label className="font-bold text-[var(--text-muted)] block mb-1 flex items-center justify-between">
                  <span>Darslikning Elektron Matni / Konspekti: *</span>
                  <span className="text-[10px] text-[var(--gold)]">AI ushbu matndan hikoya va o'yin yaratadi</span>
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Masalan: 'Ushbu darsda kislota va asoslarning neytrallanish reaksiyasi, lakmus indikatori rangi o'zgarishi va vodorod ajralishi o'rganildi...'"
                  value={generateSimForm.lesson_material_text}
                  onChange={(e) => setGenerateSimForm({ ...generateSimForm, lesson_material_text: e.target.value })}
                  className="lux-input !py-2.5 !px-3.5 w-full text-xs leading-relaxed resize-none"
                />
              </div>

              {/* 5. Maxsus Ko'rsatmalar */}
              <div>
                <label className="font-bold text-[var(--text-muted)] block mb-1">
                  AI uchun Maxsus Ko'rsatmalar (ixtiyoriy):
                </label>
                <input
                  type="text"
                  placeholder="Masalan: Talabalarga xavfli moddalarni aralashtirishda ehtiyotkorlik talab etilsin"
                  value={generateSimForm.custom_instructions}
                  onChange={(e) => setGenerateSimForm({ ...generateSimForm, custom_instructions: e.target.value })}
                  className="lux-input !py-2 !px-3 w-full text-xs"
                />
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-[var(--border-glass)]">
                <button
                  type="button"
                  onClick={() => setShowGenerateSimModal(false)}
                  className="flex-1 py-3 rounded-xl border border-[var(--border-glass)] text-xs font-bold text-[var(--text-muted)] hover:bg-[var(--bg-void)]"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={generatingSim}
                  className="flex-2 py-3 px-6 rounded-xl bg-gradient-to-r from-amber-600 via-[#967b4f] to-amber-700 hover:brightness-110 text-white text-xs font-black shadow-lg shadow-amber-600/30 flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                >
                  {generatingSim ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>AI Ssenariy & Xonani Yaratmoqda...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>🚀 AI Simulyatorni Generatsiya Qilish</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mendeleyev Davriy Jadvali Modal (Ustoz uchun ko'rish va element tanlash) */}
      <PeriodicTableModal
        isOpen={showPeriodicTable}
        onClose={() => setShowPeriodicTable(false)}
        onSelectElement={(el) => {
          setGenerateSimForm((prev) => ({
            ...prev,
            target_reaction: prev.target_reaction
              ? `${prev.target_reaction} + ${el.symbol}`
              : el.symbol,
          }));
          triggerToast(`"${el.uz_name} (${el.symbol}) - ${el.valence}-valentli" reaksiya formulasiga kiritildi!`);
        }}
      />

      {/* ===================== MODAL 6: INVITE LINK POPUP (DARHOL TAKLIF LINKI) ===================== */}
      {createdInviteModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in zoom-in-95">
          <div className="lux-card !p-6 sm:!p-8 !bg-[var(--bg-panel)] w-full max-w-lg rounded-3xl border-2 border-[var(--gold)] shadow-2xl relative text-center space-y-5">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 via-[#967b4f] to-emerald-500 mx-auto flex items-center justify-center text-white shadow-xl shadow-amber-500/20 animate-bounce">
              <Sparkles className="w-8 h-8" />
            </div>

            <div>
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-800 border border-emerald-500/30">
                Xona Tayyor • #{createdInviteModalData.room?.room_number || 1}
              </span>
              <h3 className="font-serif font-black text-xl sm:text-2xl text-[var(--text-primary)] mt-2">
                Simulyator Xonasi Yaratildi!
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-1 max-w-md mx-auto">
                {createdInviteModalData.case?.title || "Interaktiv o'yin sahnasi"}
              </p>
            </div>

            {/* Invite URL Box */}
            <div className="p-4 rounded-2xl bg-[var(--bg-void)] border border-[var(--gold)]/40 text-left space-y-2">
              <label className="text-[11px] font-bold text-[var(--text-primary)] flex items-center justify-between">
                <span>🔗 O'quvchilar uchun Taklif Havolasi (Invite Link):</span>
                <span className="text-[10px] text-emerald-600 font-extrabold">To'g'ridan-to'g'ri kirish</span>
              </label>
              
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  type="text"
                  value={createdInviteModalData.inviteUrl}
                  className="bg-white/80 dark:bg-black/40 border border-[var(--border-glass)] rounded-xl px-3 py-2 text-xs font-mono w-full text-[var(--text-primary)] select-all"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(createdInviteModalData.inviteUrl);
                    setCopiedInvite(true);
                    setTimeout(() => setCopiedInvite(false), 3000);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 shadow-md ${
                    copiedInvite
                      ? "bg-emerald-600 text-white"
                      : "bg-[var(--gold)] hover:bg-[#806740] text-white"
                  }`}
                >
                  {copiedInvite ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Nusxalandi!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Nusxalash</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-[10px] text-[var(--text-muted)] italic">
                ℹ️ Ushbu havolani barcha o'quvchilarga yuboring. O'quvchilar havola orqali bosh sahifani qidirmasdan, to'g'ridan-to'g'ri o'yin xonasiga ulanadilar.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCreatedInviteModalData(null)}
                className="flex-1 py-3 rounded-xl border border-[var(--border-glass)] text-xs font-bold text-[var(--text-muted)] hover:bg-[var(--bg-void)]"
              >
                Dashboardda Qolish
              </button>
              
              <Link
                to={createdInviteModalData.inviteUrl.replace(window.location.origin, "")}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:brightness-110 text-white text-xs font-black shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Sahnaga Kirish</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
