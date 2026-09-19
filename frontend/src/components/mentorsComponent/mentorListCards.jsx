import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserSquare2, Phone, BookOpen, Users, ChevronRight, FlaskConical, Loader2 } from "lucide-react";
import api from "../../tokenUpdater/updater";
import toast from "react-hot-toast";

export default function MentorRow({ mentor, currentBranchId }) {

 const navigate = useNavigate();
 const [selectedColor, setSelectedColor] = useState(mentor.color || "#ffffff");
 const [showPicker, setShowPicker] = useState(false);
 const [labLoading, setLabLoading] = useState(false);

 const handleSaveColor = async (e) => {
  e.stopPropagation();
  setShowPicker(false);
  try {
   await api.patch(`/register/users/${mentor.id}/`, { color: selectedColor });
  } catch (error) {
   setSelectedColor(mentor.color);
  }
 };

 // Mentor uchun laboratoriya tokenini olish va yangi oynada ochish
 const handleOpenLab = async (e) => {
  e.stopPropagation();
  setLabLoading(true);
  try {
   const res = await api.post(`/mentor-lab-token/${mentor.id}/`);
   const { access, refresh } = res.data;
   const labUrl = `${window.location.origin}/mentor-lab-entry?access=${encodeURIComponent(access)}&refresh=${encodeURIComponent(refresh)}`;
   window.open(labUrl, "_blank", "noopener,noreferrer");
   toast.success(`${mentor.first_name} uchun laboratoriya ochildi!`);
  } catch (err) {
   const detail = err.response?.data?.detail;
   toast.error(detail || "Laboratoriya tokenini olishda xatolik.");
  } finally {
   setLabLoading(false);
  }
 };

 return (
  <tr
   onClick={() => navigate(`${mentor.id}/?branch=${currentBranchId}`)}
   className="group hover:bg-white/[0.03] transition-colors cursor-pointer"
  >
   <td className="px-6 py-4">
    <div className="flex items-center gap-3">
     <div
      className="w-12 h-12 border border-white/10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
      style={{ backgroundColor: `${selectedColor}20`, borderColor: `${selectedColor}50` }}
     >
      {!mentor.image ? <UserSquare2 size={20} style={{ color: selectedColor }} /> : <img src={mentor.image} alt="" />}
     </div>
     <div>
      <p className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
       {mentor.first_name} {mentor.last_name}
      </p>
      <p className="text-[10px] text-gray-500 font-medium">@{mentor.username}</p>
     </div>
    </div>
   </td>

   <td className="px-6 py-4">
    <div className="flex items-center gap-2 text-xs text-gray-400">
     <Phone size={12} className="text-blue-500/50" />
     {mentor.phone_number || "---"}
    </div>
   </td>

   <td className="px-6 py-4">
    <div className="flex items-center gap-2 text-xs text-gray-400">
     <BookOpen size={12} className="text-purple-500/50" />
     {mentor.subject || "Belgilanmagan"}
    </div>
   </td>

   <td className="px-6 py-4 text-center">
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/5 rounded-lg border border-white/5">
     <Users size={12} className="text-indigo-500" />
     <span className="text-xs font-bold text-white">{mentor?.mentor_groups?.length || 0}</span>
    </div>
   </td>

   <td className="px-6 py-4 text-center">
    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold capitalize tracking-wider ${mentor.is_active ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-red-500/10 border-red-500/20 text-red-500"}`}>
     <div className={`w-1 h-1 rounded-full ${mentor.is_active ? "bg-emerald-500" : "bg-red-500"}`}></div>
     {mentor.is_active ? "Faol" : "Nofaol"}
    </div>
   </td>

   <td className="px-6 py-4 text-right relative">
    <div className="flex items-center justify-end gap-2">

     {/* Laboratoriyaga kirish tugmasi */}
     <button
      onClick={handleOpenLab}
      disabled={labLoading}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/25 text-amber-400 border border-amber-500/25 text-[10px] font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
      title="Laboratoriyaga kirish (parolsiz)"
     >
      {labLoading ? <Loader2 size={11} className="animate-spin" /> : <FlaskConical size={11} />}
      <span className="hidden sm:inline">Lab</span>
     </button>

     <div
      onClick={(e) => { e.stopPropagation(); setShowPicker(!showPicker); }}
      className="w-6 h-6 rounded-md cursor-pointer border border-white/20 hover:scale-110 transition-all shadow-inner"
      style={{ backgroundColor: selectedColor }}
      title="Rangni o''zgartirish"
     ></div>

     <ChevronRight size={18} className="text-gray-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
    </div>

    {showPicker && (
     <div
      onClick={(e) => e.stopPropagation()}
      className="absolute right-16 top-0 z-50 bg-[#1f2229] border border-gray-700 rounded-lg p-2 shadow-2xl flex flex-col items-center gap-2 min-w-[60px]"
     >
      <input
       type="color"
       value={selectedColor}
       onChange={(e) => setSelectedColor(e.target.value)}
       className="w-8 h-8 cursor-pointer bg-transparent border-none"
      />
      <button onClick={handleSaveColor} className="bg-blue-600 hover:bg-blue-700 text-[10px] text-white px-2 py-1 rounded font-bold w-full">OK</button>
     </div>
    )}
   </td>
  </tr>
 );
}
