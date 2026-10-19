'use client';

import React from 'react';
import { X, RotateCw, Hammer, Bomb, ShieldCheck, Sparkles, Calendar, ShoppingBag } from 'lucide-react';

interface ShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  gems: number;
  onOpenCheckin: () => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({
  isOpen,
  onClose,
  gems,
  onOpenCheckin,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#0f131d] rounded-2xl border border-[#232b3c] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#1f2637] bg-[#121623]/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0284c7] to-[#2563eb] flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-white tracking-wide">
                  TOKO PERMATA &amp; ALAT BANTU
                </h3>
              </div>
              <p className="text-xs text-[#94a3b8]">
                Gunakan Permata untuk booster penyelamat di Mode Solo!
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-[#94a3b8] hover:text-white hover:bg-[#1a2130] rounded-lg transition-colors cursor-pointer"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Gems Balance Bar */}
        <div className="px-5 py-3 bg-[#131926] border-b border-[#1c2436] flex items-center justify-between">
          <span className="text-xs font-mono text-[#94a3b8]">SALDO PERMATA ANDA:</span>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-[#1a2336] border border-[#38bdf8]/40 rounded-lg text-sm font-mono font-black text-[#38bdf8] shadow-[0_0_12px_rgba(56,189,248,0.25)]">
            <span>💎</span>
            <span>{gems} Permata</span>
          </div>
        </div>

        {/* Content / Items List */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3">
          {/* Item 1: Rotate */}
          <div className="p-3.5 bg-[#141926] border border-[#222b3e] rounded-xl flex items-center justify-between gap-3 hover:border-[#38bdf8]/50 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#0369a1]/20 border border-[#38bdf8]/40 flex items-center justify-center text-[#38bdf8] shrink-0">
                <RotateCw className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-white">Rotate Balok (Putar 90°)</h4>
                </div>
                <p className="text-xs text-[#94a3b8] mt-0.5 leading-relaxed">
                  Putar arah balok 90° searah jarum jam agar pas masuk ke celah sempit.
                </p>
              </div>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-[#192235] border border-[#2b3952] text-xs font-mono font-bold text-[#38bdf8] shrink-0">
              💎 1
            </div>
          </div>

          {/* Item 2: Hammer */}
          <div className="p-3.5 bg-[#141926] border border-[#222b3e] rounded-xl flex items-center justify-between gap-3 hover:border-[#f97316]/50 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#ea580c]/20 border border-[#f97316]/40 flex items-center justify-center text-[#f97316] shrink-0">
                <Hammer className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-white">Palu Tunggal (Hammer)</h4>
                </div>
                <p className="text-xs text-[#94a3b8] mt-0.5 leading-relaxed">
                  Hancurkan 1 balok yang mengganjal dan menghalangi langkah di papan.
                </p>
              </div>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-[#192235] border border-[#2b3952] text-xs font-mono font-bold text-[#f97316] shrink-0">
              💎 2
            </div>
          </div>

          {/* Item 3: Bomb */}
          <div className="p-3.5 bg-[#141926] border border-[#222b3e] rounded-xl flex items-center justify-between gap-3 hover:border-[#ef4444]/50 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#dc2626]/20 border border-[#ef4444]/40 flex items-center justify-center text-[#ef4444] shrink-0">
                <Bomb className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-white">Bom Silang (Bomb Plus +)</h4>
                </div>
                <p className="text-xs text-[#94a3b8] mt-0.5 leading-relaxed">
                  Ledakkan baris horizontal &amp; vertikal pola silang Plus (+) seketika!
                </p>
              </div>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-[#192235] border border-[#2b3952] text-xs font-mono font-bold text-[#ef4444] shrink-0">
              💎 3
            </div>
          </div>

          {/* Item 4: Continue */}
          <div className="p-3.5 bg-[#141926] border border-[#222b3e] rounded-xl flex items-center justify-between gap-3 hover:border-[#10b981]/50 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#059669]/20 border border-[#10b981]/40 flex items-center justify-center text-[#10b981] shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-white">Continue (Revive 1x)</h4>
                </div>
                <p className="text-xs text-[#94a3b8] mt-0.5 leading-relaxed">
                  Lanjutkan game over di Solo Mode tanpa kehilangan skor &amp; combo (maks 1x per game).
                </p>
              </div>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-[#192235] border border-[#2b3952] text-xs font-mono font-bold text-[#10b981] shrink-0">
              💎 1
            </div>
          </div>
        </div>

        {/* Footer / Daily Check-in link */}
        <div className="p-4 sm:p-5 border-t border-[#1f2637] bg-[#121623]/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={() => {
              onClose();
              onOpenCheckin();
            }}
            className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-[#2563eb] to-[#38bdf8] hover:from-[#1d4ed8] hover:to-[#2563eb] text-white text-xs font-mono font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer border border-[#60a5fa]"
          >
            <Calendar className="w-4 h-4" />
            <span>KLAIM PERMATA DI DAILY CHECK-IN</span>
          </button>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 bg-[#182030] hover:bg-[#20293d] text-[#94a3b8] hover:text-white text-xs font-mono font-bold rounded-xl transition-colors cursor-pointer border border-[#2b364c]"
          >
            TUTUP
          </button>
        </div>
      </div>
    </div>
  );
};
