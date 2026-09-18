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
  Check,
  Atom,
  Dna,
  FlaskConical,
  Landmark
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
    tone: "text-amber-800",
    bg: "bg-amber-500/10",
    border: "border-amber-500/25",
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
    tone: "text-[#806740]",
    bg: "bg-[#967b4f]/10",
    border: "border-[#967b4f]/25",
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
    tone: "text-[#967b4f]",
    bg: "bg-[#967b4f]/15",
    border: "border-[#967b4f]/30",
    description: "Gemini 2.5 Flash va RAG bilimlar bazasi orqali real keyslar tahlili. Talabaning har bir qadami AI tomonidan baholanadi.",
    points: [
      "Biologiya, Kimyo, Fizika, Huquq va Tarix real keyslari",
      "RAG embeddinglar asosida xatolarni tahlil qilish",
      "Interaktiv dialog, mahorat bali va tanga mukofotlari"
    ]
  }
];

const roles: { icon: LucideIcon; title: string; tone: string; ring: string; cardTint: string; items: string[] }[] = [
  {
    icon: ShieldCheck,
    title: "Super Admin",
    tone: "text-red-700",
    ring: "from-red-500/20 to-red-500/0",
    cardTint: "bg-red-50/70 border-red-200/80 shadow-red-500/5",
    items: [
      "Barcha filiallar va moliyaviy kassa ustidan global nazorat.",
      "Xodimlar, maoshlar va umumiy daromad analitikasi.",
      "Imtiyozli (Special) o'quvchilar global arxivi va AI tahlillari.",
    ],
  },
  {
    icon: Building2,
    title: "Admin / Filial",
    tone: "text-[#967b4f]",
    ring: "from-[#967b4f]/25 to-[#967b4f]/0",
    cardTint: "bg-amber-50/70 border-amber-200/80 shadow-amber-500/5",
    items: [
      "O'ziga biriktirilgan markaz faoliyati va xonalari monitoringi.",
      "Guruhlar, to'lovlar va davomatni tezkor tekshirish.",
      "Filial xarajatlari (Expenses) va talabalar ro'yxati.",
    ],
  },
  {
    icon: GraduationCap,
    title: "Mentor / Ustoz",
    tone: "text-emerald-700",
    ring: "from-emerald-500/25 to-emerald-500/0",
    cardTint: "bg-emerald-50/70 border-emerald-200/80 shadow-emerald-500/5",
    items: [
      "O'z guruhlari ro'yxati, dars jadvallari va talabalar auditi.",
      "Uy vazifalarini baholash va AI simulyatsiya natijalarini ko'rish.",
      "O'zining maoshini va bonuslarini real vaqtda kuzatish.",
    ],
  },
];

const sampleCases = [
  {
    icon: Dna,
    tag: "Biologiya",
    title: "DNK Replikatsiyasi va Fermentlar Tahlili",
    role: "Molekulyar Biologiya Tadqiqotchisi",
    difficulty: "EASY",
    reward: "+25 tanga",
    score: "94/100",
    time: "0.8s",
    desc: "Eukariot hujayralarda DNK polimeraza faoliyatining xatoligi natijasida mutatsiya xavfi yuz berdi. Replikatsiya va reparatsiya mexanizmini tahlil qiling.",
    studentAnswer: "DNK-polimeraza III ning ekzonukleaza faolligi yordamida noto'g'ri o'rnatilgan nukleotidlar kesib tashlanadi va DNK-ligaza uzilgan zanjirni tiklaydi.",
    aiFeedback: "Ajoyib va aniq javob! Proofreading va mismatch repair jarayonlari genetik barqarorlikni ta'minlashda eng asosiy himoya hisoblanadi.",
    aiStrength: "Hujayra biologiyasi va genetik fermentlar terminologiyasiga to'liq mos keladi."
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
    icon: Atom,
    tag: "Fizika",
    title: "Kvant Mexanikasi: Fotoeffekt va Foton Energiyasi",
    role: "Fizik-Tadqiqotchi",
    difficulty: "HARD",
    reward: "+40 tanga",
    score: "98/100",
    time: "0.9s",
    desc: "Metall plastinkaga monoxromatik nurlanish tushganda elektronlarning chiqish ishi va to'xtatuvchi potensial orasidagi bog'liqlikni tahlil qiling.",
    studentAnswer: "Eynshteynning fotoeffekt tenglamasidan foydalanamiz: h*nu = A_chiqish + (m*v^2)/2. To'xtatuvchi potensial e*U_to'xtatuvchi maksimal kinetik energiyaga teng.",
    aiFeedback: "Mukammal fizik tahlil! Kvant nazariyasining klassik to'lqin nazariyasidan farqini va Plank doimiysi bog'liqligini to'g'ri ko'rsatib berdingiz.",
    aiStrength: "Eynshteyn fotoeffekt formulasi va kvant optikasi qonuniyatlariga 100% mos."
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
    text: "Farzandingiz Aliyev Vali bugungi biologiya darsida qatnashmadi.",
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
      {/* Luxury Warm Glow Background (Champagne & Bronze - No Blue) */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -left-32 h-[38rem] w-[38rem] rounded-full bg-[#967b4f]/15 blur-[130px]" />
        <div className="absolute top-1/3 -right-40 h-[34rem] w-[34rem] rounded-full bg-amber-500/10 blur-[140px]" />
        <div className="absolute bottom-0 left-1/4 h-[30rem] w-[30rem] rounded-full bg-[#967b4f]/10 blur-[130px]" />
        <div className="absolute inset-0 bg-[#fdfaf5]/60" />
      </div>

      {/* Nav */}
      <header className="sticky top-0 z-50 px-4 pt-4">
        <nav className="mx-auto flex max-w-6xl items-center justify-between rounded-3xl px-5 py-3 bg-gradient-to-br from-white/95 to-[#fdfaf5]/90 backdrop-blur-xl border border-[#967b4f]/20 shadow-[0_12px_40px_-10px_rgba(150,123,79,0.15)]">
          <a href="#hero" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#967b4f] to-[#78613c] p-2 flex items-center justify-center text-white shadow-md shadow-[#967b4f]/25">
              <img src="/YNlogo_without_word.png" alt="Yaxshi Niyat" className="w-full h-full object-contain filter drop-shadow" />
            </div>
            <div className="flex flex-col">
              <span className="font-serif font-black text-lg tracking-wide text-[#120f0d]">
                Chronous <span className="text-[#967b4f]">AI</span>
              </span>
              <span className="text-[10px] text-[#827161] font-semibold -mt-1 tracking-wider uppercase">
                Ta'lim Platformasi
              </span>
            </div>
          </a>

          <div className="hidden items-center gap-7 text-sm font-medium text-[#827161] md:flex">
            <a className="transition-colors hover:text-[#967b4f]" href="#ustunlar">
              Imkoniyatlar
            </a>
            <a className="transition-colors hover:text-[#967b4f]" href="#ai-lab">
              AI Simulyatsiya
            </a>
            <a className="transition-colors hover:text-[#967b4f]" href="#routerlar">
              Routerlar
            </a>
            <a className="transition-colors hover:text-[#967b4f]" href="#telegram">
              Telegram Bot
            </a>
            <a className="transition-colors hover:text-[#967b4f]" href="#moliya">
              Moliya
            </a>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              to="/simulation"
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold text-[#967b4f] bg-[#967b4f]/10 border border-[#967b4f]/25 hover:bg-[#967b4f]/15 transition-all shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#967b4f]" />
              <span>AI Lab</span>
            </Link>
            <Link
              to="/login"
              style={{ color: "#ffffff" }}
              className="bg-[#967b4f] hover:bg-[#806740] rounded-full px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-soft transition-all hover:scale-[1.04]"
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
                className="bg-white/90 backdrop-blur-2xl border border-[#967b4f]/20 shadow-sm inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold tracking-wide text-[#827161]"
              >
                <Sparkles className="h-3.5 w-3.5 text-[#967b4f]" />
                <span>Aniq va Gumanitar Fanlar • Amaliyot va Markaz Boshqaruvi</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 26 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring, delay: 0.12 }}
                className="mt-6 text-4xl leading-[1.08] font-black md:text-6xl text-[#120f0d]"
              >
                O'quv markazni boshqaring. Talabalarni esa{" "}
                <span className="bg-gradient-to-r from-[#967b4f] via-amber-700 to-[#78613c] bg-clip-text text-transparent">
                  AI bilan o'qiting!
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring, delay: 0.2 }}
                className="mt-6 max-w-xl text-base leading-relaxed text-[#827161] md:text-lg"
              >
                Chronous AI — markaz faoliyatini avtomatlashtiruvchi boshqaruv tizimi, chuqurlashtirilgan LMS hamda talabalarni Biologiya, Fizika, Kimyo, Huquq va Tarix fanlarida real keyslar bilan chiniqtiruvchi Gemini AI laboratoriyasi.
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
                    style={{ color: "#ffffff" }}
                    className="inline-flex items-center gap-2 rounded-full px-7 py-4 text-sm font-bold bg-[#967b4f] hover:bg-[#806740] shadow-[0_10px_25px_-5px_rgba(150,123,79,0.35)] text-white transition-all"
                  >
                    <Play className="h-4 w-4 fill-white text-white" />
                    <span style={{ color: "#ffffff" }}>AI Laboratoriyasini Sinab Ko'rish</span>
                  </motion.div>
                </Link>

                <Link to="/login">
                  <motion.div
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 400, damping: 12 }}
                    className="inline-flex items-center gap-2 rounded-full px-6 py-4 text-sm font-semibold text-[#120f0d] bg-white border border-[#967b4f]/25 shadow-md hover:bg-[#faf7f2]"
                  >
                    <span>Boshqaruv Tizimiga Kirish</span>
                    <ArrowRight className="h-4 w-4 text-[#967b4f]" />
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
                  <div className="text-2xl font-black text-[#967b4f]">Gemini 2.5</div>
                  <div className="text-xs text-[#827161] font-medium mt-0.5">Flash AI Model</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-amber-900">0 Xatolik</div>
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
              <div className="relative rounded-3xl p-2 bg-gradient-to-tr from-[#967b4f]/25 via-amber-500/15 to-[#967b4f]/20 shadow-2xl backdrop-blur-xl border border-[#967b4f]/20">
                <motion.img
                  src={dashboard}
                  alt="Yaxshi Niyat platformasi boshqaruv paneli"
                  width={1200}
                  height={1008}
                  animate={{ y: [0, -14, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                  className="w-full rounded-2xl drop-shadow-[0_25px_50px_rgba(150,123,79,0.2)]"
                />
              </div>

              {/* Floating AI badge */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="absolute -bottom-6 -left-4 sm:bottom-4 sm:-left-6 bg-white/95 backdrop-blur-2xl border border-[#967b4f]/30 shadow-xl rounded-2xl p-4 flex items-center gap-3.5 max-w-xs"
              >
                <div className="w-10 h-10 rounded-xl bg-[#967b4f] flex items-center justify-center text-white shrink-0 shadow-md shadow-[#967b4f]/30">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#120f0d]">AI Simulyator Faol</div>
                  <div className="text-[11px] text-[#827161] mt-0.5">Biologiya, Fizika, Kimyo va Huquq keyslari tayyor</div>
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
              <span className="text-xs font-bold uppercase tracking-widest text-[#967b4f] bg-[#967b4f]/10 border border-[#967b4f]/25 px-3.5 py-1.5 rounded-full">
                Chronous AI Ekotizimining 3 Asosiy Ustuni
              </span>
              <h2 className="mt-4 text-3xl font-black md:text-5xl text-[#120f0d]">
                Boshqaruv, Ta'lim va Amaliyot bir nuqtada
              </h2>
              <p className="mt-4 text-[#827161] md:text-lg leading-relaxed">
                Chronous AI platformasining ilg'or moliyaviy boshqaruv kuchi va chuqurlashtirilgan simulyatsiya laboratoriyasi yagona tizimda mujassamlashdi.
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
                  className="bg-white/90 backdrop-blur-2xl border border-[#967b4f]/20 rounded-[2.5rem] p-8 shadow-xl flex flex-col justify-between"
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

                    <div className="space-y-2.5 pt-4 border-t border-[#967b4f]/10">
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
            <div className="relative rounded-[3rem] p-8 sm:p-12 lg:p-16 bg-gradient-to-br from-white/95 via-[#fbf8f2]/95 to-amber-50/35 backdrop-blur-2xl border border-[#967b4f]/25 shadow-[0_25px_70px_-15px_rgba(150,123,79,0.2)] overflow-hidden">
              {/* Luminous luxury ambient orbs - strictly warm gold/bronze */}
              <div className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-br from-[#967b4f]/15 via-amber-500/10 to-transparent rounded-full blur-[90px] pointer-events-none" />
              <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-gradient-to-tr from-amber-500/15 via-[#967b4f]/10 to-transparent rounded-full blur-[90px] pointer-events-none" />

              <div className="relative z-10 grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
                <div>
                  <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-amber-50/90 border border-amber-200/80 text-amber-900 text-xs font-bold mb-4 shadow-sm">
                    <Bot className="w-4 h-4 text-[#967b4f]" />
                    <span>Gemini 2.5 Flash bilan Real Simulyatsiya</span>
                    <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse ml-1" />
                  </div>

                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[#120f0d] leading-[1.15]">
                    Nazariyani unuting.{" "}
                    <span className="bg-gradient-to-r from-[#967b4f] via-amber-700 to-[#78613c] bg-clip-text text-transparent">
                      Real keyslar bilan chiniqing!
                    </span>
                  </h2>

                  <p className="mt-4 text-[#827161] text-sm sm:text-base leading-relaxed max-w-xl">
                    Biologiya, Fizika, Kimyo, Tarix va Huquqshunoslik fanlarida sun'iy intellekt talabaga haqiqiy vaziyatlarni taqdim etadi. O'quvchi har bir qadami bo'yicha tahliliy mulohaza va xatolarni tuzatish tavsiyalarini oladi.
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
                              ? "bg-white border-[#967b4f] shadow-[0_10px_25px_-5px_rgba(150,123,79,0.22)] ring-2 ring-[#967b4f]/25"
                              : "bg-white/75 border-[#967b4f]/15 hover:bg-white hover:border-[#967b4f]/40 hover:shadow-md"
                          }`}
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div
                              className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                                isSelected
                                  ? "bg-[#967b4f] text-white shadow-md shadow-[#967b4f]/30"
                                  : "bg-[#967b4f]/10 text-[#967b4f] border border-[#967b4f]/20"
                              }`}
                            >
                              <c.icon className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-900 bg-amber-50 border border-amber-200/70 px-2 py-0.5 rounded-md">
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
                            <span className="text-[11px] font-black text-amber-900 bg-amber-500/15 border border-amber-500/25 px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                              <Coins className="w-3 h-3 text-[#967b4f]" />
                              <span>{c.reward}</span>
                            </span>
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                                isSelected
                                  ? "bg-[#967b4f] text-white"
                                  : "bg-[#faf7f2] text-[#827161]"
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
                      className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-[#967b4f] hover:bg-[#806740] font-bold text-sm shadow-[0_12px_30px_-5px_rgba(150,123,79,0.35)] transition-all hover:scale-[1.03] active:scale-[0.98]"
                    >
                      <Play className="w-4 h-4 fill-white text-white" />
                      <span style={{ color: "#ffffff" }}>Simulyatsiya Laboratoriyasiga O'tish</span>
                      <ArrowRight className="w-4 h-4 text-white" />
                    </Link>
                  </div>
                </div>

                {/* Simulated Turn Preview - Live Interactive Card */}
                <div className="bg-white/95 border border-[#967b4f]/25 rounded-3xl p-6 sm:p-7 shadow-[0_20px_50px_-10px_rgba(150,123,79,0.18)] backdrop-blur-xl relative">
                  <div className="flex items-center justify-between pb-4 border-b border-[#967b4f]/15">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#967b4f] to-[#78613c] flex items-center justify-center text-white shadow-md shadow-[#967b4f]/25">
                        <Bot className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-[#120f0d] block">AI Mutaxassis Bahosi</span>
                        <span className="text-[10px] text-[#967b4f] font-semibold">Gemini 2.5 Flash Real-Time tahlil</span>
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
                        <span className="font-extrabold text-[#4a3d31] flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#967b4f]" />
                          Talaba javobi:
                        </span>
                        <span className="text-[10px] text-[#827161]">Topshirildi</span>
                      </div>
                      <p className="text-[#120f0d] leading-relaxed text-xs">
                        "{sampleCases[activeCaseIdx].studentAnswer}"
                      </p>
                    </div>

                    {/* AI Feedback */}
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50/70 via-[#fdfaf5] to-amber-50/40 border border-[#967b4f]/25 shadow-sm">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-extrabold text-amber-900 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-[#967b4f]" />
                          AI Tahlili (Gemini 2.5):
                        </span>
                        <span className="text-[10px] font-bold text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded-md">
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
                        <span className="w-1.5 h-1.5 rounded-full bg-[#967b4f]" />
                        Mukofot: <strong className="text-amber-900 font-bold">{sampleCases[activeCaseIdx].reward} berildi</strong>
                      </span>
                      <span className="text-[#967b4f] font-semibold cursor-pointer hover:underline">
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
                <div className="flex items-center gap-3 pb-4 border-b border-[#967b4f]/10">
                  <div className="w-10 h-10 rounded-full bg-[#967b4f] flex items-center justify-center text-white shadow-md shadow-[#967b4f]/25">
                    <Send className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#120f0d]">Yaxshi Niyat Telegram Bot</div>
                    <div className="text-xs text-emerald-700 font-semibold">Faol • Real vaqt eslatmalari</div>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {botMessages.map((m, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-[#fdfaf5] border border-[#967b4f]/15 text-xs">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-amber-900 bg-amber-50 border border-amber-200/60 px-2.5 py-0.5 rounded-full text-[10px]">
                          {m.tag}
                        </span>
                        <span className="text-[#827161] text-[10px]">{m.time}</span>
                      </div>
                      <p className="text-[#120f0d] font-medium leading-relaxed">{m.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <span className="text-xs font-bold uppercase tracking-widest text-[#967b4f] bg-[#967b4f]/10 border border-[#967b4f]/25 px-3.5 py-1.5 rounded-full">
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
                    <div className="w-10 h-10 rounded-xl bg-[#967b4f]/10 text-[#967b4f] border border-[#967b4f]/20 flex items-center justify-center shrink-0">
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
              <span className="text-xs font-bold uppercase tracking-widest text-[#967b4f] bg-[#967b4f]/10 border border-[#967b4f]/25 px-3.5 py-1.5 rounded-full">
                Aqlli Moliyaviy Algoritm
              </span>
              <h2 className="mt-4 text-3xl font-black md:text-4xl text-[#120f0d]">
                Murakkab moliyaviy muammolarga{" "}
                <span className="text-[#967b4f]">aqlli yechimlar</span>.
              </h2>
              <p className="mt-4 text-[#827161] md:text-lg leading-relaxed">
                Bizning hisob-kitob modulimiz oddiy tizimlardan farqli o'laroq, dars qoldirilishi, guruhdan-guruhga o'tish va imtiyozli to'lovlarni kumulyativ xatoliksiz avtomatik hisoblab beradi.
              </p>

              <div className="mt-8 space-y-4">
                {financeFeatures.map((f, i) => (
                  <div key={i} className="flex gap-4 p-4 rounded-2xl bg-white/80 border border-[#967b4f]/15 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-[#967b4f]/10 text-[#967b4f] border border-[#967b4f]/20 flex items-center justify-center shrink-0">
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
                  <span className="rounded-full bg-amber-500/15 border border-amber-500/25 px-3 py-1 text-[11px] font-bold text-amber-900">
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
                  <span className="text-xl font-black text-amber-950">475,000 UZS</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="px-4 pb-10">
        <div className="bg-white/90 backdrop-blur-2xl border border-[#967b4f]/20 shadow-xl mx-auto flex max-w-6xl flex-col items-center gap-4 rounded-3xl px-8 py-10 text-center">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#967b4f] to-[#78613c] p-1.5 flex items-center justify-center text-white shadow-md shadow-[#967b4f]/25">
              <img src="/YNlogo_without_word.png" alt="Logo" className="w-full h-full object-contain filter drop-shadow" />
            </div>
            <span className="font-serif font-bold text-lg text-[#120f0d]">Chronous AI</span>
          </div>
          <p className="text-xs text-[#827161]">
            © {new Date().getFullYear()} Chronous AI Ta'lim Platformasi. Barcha huquqlar himoyalangan.
          </p>
        </div>
      </footer>
    </div>
  );
}
