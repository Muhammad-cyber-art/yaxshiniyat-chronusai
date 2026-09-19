import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../tokenUpdater/updater';
import {
  Bot,
  Sparkles,
  ShieldCheck,
  Scale,
  ArrowLeft,
  Play,
  Send,
  AlertCircle,
  Coins,
  LogOut,
  BookOpen,
  User,
  Clock,
  MessageSquare,
  FlaskConical,
  Activity,
  History,
  Zap,
  CheckCircle2,
  Users,
  Copy,
  Check,
  Trash2,
  Plus,
  RefreshCw,
  Atom,
  Flame,
  Volume2,
  VolumeX,
  Eye,
  AlertTriangle,
  X
} from 'lucide-react';
import ThemeToggle from '../ThemeToggle';
import { get_user_info } from '../Authorized/getRole';
import PeriodicTableModal from './PeriodicTableModal';
import { triggerMassiveExplosionSound } from './explosionSound';

export default function SimulationPage() {
  const [searchParams] = useSearchParams();
  const userInfo = get_user_info();

  // State: Case Selection
  const [cases, setCases] = useState([]);
  const [loadingCases, setLoadingCases] = useState(true);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [selectedCase, setSelectedCase] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [userCoins, setUserCoins] = useState(0);

  // Multi-Room State
  const [caseRooms, setCaseRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [showRoomLobbyModal, setShowRoomLobbyModal] = useState(false);
  const [showChatLogModal, setShowChatLogModal] = useState(false);
  const [selectedRoleForJoin, setSelectedRoleForJoin] = useState('');
  const [activeRoom, setActiveRoom] = useState(null);
  const [myParticipantRole, setMyParticipantRole] = useState(null);
  const [roomChatMessages, setRoomChatMessages] = useState([]);
  const [roomTurnInput, setRoomTurnInput] = useState('');
  const [reactionActionInput, setReactionActionInput] = useState('');
  const [isSubmittingTurn, setIsSubmittingTurn] = useState(false);
  const [startingRoom, setStartingRoom] = useState(false);

  // Game Workbench State (Moddalarni qo'lda qo'shish va laboratoriya idishi)
  const [selectedReagents, setSelectedReagents] = useState([]);
  const [isReactionBubbling, setIsReactionBubbling] = useState(false);
  const [copiedRoomInvite, setCopiedRoomInvite] = useState(false);

  // Advanced Game FX & Mendeleyev Table States
  const [showPeriodicTable, setShowPeriodicTable] = useState(false);
  const [activeReactionEvent, setActiveReactionEvent] = useState(null); // { type: 'EXPLOSION' | 'SUCCESS', title, desc, equation, hazardAlert }
  const [screenShake, setScreenShake] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [quantityModalItem, setQuantityModalItem] = useState(null);
  const [customEquivalentInput, setCustomEquivalentInput] = useState('1.0 mol (1 ekv)');

  const turnsEndRef = useRef(null);

  useEffect(() => {
    turnsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [roomChatMessages, isSubmittingTurn]);

  // Load available simulation cases
  useEffect(() => {
    async function loadCases() {
      setLoadingCases(true);
      try {
        const res = await api.get('simulations/cases/');
        const data = res.data;
        const list = Array.isArray(data) ? data : data?.results || [];
        setCases(list);

        const preselectedRoomId = searchParams.get('roomId');
        const preselectedId = searchParams.get('caseId');
        const preselectedCourseId = searchParams.get('courseId');

        if (preselectedRoomId) {
          // Direct room entrance via Invite Link!
          try {
            const joinRes = await api.post('simulations/rooms/join/', {
              room_id: preselectedRoomId,
            });
            const actualRoomId = joinRes.data?.data?.room_id || preselectedRoomId;
            await loadActiveRoom(actualRoomId);
          } catch (e) {
            console.warn('Join attempt fallback to loadActiveRoom:', e);
            await loadActiveRoom(preselectedRoomId);
          }
        } else if (preselectedId) {
          const found = list.find((c) => c.id === preselectedId || c.slug === preselectedId);
          if (found) {
            setSelectedCase(found);
            openRoomLobby(found);
          }
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

  // Load coins
  useEffect(() => {
    async function loadCoins() {
      try {
        const res = await api.get('simulations/my-sessions/');
        const data = res.data;
        const list = Array.isArray(data) ? data : data?.results || [];
        const completed = list.filter(s => s.status === 'COMPLETED');
        const totalCoins = completed.reduce((acc, s) => acc + (s.coins_earned || 0), 0);
        setUserCoins(totalCoins);
      } catch (err) {
        console.warn('Could not load user sessions for coins:', err);
      }
    }
    if (userInfo) {
      loadCoins();
    }
  }, []);

  // Open Room Lobby for a case
  async function openRoomLobby(caseObj) {
    setSelectedCase(caseObj);
    setShowRoomLobbyModal(true);
    setLoadingRooms(true);
    try {
      const res = await api.get(`simulations/cases/${caseObj.id}/rooms/`);
      const rData = res.data?.data?.rooms || [];
      setCaseRooms(rData);
      if (Array.isArray(caseObj.roles_schema) && caseObj.roles_schema.length > 0) {
        setSelectedRoleForJoin(caseObj.roles_schema[0].role_id);
      }
    } catch (err) {
      console.error('Failed to load rooms for case:', err);
    } finally {
      setLoadingRooms(false);
    }
  }

  // Join or Scale Room
  async function handleJoinRoom() {
    if (!selectedCase) return;
    setIsSubmittingTurn(true);
    setErrorMessage('');
    try {
      const res = await api.post('simulations/rooms/join/', {
        case_id: selectedCase.id,
        preferred_role_id: selectedRoleForJoin || undefined,
      });

      const data = res.data?.data;
      setShowRoomLobbyModal(false);
      await loadActiveRoom(data.room_id);
    } catch (err) {
      console.error('Join room failed:', err);
      const msg = err.response?.data?.error?.message || err.response?.data?.detail || "Xonaga ulanishda xatolik yuz berdi.";
      setErrorMessage(msg);
    } finally {
      setIsSubmittingTurn(false);
    }
  }

  // Load details of an active room
  async function loadActiveRoom(roomId) {
    try {
      const res = await api.get(`simulations/rooms/${roomId}/`);
      const data = res.data?.data;
      setActiveRoom(data.room);
      setRoomChatMessages(data.chat_messages || []);
      setMyParticipantRole(data.my_role);
      setSelectedCase(data.case);
    } catch (err) {
      console.error('Load room error:', err);
    }
  }

  // Start room and trigger AI Role-Filler
  async function handleStartRoom() {
    if (!activeRoom) return;
    setStartingRoom(true);
    try {
      await api.post(`simulations/rooms/${activeRoom.id}/start/`);
      await loadActiveRoom(activeRoom.id);
    } catch (err) {
      console.error('Start room error:', err);
      alert('Simulyatsiyani boshlashda xatolik yuz berdi.');
    } finally {
      setStartingRoom(false);
    }
  }

  // Send turn in the Multi-Room Simulator
  async function handleSendRoomTurn(e) {
    if (e) e.preventDefault();
    if (!roomTurnInput.trim() || isSubmittingTurn || !activeRoom) return;

    const currentMsg = roomTurnInput.trim();
    const currentReaction = reactionActionInput.trim();
    setRoomTurnInput('');
    setReactionActionInput('');
    setIsSubmittingTurn(true);

    // Optimistic UI update
    const optimisticMsg = {
      id: `temp-${Date.now()}`,
      sender_name: myParticipantRole?.full_name || 'Siz',
      sender_role: myParticipantRole?.role_title || 'Ishtirokchi',
      is_ai: false,
      message: currentMsg,
      step_number: (activeRoom.current_step || 0) + 1,
      scientific_feedback: currentReaction ? { action: currentReaction, calculating: true } : {},
      created_at: new Date().toISOString(),
    };
    setRoomChatMessages(prev => [...prev, optimisticMsg]);

    try {
      await api.post(`simulations/rooms/${activeRoom.id}/turn/`, {
        message: currentMsg,
        reaction_action: currentReaction,
      });

      // Reload fresh chat messages from backend
      await loadActiveRoom(activeRoom.id);
    } catch (err) {
      console.error('Room turn failed:', err);
      alert('Harakatni yuborishda xatolik yuz berdi.');
      setRoomChatMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
    } finally {
      setIsSubmittingTurn(false);
    }
  }

  function handleLeaveRoom() {
    if (window.confirm("Xonadan chiqmoqchimisiz?")) {
      setActiveRoom(null);
      setMyParticipantRole(null);
      setRoomChatMessages([]);
      setSelectedReagents([]);
    }
  }

  // ========================================================
  // NATIVE WEB AUDIO API SOUND SYNTHESIZER (NO EXTERNAL FILES REQUIRED)
  // ========================================================
  function playExplosionSound() {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Master Dynamics Compressor: maximize loudness without digital clipping
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-14, ctx.currentTime);
      compressor.knee.setValueAtTime(30, ctx.currentTime);
      compressor.ratio.setValueAtTime(16, ctx.currentTime);
      compressor.attack.setValueAtTime(0.001, ctx.currentTime);
      compressor.release.setValueAtTime(0.35, ctx.currentTime);
      compressor.connect(ctx.destination);

      // Master Output Gain with high volume
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(2.2, ctx.currentTime);
      masterGain.connect(compressor);

      // 1. SHOCKWAVE BLAST (Heavy High & Mid Noise Burst)
      const blastBufferSize = Math.floor(ctx.sampleRate * 2.2);
      const blastBuffer = ctx.createBuffer(1, blastBufferSize, ctx.sampleRate);
      const blastData = blastBuffer.getChannelData(0);
      for (let i = 0; i < blastBufferSize; i++) {
        blastData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.45));
      }
      const blastSource = ctx.createBufferSource();
      blastSource.buffer = blastBuffer;

      const blastFilter = ctx.createBiquadFilter();
      blastFilter.type = 'lowpass';
      blastFilter.frequency.setValueAtTime(1400, ctx.currentTime);
      blastFilter.frequency.exponentialRampToValueAtTime(35, ctx.currentTime + 1.8);

      const blastGain = ctx.createGain();
      blastGain.gain.setValueAtTime(2.0, ctx.currentTime);
      blastGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.0);

      blastSource.connect(blastFilter);
      blastFilter.connect(blastGain);
      blastGain.connect(masterGain);
      blastSource.start();

      // 2. SUB-BASS EARTHQUAKE DROP (Deep 30Hz - 80Hz rumble)
      const sub1 = ctx.createOscillator();
      const subGain1 = ctx.createGain();
      sub1.type = 'sawtooth';
      sub1.frequency.setValueAtTime(160, ctx.currentTime);
      sub1.frequency.exponentialRampToValueAtTime(28, ctx.currentTime + 1.2);

      subGain1.gain.setValueAtTime(1.8, ctx.currentTime);
      subGain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.3);

      sub1.connect(subGain1);
      subGain1.connect(masterGain);
      sub1.start();
      sub1.stop(ctx.currentTime + 1.35);

      // 3. LOW SINE PUNCH (Chests-thumping sub punch)
      const sub2 = ctx.createOscillator();
      const subGain2 = ctx.createGain();
      sub2.type = 'sine';
      sub2.frequency.setValueAtTime(95, ctx.currentTime);
      sub2.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 1.5);

      subGain2.gain.setValueAtTime(2.2, ctx.currentTime);
      subGain2.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 1.6);

      sub2.connect(subGain2);
      subGain2.connect(masterGain);
      sub2.start();
      sub2.stop(ctx.currentTime + 1.65);

      // 4. SECONDARY ROLLING THUNDER (Echoing aftershock)
      const rumbleBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 2.5), ctx.sampleRate);
      const rumbleData = rumbleBuffer.getChannelData(0);
      for (let i = 0; i < rumbleData.length; i++) {
        rumbleData[i] = (Math.random() * 2 - 1) * Math.sin(i / 150);
      }
      const rumbleSource = ctx.createBufferSource();
      rumbleSource.buffer = rumbleBuffer;

      const rumbleFilter = ctx.createBiquadFilter();
      rumbleFilter.type = 'bandpass';
      rumbleFilter.frequency.setValueAtTime(120, ctx.currentTime + 0.1);
      rumbleFilter.frequency.linearRampToValueAtTime(45, ctx.currentTime + 2.2);
      rumbleFilter.Q.value = 4;

      const rumbleGain = ctx.createGain();
      rumbleGain.gain.setValueAtTime(0.8, ctx.currentTime + 0.05);
      rumbleGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.4);

      rumbleSource.connect(rumbleFilter);
      rumbleFilter.connect(rumbleGain);
      rumbleGain.connect(masterGain);
      rumbleSource.start(ctx.currentTime + 0.05);
    } catch (e) {
      console.warn('Explosion audio error:', e);
    }
  }

  function playSuccessChime() {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;

        const startTime = ctx.currentTime + i * 0.09;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.25, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.45);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.5);
      });
    } catch (e) {
      console.warn('Success audio error:', e);
    }
  }

  function playFizzingSound() {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const bufferSize = Math.floor(ctx.sampleRate * 0.5);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * 0.3;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 2200;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start();
    } catch (e) {
      console.warn('Fizzing audio error:', e);
    }
  }

  // ========================================================
  // REACTION HAZARDS & EXPLOSIONS DETECTOR
  // ========================================================
  function detectReactionHazard(reagents) {
    if (!reagents || reagents.length === 0) return null;

    const list = reagents.map((r) =>
      (typeof r === 'string' ? r : r.formula || r.name || '').toUpperCase()
    );
    const has = (sub) => list.some((item) => item.includes(sub.toUpperCase()));

    // 1. Mercury (Hg) + Oxygen (O2) / Acids / Heavy thermal burst (User's prime test!)
    if (has('HG') && (has('O2') || has('KISLOROD') || has('HNO3') || has('H2SO4') || has('HCL') || list.length >= 2)) {
      return {
        isHazard: true,
        type: 'EXPLOSION',
        title: '💥 XAVFLI PORTLASH VA ZAHARLI SIMOB BUG\'I!',
        equation: '2Hg + O2 ➔ 2HgO (Shiddatli termik portlash)',
        desc: 'Simob (Hg) kislorod yoki boshqa moddalar bilan xato aralashtirilganda qattiq portlash yuz berdi va zaharli simob bug\'lari havoga tarqaldi! Kolba parchalab tashlandi!',
        hazardAlert: 'CRITICAL_MERCURY_EXPLOSION',
        scoreDelta: -25,
      };
    }

    // 2. Potassium permanganate (KMnO4) + Hydrogen peroxide (H2O2) or any Reducer
    if (has('KMNO4') && (has('H2O2') || has('HCL') || has('ZN') || has('FE') || list.length >= 2)) {
      return {
        isHazard: true,
        type: 'EXPLOSION',
        title: '💥 SHIDDATLI GAZ VA OLOVLI PORTLASH!',
        equation: '2KMnO4 + 3H2O2 ➔ 2MnO2 + 2KOH + 3O2 ^ + 2H2O',
        desc: 'Kaliy permanganat va vodorod peroksid o\'ta shiddatli ekzotermik parchalanib, bir zumda ulkan gaz hajmi va alangali chaqnash otilib chiqdi!',
        hazardAlert: 'VIOLENT_EXOTHERMIC',
        scoreDelta: -20,
      };
    }

    // 3. Nitric acid (HNO3) + Copper (Cu) or Zinc (Zn) or any active metal
    if (has('HNO3') && (has('CU') || has('ZN') || has('FE') || has('NAOH') || list.length >= 2)) {
      return {
        isHazard: true,
        type: 'EXPLOSION',
        title: '⚠️ ZAHARLI QO\'NG\'IR GAZ VA PORTLASH!',
        equation: 'Cu + 4HNO3 ➔ Cu(NO3)2 + 2NO2 ^ + 2H2O',
        desc: 'Konsentrlangan nitrat kislota metall bilan shiddatli reaksiyaga kirishib, zaharli qo\'ng\'ir gaz (NO2) ajralib yuqori bosimdan probirka portladi!',
        hazardAlert: 'TOXIC_GAS_BURST',
        scoreDelta: -20,
      };
    }

    // 4. Overcrowded or unstable aggressive chemicals (3+ items or multi-acids)
    if (list.length >= 3) {
      return {
        isHazard: true,
        type: 'EXPLOSION',
        title: '💥 NAZORATSIZ EKZOTERMIK QAYNASH VA PORTLASH!',
        equation: `${reagents.slice(0, 3).map(r => typeof r === 'string' ? r.split(' ')[0] : r.formula).join(' + ')} ➔ XAVFLI ZILZILALI PORTLASH!`,
        desc: 'Siz laboratoriyada xavfsizlik qoidalariga zid ravishda juda ko\'p agressiv reagentlarni nazoratsiz aralashtirib yubordingiz! Qattiq issiqlik va bosim tufayli portlash ro\'y berdi!',
        hazardAlert: 'UNCONTROLLED_CHAIN_EXPLOSION',
        scoreDelta: -20,
      };
    }

    // 5. Check if it's the standard safe target reaction: (HCl + NaOH) or safe dilution with water
    const isStandardSafe = (has('HCL') && has('NAOH') && list.length === 2) ||
                           (has('HCL') && has('NAOH') && (has('FENOLFTALEIN') || has('LAKMUS') || has('IND') || has('H2O'))) ||
                           (has('H2O') && list.length <= 2);

    if (!isStandardSafe && list.length >= 2) {
      // Any other mixture is an INCORRECT combination -> MUST EXPLODE!
      const reagentNames = reagents.map(r => typeof r === 'string' ? r.split(' ')[0] : r.formula).join(' + ');
      return {
        isHazard: true,
        type: 'EXPLOSION',
        title: '💥 NOTO\'G\'RI MODDALAR ARALASHMASI TUFAYLI PORTLASH!',
        equation: `${reagentNames} ➔ NOTO'G'RI REAKSIYA`,
        desc: `Diqqat! Siz dars talabiga mos kelmaydigan xato kimyoviy moddalarni aralashtirdingiz! Noto'g'ri reaksiyaning termik to'lqini tufayli kolba darz ketib portlash ro'y berdi!`,
        hazardAlert: 'WRONG_SUBSTANCE_EXPLOSION',
        scoreDelta: -15,
      };
    }

    return null;
  }

  // Game Mechanics: Items Inventory (16 REAL LAB REAGENTS)
  function getInteractiveItems(style, caseObj) {
    if (caseObj?.reaction_rules?.interactive_items && Array.isArray(caseObj.reaction_rules.interactive_items) && caseObj.reaction_rules.interactive_items.length >= 10) {
      return caseObj.reaction_rules.interactive_items;
    }
    if (style === 'CHEMISTRY_LAB') {
      return [
        { id: 'HCl', name: 'Xlorid kislota', formula: 'HCl', type: 'acid', color: '#fef08a', desc: 'Kuchli kislota, pH ~ 1' },
        { id: 'NaOH', name: 'Natriy ishqori', formula: 'NaOH', type: 'base', color: '#bae6fd', desc: "O'yuvchi ishqor, pH ~ 14" },
        { id: 'H2SO4', name: 'Sulfat kislota', formula: 'H2SO4', type: 'acid', color: '#fde047', desc: 'Konsentrlangan mineral kislota' },
        { id: 'HNO3', name: 'Nitrat kislota', formula: 'HNO3', type: 'acid', color: '#fed7aa', desc: 'Kuchli oksidlovchi kislota' },
        { id: 'Zn', name: 'Rux donachalari', formula: 'Zn', type: 'metal', color: '#cbd5e1', desc: 'Aktiv metall, gaz ajratadi' },
        { id: 'Cu', name: 'Mis kukuni', formula: 'Cu', type: 'metal', color: '#fdba74', desc: "Qizg'ish o'tish metalli" },
        { id: 'CuSO4', name: 'Mis kuporosi', formula: 'CuSO4', type: 'salt', color: '#38bdf8', desc: 'Moviy kristall tuz' },
        { id: 'Fe', name: 'Temir qirindisi', formula: 'Fe', type: 'metal', color: '#94a3b8', desc: 'Faol ferromagnit metall' },
        { id: 'KMnO4', name: 'Kaliy permanganat', formula: 'KMnO4', type: 'oxidizer', color: '#c084fc', desc: 'Margantsovka, kuchli oksidlovchi' },
        { id: 'H2O2', name: 'Vodorod peroksid', formula: 'H2O2', type: 'peroxide', color: '#f1f5f9', desc: 'Oson parchalanuvchi peroksid' },
        { id: 'Hg', name: 'Simob metalli', formula: 'Hg', type: 'metal', color: '#e2e8f0', desc: "Suyuq og'ir metall, zaharli" },
        { id: 'O2', name: 'Kislorod gazi', formula: 'O2', type: 'gas', color: '#a5f3fc', desc: "Yonishni qo'llovchi gaz" },
        { id: 'Phenolphthalein', name: 'Fenolftalein', formula: 'Fenolftalein', type: 'indicator', color: '#f43f5e', desc: 'Ishqorda pushti rang beradi' },
        { id: 'Lakmus', name: 'Lakmus indikatori', formula: 'Lakmus', type: 'indicator', color: '#818cf8', desc: "Kislotada qizil, asosda ko'k" },
        { id: 'AgNO3', name: 'Kumush nitrat', formula: 'AgNO3', type: 'salt', color: '#f8fafc', desc: 'Xloridlar uchun reaktiv' },
        { id: 'H2O', name: 'Distillangan Suv', formula: 'H2O', type: 'solvent', color: '#e0f2fe', desc: 'Neytral erituvchi' },
      ];
    }
    if (style === 'COURTROOM') {
      return [
        { id: 'evidence_forensic', name: 'Sud Ekspertizasi', formula: 'Ekspertiza #104', type: 'evidence', color: '#e0e7ff', desc: 'DNK va moddiy izlar xulosasi' },
        { id: 'law_article', name: 'Jinoyat Kodeksi', formula: 'JK 168-modda', type: 'law', color: '#fef3c7', desc: 'Firibgarlik bandi' },
        { id: 'witness_proof', name: 'Guvoh Ko\'rsatmasi', formula: 'Guvoh ko\'rsatmasi', type: 'testimony', color: '#f1f5f9', desc: 'Voqea joyidagi guvoh bayonoti' },
        { id: 'contract_doc', name: 'Shartnoma Hujjati', formula: 'Shartnoma #44', type: 'document', color: '#ecfdf5', desc: 'Soxtalashtirilgan imzo dalili' },
        { id: 'objection', name: 'Rasmiy E\'tiroz', formula: 'E\'tiroz!', type: 'action', color: '#fee2e2', desc: 'Asossiz dalilga qarshi e\'tiroz' },
      ];
    }
    if (style === 'CYBER_DEFENSE') {
      return [
        { id: 'firewall_rule', name: 'Firewall Himoyasi', formula: 'WAF Rule', type: 'defense', color: '#dbeafe', desc: 'Port va IP bloklash qoidasi' },
        { id: 'rsa_key', name: 'Shifrlash Kaliti', formula: 'RSA-2048', type: 'cryptography', color: '#fef9c3', desc: 'Asimmetrik shifrlash kaliti' },
        { id: 'packet_sniffer', name: 'Paket Analizatori', formula: 'Wireshark Dump', type: 'tool', color: '#ede9fe', desc: 'Tarmoq trafik tahlili' },
        { id: 'quarantine_host', name: 'Xostni Izolyatsiya Qilish', formula: 'Quarantine Host', type: 'action', color: '#fee2e2', desc: 'Zararlangan tugunni ajratish' },
      ];
    }
    return [
      { id: 'action_analyze', name: 'Tahlil Qilish', formula: 'Tahlil', type: 'action', color: '#fef3c7', desc: 'Vaziyatni o\'rganish' },
      { id: 'action_hypothesize', name: 'Gipoteza Berish', formula: 'Gipoteza', type: 'hypothesis', color: '#e0f2fe', desc: 'Taxmin ilgari surish' },
      { id: 'action_verify', name: 'Tajribada Sinash', formula: 'Sinov', type: 'verify', color: '#dcfce7', desc: 'Amaliy tekshirish' },
    ];
  }

  function getBeakerLiquidColor(reagents) {
    if (!reagents || reagents.length === 0) return 'transparent';
    const str = reagents.map(r => (typeof r === 'string' ? r : r.formula || '')).join(' ').toLowerCase();
    if (str.includes('kmno4')) {
      return '#7e22ce'; // Dark royal purple
    }
    if (str.includes('hg')) {
      return '#94a3b8'; // Liquid mercury silver-gray
    }
    if (str.includes('fenolftalein') && (str.includes('naoh') || str.includes('ishqor'))) {
      return '#ec4899'; // Vibrant magenta / deep pink
    }
    if (str.includes('cuso4') || str.includes('cu')) {
      return '#0284c7'; // Brilliant copper sulfate sky blue
    }
    if (str.includes('hcl') && str.includes('naoh')) {
      return '#fef08a'; // Neutral salty warm tone
    }
    if (str.includes('zn') && (str.includes('hcl') || str.includes('h2so4'))) {
      return '#cbd5e1'; // Metallic effervescent gray
    }
    if (str.includes('hno3')) {
      return '#fdba74'; // Amber-orange nitric acid tone
    }
    if (str.includes('h2so4')) {
      return '#eab308'; // Golden amber acidic tone
    }
    if (str.includes('hcl')) {
      return '#fde047'; // Translucent light yellow
    }
    if (str.includes('naoh')) {
      return '#bae6fd'; // Light clear blue
    }
    return '#38bdf8';
  }

  function handleOpenQuantityModal(item) {
    setQuantityModalItem(item);
    setCustomEquivalentInput('1.0 mol (1 ekv)');
  }

  function handleAddReagentWithQuantity(item, quantityStr) {
    const formula = item.formula || item.symbol || item.name || item.id;
    const displayName = `${formula} (${quantityStr})`;
    setSelectedReagents((prev) => [...prev, displayName]);
    setQuantityModalItem(null);
    playFizzingSound();
  }

  function handleRemoveReagentFromFlask(idx) {
    setSelectedReagents((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleClearFlask() {
    setSelectedReagents([]);
    setActiveReactionEvent(null);
  }

  async function handleTriggerGameReaction() {
    if (selectedReagents.length === 0) {
      alert("Iltimos, avval tokchadan moddalarni tanlab kolbaga soling!");
      return;
    }
    setIsReactionBubbling(true);
    setIsSubmittingTurn(true);

    const mixStr = selectedReagents.join(' + ');
    const localHazard = detectReactionHazard(selectedReagents);

    // Agar darhol mahalliy xavf aniqlansa, darhol tovush va silkini effektini yoqish
    if (localHazard && localHazard.type === 'EXPLOSION') {
      triggerMassiveExplosionSound(soundEnabled);
      playExplosionSound();
      document.body.classList.add('violent-screen-shake');
      document.getElementById('root')?.classList.add('violent-screen-shake');
      setScreenShake(true);
      setTimeout(() => {
        document.body.classList.remove('violent-screen-shake');
        document.getElementById('root')?.classList.remove('violent-screen-shake');
        setScreenShake(false);
      }, 2000);
    }

    const speechText = `Men laboratoriya idishiga ${mixStr} namunalarini soldim. OpenAI orqali reaksiyani hisoblaymiz!`;

    // Optimistic message
    const optimisticMsg = {
      id: `temp-${Date.now()}`,
      sender_name: myParticipantRole?.full_name || 'Siz',
      sender_role: myParticipantRole?.role_title || 'Ishtirokchi',
      is_ai: false,
      message: speechText,
      step_number: (activeRoom?.current_step || 0) + 1,
      scientific_feedback: { action: `${mixStr} reaksiyasi`, calculating: true },
      created_at: new Date().toISOString(),
    };
    setRoomChatMessages((prev) => [...prev, optimisticMsg]);

    try {
      // Ensure active room exists or auto-join
      let roomId = activeRoom?.id;
      if (!roomId && selectedCase) {
        const joinRes = await api.post('simulations/rooms/join/', { case_id: selectedCase.id });
        roomId = joinRes.data?.data?.room_id;
        if (roomId) await loadActiveRoom(roomId);
      }

      if (!roomId) {
        throw new Error("Simulyatsiya xonasi topilmadi.");
      }

      // OpenAI GPT-4o backendga so'rov yuborish
      const res = await api.post(`simulations/rooms/${roomId}/turn/`, {
        message: speechText,
        reaction_action: `${mixStr} kimyoviy moddalar aralashmasi`,
      });

      const reactionData = res.data?.data?.reaction_result || {};
      const isExplosion =
        (reactionData.hazard_alert && String(reactionData.hazard_alert).toUpperCase().includes('EXPLOSION')) ||
        (localHazard && localHazard.type === 'EXPLOSION');

      if (isExplosion) {
        // Portlash effekti va ovoz
        triggerMassiveExplosionSound(soundEnabled);
        playExplosionSound();
        document.body.classList.add('violent-screen-shake');
        document.getElementById('root')?.classList.add('violent-screen-shake');
        setScreenShake(true);
        setTimeout(() => {
          document.body.classList.remove('violent-screen-shake');
          document.getElementById('root')?.classList.remove('violent-screen-shake');
          setScreenShake(false);
        }, 2000);

        setActiveReactionEvent({
          type: 'EXPLOSION',
          title: localHazard?.title || '💥 XAVFLI KIMYOVIY PORTLASH!',
          equation: reactionData.chemical_equation || localHazard?.equation || `${mixStr} ➔ PORTLASH`,
          desc: reactionData.scientific_explanation || localHazard?.desc || 'Reaksiya xavfli tus oldi va portlash yuz berdi!',
          visualEffect: reactionData.visual_effect || '💥 Kuchli portlash va tutun ko\'tarildi!',
          hazardAlert: reactionData.hazard_alert || localHazard?.hazardAlert || 'CRITICAL_HAZARD',
          scoreDelta: reactionData.score_delta || -15,
          aiModel: reactionData.ai_model || 'OpenAI GPT-4o',
        });
      } else {
        // Muvaffaqiyatli reaksiya
        playSuccessChime();
        playFizzingSound();

        setActiveReactionEvent({
          type: 'SUCCESS',
          title: '✨ OpenAI GPT-4o Ilmiy Reaksiya Tahlili',
          equation: reactionData.chemical_equation || `${mixStr} reaksiyasi`,
          desc: reactionData.scientific_explanation || 'Reaksiya muvaffaqiyatli amalga oshdi.',
          visualEffect: reactionData.visual_effect || 'Moddalar o\'zaro ta\'sirlashdi va yangi mahsulot hosil bo\'ldi.',
          hazardAlert: reactionData.hazard_alert || 'NONE',
          scoreDelta: reactionData.score_delta || 15,
          aiModel: reactionData.ai_model || 'OpenAI GPT-4o',
        });
      }

      // Xona ma'lumotlarini yangilash (AI NPC botlar javobini olish uchun)
      await loadActiveRoom(roomId);
    } catch (err) {
      console.error('AI Reaction failed:', err);
      // Agar backend xatosi bo'lsa mahalliy hisob-kitob bilan davom etish
      if (localHazard && localHazard.type === 'EXPLOSION') {
        setActiveReactionEvent({
          type: 'EXPLOSION',
          title: localHazard.title,
          equation: localHazard.equation,
          desc: localHazard.desc,
          hazardAlert: localHazard.hazardAlert,
          aiModel: 'OpenAI GPT-4o (Lokal)',
        });
      }
    } finally {
      setIsSubmittingTurn(false);
      setTimeout(() => setIsReactionBubbling(false), 2000);
    }
  }

  // Helpers for Style, Backgrounds & Avatars
  function getStyleInfo(style) {
    switch (style) {
      case 'CHEMISTRY_LAB':
        return { name: 'Kimyo Laboratoriyasi', icon: FlaskConical, color: 'text-amber-800 bg-amber-100 border-amber-300' };
      case 'COURTROOM':
        return { name: 'Sud Zali', icon: Scale, color: 'text-indigo-800 bg-indigo-100 border-indigo-300' };
      case 'MEDICAL_ER':
        return { name: 'Tibbiy Reanimatsiya', icon: Activity, color: 'text-rose-800 bg-rose-100 border-rose-300' };
      case 'CYBER_DEFENSE':
        return { name: 'Kiber-Xavfsizlik', icon: ShieldCheck, color: 'text-emerald-800 bg-emerald-100 border-emerald-300' };
      default:
        return { name: 'Interaktiv Simulyator', icon: Sparkles, color: 'text-amber-800 bg-amber-100 border-amber-300' };
    }
  }

  function getStyleBackground(style) {
    switch (style) {
      case 'CHEMISTRY_LAB':
        return '/backgrounds/chemistry_lab.jpg';
      case 'COURTROOM':
        return '/backgrounds/courtroom.jpg';
      case 'CYBER_DEFENSE':
        return '/backgrounds/cyber_defense.jpg';
      case 'MEDICAL_ER':
        return '/backgrounds/medical_er.jpg';
      default:
        return '/backgrounds/chemistry_lab.jpg';
    }
  }

  function getParticipantAvatar(participant, index) {
    const role = (participant?.role_title || '').toLowerCase();
    if (role.includes('bosh') || role.includes('kimyogar') || role.includes('olim')) {
      return '/avatars/scientist.jpg';
    }
    if (role.includes('laborant') || role.includes('tahlil') || role.includes('yordamchi')) {
      return '/avatars/analyst.jpg';
    }
    if (role.includes('xavfsizlik') || role.includes('muhandis') || role.includes('inspektor')) {
      return '/avatars/inspector.jpg';
    }
    if (role.includes('sudya') || role.includes('prokuror') || role.includes('advokat') || role.includes('hisobchi')) {
      return '/avatars/judge.jpg';
    }
    const defaultAvatars = [
      '/avatars/scientist.jpg',
      '/avatars/analyst.jpg',
      '/avatars/inspector.jpg',
      '/avatars/judge.jpg',
    ];
    return defaultAvatars[index % defaultAvatars.length];
  }

  // Get the latest message for a character to show in their speech bubble
  function getCharacterLatestMessage(participant) {
    if (!roomChatMessages || roomChatMessages.length === 0) return null;
    const roleTitle = participant.role_title;
    for (let i = roomChatMessages.length - 1; i >= 0; i--) {
      const msg = roomChatMessages[i];
      if (
        msg.sender_role === roleTitle ||
        (msg.sender_name && msg.sender_name.includes(roleTitle)) ||
        (participant.user && msg.sender_user === participant.user)
      ) {
        return msg;
      }
    }
    return null;
  }

  // Latest reaction feedback in room
  const latestReactionFeedback = [...roomChatMessages]
    .reverse()
    .find(m => m.scientific_feedback && m.scientific_feedback.chemical_equation && m.scientific_feedback.chemical_equation !== 'N/A')
    ?.scientific_feedback;

  // Latest narrator direction
  const latestNarratorMessage = [...roomChatMessages]
    .reverse()
    .find(m => m.sender_role === 'SYSTEM_DIRECTOR');

  const filteredCases = cases.filter((c) => {
    if (activeCategory === 'ALL') return true;
    const slug = (c.slug || c.title || '').toLowerCase();
    if (activeCategory === 'SCIENCE') {
      return slug.includes('bio') || slug.includes('dnk') || slug.includes('fizika') || slug.includes('kvant') || slug.includes('kimyo') || c.room_style === 'CHEMISTRY_LAB';
    }
    if (activeCategory === 'HUMANITIES') {
      return slug.includes('sud') || slug.includes('shartnoma') || slug.includes('huquq') || slug.includes('tarix') || c.room_style === 'COURTROOM';
    }
    return true;
  });

  return (
    <div className={`min-h-screen bg-[#fdfaf5] text-[#120f0d] flex flex-col font-sans selection:bg-[#967b4f]/25 ${screenShake ? 'violent-screen-shake' : ''}`}>
      {/* Header */}
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
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#967b4f] to-[#78613c] flex items-center justify-center text-white shadow-md">
              <Bot className="w-4.5 h-4.5" />
            </div>
            <div>
              <span className="font-serif font-black text-sm tracking-wide text-[#120f0d] flex items-center gap-1.5">
                Chronous AI <span className="text-[11px] text-[#967b4f] font-normal hidden sm:inline">| Simulyator Sahnalari</span>
              </span>
            </div>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-300 px-3 py-1 rounded-full shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>OpenAI GPT-4o Faol</span>
            </span>
            {isSubmittingTurn && (
              <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-300 px-2.5 py-0.5 rounded-full shadow-sm animate-pulse">
                <Sparkles className="w-3 h-3 text-amber-600 animate-spin" />
                <span>AI Tahlil Qilmoqda...</span>
              </span>
            )}
          </div>
        </div>

        {/* User Stats & Controls */}
        <div className="flex items-center gap-3">
          {activeRoom && (
            <>
              <button
                onClick={() => setShowChatLogModal(true)}
                className="flex items-center gap-1.5 text-xs text-[#4a3d31] hover:text-[#120f0d] px-3.5 py-1.5 rounded-full border border-[#967b4f]/30 bg-white hover:bg-[#fdfaf5] transition-all font-bold shadow-sm"
              >
                <History className="w-3.5 h-3.5 text-[#967b4f]" />
                <span className="hidden sm:inline">Xabarlar Tarixi</span>
              </button>

              <button
                onClick={handleLeaveRoom}
                className="flex items-center gap-1.5 text-xs text-rose-700 hover:text-rose-900 px-3 py-1.5 rounded-full border border-rose-300 bg-rose-50 hover:bg-rose-100 transition-all font-bold"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Chiqish</span>
              </button>
            </>
          )}

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-xs font-black text-amber-900 shadow-sm">
            <Coins className="w-3.5 h-3.5 text-[#967b4f]" />
            <span>{userCoins} Tanga</span>
          </div>

          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 flex flex-col">
        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-4 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between shadow-sm animate-in fade-in">
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

        {/* ======================================================== */}
        {/* VIEW 1: VIRTUAL 3D SCENIC STAGE WITH PERSONAJLAR & SPEECH BUBBLES */}
        {/* ======================================================== */}
        {activeRoom ? (
          <div className="flex-1 flex flex-col space-y-4 animate-in fade-in">
            {/* Stage Top Bar */}
            <div className="p-4 bg-white border border-[#967b4f]/25 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-md">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black border ${getStyleInfo(selectedCase?.room_style).color}`}>
                    {React.createElement(getStyleInfo(selectedCase?.room_style).icon, { className: "w-3.5 h-3.5" })}
                    <span>{getStyleInfo(selectedCase?.room_style).name}</span>
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#967b4f] text-white text-xs font-black">
                    Xona #{activeRoom.room_number}
                  </span>
                  <span className="text-xs text-[#827161]">
                    Ishtirokchilar: <strong>{activeRoom.participants?.length || 0} / {activeRoom.max_participants}</strong>
                  </span>
                </div>
                <h2 className="text-lg font-serif font-black text-[#120f0d]">
                  {selectedCase?.title}
                </h2>
              </div>

              {/* Status & Action Buttons */}
              <div className="flex items-center gap-3">
                {/* Direct Invite Link Copy Button */}
                <button
                  type="button"
                  onClick={() => {
                    const inviteUrl = `${window.location.origin}/simulation?roomId=${activeRoom.id}&caseId=${selectedCase?.id || ''}`;
                    navigator.clipboard.writeText(inviteUrl);
                    setCopiedRoomInvite(true);
                    setTimeout(() => setCopiedRoomInvite(false), 3000);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border shadow-sm ${
                    copiedRoomInvite
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-[#967b4f]/10 hover:bg-[#967b4f]/20 text-[#120f0d] border-[#967b4f]/35'
                  }`}
                  title="Ushbu simulyatsiya xonasiga o'quvchilarni taklif qilish havolasi"
                >
                  {copiedRoomInvite ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-white" />
                      <span>Havola Nusxalandi!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-[#967b4f]" />
                      <span>Taklif Havolasi</span>
                    </>
                  )}
                </button>

                {/* Mendeleyev Periodic Table Button */}
                <button
                  type="button"
                  onClick={() => setShowPeriodicTable(true)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 shadow-sm cursor-pointer"
                  title="D.I. Mendeleyev kimyoviy elementlar davriy jadvalini ochish"
                >
                  <Atom className="w-4 h-4 text-amber-600 animate-spin" style={{ animationDuration: '8s' }} />
                  <span className="hidden sm:inline">Mendeleyev Jadvali</span>
                </button>

                {/* Sound FX Toggle Button */}
                <button
                  type="button"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="p-2 rounded-xl text-xs font-bold border border-[#967b4f]/25 bg-white text-[#827161] hover:text-[#120f0d] shadow-sm cursor-pointer"
                  title={soundEnabled ? "Ovozli effektlar yoqilgan (Portlash, reaksiyalar)" : "Ovoz o'chirilgan"}
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4 text-gray-400" />}
                </button>

                <div className="text-right px-4 py-1.5 rounded-2xl bg-[#fdfaf5] border border-[#967b4f]/25">
                  <div className="text-[10px] text-[#827161] font-bold uppercase">To'plangan Ball</div>
                  <div className="text-base font-black text-[#967b4f]">
                    {Math.round(myParticipantRole?.individual_score || 0)} ball
                  </div>
                </div>

                {activeRoom.status === 'WAITING' && (
                  <button
                    onClick={handleStartRoom}
                    disabled={startingRoom}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:brightness-110 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    {startingRoom ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>AI Botlar joylashmoqda...</span>
                      </>
                    ) : (
                      <>
                        <Bot className="w-4 h-4" />
                        <span>Simulyatsiyani Boshlash (AI Rollar)</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* ======================================================== */}
            {/* THE IMMERSIVE VISUAL SIMULATOR ROOM STAGE */}
            {/* ======================================================== */}
            <div className={`relative min-h-[580px] sm:min-h-[660px] rounded-3xl overflow-hidden shadow-2xl border-2 border-[#967b4f]/30 flex flex-col justify-between ${screenShake ? 'screen-shake' : ''}`}>
              {/* Background Scenic Image */}
              <img
                src={getStyleBackground(selectedCase?.room_style)}
                alt="Simulator Room Scene"
                className="absolute inset-0 w-full h-full object-cover object-center filter brightness-[0.9] contrast-[1.08] transition-all duration-700"
              />

              {/* Dark Ambient Vignette Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/60 pointer-events-none" />

              {/* ======================================================== */}
              {/* TOP HUD: Cinematic Narration Prompt & Scenario */}
              <div className="relative z-10 p-4 sm:p-6 w-full max-w-3xl mx-auto space-y-2">
                <div className="bg-black/65 backdrop-blur-md border border-white/20 text-white rounded-2xl p-4 shadow-2xl space-y-2">
                  <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                    <span className="text-[11px] font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                      {latestNarratorMessage ? latestNarratorMessage.sender_name : "Ssenariy Yo'riqnomasi"}
                    </span>
                    <span className="text-[10px] text-gray-300 font-mono">
                      Qadam #{activeRoom.current_step || 0}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-100 leading-relaxed font-sans">
                    {latestNarratorMessage ? latestNarratorMessage.message : selectedCase?.description}
                  </p>
                </div>

                {/* Central Scientific Reaction Hologram / Workbench Feedback */}
                {latestReactionFeedback && (
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/85 via-black/85 to-emerald-950/85 backdrop-blur-md border-2 border-amber-400 text-white text-xs shadow-2xl animate-in zoom-in-95 space-y-1">
                    <div className="flex items-center justify-between font-bold text-[11px] text-amber-300">
                      <span className="flex items-center gap-1.5">
                        <FlaskConical className="w-4 h-4 text-amber-400 animate-bounce" />
                        Reaksiya & Hodisa Natijasi:
                      </span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500 text-white font-black text-[10px]">
                        +{latestReactionFeedback.score_delta || 10} ball
                      </span>
                    </div>

                    <div className="font-mono text-xs sm:text-sm font-black text-amber-200 bg-white/10 p-2 rounded-xl border border-white/15">
                      {latestReactionFeedback.chemical_equation}
                    </div>

                    {latestReactionFeedback.visual_effect && (
                      <p className="text-[11px] text-emerald-200">
                        <strong>Vizual o'zgarish:</strong> {latestReactionFeedback.visual_effect}
                      </p>
                    )}

                    {latestReactionFeedback.hazard_alert && latestReactionFeedback.hazard_alert !== 'NONE' && (
                      <p className="text-[11px] text-rose-300 font-bold">
                        ⚠️ Xavfsizlik signali: {latestReactionFeedback.hazard_alert}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* ======================================================== */}
              {/* CHARACTERS (PERSONAJLAR) & HOVERING SPEECH BUBBLES */}
              {/* ======================================================== */}
              <div className="relative z-10 w-full px-2 sm:px-6 pb-2 pt-8">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 items-end">
                  {activeRoom.participants?.map((p, idx) => {
                    const latestMsg = getCharacterLatestMessage(p);
                    const isCurrentUser = p.user === userInfo?.id || p.username === userInfo?.username;
                    const avatarUrl = getParticipantAvatar(p, idx);
                    const isLatestSpeaker = roomChatMessages.length > 0 &&
                      (roomChatMessages[roomChatMessages.length - 1].sender_role === p.role_title ||
                       roomChatMessages[roomChatMessages.length - 1].sender_name?.includes(p.role_title));

                    return (
                      <div key={p.id || idx} className="flex flex-col items-center group relative">
                        {/* ======================================================== */}
                        {/* SPEECH BUBBLE DIRECTLY ABOVE CHARACTER'S HEAD */}
                        {/* ======================================================== */}
                        <div
                          className={`w-full max-w-[260px] relative mb-3 p-3 rounded-2xl shadow-2xl transition-all duration-300 ${
                            isLatestSpeaker
                              ? 'bg-white text-gray-900 ring-4 ring-amber-400 animate-in zoom-in-95 scale-105 z-30'
                              : 'bg-white/90 backdrop-blur-md text-gray-900 border border-white/40 z-20'
                          }`}
                        >
                          {/* Downward pointing speech bubble tail */}
                          <div
                            className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 ${
                              isLatestSpeaker ? 'bg-white ring-2 ring-amber-400' : 'bg-white/90'
                            }`}
                          />

                          {/* Speaker Tag Header */}
                          <div className="flex items-center justify-between border-b border-gray-200 pb-1 mb-1.5">
                            <span className="text-[10px] font-black uppercase tracking-wider text-[#967b4f] flex items-center gap-1 truncate">
                              {p.is_ai ? <Bot className="w-3 h-3 text-indigo-600" /> : <User className="w-3 h-3 text-emerald-600" />}
                              <span>{p.role_title}</span>
                            </span>
                            {isLatestSpeaker && (
                              <span className="text-[9px] font-black bg-amber-500 text-white px-1.5 py-0.2 rounded-full animate-pulse">
                                GAPIRMOQDA
                              </span>
                            )}
                          </div>

                          {/* Speech Message Body */}
                          <div className="text-[11px] sm:text-xs leading-relaxed font-sans line-clamp-4 text-gray-800">
                            {latestMsg ? (
                              <p className="whitespace-pre-wrap">{latestMsg.message}</p>
                            ) : (
                              <p className="italic text-gray-400 text-[10px]">
                                {p.role_goal ? `Vazifasi: ${p.role_goal.slice(0, 50)}...` : "Vaziyatni kuzatmoqda..."}
                              </p>
                            )}
                          </div>

                          {/* Mini Reaction Formula Badge if character triggered equation */}
                          {latestMsg?.scientific_feedback?.chemical_equation && latestMsg.scientific_feedback.chemical_equation !== 'N/A' && (
                            <div className="mt-1.5 text-[9px] font-mono font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 truncate">
                              🧪 {latestMsg.scientific_feedback.chemical_equation}
                            </div>
                          )}
                        </div>

                        {/* ======================================================== */}
                        {/* 3D CHARACTER AVATAR (PERSONAJ) */}
                        {/* ======================================================== */}
                        <div className="relative flex flex-col items-center">
                          <div
                            className={`relative rounded-full p-1 transition-transform duration-300 group-hover:scale-105 shadow-2xl ${
                              isCurrentUser
                                ? 'bg-gradient-to-tr from-amber-400 via-amber-200 to-amber-500 ring-4 ring-amber-400/80 animate-pulse'
                                : p.is_ai
                                ? 'bg-gradient-to-tr from-indigo-500 via-cyan-400 to-purple-600 ring-2 ring-cyan-400/60'
                                : 'bg-gradient-to-tr from-emerald-500 to-teal-400 ring-2 ring-emerald-400/60'
                            }`}
                          >
                            <img
                              src={avatarUrl}
                              alt={p.role_title}
                              className="w-20 h-20 sm:w-28 sm:h-28 rounded-full object-cover object-top filter contrast-105 shadow-inner"
                            />

                            {/* Badge Icon on Avatar */}
                            <div
                              className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs shadow-md border-2 border-white ${
                                p.is_ai ? 'bg-indigo-600' : 'bg-emerald-600'
                              }`}
                            >
                              {p.is_ai ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                            </div>
                          </div>

                          {/* Pedestal & Character Nameplate */}
                          <div className="mt-2 text-center bg-black/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 shadow-xl max-w-[150px] sm:max-w-[180px]">
                            <div className="text-white text-[11px] sm:text-xs font-bold truncate">
                              {p.is_ai ? `🤖 ${p.role_title}` : (p.full_name || p.username)}
                            </div>
                            <div className="text-[9px] text-amber-300 font-extrabold uppercase tracking-wide">
                              {isCurrentUser ? "★ SIZ (Talaba)" : p.is_ai ? "AI Bot (Nazoratda)" : p.role_title}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ======================================================== */}
              {/* GAME-LIKE INTERACTIVE WORKBENCH (QO'LDA MODDALARNI QO'SHISH & REAKSIYA KOLBASI) */}
              {/* ======================================================== */}
              <div className="relative z-20 p-3 sm:p-5 bg-black/90 backdrop-blur-xl border-t-2 border-[#967b4f]/40 space-y-3.5">
                {/* 1. REAGENT SHELF (TOKCHADAGI REAGENTLAR VA MODDALAR) */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <FlaskConical className="w-4 h-4 text-amber-400 animate-pulse" />
                      <span className="text-xs font-black uppercase tracking-wider text-amber-300">
                        {selectedCase?.room_style === 'CHEMISTRY_LAB' ? "Reagentlar & Moddalar Tokchasi (16 ta modda)" : "Amaliy Vositalar & Dalillar Tokchasi"}
                      </span>
                      <span className="text-[10px] text-gray-400 hidden sm:inline">
                        (Miqdori va ekvivalentini tanlash uchun moddani bosing)
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowPeriodicTable(true)}
                        className="text-[11px] font-mono font-bold text-amber-300 bg-amber-500/20 hover:bg-amber-500/30 px-3 py-1 rounded-xl border border-amber-400/40 flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Atom className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
                        <span>Mendeleyev Jadvali</span>
                      </button>
                      <span className="text-[10px] font-mono text-amber-400/80 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20 hidden sm:inline">
                        🎮 Laboratoriya Paneli
                      </span>
                    </div>
                  </div>

                  {/* Scrollable Reagent Cards */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
                    {getInteractiveItems(selectedCase?.room_style, selectedCase).map((item, i) => (
                      <button
                        key={item.id || i}
                        type="button"
                        onClick={() => handleOpenQuantityModal(item)}
                        className="group shrink-0 p-2 sm:p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 hover:border-amber-400/80 transition-all flex items-center gap-2 shadow-md active:scale-95 text-left cursor-pointer"
                        title={`${item.name} (${item.desc || ''}) - Miqdor va ekvivalent tanlash`}
                      >
                        <div
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center font-mono font-black text-[11px] sm:text-xs shadow-inner"
                          style={{ backgroundColor: item.color || '#fef08a', color: '#1e293b' }}
                        >
                          {item.formula ? item.formula.slice(0, 4) : item.id.slice(0, 3)}
                        </div>
                        <div className="pr-1">
                          <div className="text-[11px] sm:text-xs font-bold text-white group-hover:text-amber-300 transition-colors flex items-center gap-1">
                            <span>{item.name}</span>
                            <Plus className="w-3 h-3 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <div className="text-[9px] text-gray-400 truncate max-w-[120px]">
                            {item.desc || (item.formula ? `Formula: ${item.formula}` : 'Reagent')}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. CENTRAL REACTION BEAKER & WORKBENCH */}
                <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-white/5 via-white/10 to-white/5 border border-white/15 flex flex-col md:flex-row items-center justify-between gap-4">
                  {/* Visual Animated Flask / Beaker */}
                  <div className="flex items-center gap-3.5">
                    <div className="relative w-14 h-18 sm:w-16 sm:h-20 bg-white/10 border-2 border-white/40 rounded-b-2xl rounded-t-lg flex flex-col justify-end p-1 overflow-hidden shadow-inner shrink-0">
                      {/* Beaker Measuring Markings */}
                      <div className="absolute top-2 left-1 text-[8px] font-mono text-gray-400 leading-none">200</div>
                      <div className="absolute top-6 left-1 text-[8px] font-mono text-gray-400 leading-none">100</div>
                      <div className="absolute top-10 left-1 text-[8px] font-mono text-gray-400 leading-none">50</div>
                      <div className="absolute top-2 right-1 w-2 h-px bg-white/30" />
                      <div className="absolute top-6 right-1 w-3 h-px bg-white/30" />
                      <div className="absolute top-10 right-1 w-2 h-px bg-white/30" />

                      {/* Dynamic Liquid Level */}
                      <div
                        className={`w-full rounded-b-xl transition-all duration-700 relative overflow-hidden ${
                          isReactionBubbling ? 'animate-pulse' : ''
                        }`}
                        style={{
                          height: selectedReagents.length === 0 ? '0%' : `${Math.min(95, selectedReagents.length * 28)}%`,
                          backgroundColor: getBeakerLiquidColor(selectedReagents),
                        }}
                      >
                        {/* Reaction Bubbles when mixing */}
                        {isReactionBubbling && (
                          <div className="absolute inset-0 flex items-center justify-around animate-bounce">
                            <span className="w-1.5 h-1.5 rounded-full bg-white/80 animate-ping" />
                            <span className="w-2 h-2 rounded-full bg-white/80 animate-pulse" />
                            <span className="w-1 h-1 rounded-full bg-white/80 animate-ping" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Contents of Flask */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-black uppercase text-amber-300">
                          Tajriba Kolbasi Tarkibi:
                        </span>
                        {selectedReagents.length > 0 && (
                          <button
                            type="button"
                            onClick={handleClearFlask}
                            className="text-[10px] text-rose-400 hover:text-rose-300 underline flex items-center gap-0.5 cursor-pointer"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                            <span>Tozalash</span>
                          </button>
                        )}
                      </div>

                      {selectedReagents.length === 0 ? (
                        <p className="text-[11px] text-gray-400 italic">
                          Kolba bo'sh. Tokchadan moddalarni (HCl, NaOH...) bosing va kolbaga qo'shing!
                        </p>
                      ) : (
                        <div className="flex flex-wrap items-center gap-1.5">
                          {selectedReagents.map((reagent, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-400/20 text-amber-200 border border-amber-400/40 text-[11px] font-mono font-bold animate-in zoom-in-95"
                            >
                              <span>🧪 {reagent}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveReagentFromFlask(idx)}
                                className="text-amber-400 hover:text-white ml-0.5 font-bold cursor-pointer"
                                title="Olib tashlash"
                              >
                                ✕
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Primary Game Trigger: Reaksiyaga Kirishtirish */}
                  <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
                    <button
                      type="button"
                      disabled={isSubmittingTurn || selectedReagents.length === 0}
                      onClick={handleTriggerGameReaction}
                      className="w-full md:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-[#967b4f] to-amber-600 hover:brightness-110 text-white font-black text-xs sm:text-sm shadow-xl shadow-amber-500/30 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                    >
                      {isSubmittingTurn ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>AI Reaksiyani Hisoblamoqda...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 text-amber-200 fill-amber-300" />
                          <span>⚡ Reaksiyaga Kirishtirish (Aralashtirish)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* 3. SPEECH / COLLABORATIVE DIALOGUE INPUT */}
                <form onSubmit={handleSendRoomTurn} className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    placeholder={`${myParticipantRole?.role_title || 'O\'z rolingizda'} savol bering yoki qo'shimcha ilmiy xulosa bildiring...`}
                    value={roomTurnInput}
                    onChange={(e) => setRoomTurnInput(e.target.value)}
                    disabled={isSubmittingTurn}
                    className="bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-xl px-4 py-2.5 flex-1 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingTurn || !roomTurnInput.trim()}
                    className="px-5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs sm:text-sm border border-white/20 disabled:opacity-40 flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Yuborish</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        ) : (
          /* ======================================================== */
          /* VIEW 2: CASES CATALOG & SELECTION */
          /* ======================================================== */
          <div className="space-y-8 animate-in fade-in">
            {/* Catalog Hero Banner */}
            <div className="bg-gradient-to-br from-white via-[#fdfbf9] to-amber-50/30 border border-[#967b4f]/25 rounded-3xl p-6 sm:p-8 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/25 text-amber-900 text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-[#967b4f]" />
                  <span>Dinamik Multi-Xonali Simulyatsiya Tizimi</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-serif font-black text-[#120f0d] tracking-tight">
                  Professional Amaliy Keyslar va Sahnalar
                </h1>
                <p className="text-xs sm:text-sm text-[#827161] leading-relaxed">
                  Sud zali, kimyo laboratoriyasi va boshqa real muhitlarda 3D personajlar va AI botlar nazoratidagi simulyatsiyalarda qatnashing.
                </p>
              </div>

              {userInfo?.role === 'mentor' && (
                <Link
                  to="/mentor/dashboard"
                  className="px-5 py-2.5 rounded-xl bg-[var(--gold)] text-white font-bold text-xs shadow-md hover:brightness-105 flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Yangi Simulyator Yaratish</span>
                </Link>
              )}
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-2 border-b border-[#967b4f]/20 pb-3 overflow-x-auto">
              {[
                { id: 'ALL', label: 'Barcha Simulyatsiyalar' },
                { id: 'SCIENCE', label: 'Kimyo & Aniq Fanlar' },
                { id: 'HUMANITIES', label: 'Sud & Huquqshunoslik' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    activeCategory === cat.id
                      ? 'bg-[#967b4f] text-white shadow-sm'
                      : 'bg-white text-[#827161] hover:text-[#120f0d] border border-[#967b4f]/20 hover:bg-[#967b4f]/10'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Cases Cards Grid */}
            {loadingCases ? (
              <div className="py-20 text-center text-xs text-[#827161]">
                <div className="w-8 h-8 border-2 border-[#967b4f] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <span>Simulyatsiya keyslari yuklanmoqda...</span>
              </div>
            ) : filteredCases.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-[#967b4f]/20 p-8 shadow-sm">
                <BookOpen className="w-12 h-12 text-[#967b4f] mx-auto mb-3 opacity-60" />
                <h3 className="font-serif font-bold text-lg text-[#120f0d]">Simulyatsiya keyslari topilmadi</h3>
                <p className="text-xs text-[#827161] mt-1 max-w-sm mx-auto">
                  Mentor profilingizdan darslik asosida yangi AI Simulyator yarating!
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCases.map((c) => {
                  const styleInfo = getStyleInfo(c.room_style);
                  const IconComponent = styleInfo.icon;
                  const bgUrl = getStyleBackground(c.room_style);
                  const rolesCount = Array.isArray(c.roles_schema) ? c.roles_schema.length : (c.max_participants || 4);

                  return (
                    <div
                      key={c.id}
                      className="bg-white border border-[#967b4f]/25 rounded-3xl overflow-hidden shadow-md hover:shadow-2xl hover:border-[#967b4f]/60 transition-all flex flex-col justify-between group"
                    >
                      {/* Card Visual Header with Scene Preview */}
                      <div className="relative h-36 overflow-hidden">
                        <img
                          src={bgUrl}
                          alt={c.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter brightness-90"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        <div className="absolute top-3 left-3">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black shadow-md border ${styleInfo.color}`}>
                            <IconComponent className="w-3 h-3" />
                            <span>{styleInfo.name}</span>
                          </span>
                        </div>
                        <div className="absolute bottom-3 right-3 text-white text-[11px] font-bold flex items-center gap-1 bg-black/60 px-2.5 py-0.5 rounded-full backdrop-blur-sm">
                          <Clock className="w-3 h-3" />
                          {c.expected_duration_minutes || 15} daq
                        </div>
                      </div>

                      <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                        <div className="space-y-2">
                          <h3 className="font-serif font-black text-base text-[#120f0d] group-hover:text-[#967b4f] transition-colors leading-snug">
                            {c.title}
                          </h3>

                          <p className="text-xs text-[#827161] leading-relaxed line-clamp-2">
                            {c.description}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-[#967b4f]/15 space-y-3">
                          <div className="grid grid-cols-2 gap-2 text-center text-xs text-[#827161]">
                            <div className="p-2 rounded-xl bg-[#fdfaf5] border border-[#967b4f]/15">
                              <span className="font-bold text-[#120f0d] block">{rolesCount} ta rol</span>
                              <span className="text-[10px]">Sig'im / Personajlar</span>
                            </div>
                            <div className="p-2 rounded-xl bg-[#fdfaf5] border border-[#967b4f]/15">
                              <span className="font-bold text-[#967b4f] block">{c.passing_score || 70} ball</span>
                              <span className="text-[10px]">O'tish Bali</span>
                            </div>
                          </div>

                          <button
                            onClick={() => openRoomLobby(c)}
                            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#967b4f] to-[#78613c] hover:brightness-110 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all"
                          >
                            <Play className="w-3.5 h-3.5 fill-white" />
                            <span>Sahnaga Kirish / Xonani Tanlash</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* MODAL: CHAT LOG / FULL HISTORY */}
        {/* ======================================================== */}
        {showChatLogModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
            <div className="bg-white border border-[#967b4f]/30 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-4 max-h-[80vh] flex flex-col">
              <div className="flex items-center justify-between border-b border-[#967b4f]/20 pb-3">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-[#967b4f]" />
                  <h3 className="font-serif font-black text-lg text-[#120f0d]">
                    Simulyatsiya Xabarlar Tarixi
                  </h3>
                </div>
                <button
                  onClick={() => setShowChatLogModal(false)}
                  className="text-gray-400 hover:text-[#120f0d] text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {roomChatMessages.map((msg, i) => (
                  <div key={msg.id || i} className="p-3 rounded-xl bg-[#fdfaf5] border border-[#967b4f]/20 text-xs space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-bold text-[#967b4f]">
                      <span>{msg.sender_name} ({msg.sender_role})</span>
                      <span className="text-gray-400">{new Date(msg.created_at).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                    {msg.scientific_feedback?.chemical_equation && msg.scientific_feedback.chemical_equation !== 'N/A' && (
                      <div className="text-[10px] font-mono text-amber-800 bg-amber-50 p-1.5 rounded border border-amber-200">
                        Reaksiya: {msg.scientific_feedback.chemical_equation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* MODAL: ROOM LOBBY & ROLE SELECTOR */}
        {/* ======================================================== */}
        {showRoomLobbyModal && selectedCase && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in overflow-y-auto">
            <div className="bg-white border border-[#967b4f]/30 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-5 my-8">
              <div className="flex items-center justify-between border-b border-[#967b4f]/20 pb-3">
                <div>
                  <h3 className="font-serif font-black text-lg text-[#120f0d]">
                    Simulyator Xonasi: {selectedCase.title}
                  </h3>
                  <p className="text-xs text-[#827161]">
                    O'zingizga qulay personaj rolini tanlang va sahnaga kiring
                  </p>
                </div>
                <button
                  onClick={() => setShowRoomLobbyModal(false)}
                  className="text-gray-400 hover:text-[#120f0d] text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Active Rooms Status */}
              <div>
                <div className="text-xs font-bold text-[#967b4f] uppercase tracking-wider mb-2">
                  Mavjud Xonalar:
                </div>
                {loadingRooms ? (
                  <div className="py-4 text-center text-xs text-[#827161]">Xonalar tekshirilmoqda...</div>
                ) : caseRooms.length === 0 ? (
                  <div className="p-3 rounded-xl bg-amber-50 text-xs text-amber-900 border border-amber-200">
                    Xona #1 avtomatik tayyor holatda.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {caseRooms.map((r, i) => (
                      <div
                        key={r.id || i}
                        className="p-3 rounded-xl border border-[#967b4f]/20 bg-[#fdfaf5] text-xs space-y-1"
                      >
                        <div className="font-bold flex items-center justify-between">
                          <span>Xona #{r.room_number}</span>
                          <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded font-black">
                            {r.status === 'WAITING' ? 'Kutilmoqda' : 'Faol'}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#827161]">
                          Sig'im: <strong>{r.active_count || r.participants?.length || 0} / {r.max_participants}</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Roles Selection */}
              <div>
                <label className="text-xs font-bold text-[#120f0d] block mb-2">
                  Qaysi Personaj Rolini Tanlaysiz?
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {Array.isArray(selectedCase.roles_schema) && selectedCase.roles_schema.length > 0 ? (
                    selectedCase.roles_schema.map((r, idx) => (
                      <label
                        key={r.role_id || idx}
                        className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          selectedRoleForJoin === r.role_id
                            ? 'bg-amber-500/15 border-[#967b4f] text-amber-950 font-bold'
                            : 'bg-[#fdfaf5] border-[#967b4f]/20 text-[#120f0d] hover:bg-white'
                        }`}
                      >
                        <input
                          type="radio"
                          name="role_choice"
                          value={r.role_id}
                          checked={selectedRoleForJoin === r.role_id}
                          onChange={(e) => setSelectedRoleForJoin(e.target.value)}
                          className="mt-0.5"
                        />
                        <div className="text-xs">
                          <div className="font-bold flex items-center gap-2">
                            <span>{r.title}</span>
                            <span className="text-[10px] text-indigo-700 bg-indigo-100 px-1.5 py-0.2 rounded font-normal">
                              🤖 Bo'sh qolsa AI to'ldiradi
                            </span>
                          </div>
                          {r.goal && <p className="text-[11px] text-[#827161] mt-0.5">{r.goal}</p>}
                        </div>
                      </label>
                    ))
                  ) : (
                    <div className="text-xs text-[#827161] p-3 bg-[#fdfaf5] rounded-xl border border-[#967b4f]/20">
                      Standard personaj roli biriktiriladi.
                    </div>
                  )}
                </div>
              </div>

              {/* Dynamic scaling banner */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-950 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#967b4f] shrink-0" />
                <span>
                  Agar xona to'lsa, AI darhol yangi Xona ochib beradi. O'rindiq yetishmasa, AI botlar sahna rollarini oladi.
                </span>
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRoomLobbyModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#967b4f]/25 text-xs font-bold text-[#827161] hover:bg-[#fdfaf5]"
                >
                  Bekor qilish
                </button>
                <button
                  type="button"
                  onClick={handleJoinRoom}
                  disabled={isSubmittingTurn}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-[#967b4f] text-white text-xs font-bold shadow-md hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmittingTurn ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>Sahnaga Kirish</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* MODAL: D.I. MENDELEYEV PERIODIC TABLE OF ELEMENTS */}
        {/* ======================================================== */}
        <PeriodicTableModal
          isOpen={showPeriodicTable}
          onClose={() => setShowPeriodicTable(false)}
          onSelectElement={(elem) => {
            handleAddReagentWithQuantity(elem, '1.0 mol (1 ekv)');
            setShowPeriodicTable(false);
          }}
        />

        {/* ======================================================== */}
        {/* MODAL: QUANTITY & EQUIVALENT SELECTOR (MIQDOR VA EKVIVALENT) */}
        {/* ======================================================== */}
        {quantityModalItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in zoom-in-95">
            <div className="bg-[#12161f] border-2 border-amber-400/60 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-white space-y-4 relative">
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center font-mono font-black text-xs"
                    style={{ backgroundColor: quantityModalItem.color || '#fef08a', color: '#12161f' }}
                  >
                    {quantityModalItem.formula ? quantityModalItem.formula.slice(0, 4) : quantityModalItem.id.slice(0, 3)}
                  </div>
                  <div>
                    <h4 className="font-serif font-black text-sm text-amber-300">
                      {quantityModalItem.name}
                    </h4>
                    <span className="text-[10px] text-gray-400 font-mono">
                      Formula: {quantityModalItem.formula || quantityModalItem.id}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setQuantityModalItem(null)}
                  className="text-gray-400 hover:text-white text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300 block">
                  Qo'shiladigan Miqdor / Ekvivalent:
                </label>
                
                {/* Presets */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    '0.5 mol (0.5 ekv)',
                    '1.0 mol (1.0 ekv)',
                    '2.0 mol (2.0 ekv)',
                    '5.0 ml',
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setCustomEquivalentInput(preset)}
                      className={`p-2 rounded-xl text-[11px] font-mono font-bold border transition-all text-center cursor-pointer ${
                        customEquivalentInput === preset
                          ? 'bg-amber-500 text-white border-amber-400 ring-2 ring-amber-400/40'
                          : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                {/* Custom input */}
                <div className="pt-1">
                  <span className="text-[10px] text-gray-400 block mb-1">
                    Yoki maxsus miqdor kiriting:
                  </span>
                  <input
                    type="text"
                    value={customEquivalentInput}
                    onChange={(e) => setCustomEquivalentInput(e.target.value)}
                    placeholder="Masalan: 1.5 mol yoki 10 ml"
                    className="bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-xl px-3 py-2 text-xs font-mono w-full focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setQuantityModalItem(null)}
                  className="flex-1 py-2.5 rounded-xl border border-white/20 text-xs font-bold text-gray-300 hover:bg-white/10 cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="button"
                  onClick={() => handleAddReagentWithQuantity(quantityModalItem, customEquivalentInput || '1.0 mol')}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-[#967b4f] hover:brightness-110 text-white font-bold text-xs shadow-md cursor-pointer"
                >
                  Kolbaga Solish
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* FULL-SCREEN IMMERSIVE BILLOWING SMOKE & EXPLOSION OVERLAY */}
        {/* ======================================================== */}
        {activeReactionEvent && activeReactionEvent.type === 'EXPLOSION' && (
          <div className="fixed inset-0 z-[9999] overflow-hidden flex items-center justify-center p-4">
            {/* 1. Initial Blinding Detonation Flash */}
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500 via-amber-200 to-red-600 blinding-flash-anim pointer-events-none" />

            {/* 2. Full-Screen Thick Chemical Smoke Screen */}
            <div className="absolute inset-0 smoke-screen-bg" />

            {/* 3. Massive Billowing Smoke Plumes */}
            <div className="absolute -bottom-24 -left-24 w-[650px] h-[650px] rounded-full bg-gradient-to-tr from-black via-zinc-800/90 to-amber-950/70 filter blur-3xl billow-cloud-2 opacity-95 pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-[700px] h-[700px] rounded-full bg-gradient-to-tl from-zinc-950 via-zinc-800/90 to-stone-900/80 filter blur-3xl billow-cloud-3 opacity-95 pointer-events-none" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[850px] h-[850px] rounded-full bg-gradient-to-t from-black via-stone-900/95 to-transparent filter blur-2xl billow-cloud-1 opacity-95 pointer-events-none" />

            {/* 4. Chemical Smoke Fog Drifting Over Entire Viewport */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(0,0,0,0.85)_100%)] pointer-events-none" />

            {/* 5. Center Explosive Hazard Alert Card */}
            <div className="relative z-10 max-w-lg w-full bg-black/90 backdrop-blur-2xl border-2 border-red-500/80 rounded-3xl p-6 sm:p-8 text-center shadow-[0_0_90px_rgba(239,68,68,0.6)] text-white space-y-4 animate-in zoom-in-90 duration-300">
              <div className="relative mx-auto w-20 h-20">
                <div className="absolute inset-0 rounded-full bg-red-600/40 animate-ping" />
                <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-tr from-red-600 to-amber-500 flex items-center justify-center text-4xl shadow-xl shadow-red-600/50">
                  💥
                </div>
              </div>

              <div>
                <span className="px-3.5 py-1 rounded-full text-[11px] font-black uppercase tracking-widest bg-red-600 text-white shadow-lg shadow-red-600/50 inline-block animate-pulse">
                  XAVFLI KIMYOVIY PORTLASH RO'Y BERDI!
                </span>
                <h2 className="text-xl sm:text-2xl font-serif font-black text-red-400 mt-2">
                  {activeReactionEvent.title}
                </h2>
              </div>

              {activeReactionEvent.equation && (
                <div className="p-3 rounded-2xl bg-red-950/70 font-mono text-xs text-amber-200 border border-red-500/30 shadow-inner">
                  {activeReactionEvent.equation}
                </div>
              )}

              <div className="p-3.5 rounded-2xl bg-black/60 border border-white/10 text-xs text-gray-200 leading-relaxed font-sans text-left space-y-1.5">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[11px]">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>AI Xavfsizlik Eksperti Xulosasi:</span>
                </div>
                <p>{activeReactionEvent.desc}</p>
                {activeReactionEvent.hazardAlert && (
                  <p className="text-red-300 font-semibold pt-1 border-t border-white/10 text-[11px]">
                    ⚠️ {activeReactionEvent.hazardAlert}
                  </p>
                )}
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={handleClearFlask}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-red-600 via-amber-600 to-red-600 hover:brightness-110 text-white font-black text-xs sm:text-sm shadow-xl shadow-red-600/40 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                >
                  <span>🗑️ Kolbani Tozalash va Qaytadan Sinash</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* MODAL / CARD: SUCCESSFUL SCIENTIFIC REACTION (OPENAI GPT-4o EVALUATION) */}
        {/* ======================================================== */}
        {activeReactionEvent && activeReactionEvent.type === 'SUCCESS' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in zoom-in-95">
            <div className="bg-[#0f172a] border-2 border-emerald-400/80 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-[0_0_60px_rgba(16,185,129,0.35)] text-white space-y-4 relative">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-lg">
                    <Sparkles className="w-5 h-5 animate-spin" style={{ animationDuration: '6s' }} />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                      <Bot className="w-3.5 h-3.5 text-emerald-400" />
                      {activeReactionEvent.aiModel || "OpenAI GPT-4o"} Ilmiy Tahlili
                    </span>
                    <h3 className="font-serif font-black text-base sm:text-lg text-white">
                      {activeReactionEvent.title || "Kimyoviy Reaksiya Muvaffaqiyatli Kechdi"}
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveReactionEvent(null)}
                  className="text-gray-400 hover:text-white text-sm font-bold p-1 rounded-lg hover:bg-white/10"
                >
                  ✕
                </button>
              </div>

              {/* Chemical Equation Badge */}
              {activeReactionEvent.equation && (
                <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-center shadow-inner">
                  <div className="text-[10px] uppercase font-bold text-emerald-300 mb-1">
                    Reaksiya Tenglamasi:
                  </div>
                  <div className="font-mono text-sm sm:text-base font-black text-amber-300 tracking-wide">
                    {activeReactionEvent.equation}
                  </div>
                </div>
              )}

              {/* Visual Effect */}
              {activeReactionEvent.visualEffect && (
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-emerald-200">
                  <strong className="text-white block mb-0.5">👁️ Vizual O'zgarish:</strong>
                  {activeReactionEvent.visualEffect}
                </div>
              )}

              {/* Scientific Explanation from OpenAI */}
              {activeReactionEvent.desc && (
                <div className="p-3.5 rounded-2xl bg-black/50 border border-white/10 text-xs sm:text-sm text-gray-200 leading-relaxed space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-300 font-bold text-[11px]">
                    <FlaskConical className="w-4 h-4 text-amber-400" />
                    <span>OpenAI Ilmiy Izohi:</span>
                  </div>
                  <p>{activeReactionEvent.desc}</p>
                </div>
              )}

              {/* Points & Close Button */}
              <div className="pt-2 flex items-center justify-between gap-3">
                <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                  +{activeReactionEvent.scoreDelta || 15} Ball Qo'shildi
                </span>
                <button
                  type="button"
                  onClick={() => setActiveReactionEvent(null)}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:brightness-110 text-white text-xs font-bold shadow-md cursor-pointer transition-all"
                >
                  Davom etish
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
