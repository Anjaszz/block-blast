'use client';

import React, { useState, useEffect } from 'react';
import { Trophy, X, RotateCcw, Crown, Info } from 'lucide-react';
import { LeaderboardEntry } from '@/lib/types';
import { fetchLeaderboard, isSupabaseConfigured } from '@/lib/supabase';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchLeaderboard();
      setEntries(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#11141d] rounded-xl border border-[#202636] p-5 shadow-2xl flex flex-col gap-3.5 max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#202636]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-[#1f2636] border border-[#2d374d] rounded-md">
              <Trophy className="w-5 h-5 text-[#facc15]" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white tracking-wide">LEADERBOARD GLOBAL</h3>
              <p className="text-[10px] font-mono text-[#3b82f6]">
                SKOR TERTINGGI SOLO MODE (BUKAN AKUMULASI)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={loadData}
              disabled={loading}
              className="p-1.5 text-[#94a3b8] hover:text-white rounded hover:bg-[#181d2a] transition-colors cursor-pointer"
              title="Refresh"
            >
              <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-[#94a3b8] hover:text-white rounded hover:bg-[#181d2a] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Explanatory Banner */}
        <div className="p-2.5 bg-[#151924] border border-[#202738] rounded-lg text-[11px] text-[#94a3b8] flex items-center gap-2">
          <Info className="w-4 h-4 text-[#3b82f6] shrink-0" />
          <span>
            Hanya mencatat <strong className="text-white">rekor poin tertinggi per 1 permainan solo</strong>. Poin stage room dihitung khusus di scoreboard room masing-masing.
          </span>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-y-auto pr-1">
          {loading ? (
            <div className="py-12 text-center text-xs font-mono text-[#94a3b8]">
              MEMUAT LEADERBOARD...
            </div>
          ) : entries.length === 0 ? (
            <div className="py-12 text-center text-xs font-mono text-[#94a3b8]">
              BELUM ADA SKOR TERCATAT. MAIN SOLO SEKARANG!
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <div className="grid grid-cols-12 text-[10px] font-mono text-[#94a3b8] px-2 py-1">
                <span className="col-span-2">RANK</span>
                <span className="col-span-5">PEMAIN</span>
                <span className="col-span-2 text-center">LINES</span>
                <span className="col-span-3 text-right">BEST SCORE</span>
              </div>

              {entries.map((item, index) => {
                const rank = index + 1;
                let rankBadgeBg = 'bg-[#181d2a] text-[#94a3b8]';
                if (rank === 1) rankBadgeBg = 'bg-[#eab308] text-black font-black';
                else if (rank === 2) rankBadgeBg = 'bg-[#94a3b8] text-black font-black';
                else if (rank === 3) rankBadgeBg = 'bg-[#b45309] text-white font-bold';

                return (
                  <div
                    key={item.id || index}
                    className="grid grid-cols-12 items-center p-2 rounded-lg bg-[#151924] border border-[#202738] text-xs hover:border-[#3b82f6]/50 transition-colors"
                  >
                    <div className="col-span-2 flex items-center">
                      <span className={`w-5 h-5 rounded flex items-center justify-center text-[11px] ${rankBadgeBg}`}>
                        {rank === 1 ? <Crown className="w-3 h-3" /> : rank}
                      </span>
                    </div>

                    <div className="col-span-5 truncate font-semibold text-white">
                      {item.username}
                    </div>

                    <div className="col-span-2 text-center font-mono text-[#94a3b8]">
                      {item.lines_cleared}
                    </div>

                    <div className="col-span-3 text-right font-mono font-bold text-[#3b82f6]">
                      {item.score.toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
