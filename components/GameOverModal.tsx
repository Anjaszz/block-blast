'use client';

import React, { useEffect, useMemo } from 'react';
import {
  RotateCcw,
  Trophy,
  Crown,
  Swords,
  Sparkles,
  Skull,
  CheckCircle2,
  Users,
  Medal,
  Home,
  Flame,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Player, StageMode } from '@/lib/types';

interface GameOverModalProps {
  isOpen: boolean;
  score: number;
  linesCleared: number;
  maxCombo: number;
  isNewHigh: boolean;
  gameMode: 'solo' | 'stage';
  stageMode?: StageMode;
  stageWinner: Player | null;
  stageRank: number | null;
  stagePlayers?: Player[];
  roomCode?: string;
  localPlayerId?: string;
  gems?: number;
  hasUsedContinue?: boolean;
  onContinue?: () => void;
  onRestart: () => void;
  onBackToMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  score,
  linesCleared,
  maxCombo,
  isNewHigh,
  gameMode,
  stageMode = 'survival',
  stageWinner,
  stageRank,
  stagePlayers,
  roomCode,
  localPlayerId,
  gems = 0,
  hasUsedContinue = false,
  onContinue,
  onRestart,
  onBackToMenu,
}) => {
  const isStageMode = gameMode === 'stage' || stageWinner !== null || stageRank !== null;

  // Process & Sort Full Ranked Players List for Stage Mode
  const sortedPlayers: Player[] = useMemo(() => {
    if (!isStageMode) return [];

    let list: Player[] = [];
    if (stagePlayers && stagePlayers.length > 0) {
      list = [...stagePlayers];
    } else if (stageWinner) {
      list = [stageWinner];
    }

    // Sort list according to rules:
    // 1. If assigned rank exists and differs
    // 2. Put absolute winner at top (#1)
    // 3. Follow timer or survival logic
    list.sort((a, b) => {
      if (typeof a.rank === 'number' && typeof b.rank === 'number' && a.rank !== b.rank) {
        return a.rank - b.rank;
      }
      if (stageWinner) {
        if (a.id === stageWinner.id) return -1;
        if (b.id === stageWinner.id) return 1;
      }
      if (stageMode === 'timer') {
        return (b.score || 0) - (a.score || 0);
      } else {
        if (a.isAlive && !b.isAlive) return -1;
        if (!a.isAlive && b.isAlive) return 1;
        return (b.score || 0) - (a.score || 0);
      }
    });

    // Make sure designated winner is at index 0
    if (stageWinner) {
      const winnerIdx = list.findIndex((p) => p.id === stageWinner.id);
      if (winnerIdx > 0) {
        const [w] = list.splice(winnerIdx, 1);
        list.unshift(w);
      }
    }

    // Assign rank 1..N cleanly
    return list.map((p, idx) => ({
      ...p,
      rank: idx + 1,
    }));
  }, [isStageMode, stagePlayers, stageWinner, stageMode]);

  // Determine if the local player is the actual champion
  const isActualWinner = isStageMode
    ? Boolean(
        stageWinner && localPlayerId
          ? stageWinner.id === localPlayerId
          : stageRank === 1 || (sortedPlayers.length > 0 && sortedPlayers[0].id === localPlayerId)
      )
    : false;

  // My calculated rank in stage
  const myComputedRank = useMemo(() => {
    if (!isStageMode) return null;
    if (isActualWinner) return 1;
    const foundIdx = sortedPlayers.findIndex((p) => p.id === localPlayerId);
    if (foundIdx >= 0) return foundIdx + 1;
    return stageRank || 2;
  }, [isStageMode, isActualWinner, sortedPlayers, localPlayerId, stageRank]);

  useEffect(() => {
    if (isOpen && (isNewHigh || isActualWinner)) {
      try {
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#facc15', '#2563eb', '#ef4444', '#10b981', '#ffffff'],
        });
      } catch {
        // Confetti optional
      }
    }
  }, [isOpen, isNewHigh, isActualWinner]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div
        className={`w-full ${
          isStageMode ? 'max-w-md sm:max-w-lg' : 'max-w-sm'
        } bg-[#11141d] rounded-2xl border border-[#202636] p-5 sm:p-6 shadow-2xl flex flex-col gap-4 text-center my-auto max-h-[92vh] overflow-y-auto`}
      >
        {/* ================= HEADER ================= */}
        <div>
          {isStageMode ? (
            <div className="flex flex-col items-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#181d2a] border border-[#262e3f] mb-2 text-xs font-mono font-bold text-[#94a3b8]">
                <Swords className="w-3.5 h-3.5 text-[#ef4444]" />
                <span>
                  {stageMode === 'timer' ? 'STAGE MODE: TIMER BATTLE' : 'STAGE MODE: SURVIVAL ELIMINATION'}
                </span>
                {roomCode && <span className="text-[#64748b]">#{roomCode}</span>}
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white tracking-wider">
                HASIL PERTANDINGAN
              </h2>
            </div>
          ) : (
            <div>
              <div className="inline-flex p-3 rounded-xl bg-[#181d2a] border border-[#262e3f] mb-2">
                <Trophy className="w-8 h-8 text-[#3b82f6]" />
              </div>
              <h2 className="text-xl font-black text-white tracking-wider">GAME OVER</h2>
            </div>
          )}

          {isNewHigh && (
            <div className="inline-block mt-1 px-2.5 py-0.5 bg-[#2563eb] text-white text-[10px] font-black uppercase tracking-widest rounded">
              NEW PERSONAL BEST!
            </div>
          )}
        </div>

        {/* ================= STAGE MODE: WINNER SPOTLIGHT ================= */}
        {isStageMode && (
          <div>
            {isActualWinner ? (
              <div className="p-4 rounded-xl bg-gradient-to-b from-amber-500/20 via-amber-950/20 to-[#181d2a] border border-amber-500/40 shadow-[0_0_25px_rgba(245,158,11,0.2)] flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center mb-1.5 shadow-inner">
                  <Crown className="w-7 h-7 text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.8)] animate-pulse" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                  STAGE CHAMPION
                </span>
                <h3 className="text-lg sm:text-xl font-black text-white tracking-wide">
                  SELAMAT, KAMU JUARA 1! 🏆
                </h3>
                <p className="text-xs text-[#cbd5e1] mt-0.5">
                  {stageMode === 'timer'
                    ? 'Hebat! Kamu berhasil mencetak skor tertinggi di room ini!'
                    : 'Luar biasa! Kamu adalah pemain terakhir yang bertahan di arena!'}
                </p>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-[#181d2a] to-[#141824] border border-amber-500/30 flex items-center justify-between gap-3 text-left">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shrink-0">
                    <Crown className="w-5 h-5 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">
                      JUARA 1 ({stageMode === 'timer' ? 'SKOR TERTINGGI' : 'LAST SURVIVOR'})
                    </span>
                    <span className="text-sm font-black text-white truncate block">
                      {stageWinner?.username || sortedPlayers[0]?.username || 'Player 1'}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] text-[#94a3b8] font-mono block">SKOR AKHIR</span>
                  <span className="text-sm font-mono font-black text-amber-300">
                    {(stageWinner?.score || sortedPlayers[0]?.score || 0).toLocaleString()} <span className="text-[9px]">PTS</span>
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= STAGE MODE: ALL PLAYERS RANKINGS LIST ================= */}
        {isStageMode && sortedPlayers.length > 0 && (
          <div className="flex flex-col gap-2 text-left">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-mono font-bold text-[#94a3b8] flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#3b82f6]" />
                KLASEMEN AKHIR SEMUA PEMAIN
              </span>
              <span className="text-[11px] font-mono font-semibold text-[#64748b]">
                {sortedPlayers.length} Pemain
              </span>
            </div>

            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {sortedPlayers.map((p, idx) => {
                const rankNum = p.rank || idx + 1;
                const isMe = p.id === localPlayerId;
                const isWinner = rankNum === 1 || (stageWinner && p.id === stageWinner.id);
                const isDead = !p.isAlive && !isWinner;

                return (
                  <div
                    key={p.id || idx}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                      isMe
                        ? 'bg-blue-950/40 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                        : 'bg-[#151923] border-[#222938]'
                    }`}
                  >
                    {/* Left: Rank Badge, Color Indicator, Username, and Stats */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Rank Badge */}
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs shrink-0 border ${
                          rankNum === 1
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : rankNum === 2
                            ? 'bg-slate-400/20 text-slate-200 border-slate-400/40'
                            : rankNum === 3
                            ? 'bg-orange-600/20 text-orange-300 border-orange-500/40'
                            : 'bg-[#1a202d] text-[#94a3b8] border-[#262f42]'
                        }`}
                      >
                        {rankNum === 1 ? '👑1' : `#${rankNum}`}
                      </div>

                      {/* Accent Color Dot */}
                      <div
                        className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: p.accentColor || '#3b82f6' }}
                      />

                      {/* Name & Sub-details */}
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5 truncate">
                          <span
                            className={`text-xs font-bold truncate ${
                              isMe ? 'text-white' : 'text-[#cbd5e1]'
                            }`}
                          >
                            {p.username}
                          </span>
                          {isMe && (
                            <span className="px-1.5 py-0.2 bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[9px] font-black rounded uppercase">
                              KAMU
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-[#64748b] font-mono">
                          {p.linesCleared ?? 0} lines • x{p.combo ?? 0} combo
                        </span>
                      </div>
                    </div>

                    {/* Right: Status Pill & Final Score */}
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Status Badge */}
                      {isWinner ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] font-black flex items-center gap-1">
                          <Crown className="w-3 h-3" />
                          JUARA 1
                        </span>
                      ) : isDead ? (
                        <span className="px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30 text-[10px] font-bold flex items-center gap-1">
                          <Skull className="w-3 h-3" />
                          GAME OVER
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          SELESAI
                        </span>
                      )}

                      {/* Final Score */}
                      <div className="text-right min-w-[50px]">
                        <span className="font-mono font-black text-xs text-white">
                          {(p.score ?? 0).toLocaleString()}
                        </span>
                        <span className="block text-[8px] text-[#64748b] font-mono -mt-0.5">PTS</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= PERSONAL STATS SUMMARY ================= */}
        <div className="flex flex-col gap-1.5">
          {isStageMode && (
            <div className="flex items-center justify-between text-xs px-1 text-[#94a3b8] font-mono">
              <span>STATISTIK PERFORMA KAMU:</span>
              <span className="font-bold text-white">
                Peringkat #{myComputedRank || 1}
              </span>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2">
            <div className="p-2.5 bg-[#161a25] border border-[#222938] rounded-xl flex flex-col items-center">
              <span className="text-[10px] font-mono text-[#94a3b8]">SKOR KAMU</span>
              <span className="font-mono font-bold text-sm text-[#3b82f6] mt-0.5">
                {score.toLocaleString()}
              </span>
            </div>

            <div className="p-2.5 bg-[#161a25] border border-[#222938] rounded-xl flex flex-col items-center">
              <span className="text-[10px] font-mono text-[#94a3b8]">LINES</span>
              <span className="font-mono font-bold text-sm text-white mt-0.5">
                {linesCleared}
              </span>
            </div>

            <div className="p-2.5 bg-[#161a25] border border-[#222938] rounded-xl flex flex-col items-center">
              <span className="text-[10px] font-mono text-[#94a3b8]">MAX COMBO</span>
              <span className="font-mono font-bold text-sm text-[#ef4444] mt-0.5">
                x{maxCombo}
              </span>
            </div>
          </div>
        </div>

        {/* ================= ACTION BUTTONS ================= */}
        <div className="flex flex-col gap-2 mt-1">
          {!isStageMode ? (
            <>
              {/* CONTINUE BUTTON (Solo Mode only & max 1x per game) */}
              {!hasUsedContinue && onContinue && (
                <button
                  onClick={onContinue}
                  disabled={gems < 1}
                  className={`w-full py-3 px-4 rounded-xl flex items-center justify-between text-xs font-mono font-black tracking-wider transition-all border ${
                    gems >= 1
                      ? 'bg-gradient-to-r from-[#0284c7] to-[#2563eb] hover:from-[#0369a1] hover:to-[#1d4ed8] text-white border-[#38bdf8] shadow-[0_0_20px_rgba(56,189,248,0.4)] animate-pulse cursor-pointer'
                      : 'bg-[#181d2a] text-[#64748b] border-[#222938] opacity-60 cursor-not-allowed'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#38bdf8] fill-current" />
                    <span>LANJUTKAN PERMAINAN (1x)</span>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-black/40 text-[11px] flex items-center gap-1 font-bold text-white">
                    💎 1 Permata
                  </span>
                </button>
              )}

              <button
                onClick={onRestart}
                className="w-full py-3 px-4 bg-[#2563eb] hover:bg-[#3b82f6] text-white font-bold text-xs tracking-wider rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer border border-[#1d4ed8]"
              >
                <RotateCcw className="w-4 h-4" />
                <span>PLAY AGAIN</span>
              </button>

              <button
                onClick={onBackToMenu}
                className="w-full py-2.5 px-4 bg-[#161a25] hover:bg-[#1d2332] text-[#94a3b8] hover:text-white font-semibold text-xs tracking-wide rounded-xl transition-colors cursor-pointer border border-[#222938]"
              >
                KEMBALI KE MENU
              </button>
            </>
          ) : (
            <button
              onClick={onBackToMenu}
              className="w-full py-3 px-4 bg-[#2563eb] hover:bg-[#3b82f6] text-white font-bold text-xs tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer border border-[#1d4ed8] shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:shadow-[0_0_20px_rgba(37,99,235,0.5)]"
            >
              <Home className="w-4 h-4" />
              <span>KEMBALI KE DASHBOARD</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
