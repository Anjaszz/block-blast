'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Smile, Sparkles, X } from 'lucide-react';
import { soundManager } from '@/lib/sound';

export interface EmoteItem {
  emote: string;
  label: string;
}

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

export interface FloatingEmoteEvent {
  id: string;
  senderName: string;
  emote: string;
  isSelf: boolean;
  xPercent: number; // 15% - 85%
  createdAt: number;
}

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
  const [isOpen, setIsOpen] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Cooldown countdown
  useEffect(() => {
    if (cooldown > 0) {
      cooldownTimerRef.current = setTimeout(() => {
        setCooldown((prev) => Math.max(0, prev - 100));
      }, 100);
    }
    return () => {
      if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
    };
  }, [cooldown]);

  const handleSelectEmote = (emote: string) => {
    if (cooldown > 0 || disabled) return;
    soundManager.playEmoteSound();
    onSendEmote(emote);
    setCooldown(800); // 0.8s anti-spam cooldown
  };

  return (
    <>
      {/* 1. FLOATING REACTION BUBBLES LAYER */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {floatingEmotes.map((item) => (
          <div
            key={item.id}
            className="absolute bottom-16 animate-float-up flex flex-col items-center gap-1 select-none"
            style={{
              left: `${item.xPercent}%`,
              transform: 'translateX(-50%)',
            }}
          >
            {/* Sender Badge */}
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider shadow-md backdrop-blur-md border ${
                item.isSelf
                  ? 'bg-[#3b82f6]/90 border-white/40 text-white'
                  : 'bg-[#181d2a]/90 border-[#38bdf8]/50 text-[#38bdf8]'
              }`}
            >
              {item.isSelf ? 'Kamu' : item.senderName}
            </span>

            {/* Glowing Bouncing Big Emote */}
            <span className="text-4xl sm:text-5xl filter drop-shadow-[0_0_15px_rgba(255,255,255,0.6)] animate-pulse">
              {item.emote}
            </span>
          </div>
        ))}
      </div>

      {/* 2. EMOTE TRIGGER BUTTON & POPUP DOCK */}
      <div className="relative inline-block">
        {/* Toggle Trigger Button */}
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          disabled={disabled}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-mono text-xs font-bold transition-all cursor-pointer shadow-lg select-none ${
            isOpen
              ? 'bg-[#2563eb] border-[#60a5fa] text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]'
              : 'bg-[#161a25] hover:bg-[#1f2637] border-[#222938] hover:border-[#38bdf8] text-[#94a3b8] hover:text-white'
          }`}
          title="Kirim Reaksi Cepat / Emote Live"
        >
          <Smile className={`w-4 h-4 ${isOpen ? 'text-white animate-spin' : 'text-[#facc15]'}`} />
          <span className="hidden sm:inline">REAKSI</span>
          {cooldown > 0 && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444] animate-ping" />
          )}
        </button>

        {/* Emote Selection Drawer / Bubble Popup */}
        {isOpen && (
          <div className="absolute right-0 bottom-full mb-2.5 z-40 bg-[#11141d]/95 backdrop-blur-md border border-[#2b3548] p-2.5 rounded-2xl shadow-[0_10px_35px_rgba(0,0,0,0.8)] flex flex-col gap-2 min-w-[280px] sm:min-w-[320px] animate-scale-in">
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-1 pb-1 border-b border-[#202636]">
              <span className="text-[10px] font-mono font-bold text-[#94a3b8] uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#facc15]" />
                REAKSI LIVE
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="text-[#64748b] hover:text-white p-0.5 rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Emote Grid */}
            <div className="grid grid-cols-4 gap-1.5">
              {QUICK_EMOTES.map(({ emote, label }) => {
                const isCooling = cooldown > 0;
                return (
                  <button
                    key={label}
                    onClick={() => handleSelectEmote(emote)}
                    disabled={isCooling || disabled}
                    className="group relative p-2 bg-[#171c28] hover:bg-[#232c3f] border border-[#263145] hover:border-[#38bdf8] rounded-xl flex flex-col items-center justify-center gap-1 transition-all hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <span className="text-2xl group-hover:animate-bounce">{emote}</span>
                    <span className="text-[9px] font-mono text-[#94a3b8] group-hover:text-white truncate max-w-full">
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Cooldown Bar */}
            {cooldown > 0 && (
              <div className="w-full bg-[#1e2536] h-1 rounded-full overflow-hidden mt-0.5">
                <div
                  className="bg-[#3b82f6] h-full transition-all duration-100"
                  style={{ width: `${(cooldown / 800) * 100}%` }}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};
