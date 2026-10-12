'use client';

import React, { useEffect } from 'react';
import { RotateCcw, Trophy, Crown, Swords, Share2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Player } from '@/lib/types';

interface GameOverModalProps {
  isOpen: boolean;
  score: number;
  linesCleared: number;
  maxCombo: number;
  isNewHigh: boolean;
  gameMode: 'solo' | 'stage';
  stageWinner: Player | null;
  stageRank: number | null;
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
  stageWinner,
  stageRank,
  onRestart,
  onBackToMenu,
}) => {
  useEffect(() => {
    if (isOpen && (isNewHigh || stageRank === 1)) {
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
  }, [isOpen, isNewHigh, stageRank]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#11141d] rounded-xl border border-[#202636] p-6 shadow-2xl flex flex-col gap-5 text-center">
        {/* Title & Badge */}
        <div>
          {gameMode === 'stage' ? (
            <div className="inline-flex p-3 rounded-lg bg-[#181d2a] border border-[#262e3f] mb-2">
              <Swords className="w-8 h-8 text-[#ef4444]" />
            </div>
          ) : (
            <div className="inline-flex p-3 rounded-lg bg-[#181d2a] border border-[#262e3f] mb-2">
              <Trophy className="w-8 h-8 text-[#3b82f6]" />
            </div>
          )}

          <h2 className="text-xl font-black text-white tracking-wider">
            {gameMode === 'stage' ? 'STAGE COMPLETE' : 'GAME OVER'}
          </h2>

          {isNewHigh && (
            <div className="inline-block mt-1 px-2.5 py-0.5 bg-[#2563eb] text-white text-[10px] font-black uppercase tracking-widest rounded">
              NEW PERSONAL BEST!
            </div>
          )}

          {gameMode === 'stage' && stageRank && (
            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-[#181d2a] border border-[#262e3f] rounded-lg">
              {stageRank === 1 ? (
                <>
                  <Crown className="w-4 h-4 text-[#facc15]" />
                  <span className="text-xs font-black text-[#facc15]">
                    JUARA 1 (LAST SURVIVOR)
                  </span>
                </>
              ) : (
                <span className="text-xs font-bold text-[#94a3b8]">
                  PERINGKAT #{stageRank} (TERELIMINASI)
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
        {gameMode === 'stage' && stageWinner && (
          <div className="p-2.5 bg-[#181d2a] border border-[#262e3f] rounded-lg text-xs flex items-center justify-between">
            <span className="text-[#94a3b8]">JUARA STAGE (SURVIVOR):</span>
            <span className="font-bold text-[#facc15] flex items-center gap-1">
              <Crown className="w-3.5 h-3.5" />
              {stageWinner.username} ({stageWinner.score.toLocaleString()} pts)
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          {gameMode === 'solo' ? (
            <>
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
