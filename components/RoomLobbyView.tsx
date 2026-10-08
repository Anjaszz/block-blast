'use client';

import React, { useState } from 'react';
import { Users, Copy, Check, Play, Share2, Lock, Globe, ArrowLeft, Crown } from 'lucide-react';
import { Player, RoomState } from '@/lib/types';

interface RoomLobbyViewProps {
  roomState: RoomState;
  localPlayerId: string;
  onStartGame: () => void;
  onLeaveRoom: () => void;
}

export const RoomLobbyView: React.FC<RoomLobbyViewProps> = ({
  roomState,
  localPlayerId,
  onStartGame,
  onLeaveRoom,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const isHost = roomState.players.length > 0 && roomState.players[0].id === localPlayerId;

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}?join=${roomState.code}`;
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomState.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="w-full max-w-lg mx-auto p-5 sm:p-6 bg-[#11141d] rounded-xl border border-[#202636] shadow-2xl flex flex-col gap-5">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#202636]">
        <button
          onClick={onLeaveRoom}
          className="flex items-center gap-1.5 text-xs text-[#94a3b8] hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Keluar</span>
        </button>

        <div className="flex items-center gap-2">
          {roomState.is_private ? (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-[#261518] text-[#ef4444] text-[10px] font-bold rounded border border-[#ef4444]/40">
              <Lock className="w-3 h-3" />
              PRIVATE
            </span>
          ) : (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-[#14233a] text-[#3b82f6] text-[10px] font-bold rounded border border-[#3b82f6]/40">
              <Globe className="w-3 h-3" />
              PUBLIK
            </span>
          )}
        </div>
      </div>

      {/* Room Title & Code Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-[#161a25] border border-[#222938] rounded-xl">
        <div>
          <span className="text-[10px] font-mono tracking-wider text-[#94a3b8] uppercase">
            NAMA STAGE
          </span>
          <h2 className="text-base font-bold text-white tracking-wide">
            {roomState.name || `Stage ${roomState.code}`}
          </h2>
          <div className="text-xs font-mono text-[#3b82f6] mt-0.5">
            CODE: <strong className="text-white tracking-widest">{roomState.code}</strong>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Copy Code */}
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-[#1a202e] hover:bg-[#232b3d] border border-[#262e3f] rounded text-[11px] font-mono text-[#94a3b8] hover:text-white transition-colors cursor-pointer"
            title="Salin Kode Room"
          >
            {copiedCode ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
            <span>{copiedCode ? 'COPIED' : 'KODE'}</span>
          </button>

          {/* Share Link Button */}
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2563eb] hover:bg-[#3b82f6] text-white rounded text-xs font-semibold tracking-wide transition-colors cursor-pointer border border-[#1d4ed8]"
            title="Bagikan link ke teman untuk bergabung"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'LINK DISALIN!' : 'SHARE LINK'}</span>
          </button>
        </div>
      </div>

      {/* Players List in Room (Max 5) */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs font-mono text-[#94a3b8] px-1">
          <span>PEMAIN DALAM ROOM ({roomState.players.length}/5)</span>
          <span className="text-[#3b82f6]">STATUS</span>
        </div>

        <div className="flex flex-col gap-2">
          {roomState.players.map((p, index) => {
            const isMe = p.id === localPlayerId;
            return (
              <div
                key={p.id}
                className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                  isMe
                    ? 'bg-[#182030] border-[#3b82f6]'
                    : 'bg-[#151924] border-[#202738]'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <div
                    className="w-3.5 h-3.5 rounded-full shrink-0"
                    style={{ backgroundColor: p.accentColor }}
                  />
                  <span className={`text-xs font-bold truncate ${isMe ? 'text-[#3b82f6]' : 'text-white'}`}>
                    {p.username} {isMe && '(KAMU)'}
                  </span>

                  {index === 0 && (
                    <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-[#2563eb] text-white rounded font-mono shrink-0">
                      <Crown className="w-2.5 h-2.5" />
                      HOST
                    </span>
                  )}
                </div>

                <span className="text-[11px] font-mono text-green-400 shrink-0">
                  SIAP
                </span>
              </div>
            );
          })}

          {/* Empty Slot Placeholders */}
          {Array.from({ length: 5 - roomState.players.length }).map((_, i) => (
            <div
              key={`empty-slot-${i}`}
              className="p-3 border border-dashed border-[#1f2636] rounded-xl text-center text-xs font-mono text-[#64748b]"
            >
              SLOT {roomState.players.length + i + 1} TERSEDIA (MENUNGGU PEMAIN)
            </div>
          ))}
        </div>
      </div>

      {/* Info Notice */}
      <div className="p-3 bg-[#151924] border border-[#202738] rounded-lg text-[11px] text-[#94a3b8] leading-relaxed">
        Bagikan link atau kode room ke teman kamu. Semua pemain dalam room akan bertanding serentak selama 2 menit untuk merebut posisi skor tertinggi!
      </div>

      {/* Action Button */}
      {isHost ? (
        <button
          onClick={onStartGame}
          className="w-full py-3 px-4 bg-[#dc2626] hover:bg-[#ef4444] text-white font-bold text-sm tracking-wider rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer border border-[#b91c1c]"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>MULAI PERTANDINGAN SEKARANG</span>
        </button>
      ) : (
        <div className="w-full py-3 px-4 bg-[#181d2a] border border-[#262e3f] rounded-xl text-center text-xs font-mono text-[#94a3b8]">
          MENUNGGU HOST MEMULAI PERTANDINGAN...
        </div>
      )}
    </div>
  );
};
