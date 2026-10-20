'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Smile, Sparkles, X, Crown, Lock, Target } from 'lucide-react';
import { Player } from '@/lib/types';
import { soundManager } from '@/lib/sound';

export interface EmoteItem {
  emote: string;
  label: string;
}

// 8 Emote Umum
export const QUICK_EMOTES: EmoteItem[] = [
  { emote: '🔥', label: 'Membara' },
  { emote: '😎', label: 'Santai' },
  { emote: '😱', label: 'Panik' },
  { emote: '💀', label: 'Tamat' },
  { emote: '👏', label: 'Mantap' },
  { emote: '🚀', label: 'Gass' },
  { emote: '😈', label: 'Ngece' },
  { emote: '😭', label: 'Nangis' },
];

// 5 Emote Khusus Sombong (Hanya Aktif saat Pemain sedang Top 1 Score)
export const TOP1_FLEX_EMOTES: EmoteItem[] = [
  { emote: '👑', label: 'Raja Bos!' },
  { emote: '🥱', label: 'Terlalu Gampang!' },
  { emote: '💅', label: 'Kejar Kalo Bisa!' },
  { emote: '🏆', label: 'Ga Ada Lawan!' },
  { emote: '🥇', label: 'Nomor 1 Nih!' },
];

export interface FloatingEmoteEvent {
  id: string;
  senderName: string;
  targetName?: string;
  emote: string;
  label?: string;
  isSelf: boolean;
  isTargetMe?: boolean;
  isFlex?: boolean;
  xPercent: number; // 15% - 85%
  createdAt: number;
}

interface PlayerTargetEmoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetPlayer: Player;
  isLocalRank1: boolean;
  onSendEmote: (emote: string, targetPlayer: Player, isFlex?: boolean) => void;
  disabled?: boolean;
}

/**
 * Modal Popover untuk Mengirim Emote ke 1 Pemain Spesifik
 */
export const PlayerTargetEmoteModal: React.FC<PlayerTargetEmoteModalProps> = ({
  isOpen,
  onClose,
  targetPlayer,
  isLocalRank1,
  onSendEmote,
  disabled = false,
}) => {
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (cooldown > 0) {
      timerRef.current = setTimeout(() => {
        setCooldown((prev) => Math.max(0, prev - 100));
      }, 100);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [cooldown]);

  if (!isOpen) return null;

  const handleSelect = (emote: string, isFlex: boolean = false) => {
    if (cooldown > 0 || disabled) return;
    soundManager.playEmoteSound();
    onSendEmote(emote, targetPlayer, isFlex);
    setCooldown(800);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3">
      <div className="w-full max-w-sm bg-[#11141d] rounded-2xl border border-[#2b3548] p-4 shadow-2xl flex flex-col gap-3 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-[#202636]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#182132] border border-[#38bdf8]/40 rounded-lg">
              <Target className="w-4 h-4 text-[#38bdf8]" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Kirim Reaksi ke:</span>
                <span className="text-[#38bdf8] font-mono">{targetPlayer.username}</span>
              </div>
              <div className="text-[10px] font-mono text-[#94a3b8]">
                Rank #{targetPlayer.rank || '?'} • {targetPlayer.score.toLocaleString()} pts
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-[#64748b] hover:text-white p-1 rounded-lg hover:bg-[#181d2a] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. SEKSI KHUSUS: REAKSI SOMBONG (TOP 1) */}
        <div className={`p-2.5 rounded-xl border transition-all ${
          isLocalRank1
            ? 'bg-[#291e0b] border-[#eab308] shadow-[0_0_15px_rgba(234,179,8,0.25)]'
            : 'bg-[#151922] border-[#222938] opacity-80'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono font-bold tracking-wider uppercase flex items-center gap-1.5 text-[#facc15]">
              <Crown className="w-3.5 h-3.5 fill-current" />
              REAKSI SOMBONG (TOP 1 EXCLUSIVE)
            </span>
            {!isLocalRank1 && (
              <span className="text-[9px] font-mono bg-[#1c2230] text-[#94a3b8] px-1.5 py-0.5 rounded flex items-center gap-0.5">
                <Lock className="w-2.5 h-2.5" />
                KUNCI
              </span>
            )}
          </div>

          {isLocalRank1 ? (
            <div className="grid grid-cols-5 gap-1.5">
              {TOP1_FLEX_EMOTES.map(({ emote, label }) => (
                <button
                  key={label}
                  onClick={() => handleSelect(emote, true)}
                  disabled={cooldown > 0 || disabled}
                  className="p-1.5 bg-[#3a2a0d] hover:bg-[#523d13] border border-[#eab308]/60 hover:border-[#fde047] rounded-lg flex flex-col items-center justify-center gap-0.5 transition-all hover:scale-110 active:scale-95 cursor-pointer"
                  title={label}
                >
                  <span className="text-2xl animate-bounce">{emote}</span>
                  <span className="text-[8px] font-mono text-[#fde047] truncate max-w-full font-bold">
                    {label}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-[10px] font-mono text-[#64748b] text-center py-1">
              Capai <strong>Rank #1 Score</strong> di room ini untuk pamer dan membuka reaksi sombong! 👑
            </p>
          )}
        </div>

        {/* 2. SEKSI EMOTE STANDAR */}
        <div>
          <span className="text-[10px] font-mono font-bold text-[#94a3b8] uppercase tracking-wider block mb-1.5">
            REAKSI UMUM:
          </span>

          <div className="grid grid-cols-4 gap-1.5">
            {QUICK_EMOTES.map(({ emote, label }) => (
              <button
                key={label}
                onClick={() => handleSelect(emote, false)}
                disabled={cooldown > 0 || disabled}
                className="p-2 bg-[#171c28] hover:bg-[#232c3f] border border-[#263145] hover:border-[#38bdf8] rounded-xl flex flex-col items-center justify-center gap-1 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <span className="text-2xl">{emote}</span>
                <span className="text-[9px] font-mono text-[#94a3b8] truncate max-w-full">
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

interface QuickEmoteSystemProps {
  onSendEmote: (emote: string) => void;
  floatingEmotes: FloatingEmoteEvent[];
  disabled?: boolean;
}

export const QuickEmoteSystem: React.FC<QuickEmoteSystemProps> = ({
  onSendEmote,
  floatingEmotes,
  disabled = false,
}) => {
  return null; // Logic dipindahkan langsung ke baris tiap pemain di StageScoreboard & RoomLobby
};
