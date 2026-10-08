'use client';

import React, { useState } from 'react';
import { Users, Swords, Copy, Check, Play, Bot } from 'lucide-react';
import { Player } from '@/lib/types';
import { generateRoomCode } from '@/lib/multiplayer';
import { isSupabaseConfigured } from '@/lib/supabase';

interface StageLobbyProps {
  onJoinRoom: (code: string, asBotMode?: boolean) => void;
  roomCode: string | null;
  players: Player[];
  onStartStage: () => void;
  isHost: boolean;
  isInLobby: boolean;
}

export const StageLobby: React.FC<StageLobbyProps> = ({
  onJoinRoom,
  roomCode,
  players,
  onStartStage,
  isHost,
  isInLobby,
}) => {
  const [inputCode, setInputCode] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isInLobby) {
    return (
      <div className="w-full max-w-md mx-auto p-6 bg-[#11141d] rounded-xl border border-[#202636] flex flex-col gap-5">
        <div className="text-center">
          <div className="inline-flex p-3 rounded-lg bg-[#181d2a] border border-[#262e3f] mb-3">
            <Swords className="w-8 h-8 text-[#ef4444]" />
          </div>
          <h2 className="text-lg font-bold text-white tracking-wide">5-PLAYER STAGE BATTLE</h2>
          <p className="text-xs text-[#94a3b8] mt-1">
            Bertanding serentak dalam 1 stage maksimal 5 pemain. Siapa yang mencetak poin terbanyak keluar sebagai juara!
          </p>
        </div>

        {/* Quick Instant Battle Button */}
        <button
          onClick={() => onJoinRoom(`BOT-${generateRoomCode().slice(0, 4)}`, true)}
          className="w-full py-3 px-4 bg-[#dc2626] hover:bg-[#ef4444] text-white font-bold text-sm rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer border border-[#b91c1c]"
        >
          <Bot className="w-4 h-4" />
          <span>INSTANT STAGE (VS 4 RIVALS)</span>
        </button>

        <div className="flex items-center gap-2 my-1">
          <div className="flex-1 h-px bg-[#202636]" />
          <span className="text-[11px] font-mono text-[#94a3b8]">OR LIVE MULTIPLAYER</span>
          <div className="flex-1 h-px bg-[#202636]" />
        </div>

        {/* Create Room */}
        <button
          onClick={() => onJoinRoom(generateRoomCode())}
          className="w-full py-2.5 px-4 bg-[#2563eb] hover:bg-[#3b82f6] text-white font-semibold text-xs tracking-wide rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer border border-[#1d4ed8]"
        >
          <Users className="w-4 h-4" />
          <span>CREATE STAGE ROOM</span>
        </button>

        {/* Join existing Room */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="ENTER ROOM CODE"
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value.toUpperCase())}
            maxLength={6}
            className="flex-1 bg-[#161a25] border border-[#262e3f] text-white text-xs font-mono tracking-widest px-3 py-2 rounded-lg focus:outline-none focus:border-[#3b82f6]"
          />
          <button
            onClick={() => inputCode.trim() && onJoinRoom(inputCode.trim())}
            disabled={!inputCode.trim()}
            className="px-4 py-2 bg-[#1b2230] hover:bg-[#232b3d] disabled:opacity-40 text-white text-xs font-semibold rounded-lg border border-[#2a3449] transition-colors cursor-pointer"
          >
            JOIN
          </button>
        </div>

        {!isSupabaseConfigured && (
          <div className="p-3 bg-[#161922] border border-[#232b3b] rounded-lg text-[11px] text-[#94a3b8] leading-relaxed">
            💡 <strong className="text-white">Tips:</strong> Supabase env belum diisi, mode stage akan otomatis mensimulasikan 4 rival tanding secara real-time. Untuk multiplayer antar-perangkat, isi <code className="text-[#3b82f6]">.env.local</code>.
          </div>
        )}
      </div>
    );
  }

  // Inside Room Waiting Lobby
  return (
    <div className="w-full max-w-md mx-auto p-6 bg-[#11141d] rounded-xl border border-[#202636] flex flex-col gap-4">
      <div className="flex items-center justify-between pb-3 border-b border-[#202636]">
        <div>
          <span className="text-[10px] uppercase font-mono tracking-wider text-[#94a3b8]">ROOM CODE</span>
          <div className="font-mono text-xl font-black text-white tracking-widest">{roomCode}</div>
        </div>

        <button
          onClick={handleCopyCode}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#181d2a] hover:bg-[#202738] border border-[#262e3f] rounded text-xs font-medium text-[#94a3b8] hover:text-white transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'COPIED' : 'COPY'}</span>
        </button>
      </div>

      <div>
        <div className="flex items-center justify-between text-xs font-mono text-[#94a3b8] mb-2">
          <span>PLAYERS IN STAGE ({players.length}/5)</span>
          <span className="text-[#3b82f6]">WAITING...</span>
        </div>

        <div className="flex flex-col gap-2">
          {players.map((p, index) => (
            <div
              key={p.id}
              className="flex items-center justify-between p-2.5 bg-[#161a25] border border-[#222938] rounded-lg"
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: p.accentColor }}
                />
                <span className="text-xs font-bold text-white">{p.username}</span>
                {index === 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-[#2563eb] text-white rounded font-mono">
                    HOST
                  </span>
                )}
              </div>
              <span className="text-[11px] font-mono text-green-400">READY</span>
            </div>
          ))}

          {/* Empty slots placeholders */}
          {Array.from({ length: 5 - players.length }).map((_, i) => (
            <div
              key={`empty-slot-${i}`}
              className="p-2.5 border border-dashed border-[#1f2636] rounded-lg text-center text-xs font-mono text-[#64748b]"
            >
              SLOT {players.length + i + 1} AVAILABLE
            </div>
          ))}
        </div>
      </div>

      {/* Start Game Button */}
      <button
        onClick={onStartStage}
        className="w-full mt-2 py-3 px-4 bg-[#dc2626] hover:bg-[#ef4444] text-white font-bold text-sm tracking-wider rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer border border-[#b91c1c]"
      >
        <Play className="w-4 h-4 fill-current" />
        <span>START STAGE BATTLE</span>
      </button>
    </div>
  );
};
