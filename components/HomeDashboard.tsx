'use client';

import React from 'react';
import { Play, Plus, Search, Trophy, User, Volume2, VolumeX, Swords, Crown } from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase';

interface HomeDashboardProps {
  username: string;
  highScore: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenUsernameModal: () => void;
  onPlaySolo: () => void;
  onCreateRoom: () => void;
  onBrowseRooms: () => void;
  onOpenLeaderboard: () => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  username,
  highScore,
  soundEnabled,
  onToggleSound,
  onOpenUsernameModal,
  onPlaySolo,
  onCreateRoom,
  onBrowseRooms,
  onOpenLeaderboard,
}) => {
  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-6 p-4">
      {/* Top Bar on Dashboard */}
      <div className="flex items-center justify-between pb-3 border-b border-[#202636]">
         <div className="flex items-center gap-1.5 px-3 py-1 bg-[#151924] border border-[#232b3c] rounded-lg text-xs font-mono">
            <span className="text-[#94a3b8]">SOLO BEST:</span>
            <span className="font-bold text-[#3b82f6]">{highScore.toLocaleString()}</span>
          </div>

        {/* Status & Sound */}
        <div className="flex items-center gap-2.5">
         

          <button
            onClick={onToggleSound}
            className="p-2 bg-[#151924] border border-[#232b3c] hover:border-[#3b82f6] rounded-lg text-[#94a3b8] hover:text-white transition-colors cursor-pointer"
            title={soundEnabled ? 'Mute Audio' : 'Aktifkan Audio'}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-[#3b82f6]" />
            ) : (
              <VolumeX className="w-4 h-4 text-[#dc2626]" />
            )}
          </button>
        </div>
      </div>

      {/* Hero Header */}
      <div className="text-center py-4 flex flex-col items-center">
        <div className="flex items-center gap-1.5 mb-2">
          <div className="w-5 h-5 bg-[#2563eb] rounded-xs" />
          <div className="w-5 h-5 bg-[#dc2626] rounded-xs" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-wider text-white">
          BLOCK<span className="text-[#3b82f6]">ARENA</span>
        </h1>
        <p className="text-xs sm:text-sm text-[#94a3b8] mt-1 max-w-md font-medium">
          Tantangan puzzle balok kompetitif. Main sendiri untuk raih skor tertinggi atau adu poin serentak 5 pemain per stage!
        </p>
      </div>

      {/* 4 UTAMA BUTTONS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 mt-2">
        {/* 1. BUTTON PLAY (SOLO) */}
        <button
          onClick={onPlaySolo}
          className="group p-5 bg-[#121622] hover:bg-[#161c2d] border-2 border-[#20273a] hover:border-[#2563eb] rounded-2xl flex flex-col gap-3 text-left transition-all cursor-pointer shadow-lg hover:shadow-[#2563eb]/20"
        >
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 bg-[#1a2338] border border-[#2563eb] rounded-xl flex items-center justify-center text-[#3b82f6] group-hover:bg-[#2563eb] group-hover:text-white transition-colors">
              <Play className="w-5 h-5 fill-current" />
            </div>
            <span className="px-2.5 py-0.5 bg-[#1b253b] text-[#3b82f6] text-[10px] font-mono font-bold rounded">
              SOLO MODE
            </span>
          </div>

          <div>
            <h2 className="text-lg font-black text-white tracking-wide">
              PLAY
            </h2>
            <p className="text-xs text-[#94a3b8] mt-1 leading-relaxed">
              Main biasa sendiri secara santai & kompetitif. Raih skor tertinggi untuk masuk ke Leaderboard Global!
            </p>
          </div>
        </button>

        {/* 2. BUTTON CREATE ROOM */}
        <button
          onClick={onCreateRoom}
          className="group p-5 bg-[#121622] hover:bg-[#1a151b] border-2 border-[#20273a] hover:border-[#dc2626] rounded-2xl flex flex-col gap-3 text-left transition-all cursor-pointer shadow-lg hover:shadow-[#dc2626]/20"
        >
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 bg-[#281619] border border-[#dc2626] rounded-xl flex items-center justify-center text-[#ef4444] group-hover:bg-[#dc2626] group-hover:text-white transition-colors">
              <Plus className="w-6 h-6" />
            </div>
            <span className="px-2.5 py-0.5 bg-[#2a1418] text-[#ef4444] text-[10px] font-mono font-bold rounded">
              STAGE 5P
            </span>
          </div>

          <div>
            <h2 className="text-lg font-black text-white tracking-wide">
              CREATE ROOM
            </h2>
            <p className="text-xs text-[#94a3b8] mt-1 leading-relaxed">
              Bikin stage room (Publik atau Private berpassword). Bagikan link ke teman untuk tanding poin serentak!
            </p>
          </div>
        </button>

        {/* 3. BUTTON CARI ROOM */}
        <button
          onClick={onBrowseRooms}
          className="group p-5 bg-[#121622] hover:bg-[#161c2d] border-2 border-[#20273a] hover:border-[#3b82f6] rounded-2xl flex flex-col gap-3 text-left transition-all cursor-pointer shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 bg-[#171f2e] border border-[#26354d] rounded-xl flex items-center justify-center text-[#3b82f6] group-hover:bg-[#1e2a44] transition-colors">
              <Search className="w-5 h-5" />
            </div>
            <span className="px-2.5 py-0.5 bg-[#182030] text-[#94a3b8] text-[10px] font-mono font-bold rounded">
              BROWSE
            </span>
          </div>

          <div>
            <h2 className="text-lg font-black text-white tracking-wide">
              CARI ROOM
            </h2>
            <p className="text-xs text-[#94a3b8] mt-1 leading-relaxed">
              Lihat daftar room aktif dan cari room teman. Masuk langsung ke room publik atau ketik password room private.
            </p>
          </div>
        </button>

        {/* 4. BUTTON LEADERBOARD */}
        <button
          onClick={onOpenLeaderboard}
          className="group p-5 bg-[#121622] hover:bg-[#181a1d] border-2 border-[#20273a] hover:border-[#eab308] rounded-2xl flex flex-col gap-3 text-left transition-all cursor-pointer shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 bg-[#231e13] border border-[#715c1b] rounded-xl flex items-center justify-center text-[#eab308] group-hover:bg-[#3d3215] transition-colors">
              <Trophy className="w-5 h-5" />
            </div>
            <span className="px-2.5 py-0.5 bg-[#252014] text-[#eab308] text-[10px] font-mono font-bold rounded">
              TOP SCORES
            </span>
          </div>

          <div>
            <h2 className="text-lg font-black text-white tracking-wide">
              LEADERBOARD
            </h2>
            <p className="text-xs text-[#94a3b8] mt-1 leading-relaxed">
              Papan peringkat global skor tertinggi pemain mode Solo (bukan akumulasi). Lihat siapa penguasa BlockArena!
            </p>
          </div>
        </button>
      </div>

      {/* Footer System Status */}
      <div className="mt-4 text-center">
        <span className="text-[11px] font-mono text-[#64748b]">
         Created By <a className='text-red-500 font-semibold' href="https://www.google.com/search?q=Anjas+Rani&oq=Anjas+Rani" target='_blank'>Anjaszzz</a>
        </span>
      </div>
    </div>
  );
};
