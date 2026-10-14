'use client';

import React, { useEffect } from 'react';
import { RotateCcw, Trophy, Crown, Swords, Sparkles } from 'lucide-react';
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
  localPlayerId,
  gems = 0,
  hasUsedContinue = false,
  onContinue,
  onRestart,
  onBackToMenu,
}) => {
  const isStageMode = gameMode === 'stage' || stageWinner !== null || stageRank !== null;

  const isActualWinner =
    isStageMode
      ? Boolean(stageWinner && localPlayerId ? stageWinner.id === localPlayerId : stageRank === 1)
      : false;

  useEffect(() => {
    if (isOpen && (isNewHigh || isActualWinner)) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#2563eb', '#ef4444', '#ffffff', '#3b82f6'],
        });
      } catch {
        // Confetti optional
      }
    }
  }, [isOpen, isNewHigh, isActualWinner]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#11141d] rounded-xl border border-[#202636] p-6 shadow-2xl flex flex-col gap-5 text-center">
        {/* Title & Badge */}
        <div>
          {isStageMode ? (
            <div className="inline-flex p-3 rounded-lg bg-[#181d2a] border border-[#262e3f] mb-2">
              <Swords className="w-8 h-8 text-[#ef4444]" />
            </div>
          ) : (
            <div className="inline-flex p-3 rounded-lg bg-[#181d2a] border border-[#262e3f] mb-2">
              <Trophy className="w-8 h-8 text-[#3b82f6]" />
            </div>
          )}

          <h2 className="text-xl font-black text-white tracking-wider">
            {isStageMode ? 'STAGE COMPLETE' : 'GAME OVER'}
          </h2>

          {isNewHigh && (
            <div className="inline-block mt-1 px-2.5 py-0.5 bg-[#2563eb] text-white text-[10px] font-black uppercase tracking-widest rounded">
              NEW PERSONAL BEST!
            </div>
          )}

          {isStageMode && (
            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-[#181d2a] border border-[#262e3f] rounded-lg">
              {isActualWinner ? (
                <>
                  <Crown className="w-4 h-4 text-[#facc15]" />
                  <span className="text-xs font-black text-[#facc15]">
                    {stageMode === 'timer' ? 'JUARA 1 (SKOR TERTINGGI)' : 'JUARA 1 (LAST SURVIVOR)'}
                  </span>
                </>
              ) : (
                <span className="text-xs font-bold text-[#94a3b8]">
                  PERINGKAT #{stageRank && stageRank > 1 ? stageRank : 2}
                  {stageMode === 'timer' ? '' : ' (TERELIMINASI)'}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Stats Grid (Solid cards, no gradient) */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2.5 bg-[#161a25] border border-[#222938] rounded-lg flex flex-col items-center">
            <span className="text-[10px] font-mono text-[#94a3b8]">SCORE</span>
            <span className="font-mono font-bold text-sm text-[#3b82f6] mt-0.5">
              {score.toLocaleString()}
            </span>
          </div>

          <div className="p-2.5 bg-[#161a25] border border-[#222938] rounded-lg flex flex-col items-center">
            <span className="text-[10px] font-mono text-[#94a3b8]">LINES</span>
            <span className="font-mono font-bold text-sm text-white mt-0.5">
              {linesCleared}
            </span>
          </div>

          <div className="p-2.5 bg-[#161a25] border border-[#222938] rounded-lg flex flex-col items-center">
            <span className="text-[10px] font-mono text-[#94a3b8]">MAX COMBO</span>
            <span className="font-mono font-bold text-sm text-[#ef4444] mt-0.5">
              x{maxCombo}
            </span>
          </div>
        </div>

        {/* Stage Winner Mention */}
        {isStageMode && stageWinner && (
          <div className="p-2.5 bg-[#181d2a] border border-[#262e3f] rounded-lg text-xs flex items-center justify-between">
            <span className="text-[#94a3b8]">
              {stageMode === 'timer' ? 'JUARA STAGE (SKOR TERTINGGI):' : 'JUARA STAGE (SURVIVOR):'}
            </span>
            <span className="font-bold text-[#facc15] flex items-center gap-1">
              <Crown className="w-3.5 h-3.5" />
              {stageWinner.username} ({stageWinner.score.toLocaleString()} pts)
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          {!isStageMode ? (
            <>
              {/* CONTINUE BUTTON (Hanya di mode Solo & maksimal 1x per game) */}
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
                className="w-full py-3 px-4 bg-[#2563eb] hover:bg-[#3b82f6] text-white font-bold text-xs tracking-wider rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer border border-[#1d4ed8]"
              >
                <RotateCcw className="w-4 h-4" />
                <span>PLAY AGAIN</span>
              </button>

              <button
                onClick={onBackToMenu}
                className="w-full py-2.5 px-4 bg-[#161a25] hover:bg-[#1d2332] text-[#94a3b8] hover:text-white font-semibold text-xs tracking-wide rounded-lg transition-colors cursor-pointer border border-[#222938]"
              >
                KEMBALI KE MENU
              </button>
            </>
          ) : (
            <button
              onClick={onBackToMenu}
              className="w-full py-3 px-4 bg-[#2563eb] hover:bg-[#3b82f6] text-white font-bold text-xs tracking-wider rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer border border-[#1d4ed8]"
            >
              KEMBALI KE DASHBOARD
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
