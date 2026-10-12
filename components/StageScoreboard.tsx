'use client';

import React from 'react';
import { Player } from '@/lib/types';
import { Timer, Crown, Flame } from 'lucide-react';

interface StageScoreboardProps {
  players: Player[];
  localPlayerId: string;
  timeLeft: number;
  roomCode: string;
}

export const StageScoreboard: React.FC<StageScoreboardProps> = ({
  players,
  localPlayerId,
  timeLeft,
  roomCode,
}) => {
  const maxScore = Math.max(...players.map((p) => p.score), 100);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="w-full max-w-[340px] bg-[#11141d] rounded-xl border border-[#202636] p-3.5 flex flex-col gap-3">
      {/* Header with Stage Timer */}
      <div className="flex items-center justify-between pb-2.5 border-b border-[#202636]">
        <div>
          <div className="text-[10px] uppercase font-mono tracking-wider text-[#94a3b8]">STAGE ROOM</div>
          <div className="font-mono font-bold text-sm tracking-wider text-[#3b82f6]">{roomCode}</div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 bg-[#181d2a] border border-[#262e3f] rounded">
          <Timer className={`w-4 h-4 ${timeLeft <= 30 ? 'text-[#ef4444] animate-pulse' : 'text-[#3b82f6]'}`} />
          <span className={`font-mono font-bold text-sm ${timeLeft <= 30 ? 'text-[#ef4444]' : 'text-white'}`}>
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      {/* 5-Player Leaderboard Table */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-[11px] font-mono text-[#94a3b8] px-1">
          <span>RANK & PLAYER (MAX 5)</span>
          <span>SCORE</span>
        </div>

        {players.map((player, index) => {
          const isLocal = player.id === localPlayerId;
          const rank = index + 1;
          const progressPercent = Math.min(100, Math.round((player.score / maxScore) * 100));

          let rankBadgeBg = 'bg-[#1e2433] text-[#94a3b8]';
          if (rank === 1) rankBadgeBg = 'bg-[#eab308] text-black font-black';
          else if (rank === 2) rankBadgeBg = 'bg-[#94a3b8] text-black font-black';
          else if (rank === 3) rankBadgeBg = 'bg-[#b45309] text-white font-bold';

          return (
            <div
              key={player.id}
              className={`p-2 rounded-lg border flex flex-col gap-1 transition-all ${
                isLocal
                  ? 'bg-[#161c28] border-[#3b82f6]'
                  : 'bg-[#131620] border-[#1f2635]'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 truncate">
                  {/* Rank Badge */}
                  <span className={`w-5 h-5 rounded flex items-center justify-center text-xs shrink-0 ${rankBadgeBg}`}>
                    {rank === 1 ? <Crown className="w-3 h-3" /> : rank}
                  </span>

                  {/* Player Name */}
                  <span className={`text-xs font-semibold truncate ${isLocal ? 'text-[#3b82f6]' : 'text-white'}`}>
                    {player.username} {isLocal && '(YOU)'}
                  </span>

                  {/* Combo Badge */}
                  {player.combo > 1 && (
                    <span className="flex items-center gap-0.5 text-[10px] font-mono text-[#ef4444] bg-[#2a1417] px-1 rounded">
                      <Flame className="w-2.5 h-2.5" />
                      x{player.combo}
                    </span>
                  )}
                </div>

                {/* Score */}
                <span className="font-mono font-bold text-xs text-white shrink-0">
                  {player.score.toLocaleString()}
                </span>
              </div>

              {/* Progress Bar (Solid, no gradient) */}
              <div className="w-full bg-[#1b202c] h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${progressPercent}%`,
                    backgroundColor: isLocal ? '#3b82f6' : '#dc2626',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
