'use client';

import React from 'react';
import { RotateCw, Hammer, Bomb, ShoppingBag, X, Sparkles, Check } from 'lucide-react';

export type PowerUpTool = 'rotate' | 'hammer' | 'bomb' | null;

interface PowerUpBarProps {
  gems: number;
  activeTool: PowerUpTool;
  onSelectTool: (tool: PowerUpTool) => void;
  onRotateShape: () => void;
  onOpenShop: () => void;
  hasPlayableShapes: boolean;
  variant?: 'horizontal' | 'sidebar';
  onFinishRotate?: () => void;
}

export const PowerUpBar: React.FC<PowerUpBarProps> = ({
  gems,
  activeTool,
  onSelectTool,
  onRotateShape,
  onOpenShop,
  hasPlayableShapes,
  variant = 'horizontal',
  onFinishRotate,
}) => {
  // ==========================================
  // VARIANT 1: DESKTOP SIDEBAR (Samping Arena)
  // ==========================================
  if (variant === 'sidebar') {
    return (
      <div className="w-full bg-[#11141d] border-2 border-[#202636] rounded-xl p-3.5 sm:p-4 flex flex-col gap-3 shadow-2xl select-none">
        {/* Sidebar Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#1f2739]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#38bdf8]/15 border border-[#38bdf8]/30 flex items-center justify-center text-[#38bdf8]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-mono font-black tracking-wider text-white uppercase">
                ALAT BANTU
              </h3>
              <span className="text-[10px] font-mono text-[#64748b]">SOLO POWER-UPS</span>
            </div>
          </div>

          {/* Gems Balance Badge */}
          <button
            onClick={onOpenShop}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#182133] hover:bg-[#202c44] border border-[#2d3e5f] hover:border-[#38bdf8] text-[#38bdf8] text-xs font-mono font-black transition-all cursor-pointer shadow-sm"
            title="Klik untuk membuka Toko Permata"
          >
            <span>💎</span>
            <span>{gems}</span>
          </button>
        </div>

        {/* Active Tool Guidance Banner */}
        {activeTool && (
          <div className="flex flex-col gap-1.5 p-2.5 rounded-lg bg-[#161c28] border border-[#38bdf8]/60 shadow-[0_0_15px_rgba(56,189,248,0.2)] animate-pulse">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-black text-[#38bdf8] uppercase tracking-wider">
                {activeTool === 'rotate'
                  ? 'MODE PUTAR AKTIF'
                  : activeTool === 'hammer'
                  ? 'MODE PALU AKTIF'
                  : 'MODE BOM AKTIF'}
              </span>
              <div className="flex items-center gap-1">
                {activeTool === 'rotate' && onFinishRotate && (
                  <button
                    onClick={onFinishRotate}
                    className="flex items-center gap-1 text-[10px] font-mono font-black text-white bg-[#10b981] hover:bg-[#059669] px-2 py-0.5 rounded cursor-pointer transition-colors shadow-sm"
                  >
                    <Check className="w-3 h-3 stroke-[3]" />
                    <span>Selesai</span>
                  </button>
                )}
                <button
                  onClick={() => onSelectTool(null)}
                  className="flex items-center gap-1 text-[10px] font-mono font-bold text-[#94a3b8] hover:text-white bg-[#222c40] px-2 py-0.5 rounded cursor-pointer transition-colors"
                >
                  <X className="w-3 h-3" />
                  <span>Batal</span>
                </button>
              </div>
            </div>
            <p className="text-[11px] text-[#cbd5e1] leading-tight">
              {activeTool === 'rotate'
                ? 'Klik balok untuk memutar arah 90° (bisa berkali-kali). Klik [Selesai] jika sudah pas.'
                : activeTool === 'hammer'
                ? 'Klik 1 balok di arena untuk dihancurkan.'
                : 'Klik petak target untuk ledakan Plus (+).'}
            </p>
          </div>
        )}

        {/* Vertical Tool Buttons Stack */}
        <div className="flex flex-col gap-2">
          {/* 1. Rotate Button */}
          <button
            onClick={onRotateShape}
            disabled={gems < 1 || !hasPlayableShapes}
            className={`w-full p-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
              activeTool === 'rotate'
                ? 'bg-[#0284c7] border-[#38bdf8] text-white shadow-[0_0_15px_rgba(56,189,248,0.5)] ring-2 ring-[#0284c7]/50'
                : gems >= 1 && hasPlayableShapes
                ? 'bg-[#141b29] hover:bg-[#1a2538] border-[#223049] hover:border-[#38bdf8] text-white'
                : 'bg-[#10141e] border-[#1a202c] text-[#475569] opacity-40 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#0284c7]/20 border border-[#38bdf8]/40 flex items-center justify-center text-[#38bdf8] shrink-0">
                <RotateCw className={`w-4 h-4 ${activeTool === 'rotate' ? 'animate-spin' : ''}`} />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-mono font-bold text-white">PUTAR BALOK</span>
                <span className="text-[10px] text-[#94a3b8]">Putar arah 90°</span>
              </div>
            </div>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#1e273a] border border-[#2d3950] text-xs font-mono font-black text-[#38bdf8] shrink-0">
              <span>💎</span>
              <span>1</span>
            </div>
          </button>

          {/* 2. Hammer Button */}
          <button
            onClick={() => onSelectTool(activeTool === 'hammer' ? null : 'hammer')}
            disabled={gems < 2}
            className={`w-full p-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
              activeTool === 'hammer'
                ? 'bg-[#ea580c] border-[#fb923c] text-white shadow-[0_0_15px_rgba(234,88,12,0.5)] ring-2 ring-[#ea580c]/50'
                : gems >= 2
                ? 'bg-[#1c1822] hover:bg-[#251f2d] border-[#3d273a] hover:border-[#f97316] text-white'
                : 'bg-[#10141e] border-[#1a202c] text-[#475569] opacity-40 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#ea580c]/20 border border-[#f97316]/40 flex items-center justify-center text-[#f97316] shrink-0">
                <Hammer className="w-4 h-4" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-mono font-bold text-white">PALU TUNGGAL</span>
                <span className="text-[10px] text-[#94a3b8]">Hancurkan 1 balok</span>
              </div>
            </div>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#2b1f20] border border-[#4a2e28] text-xs font-mono font-black text-[#f97316] shrink-0">
              <span>💎</span>
              <span>2</span>
            </div>
          </button>

          {/* 3. Bomb Plus (+) Button */}
          <button
            onClick={() => onSelectTool(activeTool === 'bomb' ? null : 'bomb')}
            disabled={gems < 3}
            className={`w-full p-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
              activeTool === 'bomb'
                ? 'bg-[#dc2626] border-[#f87171] text-white shadow-[0_0_15px_rgba(220,38,38,0.5)] ring-2 ring-[#dc2626]/50'
                : gems >= 3
                ? 'bg-[#21161a] hover:bg-[#2b1b22] border-[#422329] hover:border-[#ef4444] text-white'
                : 'bg-[#10141e] border-[#1a202c] text-[#475569] opacity-40 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#dc2626]/20 border border-[#ef4444]/40 flex items-center justify-center text-[#ef4444] shrink-0">
                <Bomb className="w-4 h-4" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-mono font-bold text-white">BOM SILANG (+)</span>
                <span className="text-[10px] text-[#94a3b8]">Ledak 4 baris & kolom</span>
              </div>
            </div>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#2c181b] border border-[#4d242c] text-xs font-mono font-black text-[#ef4444] shrink-0">
              <span>💎</span>
              <span>3</span>
            </div>
          </button>

          {/* 4. Open Shop Button */}
          <button
            onClick={onOpenShop}
            className="w-full mt-1 py-2 px-3 bg-[#151c2d] hover:bg-[#1a243a] border border-[#23304c] hover:border-[#38bdf8] text-[#38bdf8] rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer text-xs font-mono font-bold shadow-sm"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>BUKA TOKO PERMATA</span>
          </button>
        </div>

        {/* Tip Footer */}
        <div className="pt-2 border-t border-[#1a202c] text-[10px] font-mono text-[#64748b] text-center leading-relaxed">
          Gunakan alat bantu untuk menyelamatkan permainan saat papan mulai sesak!
        </div>
      </div>
    );
  }

  // ==========================================
  // VARIANT 2: MOBILE HORIZONTAL BAR (Bawah Arena)
  // ==========================================
  return (
    <div className="w-full max-w-[420px] mx-auto mt-2 flex flex-col gap-1.5 select-none">
      {/* Active Tool Notification Banner */}
      {activeTool && (
        <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-[#141a27] border border-[#38bdf8]/50 animate-pulse text-xs">
          <div className="flex items-center gap-1.5 text-white font-mono font-bold">
            {activeTool === 'rotate' ? (
              <>
                <RotateCw className="w-3.5 h-3.5 text-[#38bdf8] animate-spin" />
                <span className="text-[#38bdf8]">Mode Putar:</span>
                <span className="text-[#e2e8f0]">Klik balok untuk putar!</span>
              </>
            ) : activeTool === 'hammer' ? (
              <>
                <Hammer className="w-3.5 h-3.5 text-[#f97316]" />
                <span className="text-[#f97316]">Mode Palu:</span>
                <span className="text-[#e2e8f0]">Klik 1 balok di papan!</span>
              </>
            ) : (
              <>
                <Bomb className="w-3.5 h-3.5 text-[#ef4444]" />
                <span className="text-[#ef4444]">Mode Bom Plus (+):</span>
                <span className="text-[#e2e8f0]">Klik area target papan!</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {activeTool === 'rotate' && onFinishRotate && (
              <button
                onClick={onFinishRotate}
                className="flex items-center gap-1 text-[11px] font-mono font-black text-white bg-[#10b981] hover:bg-[#059669] px-2 py-0.5 rounded cursor-pointer transition-colors shadow-sm"
              >
                <Check className="w-3 h-3 stroke-[3]" />
                <span>Selesai</span>
              </button>
            )}
            <button
              onClick={() => onSelectTool(null)}
              className="flex items-center gap-1 text-[11px] font-mono font-bold text-[#94a3b8] hover:text-white bg-[#1e273a] px-2 py-0.5 rounded cursor-pointer transition-colors"
            >
              <X className="w-3 h-3" />
              <span>Batal</span>
            </button>
          </div>
        </div>
      )}

      {/* Power-up Buttons Bar */}
      <div className="flex items-center justify-between gap-1.5 sm:gap-2 p-2 bg-[#10141f] border border-[#20293d] rounded-xl shadow-lg">
        {/* 1. Rotate Shape (1 Gem) */}
        <button
          onClick={onRotateShape}
          disabled={gems < 1 || !hasPlayableShapes}
          className={`flex-1 py-1.5 px-2 rounded-lg flex flex-col items-center justify-center gap-0.5 border transition-all cursor-pointer ${
            activeTool === 'rotate'
              ? 'bg-[#0284c7] border-[#38bdf8] text-white shadow-[0_0_12px_rgba(56,189,248,0.5)] ring-2 ring-[#0284c7]/50'
              : gems >= 1 && hasPlayableShapes
              ? 'bg-[#152033] hover:bg-[#1a2942] border-[#29426b] hover:border-[#38bdf8] text-[#38bdf8] shadow-sm'
              : 'bg-[#131722] border-[#1d2332] text-[#475569] opacity-50 cursor-not-allowed'
          }`}
          title="Putar balok 90 derajat (1 Permata)"
        >
          <div className="flex items-center gap-1">
            <RotateCw className="w-3.5 h-3.5" />
            <span className="text-xs font-mono font-bold tracking-tight">PUTAR</span>
          </div>
          <span className="text-[10px] font-mono font-semibold text-[#94a3b8]">💎 1</span>
        </button>

        {/* 2. Hammer (2 Gems) */}
        <button
          onClick={() => onSelectTool(activeTool === 'hammer' ? null : 'hammer')}
          disabled={gems < 2}
          className={`flex-1 py-1.5 px-2 rounded-lg flex flex-col items-center justify-center gap-0.5 border transition-all cursor-pointer ${
            activeTool === 'hammer'
              ? 'bg-[#ea580c] border-[#fb923c] text-white shadow-[0_0_12px_rgba(234,88,12,0.5)] ring-2 ring-[#ea580c]/50'
              : gems >= 2
              ? 'bg-[#211b1c] hover:bg-[#2b1f20] border-[#4a2e28] hover:border-[#f97316] text-[#f97316] shadow-sm'
              : 'bg-[#131722] border-[#1d2332] text-[#475569] opacity-50 cursor-not-allowed'
          }`}
          title="Hancurkan 1 balok di papan (2 Permata)"
        >
          <div className="flex items-center gap-1">
            <Hammer className="w-3.5 h-3.5" />
            <span className="text-xs font-mono font-bold tracking-tight">PALU</span>
          </div>
          <span className="text-[10px] font-mono font-semibold text-[#94a3b8]">💎 2</span>
        </button>

        {/* 3. Bomb Plus (+) (3 Gems) */}
        <button
          onClick={() => onSelectTool(activeTool === 'bomb' ? null : 'bomb')}
          disabled={gems < 3}
          className={`flex-1 py-1.5 px-2 rounded-lg flex flex-col items-center justify-center gap-0.5 border transition-all cursor-pointer ${
            activeTool === 'bomb'
              ? 'bg-[#dc2626] border-[#f87171] text-white shadow-[0_0_12px_rgba(220,38,38,0.5)] ring-2 ring-[#dc2626]/50'
              : gems >= 3
              ? 'bg-[#24171a] hover:bg-[#2f1a20] border-[#4d242c] hover:border-[#ef4444] text-[#ef4444] shadow-sm'
              : 'bg-[#131722] border-[#1d2332] text-[#475569] opacity-50 cursor-not-allowed'
          }`}
          title="Ledakkan area pola Plus (+) horizontal & vertikal (3 Permata)"
        >
          <div className="flex items-center gap-1">
            <Bomb className="w-3.5 h-3.5" />
            <span className="text-xs font-mono font-bold tracking-tight">BOM</span>
          </div>
          <span className="text-[10px] font-mono font-semibold text-[#94a3b8]">💎 3</span>
        </button>

        {/* 4. Open Shop / Info Button */}
        <button
          onClick={onOpenShop}
          className="py-1.5 px-2 bg-[#151c2d] hover:bg-[#1c263d] border border-[#23304c] hover:border-[#38bdf8] text-[#38bdf8] rounded-lg flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer"
          title="Buka Toko Permata & Bantuan"
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span className="text-[10px] font-mono font-bold text-[#94a3b8]">TOKO</span>
        </button>
      </div>
    </div>
  );
};
