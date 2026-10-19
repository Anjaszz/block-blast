'use client';

import React from 'react';
import { RotateCw, Hammer, Bomb, ShoppingBag, X } from 'lucide-react';

export type PowerUpTool = 'rotate' | 'hammer' | 'bomb' | null;

interface PowerUpBarProps {
  gems: number;
  activeTool: PowerUpTool;
  onSelectTool: (tool: PowerUpTool) => void;
  onRotateShape: () => void;
  onOpenShop: () => void;
  hasPlayableShapes: boolean;
}

export const PowerUpBar: React.FC<PowerUpBarProps> = ({
  gems,
  activeTool,
  onSelectTool,
  onRotateShape,
  onOpenShop,
  hasPlayableShapes,
}) => {
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
                <span className="text-[#e2e8f0]">Pilih balok di dock untuk diputar!</span>
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
          <button
            onClick={() => onSelectTool(null)}
            className="flex items-center gap-1 text-[11px] font-mono font-bold text-[#94a3b8] hover:text-white bg-[#1e273a] px-2 py-0.5 rounded cursor-pointer transition-colors"
          >
            <X className="w-3 h-3" />
            <span>Batal</span>
          </button>
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
