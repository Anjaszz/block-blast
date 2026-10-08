'use client';

import React from 'react';
import { Trophy, Volume2, VolumeX, User, ArrowLeft } from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase';

interface NavbarProps {
  view: 'dashboard' | 'solo' | 'room_lobby' | 'stage_playing';
  onGoHome: () => void;
  username: string;
  onOpenUsernameModal: () => void;
  onOpenLeaderboard: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  highScore: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  view,
  onGoHome,
  username,
  onOpenUsernameModal,
  onOpenLeaderboard,
  soundEnabled,
  onToggleSound,
  highScore,
}) => {
  return (
    <header className="w-full bg-[#10131c] border-b border-[#202636] px-4 py-3 sticky top-0 z-30">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        {/* Logo / Back to Dashboard */}
        <div className="flex items-center gap-3">
          {view !== 'dashboard' && (
            <button
              onClick={onGoHome}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-[#181d2a] hover:bg-[#202738] border border-[#262e3f] rounded text-xs font-semibold text-[#94a3b8] hover:text-white transition-colors cursor-pointer mr-1"
              title="Kembali ke Dashboard"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Menu</span>
            </button>
          )}

          <div
            onClick={onGoHome}
            className="flex items-center gap-2.5 cursor-pointer select-none"
          >
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-[#2563eb] rounded-xs" />
              <div className="w-4 h-4 bg-[#dc2626] rounded-xs" />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-extrabold text-lg tracking-wider text-white">BLOCK</span>
                <span className="font-extrabold text-lg tracking-wider text-[#3b82f6]">ARENA</span>
              </div>
              
            </div>
          </div>
        </div>

        {/* Controls & Profile */}
        <div className="flex items-center gap-2">


          {/* Username Badge */}
          <button
            onClick={onOpenUsernameModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#181c28] border border-[#262e3f] hover:border-[#3b82f6] rounded text-xs font-medium text-white transition-colors cursor-pointer"
            title="Ganti Username"
          >
            <User className="w-3.5 h-3.5 text-[#3b82f6]" />
            <span className="max-w-[80px] sm:max-w-[120px] truncate">{username}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
