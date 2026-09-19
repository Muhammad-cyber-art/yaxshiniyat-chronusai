import React, { useState } from 'react';
import { PERIODIC_ELEMENTS, CATEGORY_COLORS } from './periodicTableData';
import { X, Search, Atom, Plus, Sparkles, Info } from 'lucide-react';

export default function PeriodicTableModal({ isOpen, onClose, onSelectElement }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedElement, setSelectedElement] = useState(PERIODIC_ELEMENTS[0]);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('ALL');

  if (!isOpen) return null;

  const filteredElements = PERIODIC_ELEMENTS.filter((el) => {
    const matchSearch =
      el.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      el.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(el.number).includes(searchTerm);
    const matchCategory = activeCategoryFilter === 'ALL' || el.category === activeCategoryFilter;
    return matchSearch && matchCategory;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="bg-[#12161f] border-2 border-[#967b4f] w-full max-w-5xl rounded-3xl p-4 sm:p-6 shadow-2xl text-white relative my-4 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-[#967b4f] flex items-center justify-center text-white shadow-lg">
              <Atom className="w-6 h-6 animate-spin" style={{ animationDuration: '10s' }} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-serif font-black text-amber-300 flex items-center gap-2">
                <span>D.I. Mendeleyev Davriy Jadvali</span>
                <span className="text-xs font-mono font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full">
                  Kimyoviy Elementlar
                </span>
              </h2>
              <p className="text-[11px] text-gray-400">
                Elementlarni o'rganing va simulyatsiya tajriba kolbasiga bevosita tanlab qo'shing!
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Element nomi yoki belgisi (H, Fe, O...)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-xl pl-9 pr-3 py-1.5 text-xs w-full focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            <button
              onClick={() => setActiveCategoryFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                activeCategoryFilter === 'ALL'
                  ? 'bg-amber-500 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              Barchasi
            </button>
            {Object.entries(CATEGORY_COLORS).map(([catKey, catVal]) => (
              <button
                key={catKey}
                onClick={() => setActiveCategoryFilter(catKey)}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all whitespace-nowrap ${
                  activeCategoryFilter === catKey
                    ? `${catVal.bg} ${catVal.border} text-white ring-2 ring-amber-400`
                    : 'bg-white/5 border-transparent text-gray-400 hover:bg-white/10'
                }`}
              >
                {catVal.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Area: Grid + Active Element Inspector */}
        <div className="grid lg:grid-cols-3 gap-4 flex-1 overflow-hidden min-h-0 pt-2">
          {/* Elements Grid (2 Cols on lg) */}
          <div className="lg:col-span-2 overflow-y-auto pr-2 grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 gap-2 scrollbar-thin">
            {filteredElements.map((elem) => {
              const cat = CATEGORY_COLORS[elem.category] || CATEGORY_COLORS.nonmetal;
              const isSelected = selectedElement?.number === elem.number;
              return (
                <div
                  key={elem.number}
                  onClick={() => setSelectedElement(elem)}
                  className={`p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col justify-between ${
                    cat.bg
                  } ${cat.border} ${
                    isSelected
                      ? 'ring-2 ring-amber-400 scale-105 shadow-xl shadow-amber-500/20'
                      : 'hover:scale-102 hover:brightness-110'
                  }`}
                >
                  <div className="flex items-center justify-between text-[8px] font-mono text-gray-300">
                    <span>{elem.number}</span>
                    <span>{elem.mass}</span>
                  </div>
                  <div className="text-base sm:text-lg font-black font-mono text-white tracking-wider my-0.5">
                    {elem.symbol}
                  </div>
                  <div className="text-[9px] font-bold text-gray-200 truncate">
                    {elem.name}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Active Element Inspector Panel (1 Col on lg) */}
          {selectedElement && (
            <div className="bg-white/5 border border-white/15 rounded-2xl p-4 flex flex-col justify-between shrink-0 overflow-y-auto space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-amber-300 uppercase">
                    Element #{selectedElement.number}
                  </span>
                  <span
                    className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
                      (CATEGORY_COLORS[selectedElement.category] || CATEGORY_COLORS.nonmetal).bg
                    } ${(CATEGORY_COLORS[selectedElement.category] || CATEGORY_COLORS.nonmetal).border} text-white`}
                  >
                    {(CATEGORY_COLORS[selectedElement.category] || CATEGORY_COLORS.nonmetal).label}
                  </span>
                </div>

                <div className="flex items-center gap-4 my-3">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-500/40 border-2 border-amber-400 flex flex-col items-center justify-center font-mono shadow-inner shrink-0">
                    <span className="text-2xl font-black text-white">{selectedElement.symbol}</span>
                    <span className="text-[9px] text-gray-300">{selectedElement.number}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-serif font-black text-white">{selectedElement.name}</h3>
                    <div className="text-xs text-amber-300/90 font-mono">
                      Atom massasi: <strong>{selectedElement.mass} a.m.b</strong>
                    </div>
                    <div className="text-[11px] text-gray-300 font-mono">
                      Valentligi: <strong>{selectedElement.valence || 'O\'zgaruvchan'}</strong>
                    </div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-gray-300 leading-relaxed font-sans">
                  {selectedElement.desc}
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3 text-[11px] font-mono">
                  <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                    <span className="text-gray-400 block text-[9px]">Guruh:</span>
                    <span className="font-bold text-white">{selectedElement.group}-guruh</span>
                  </div>
                  <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                    <span className="text-gray-400 block text-[9px]">Davr:</span>
                    <span className="font-bold text-white">{selectedElement.period}-davr</span>
                  </div>
                </div>
              </div>

              {/* Action Button: Add directly into Beaker */}
              <button
                type="button"
                onClick={() => {
                  if (onSelectElement) {
                    onSelectElement(selectedElement);
                  }
                }}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-[#967b4f] hover:brightness-110 text-white font-black text-xs shadow-lg shadow-amber-500/25 flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Kolbaga Qo'shish ({selectedElement.symbol})</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
