'use client';

import React from 'react';
import { Player } from '@/lib/types';
import { Crown, Flame, Swords } from 'lucide-react';

interface StageScoreboardProps {
  players: Player[];
  localPlayerId: string;
  roomCode: string;
}

export const StageScoreboard: React.FC<StageScoreboardProps> = ({
  players,
  localPlayerId,
  roomCode,
}) => {
  const maxScore = Math.max(...players.map((p) => p.score), 100);

  return (
    <div className="w-full max-w-[340px] bg-[#11141d] rounded-xl border border-[#202636] p-3.5 flex flex-col gap-3">
      {/* Header with Survival Badge (No countdown timer) */}
      <div className="flex items-center justify-between pb-2.5 border-b border-[#202636]">
        <div>
          <div className="text-[10px] uppercase font-mono tracking-wider text-[#94a3b8]">STAGE ROOM</div>
          <div className="font-mono font-bold text-sm tracking-wider text-[#3b82f6]">{roomCode}</div>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#181d2a] border border-[#262e3f] rounded">
          <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse shrink-0" />
          <span className="font-mono font-bold text-xs text-white tracking-wider flex items-center gap-1">
            <Swords className="w-3 h-3 text-[#ef4444]" />
            SURVIVAL
          </span>
        </div>
      </div>

      {/* 5-Player Leaderboard Table */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-[11px] font-mono text-[#94a3b8] px-1">
          <span>RANK & PLAYER (SURVIVOR)</span>
          <span>SCORE</span>
        </div>

        {players.map((player, index) => {
          const isLocal = player.id === localPlayerId;
          const rank = index + 1;
          const progressPercent = Math.min(100, Math.round((player.score / maxScore) * 100));

          let rankBadgeBg = 'bg-[#1e2433] text-[#94a3b8]';
          if (rank === 1 && player.isAlive) rankBadgeBg = 'bg-[#eab308] text-black font-black';
          else if (rank === 2 && player.isAlive) rankBadgeBg = 'bg-[#94a3b8] text-black font-black';
          else if (rank === 3 && player.isAlive) rankBadgeBg = 'bg-[#b45309] text-white font-bold';

          return (
            <div
              key={player.id}
              className={`p-2 rounded-lg border flex flex-col gap-1 transition-all ${
                !player.isAlive
                  ? 'bg-[#10131a]/60 border-[#1a1f2b] opacity-60'
                  : isLocal
                  ? 'bg-[#161c28] border-[#3b82f6]'
                  : 'bg-[#131620] border-[#1f2635]'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 truncate">
                  {/* Rank Badge */}
                  <span className={`w-5 h-5 rounded flex items-center justify-center text-xs shrink-0 ${rankBadgeBg}`}>
                    {rank === 1 && player.isAlive ? <Crown className="w-3 h-3" /> : rank}
                  </span>

                  {/* Player Name */}
                  <span
                    className={`text-xs font-semibold truncate ${
                      !player.isAlive
                        ? 'text-[#64748b] line-through'
                        : isLocal
                        ? 'text-[#3b82f6]'
                        : 'text-white'
                    }`}
                  >
                    {player.username} {isLocal && '(YOU)'}
                  </span>

                  {/* Eliminated Badge */}
                  {!player.isAlive && (
                    <span className="text-[9px] font-mono font-bold text-[#ef4444] bg-[#2a1417] px-1 py-0.5 rounded border border-[#ef4444]/30 shrink-0">
                      OUT
                    </span>
                  )}

                  {/* Combo Badge */}
                  {player.isAlive && player.combo > 1 && (
                    <span className="flex items-center gap-0.5 text-[10px] font-mono text-[#ef4444] bg-[#2a1417] px-1 rounded shrink-0">
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
                    backgroundColor: !player.isAlive ? '#475569' : isLocal ? '#3b82f6' : '#dc2626',
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
