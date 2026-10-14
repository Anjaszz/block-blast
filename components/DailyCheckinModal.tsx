'use client';

import React, { useState, useEffect } from 'react';
import { CheckinStatus, claimDailyCheckin, getCheckinStatus, DAILY_REWARDS } from '@/lib/gems';
import { Calendar, Sparkles, Check, X, Gift, Crown, Info } from 'lucide-react';
import confetti from 'canvas-confetti';

interface DailyCheckinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGemsUpdated: (newGems: number) => void;
}

export const DailyCheckinModal: React.FC<DailyCheckinModalProps> = ({
  isOpen,
  onClose,
  onGemsUpdated,
}) => {
  const [status, setStatus] = useState<CheckinStatus | null>(null);
  const [claimFeedback, setClaimFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStatus(getCheckinStatus());
      setClaimFeedback(null);
    }
  }, [isOpen]);

  if (!isOpen || !status) return null;

  const handleClaim = () => {
    const res = claimDailyCheckin();
    if (res.success) {
      onGemsUpdated(res.totalGems);
      setStatus(getCheckinStatus());
      setClaimFeedback(res.message || null);

      try {
        confetti({
          particleCount: 70,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#38bdf8', '#eab308', '#ec4899', '#ffffff'],
        });
      } catch {
        // Ignore confetti
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-lg bg-[#11141d] rounded-2xl border border-[#202636] p-5 shadow-2xl flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#202636]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#172338] border border-[#2563eb] rounded-xl text-[#38bdf8]">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-black text-sm text-white tracking-wider">
                  DAILY CHECK-IN
                </span>
                <span className="text-[10px] font-mono font-bold bg-[#1d4ed8] text-white px-1.5 py-0.5 rounded">
                  7-DAY STREAK
                </span>
              </div>
              <p className="text-[11px] text-[#94a3b8] mt-0.5">
                Check-in setiap hari untuk mengumpulkan Permata Revive!
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-[#64748b] hover:text-white p-1 rounded-lg hover:bg-[#181d2a] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 7-Days Calendar Grid */}
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          {DAILY_REWARDS.map((reward, index) => {
            const dayNum = index + 1;
            const isCompleted =
              status.lastCheckinDate &&
              ((status.canClaimToday && dayNum < status.nextClaimDay) ||
                (!status.canClaimToday && dayNum <= status.currentStreak));
            const isTodayClaimable = status.canClaimToday && dayNum === status.nextClaimDay;
            const isDay7 = dayNum === 7;
            const isDay6 = dayNum === 6;

            return (
              <div
                key={`day-${dayNum}`}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-between gap-1.5 transition-all text-center ${
                  isDay7 ? 'col-span-2 sm:col-span-1' : ''
                } ${
                  isCompleted
                    ? 'bg-[#12221b] border-[#10b981]/50 text-[#10b981]'
                    : isTodayClaimable
                    ? 'bg-[#132238] border-[#38bdf8] text-white shadow-[0_0_15px_rgba(56,189,248,0.3)] animate-pulse'
                    : isDay7
                    ? 'bg-[#221815] border-[#f59e0b]/40 text-[#f59e0b]'
                    : isDay6
                    ? 'bg-[#1e1724] border-[#a855f7]/40 text-[#c084fc]'
                    : 'bg-[#141824] border-[#1f2636] text-[#94a3b8] opacity-75'
                }`}
              >
                {/* Day Label */}
                <span className="text-[10px] font-mono font-bold tracking-wider">
                  DAY {dayNum}
                </span>

                {/* Reward Gem Icon & Value */}
                <div className="my-1 flex flex-col items-center">
                  {isCompleted ? (
                    <div className="w-7 h-7 rounded-full bg-[#10b981]/20 flex items-center justify-center text-[#10b981]">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  ) : isDay7 ? (
                    <div className="relative">
                      <Crown className="w-4 h-4 text-[#facc15] absolute -top-3 left-1/2 -translate-x-1/2" />
                      <span className="text-xl">💎</span>
                    </div>
                  ) : (
                    <span className="text-lg">💎</span>
                  )}
                  <span className="text-xs font-mono font-black mt-0.5">
                    +{reward}
                  </span>
                </div>

                {/* Status Indicator */}
                <div className="text-[9px] font-mono font-semibold">
                  {isCompleted ? (
                    <span className="text-[#10b981]">KLAIM</span>
                  ) : isTodayClaimable ? (
                    <span className="text-[#38bdf8] font-bold">HARI INI</span>
                  ) : (
                    <span className="text-[#64748b]">LOCKED</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Claim Feedback Banner */}
        {claimFeedback && (
          <div className="p-3 bg-[#11241b] border border-[#10b981] rounded-xl text-xs font-mono font-bold text-[#34d399] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#10b981] shrink-0" />
            <span>{claimFeedback}</span>
          </div>
        )}

        {/* Info Banner */}
        <div className="p-3 bg-[#151924] border border-[#222938] rounded-xl flex items-start gap-2.5 text-xs text-[#94a3b8]">
          <Info className="w-4 h-4 text-[#38bdf8] shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-white">Kegunaan Permata 💎:</strong> Dapat digunakan untuk{' '}
            <span className="text-[#38bdf8] font-semibold">Continue (Revive 1x)</span> saat kamu Game Over di Solo Mode agar skor tinggimu bisa berlanjut!
          </p>
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col gap-2 mt-1">
          {status.canClaimToday ? (
            <button
              onClick={handleClaim}
              className="w-full py-3 px-4 bg-gradient-to-r from-[#0284c7] to-[#2563eb] hover:from-[#0369a1] hover:to-[#1d4ed8] text-white font-mono font-black text-xs tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(56,189,248,0.4)]"
            >
              <Gift className="w-4 h-4" />
              <span>KLAIM HARI {status.nextClaimDay} (+{status.todayReward} PERMATA 💎)</span>
            </button>
          ) : (
            <button
              disabled
              className="w-full py-3 px-4 bg-[#161a25] border border-[#222938] text-[#64748b] font-mono font-bold text-xs tracking-wider rounded-xl cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4 text-[#10b981]" />
              <span>CHECK-IN HARI INI SELESAI (KEMBALI BESOK)</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full py-2 bg-[#161a25] hover:bg-[#1d2332] text-xs font-mono text-[#94a3b8] hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            TUTUP
          </button>
        </div>
      </div>
    </div>
  );
};
