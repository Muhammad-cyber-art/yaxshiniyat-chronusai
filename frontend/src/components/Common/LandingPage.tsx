import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BellRing,
  Building2,
  CalendarCheck,
  Coins,
  GraduationCap,
  Repeat,
  Send,
  ShieldCheck,
  Sparkles,
  Tags,
  Zap,
  Bot,
  Cpu,
  Scale,
  Terminal,
  Play,
  CheckCircle2,
  Trophy,
  BookOpen,
  Users,
  Target,
  BarChart3,
  Layers,
  Check
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import dashboard from "./dashboard-3d.png";

const spring = { type: "spring" as const, stiffness: 120, damping: 14 };
const pop = { type: "spring" as const, stiffness: 130, damping: 13 };

const pillars = [
  {
    icon: Building2,
    badge: "Boshqaruv",
    title: "Markaz Boshqaruvi (CRM/ERP)",
    tone: "text-amber-600",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    description: "Filiallar tarmog'i, kassa hisob-kitoblari, xodimlar maoshi, davomat va Telegram bot orqali ota-onalar bilan uzluksiz aloqa.",
    points: [
      "Ko'p filialli markazlarni yagona konsoldan boshqarish",
      "Kassa, to'lovlar va avtomatlashtirilgan refund algoritmi",
      "O'qituvchilar dars jadvallari va avtomatik oylik hisobi"
    ]
  },
  {
    icon: BookOpen,
    badge: "Akademik Ta'lim",
    title: "LMS va Ta'lim Dasturlari",
    tone: "text-emerald-600",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    description: "Strukturalangan darslar, nazorat testlari, uyga vazifalar va har bir talabaning o'zlashtirish dinamikasini kuzatuvchi kabinet.",
    points: [
      "Modul va darslar bo'yicha interaktiv o'quv dasturi",
      "Nazorat testlari va uy vazifalarini tekshirish",
      "Talabalarning davomati va o'zlashtirish reytingi"
    ]
  },
  {
    icon: Bot,
    badge: "AI Innovatsiya",
    title: "Chronos AI Simulyatsiya Lab",
    tone: "text-indigo-600",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/20",
    description: "Gemini 2.5 Flash va RAG bilimlar bazasi orqali real keyslar tahlili. Talabaning har bir qadami AI tomonidan baholanadi.",
    points: [
      "Kiberxavfsizlik, Huquq va Dasturlash real keyslari",
      "RAG embeddinglar asosida xatolarni tahlil qilish",
      "Interaktiv dialog, mahorat bali va tanga mukofotlari"
    ]
  }
];

const roles: { icon: LucideIcon; title: string; tone: string; ring: string; cardTint: string; items: string[] }[] = [
  {
    icon: ShieldCheck,
    title: "Super Admin",
    tone: "text-red-500",
    ring: "from-red-500/25 to-red-500/0",
    cardTint: "bg-red-50/80 border-red-200 shadow-red-500/5",
    items: [
      "Barcha filiallar va moliyaviy kassa ustidan global nazorat.",
      "Xodimlar, maoshlar va umumiy daromad analitikasi.",
      "Imtiyozli (Special) o'quvchilar global arxivi va AI tahlillari.",
    ],
  },
  {
    icon: Building2,
    title: "Admin / Filial",
    tone: "text-blue-500",
    ring: "from-blue-500/30 to-blue-500/0",
    cardTint: "bg-blue-50/80 border-blue-200 shadow-blue-500/5",
    items: [
      "O'ziga biriktirilgan markaz faoliyati va xonalari monitoringi.",
      "Guruhlar, to'lovlar va davomatni tezkor tekshirish.",
      "Filial xarajatlari (Expenses) va talabalar ro'yxati.",
    ],
  },
  {
    icon: GraduationCap,
    title: "Mentor / Ustoz",
    tone: "text-emerald-500",
    ring: "from-emerald-500/30 to-emerald-500/0",
    cardTint: "bg-emerald-50/80 border-emerald-200 shadow-emerald-500/5",
    items: [
      "O'z guruhlari ro'yxati, dars jadvallari va talabalar auditi.",
      "Uy vazifalarini baholash va AI simulyatsiya natijalarini ko'rish.",
      "O'zining maoshini va bonuslarini real vaqtda kuzatish.",
    ],
  },
];

const sampleCases = [
  {
    icon: ShieldCheck,
    tag: "Kiberxavfsizlik",
    title: "Fintech Bank Tizimida SQL Injection Hujumi",
    role: "SOC Kiberxavfsizlik Mutaxassisi",
    difficulty: "EASY",
    reward: "+25 tanga",
    score: "92/100",
    time: "0.8s",
    desc: "Bank veb-ilovasida shubhali HTTP so'rovlar qayd etildi. URL parametrlarida SQL belgilari aniqlandi. Zudlik bilan zaiflikni bartaraf eting.",
    studentAnswer: "Kiruvchi so'rovlardagi SQL parametrlarni Prepared Statement orqali tekshiramiz va ORM parameterized querylardan foydalanamiz.",
    aiFeedback: "Ajoyib yechim! Prepared Statements va ORM parametrlaridan foydalanish SQL Injection zaifliklarini eng samarali to'xtatuvchi usuldir.",
    aiStrength: "OWASP Top 10 xavfsizlik standartiga to'liq mos keladi."
  },
  {
    icon: Scale,
    tag: "Huquqshunoslik",
    title: "Tijoriy Yetkazib Berish Shartnomasi Bo'yicha Sud Ishi",
    role: "Korporativ Yurist",
    difficulty: "MEDIUM",
    reward: "+30 tanga",
    score: "95/100",
    time: "1.1s",
    desc: "Xaridor mahsulotlar 15 kunga kechikib yetkazilgani sababli 100 mln so'm jarima talab qilmoqda. Shartnoma bandlarini va Fuqarolik Kodeksini asoslang.",
    studentAnswer: "FK 333-moddasi bo'yicha fors-major holatlarini tekshirib, shartnoma 7.2-bandidagi penyani qisqartirish to'g'risida e'tiroz bildiramiz.",
    aiFeedback: "To'g'ri strategiya! Shartnoma bandlarini moddiy huquq normalari bilan asoslash sudda da'voni 70% ga kamaytirish imkonini beradi.",
    aiStrength: "Iqtisodiy sud amaliyoti pretsedentlariga tayangan."
  },
  {
    icon: Terminal,
    tag: "Dasturlash",
    title: "Taqsimlangan Mikroservis Tizimida Kesh Nomuvofiqligi",
    role: "Senior Backend Muhandis",
    difficulty: "HARD",
    reward: "+40 tanga",
    score: "98/100",
    time: "0.9s",
    desc: "Redis keshidagi ma'lumotlar PostgreSQL asosiy bazasi bilan sinxronlashmayapti. Cache-Aside patterni va invalidatsiya mexanizmini to'g'rilang.",
    studentAnswer: "Cache-Aside patternidan foydalanib, DB write amalga oshgach, Redisdagi kalitni darhol invalidate (DEL) qilamiz va 300s TTL o'rnatamiz.",
    aiFeedback: "Mukammal arxitektura! Write-through o'rniga Cache Invalidation qo'llash Race Condition holatlarini butunlay bartaraf etadi.",
    aiStrength: "Yuqori yuklamali tizimlar (High-Load) uchun eng optimal yechim."
  }
];

const botFeatures = [
  {
    icon: CalendarCheck,
    title: "Elektron Davomat va Alertlar",
    text: "O'qituvchi davomatni belgilashi bilanoq tizim bu ma'lumotni moliya bo'limi (refund hisobi uchun) va Telegram botga bir zumda uzatadi.",
  },
  {
    icon: BellRing,
    title: "Avtomatlashgan To'lov Eslatmalari",
    text: "Oylik to'lovlar muddati kelganda, qarzdorliklar paydo bo'lganda yoki dars qoldirilganda ota-onalarga bot orqali avtomatik eslatmalar boradi.",
  },
];

const botMessages = [
  {
    tag: "Davomat",
    text: "Farzandingiz Aliyev Vali bugungi matematika darsida qatnashmadi.",
    time: "14:32",
  },
  {
    tag: "To'lov",
    text: "Sizning noyabr oyi uchun to'lov qoldig'ingiz 150,000 UZS. Iltimos, belgilangan muddatda to'lovni amalga oshiring.",
    time: "09:10",
  },
];

const financeFeatures = [
  {
    icon: Coins,
    title: "Avtomatik Chegirmalar / Refund",
    text: "Dars qoldirilsa, pullar kunlik narx asosida hisoblanadi va kumulyativ xatoliksiz tarzda qayta taqsimlanadi.",
  },
  {
    icon: Tags,
    title: "Individual Narxlar / Custom Fees",
    text: "Kam ta'minlangan, Imtiyozli va O'qituvchi kelishgan (oylikka ta'sir qilmaydigan) moslashuvchan narx yechimlari mavjud.",
  },
  {
    icon: Repeat,
    title: "Guruhdan o'tish / Transfers",
    text: "O'quvchi guruhdan guruhga o'tganda avvalgi qarzi yoki ortiqcha puli yangi guruhga matematik aniqlikda ko'chiriladi.",
  },
];

const reportRows = [
  { label: "Oylik to'lov", value: "600,000 UZS" },
  { label: "Qoldirilgan darslar (2 kun)", value: "- 60,000 UZS" },
  { label: "Imtiyoz (Special)", value: "- 90,000 UZS" },
  { label: "Oldingi guruh qoldig'i", value: "+ 25,000 UZS" },
];

export function LandingPage() {
  const [activeCaseIdx, setActiveCaseIdx] = useState(0);

  return (
    <div data-theme="light" className="min-h-screen bg-[#fdfaf5] text-[#120f0d]">
      {/* Aurora glow background */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -left-32 h-[38rem] w-[38rem] rounded-full bg-gold/25 blur-[120px]" />
        <div className="absolute top-1/3 -right-40 h-[34rem] w-[34rem] rounded-full bg-indigo-500/15 blur-[130px]" />
        <div className="absolute bottom-0 left-1/4 h-[30rem] w-[30rem] rounded-full bg-sky-500/15 blur-[130px]" />
        <div className="absolute inset-0 bg-[#fdfaf5]/50" />
      </div>

      {/* Nav */}
      <header className="sticky top-0 z-50 px-4 pt-4">
        <nav className="mx-auto flex max-w-6xl items-center justify-between rounded-3xl px-5 py-3 bg-gradient-to-br from-white/95 to-[#fdfaf5]/85 backdrop-blur-xl border border-[#967b4f]/15 shadow-[0_12px_40px_-10px_rgba(150,123,79,0.15)]">
          <a href="#hero" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-600 via-indigo-600 to-blue-600 flex items-center justify-center text-white shadow-md">
              <Bot className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-black text-lg tracking-tight bg-gradient-to-r from-amber-700 via-indigo-900 to-blue-900 bg-clip-text text-transparent">
                ChronosAI
              </span>
              <span className="text-[10px] text-[#827161] font-semibold -mt-1 tracking-wider uppercase">
                Yaxshi Niyat Ekotizimi
              </span>
            </div>
          </a>

          <div className="hidden items-center gap-7 text-sm font-medium text-[#827161] md:flex">
            <a className="transition-colors hover:text-indigo-600" href="#ustunlar">
              Imkoniyatlar
            </a>
            <a className="transition-colors hover:text-indigo-600" href="#ai-lab">
              AI Simulyatsiya
            </a>
            <a className="transition-colors hover:text-indigo-600" href="#routerlar">
              Routerlar
            </a>
            <a className="transition-colors hover:text-indigo-600" href="#telegram">
              Telegram Bot
            </a>
            <a className="transition-colors hover:text-indigo-600" href="#moliya">
              Moliya
            </a>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              to="/simulation"
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition-all shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>AI Lab</span>
            </Link>
            <Link
              to="/login"
              className="bg-cta-gradient rounded-full px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-soft transition-transform hover:scale-[1.04]"
            >
              Tizimga kirish
            </Link>
          </div>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section id="hero" className="relative px-4 pt-14 pb-20 md:pt-20">
          <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring, delay: 0.05 }}
                className="bg-white/90 backdrop-blur-2xl border border-[#967b4f]/20 shadow-md inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold tracking-wide text-[#827161]"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                <span>ChronosAI • Ta'lim, Amaliyot va Markaz Boshqaruvi Yagona Tizimda</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 26 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring, delay: 0.12 }}
                className="mt-6 text-4xl leading-[1.08] font-black md:text-6xl text-[#120f0d]"
              >
                O'quv markazni boshqaring. Talabalarni esa{" "}
                <span className="bg-gradient-to-r from-amber-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent">
                  AI bilan o'qiting!
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring, delay: 0.2 }}
                className="mt-6 max-w-xl text-base leading-relaxed text-[#827161] md:text-lg"
              >
                ChronosAI — o'quv markazlar faoliyatini to'liq avtomatlashtiruvchi CRM, chuqurlashtirilgan LMS hamda talabalarni real keyslarda chiniqtiruvchi Gemini 2.5 Flash AI simulyatsiya laboratoriyasi.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring, delay: 0.28 }}
                className="mt-8 flex flex-wrap items-center gap-3.5"
              >
                <Link to="/simulation">
                  <motion.div
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 400, damping: 12 }}
                    className="inline-flex items-center gap-2 rounded-full px-7 py-4 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 shadow-[0_10px_25px_-5px_rgba(79,70,229,0.4)]"
                  >
                    <Play className="h-4 w-4 fill-white" />
                    <span>AI Laboratoriyasini Sinab Ko'rish</span>
                  </motion.div>
                </Link>

                <Link to="/login">
                  <motion.div
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 400, damping: 12 }}
                    className="inline-flex items-center gap-2 rounded-full px-6 py-4 text-sm font-semibold text-[#120f0d] bg-white border border-[#967b4f]/20 shadow-md hover:bg-[#faf7f2]"
                  >
                    <span>Boshqaruv Tizimiga Kirish</span>
                    <ArrowRight className="h-4 w-4" />
                  </motion.div>
                </Link>
              </motion.div>

              {/* Quick credibility stats */}
              <div className="mt-10 grid grid-cols-3 gap-4 pt-6 border-t border-[#967b4f]/15">
                <div>
                  <div className="text-2xl font-black text-[#120f0d]">100%</div>
                  <div className="text-xs text-[#827161] font-medium mt-0.5">Avtomatlashtirish</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-indigo-600">Gemini 2.5</div>
                  <div className="text-xs text-[#827161] font-medium mt-0.5">Flash AI Model</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-emerald-600">0 Xatolik</div>
                  <div className="text-xs text-[#827161] font-medium mt-0.5">Moliyaviy Hisob-kitob</div>
                </div>
              </div>
            </div>

            {/* Visual Hero Dashboard */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92, rotate: -2 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 90, damping: 13, delay: 0.15 }}
              className="relative"
            >
              <div className="relative rounded-3xl p-2 bg-gradient-to-tr from-amber-500/20 via-indigo-500/20 to-blue-500/20 shadow-2xl backdrop-blur-xl">
                <motion.img
                  src={dashboard}
                  alt="ChronosAI platformasi boshqaruv paneli"
                  width={1200}
                  height={1008}
                  animate={{ y: [0, -14, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                  className="w-full rounded-2xl drop-shadow-[0_30px_60px_rgba(79,70,229,0.2)]"
                />
              </div>

              {/* Floating AI badge */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="absolute -bottom-6 -left-4 sm:bottom-4 sm:-left-6 bg-white/95 backdrop-blur-2xl border border-indigo-200/80 shadow-xl rounded-2xl p-4 flex items-center gap-3.5 max-w-xs"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-indigo-600/30">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#120f0d]">AI Simulyator Faol</div>
                  <div className="text-[11px] text-[#827161] mt-0.5">Real kiber-keyslar va huquqiy tahlillar tayyor</div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* 3 Pillars Section */}
        <section id="ustunlar" className="px-4 py-20 bg-gradient-to-b from-transparent via-white/60 to-transparent">
          <div className="mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ type: "spring", stiffness: 110, damping: 15 }}
              className="text-center max-w-3xl mx-auto"
            >
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 border border-indigo-200 px-3.5 py-1.5 rounded-full">
                ChronosAI Ekotizimining 3 Ta Ustuni
              </span>
              <h2 className="mt-4 text-3xl font-black md:text-5xl text-[#120f0d]">
                Boshqaruv, Ta'lim va Amaliyot bir nuqtada
              </h2>
              <p className="mt-4 text-[#827161] md:text-lg leading-relaxed">
                Yaxshi Niyatning murakkab moliyaviy boshqaruv kuchi va OmniLab AI laboratoriyasining ilg'or amaliy simulyatsiyasi birlashdi.
              </p>
            </motion.div>

            <div className="mt-14 grid gap-8 md:grid-cols-3">
              {pillars.map((p, i) => (
                <motion.article
                  key={p.title}
                  initial={{ opacity: 0, y: 40, scale: 0.96 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ ...pop, delay: i * 0.1 }}
                  whileHover={{ y: -8 }}
                  className="bg-white/90 backdrop-blur-2xl border border-[#967b4f]/15 rounded-[2.5rem] p-8 shadow-xl flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div className={`w-14 h-14 rounded-2xl ${p.bg} ${p.border} border flex items-center justify-center ${p.tone}`}>
                        <p.icon className="w-7 h-7" />
                      </div>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${p.bg} ${p.tone}`}>
                        {p.badge}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-[#120f0d] mb-3">{p.title}</h3>
                    <p className="text-sm text-[#827161] leading-relaxed mb-6">{p.description}</p>

                    <div className="space-y-2.5 pt-4 border-t border-gray-100">
                      {p.points.map((pt, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 text-xs text-[#827161] font-medium">
                          <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${p.tone}`} />
                          <span>{pt}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        {/* AI Simulation Showcase Section */}
        <section id="ai-lab" className="px-4 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="relative rounded-[3rem] p-8 sm:p-12 lg:p-16 bg-gradient-to-br from-white/95 via-[#fbf8f2]/95 to-indigo-50/50 backdrop-blur-2xl border border-[#967b4f]/25 shadow-[0_25px_70px_-15px_rgba(150,123,79,0.2)] overflow-hidden">
              {/* Luminous luxury ambient orbs */}
              <div className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-br from-indigo-500/15 via-purple-500/10 to-transparent rounded-full blur-[90px] pointer-events-none" />
              <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-gradient-to-tr from-amber-500/15 via-indigo-500/10 to-transparent rounded-full blur-[90px] pointer-events-none" />

              <div className="relative z-10 grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
                <div>
                  <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-amber-500/10 border border-indigo-200/80 text-indigo-800 text-xs font-bold mb-4 shadow-sm">
                    <Bot className="w-4 h-4 text-indigo-600" />
                    <span>Gemini 2.5 Flash bilan Real Simulyatsiya</span>
                    <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse ml-1" />
                  </div>

                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[#120f0d] leading-[1.15]">
                    Nazariyani unuting.{" "}
                    <span className="bg-gradient-to-r from-amber-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                      Real keyslar bilan chiniqing!
                    </span>
                  </h2>

                  <p className="mt-4 text-[#827161] text-sm sm:text-base leading-relaxed max-w-xl">
                    Kiberxavfsizlik, Huquqshunoslik va Muhandislik sohalarida sun'iy intellekt talabaga haqiqiy vaziyatlarni taqdim etadi. O'quvchi har bir qadami bo'yicha tahliliy mulohaza va xatolarni tuzatish tavsiyalarini oladi.
                  </p>

                  <div className="mt-7 space-y-3">
                    {sampleCases.map((c, idx) => {
                      const isSelected = activeCaseIdx === idx;
                      return (
                        <motion.div
                          key={idx}
                          onClick={() => setActiveCaseIdx(idx)}
                          whileHover={{ x: 4 }}
                          transition={{ type: "spring", stiffness: 350, damping: 20 }}
                          className={`p-4 rounded-2xl transition-all flex items-center justify-between gap-4 cursor-pointer border ${
                            isSelected
                              ? "bg-white border-indigo-500 shadow-[0_10px_25px_-5px_rgba(79,70,229,0.18)] ring-2 ring-indigo-500/20"
                              : "bg-white/75 border-[#967b4f]/15 hover:bg-white hover:border-indigo-300 hover:shadow-md"
                          }`}
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div
                              className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                                isSelected
                                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                                  : "bg-indigo-50 text-indigo-600 border border-indigo-100"
                              }`}
                            >
                              <c.icon className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-2 py-0.5 rounded-md">
                                  {c.tag}
                                </span>
                                <span className="text-[10px] font-semibold text-[#827161]">
                                  {c.difficulty}
                                </span>
                              </div>
                              <div className="text-xs sm:text-sm font-bold text-[#120f0d] truncate">
                                {c.title}
                              </div>
                              <div className="text-[11px] text-[#827161] mt-0.5">{c.role}</div>
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center gap-2.5">
                            <span className="text-[11px] font-black text-amber-800 bg-amber-500/15 border border-amber-500/25 px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                              <Coins className="w-3 h-3 text-amber-600" />
                              <span>{c.reward}</span>
                            </span>
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                                isSelected
                                  ? "bg-indigo-600 text-white"
                                  : "bg-gray-100 text-gray-400"
                              }`}
                            >
                              <ArrowRight className="w-3 h-3" />
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  <div className="mt-8 flex items-center gap-4">
                    <Link
                      to="/simulation"
                      style={{ color: "#ffffff" }}
                      className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 font-bold text-sm shadow-[0_12px_30px_-5px_rgba(79,70,229,0.35)] transition-transform hover:scale-[1.03] active:scale-[0.98]"
                    >
                      <Play className="w-4 h-4 fill-white text-white" />
                      <span style={{ color: "#ffffff" }}>Simulyatsiya Laboratoriyasiga O'tish</span>
                      <ArrowRight className="w-4 h-4 text-white" />
                    </Link>
                  </div>
                </div>

                {/* Simulated Turn Preview - Live Interactive Card */}
                <div className="bg-white/95 border border-[#967b4f]/20 rounded-3xl p-6 sm:p-7 shadow-[0_20px_50px_-10px_rgba(150,123,79,0.18)] backdrop-blur-xl relative">
                  <div className="flex items-center justify-between pb-4 border-b border-[#967b4f]/15">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
                        <Bot className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-[#120f0d] block">AI Mutaxassis Bahosi</span>
                        <span className="text-[10px] text-indigo-600 font-medium">Gemini 2.5 Flash Real-Time tahlil</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full shadow-sm">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-black text-emerald-800">
                        Baho: {sampleCases[activeCaseIdx].score}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 space-y-4 text-xs">
                    {/* Student input */}
                    <div className="p-4 rounded-2xl bg-[#faf7f2] border border-[#967b4f]/15 shadow-sm">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-extrabold text-indigo-700 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                          Talaba javobi:
                        </span>
                        <span className="text-[10px] text-[#827161]">Topshirildi</span>
                      </div>
                      <p className="text-[#120f0d] leading-relaxed text-xs">
                        "{sampleCases[activeCaseIdx].studentAnswer}"
                      </p>
                    </div>

                    {/* AI Feedback */}
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/80 via-purple-50/40 to-indigo-50/60 border border-indigo-200/80 shadow-sm">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-extrabold text-indigo-900 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                          AI Tahlili (Gemini 2.5):
                        </span>
                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-100/70 px-2 py-0.5 rounded-md">
                          {sampleCases[activeCaseIdx].time}
                        </span>
                      </div>
                      <p className="text-[#120f0d] leading-relaxed text-xs">
                        {sampleCases[activeCaseIdx].aiFeedback}
                      </p>
                    </div>

                    {/* Strength / Compliance */}
                    <div className="p-3.5 rounded-2xl bg-emerald-50/90 border border-emerald-200 text-emerald-900 flex items-center gap-2.5 shadow-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-medium text-xs">
                        <strong className="font-bold text-emerald-900">Kuchli tomon:</strong>{" "}
                        {sampleCases[activeCaseIdx].aiStrength}
                      </span>
                    </div>

                    {/* Performance Micro-bar */}
                    <div className="pt-3 border-t border-[#967b4f]/15 flex items-center justify-between text-[11px] text-[#827161]">
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        Mukofot: <strong className="text-amber-800 font-bold">{sampleCases[activeCaseIdx].reward} berildi</strong>
                      </span>
                      <span className="text-indigo-600 font-semibold cursor-pointer hover:underline">
                        Batafsil matrisa →
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Roles Section */}
        <section id="routerlar" className="px-4 py-20">
          <div className="mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ type: "spring", stiffness: 110, damping: 15 }}
              className="max-w-2xl"
            >
              <h2 className="text-3xl font-black md:text-5xl text-[#120f0d]">
                Kuchli va himoyalangan routerlar
              </h2>
              <p className="mt-4 text-[#827161] md:text-lg">
                Har bir xodim faqat o'ziga tegishli vazifalarni bajaradi. Rolga asoslangan routerlar ma'lumotlar xavfsizligini 100% ta'minlaydi.
              </p>
            </motion.div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {roles.map((role, i) => (
                <motion.article
                  key={role.title}
                  initial={{ opacity: 0, y: 40, scale: 0.96 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ ...pop, delay: i * 0.1 }}
                  whileHover={{ y: -8 }}
                  className={`relative overflow-hidden rounded-[2.5rem] p-7 backdrop-blur-2xl border shadow-xl ${role.cardTint}`}
                >
                  <div
                    className={`absolute -top-20 -right-16 h-44 w-44 rounded-full bg-gradient-to-br blur-2xl ${role.ring}`}
                  />
                  <span
                    className={`relative flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fdfaf5]/80 ${role.tone}`}
                  >
                    <role.icon className="h-6 w-6" />
                  </span>
                  <h3 className="relative mt-6 text-xl font-bold text-[#120f0d]">{role.title}</h3>
                  <ul className="relative mt-5 space-y-3.5 text-sm leading-relaxed text-[#827161]">
                    {role.items.map((item) => (
                      <li key={item} className="flex gap-3">
                        <span
                          className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-current ${role.tone}`}
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        {/* Telegram Bot */}
        <section id="telegram" className="px-4 py-20 bg-gradient-to-b from-transparent via-white/50 to-transparent">
          <div className="mx-auto grid max-w-6xl gap-14 lg:grid-cols-2 items-center">
            <div className="order-2 lg:order-1">
              <div className="bg-white/90 backdrop-blur-2xl border border-[#967b4f]/20 rounded-[2.5rem] p-7 shadow-xl max-w-md mx-auto">
                <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                  <div className="w-10 h-10 rounded-full bg-sky-500 flex items-center justify-center text-white">
                    <Send className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#120f0d]">ChronosAI Telegram Bot</div>
                    <div className="text-xs text-emerald-600 font-medium">Faol • Real vaqt eslatmalari</div>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {botMessages.map((m, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-[#fdfaf5] border border-[#967b4f]/15 text-xs">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full text-[10px]">
                          {m.tag}
                        </span>
                        <span className="text-gray-400 text-[10px]">{m.time}</span>
                      </div>
                      <p className="text-[#120f0d] font-medium leading-relaxed">{m.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <span className="text-xs font-bold uppercase tracking-widest text-sky-600 bg-sky-50 border border-sky-200 px-3.5 py-1.5 rounded-full">
                Tezkor Telegram Integratsiyasi
              </span>
              <h2 className="mt-4 text-3xl font-black md:text-5xl text-[#120f0d]">
                Ota-onalar bilan uzluksiz aloqa
              </h2>
              <p className="mt-4 text-[#827161] md:text-lg leading-relaxed">
                Davomat va to'lovlar monitoringi avtomatik tarzda Telegram orqali uzatiladi. Har qanday qoldirilgan dars yoki qarzdorlik haqida darhol xabar yuboriladi.
              </p>

              <div className="mt-8 space-y-4">
                {botFeatures.map((f, i) => (
                  <div key={i} className="flex gap-4 p-4 rounded-2xl bg-white/80 border border-[#967b4f]/15">
                    <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center shrink-0">
                      <f.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#120f0d]">{f.title}</h4>
                      <p className="text-xs text-[#827161] mt-1 leading-relaxed">{f.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Finance */}
        <section id="moliya" className="px-4 py-20">
          <div className="mx-auto grid max-w-6xl gap-14 lg:grid-cols-2">
            <div className="lg:py-8">
              <span className="text-xs font-bold uppercase tracking-widest text-amber-700 bg-amber-50 border border-amber-200 px-3.5 py-1.5 rounded-full">
                Aqlli Moliyaviy Algoritm
              </span>
              <h2 className="mt-4 text-3xl font-black md:text-4xl text-[#120f0d]">
                Murakkab moliyaviy muammolarga{" "}
                <span className="text-amber-600">aqlli yechimlar</span>.
              </h2>
              <p className="mt-4 text-[#827161] md:text-lg leading-relaxed">
                Bizning hisob-kitob modulimiz oddiy tizimlardan farqli o'laroq, dars qoldirilishi, guruhdan-guruhga o'tish va imtiyozli to'lovlarni kumulyativ xatoliksiz avtomatik hisoblab beradi.
              </p>

              <div className="mt-8 space-y-4">
                {financeFeatures.map((f, i) => (
                  <div key={i} className="flex gap-4 p-4 rounded-2xl bg-white/80 border border-[#967b4f]/15 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                      <f.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#120f0d]">{f.title}</h4>
                      <p className="text-xs text-[#827161] mt-1 leading-relaxed">{f.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:sticky lg:top-28 lg:h-fit">
              <div className="bg-white/90 backdrop-blur-2xl border border-[#967b4f]/20 shadow-xl rounded-[2.5rem] p-7">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-[#120f0d]">Hisobot Namuna</p>
                  <span className="rounded-full bg-amber-500/15 border border-amber-500/25 px-3 py-1 text-[11px] font-bold text-amber-800">
                    Noyabr Oyi
                  </span>
                </div>
                <div className="mt-6 space-y-4">
                  {reportRows.map((r, i) => (
                    <div
                      key={r.label}
                      className="flex items-center justify-between border-b border-gray-100 pb-3 text-sm"
                    >
                      <span className="text-[#827161] text-xs font-medium">{r.label}</span>
                      <span className="font-bold text-xs sm:text-sm text-[#120f0d]">{r.value}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex items-center justify-between rounded-2xl px-5 py-4 bg-gradient-to-r from-amber-500/20 via-amber-600/10 to-amber-500/20 border border-amber-500/30">
                  <span className="text-sm font-bold text-[#120f0d]">Yakuniy summa</span>
                  <span className="text-xl font-black text-amber-900">475,000 UZS</span>
                </div>
              </div>
            </div>
          </div>
        </section>


      </main>

      {/* Footer */}
      <footer className="px-4 pb-10">
        <div className="bg-white/90 backdrop-blur-2xl border border-[#967b4f]/15 shadow-xl mx-auto flex max-w-6xl flex-col items-center gap-4 rounded-3xl px-8 py-10 text-center">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-600 to-indigo-600 flex items-center justify-center text-white">
              <Bot className="w-4 h-4" />
            </div>
            <span className="font-display font-bold text-lg text-[#120f0d]">ChronosAI</span>
          </div>
          <p className="text-xs text-[#827161]">
            © {new Date().getFullYear()} ChronosAI | Yaxshi Niyat Educational & Practical Platform. Barcha huquqlar himoyalangan.
          </p>
        </div>
      </footer>
    </div>
  );
}
