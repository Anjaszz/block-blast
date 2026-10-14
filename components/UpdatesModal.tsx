'use client';

import React from 'react';
import { X, Sparkles, Swords, Timer, Gift, Calendar, CheckCircle2, Smartphone, ShieldCheck } from 'lucide-react';

interface UpdatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAcknowledge?: () => void;
}

export const UpdatesModal: React.FC<UpdatesModalProps> = ({
  isOpen,
  onClose,
  onAcknowledge,
}) => {
  if (!isOpen) return null;

  const handleUnderstand = () => {
    if (onAcknowledge) {
      onAcknowledge();
    } else {
      if (typeof window !== 'undefined') {
        localStorage.setItem('blockarena_has_seen_updates_v1', 'true');
      }
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-[#0f131d] rounded-2xl border border-[#232b3c] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#1f2637] bg-[#121623]/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2563eb] to-[#38bdf8] flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-white tracking-wide">
                  CATATAN UPDATE TERBARU
                </h3>
                <span className="px-2 py-0.5 bg-[#1d4ed8]/40 border border-[#3b82f6]/50 text-[#60a5fa] text-[10px] font-mono font-bold rounded-full">
                  NEW
                </span>
              </div>
              <p className="text-xs text-[#94a3b8]">
                Fitur-fitur baru seru kini hadir di BlockArena!
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

        {/* Modal Body / Update Items */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 divide-y divide-[#1b2232]">
          {/* 1. Mode Stage: Survival & Timer */}
          <div className="flex items-start gap-3 pt-1">
            <div className="p-2 bg-[#26151a] border border-[#dc2626]/40 rounded-xl text-[#ef4444] shrink-0 mt-0.5">
              <Swords className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <h4 className="font-bold text-sm text-white">
                  Mode Stage Multiplayer: Survival & Timer
                </h4>
              </div>
              <p className="text-xs text-[#94a3b8] mt-1 leading-relaxed">
                Saat membuat room pertandingan, kini ada 2 pilihan mode seru:
              </p>
              <ul className="text-xs text-[#cbd5e1] mt-1.5 space-y-1 list-disc list-inside">
                <li>
                  <strong className="text-white">Survival:</strong> Bertahan sampai akhir! Pemain terakhir yang selamat jadi juara.
                </li>
                <li>
                  <strong className="text-white">Timer:</strong> Pertandingan selesai hanya saat waktu habis. Pemain dengan skor tertinggi yang menang, meskipun gugur lebih dulu!
                </li>
              </ul>
            </div>
          </div>

          {/* 2. Serangan Combo (Gift Block) */}
          <div className="flex items-start gap-3 pt-3.5">
            <div className="p-2 bg-[#2d1b11] border border-[#f97316]/40 rounded-xl text-[#f97316] shrink-0 mt-0.5">
              <Gift className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-sm text-white">
                Serang Lawan dengan Combo 3x (Gift Block)
              </h4>
              <p className="text-xs text-[#94a3b8] mt-1 leading-relaxed">
                Saat bertanding di Stage bersama teman, capai <strong className="text-[#f97316]">Combo 3x</strong> beruntun untuk membuka kesempatan menyerang! Anda bisa memilih 1 dari 4 balok besar/rumit untuk dikirimkan langsung ke antrean balok teman Anda sebagai jebakan.
              </p>
            </div>
          </div>

          {/* 3. Daily Check-in & Permata */}
          <div className="flex items-start gap-3 pt-3.5">
            <div className="p-2 bg-[#122822] border border-[#10b981]/40 rounded-xl text-[#10b981] shrink-0 mt-0.5">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-sm text-white">
                Daily Check-in 7 Hari & Hadiah Permata 💎
              </h4>
              <p className="text-xs text-[#94a3b8] mt-1 leading-relaxed">
                Check-in setiap hari untuk mengumpulkan Permata secara gratis:
              </p>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <div className="p-2 bg-[#141a27] border border-[#20293d] rounded-lg text-center">
                  <span className="text-[10px] text-[#94a3b8] block">Hari 1 - 5</span>
                  <span className="text-xs font-bold text-[#38bdf8]">💎 +1 Tiap Hari</span>
                </div>
                <div className="p-2 bg-[#141a27] border border-[#20293d] rounded-lg text-center">
                  <span className="text-[10px] text-[#94a3b8] block">Hari 6</span>
                  <span className="text-xs font-bold text-[#facc15]">💎 +4 Permata</span>
                </div>
                <div className="p-2 bg-[#1d1b2e] border border-[#a855f7]/40 rounded-lg text-center">
                  <span className="text-[10px] text-[#c084fc] block">Hari 7 (Spesial)</span>
                  <span className="text-xs font-bold text-[#e879f9]">💎 +7 Permata</span>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Fitur Continue Game Over di Solo Mode */}
          <div className="flex items-start gap-3 pt-3.5">
            <div className="p-2 bg-[#162238] border border-[#3b82f6]/40 rounded-xl text-[#38bdf8] shrink-0 mt-0.5">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-sm text-white">
                Fitur Continue (Revive) di Solo Mode
              </h4>
              <p className="text-xs text-[#94a3b8] mt-1 leading-relaxed">
                Game over saat sedang mencetak skor rekor? Anda bisa menggunakan <strong className="text-[#38bdf8]">1 Permata (💎)</strong> untuk melanjutkan permainan!
              </p>
              <div className="p-2 bg-[#151c2a] border border-[#232f46] rounded-lg mt-2 text-[11px] text-[#cbd5e1] space-y-1">
                <p>• Hanya berlaku di <strong>Solo Mode</strong>.</p>
                <p>• Dibatasi <strong>maksimal 1x Continue</strong> per satu sesi permainan.</p>
                <p>• Skor, garis, dan combo tetap utuh; balok macet dibersihkan agar permainan bisa lanjut!</p>
              </div>
            </div>
          </div>

          {/* 5. Progressive Web App (PWA) */}
          <div className="flex items-start gap-3 pt-3.5">
            <div className="p-2 bg-[#201d36] border border-[#8b5cf6]/40 rounded-xl text-[#a78bfa] shrink-0 mt-0.5">
              <Smartphone className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-sm text-white">
                Install Sebagai Aplikasi (PWA)
              </h4>
              <p className="text-xs text-[#94a3b8] mt-1 leading-relaxed">
                BlockArena kini dapat di-install langsung ke HP (Android/iOS) atau PC Anda melalui tombol <strong className="text-white">INSTALL APLIKASI</strong>. Nikmati pengalaman bermain layar penuh tanpa address bar browser dan akses mode Solo secara offline.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-[#1f2637] bg-[#121623]/80 flex items-center justify-between gap-3">
          <span className="text-[11px] text-[#64748b] hidden sm:inline">
            Bisa dibuka kapan saja via tombol &ldquo;Baca Update&rdquo; di Dashboard.
          </span>
          <button
            onClick={handleUnderstand}
            className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-[#2563eb] to-[#3b82f6] hover:from-[#1d4ed8] hover:to-[#2563eb] text-white text-xs font-mono font-bold tracking-wider rounded-xl transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer border border-[#60a5fa]"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>SAYA SUDAH MENGERTI</span>
          </button>
        </div>
      </div>
    </div>
  );
};
