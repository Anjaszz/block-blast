'use client';

import React, { useState, useEffect } from 'react';
import { Play, Plus, Search, Trophy, User, Volume2, VolumeX, Swords, Crown, Sparkles, Download, Smartphone, X } from 'lucide-react';
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
  gems?: number;
  canClaimCheckin?: boolean;
  onOpenCheckinModal?: () => void;
  onOpenUpdatesModal?: () => void;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
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
  gems = 0,
  canClaimCheckin = false,
  onOpenCheckinModal,
  onOpenUpdatesModal,
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if running in standalone mode (already installed)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Check if user dismissed the banner previously in this session
    const isDismissed = sessionStorage.getItem('blockarena_install_banner_closed');
    if (!isDismissed) {
      setShowInstallBanner(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (!sessionStorage.getItem('blockarena_install_banner_closed')) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowInstallBanner(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setShowInstallBanner(false);
      }
      setDeferredPrompt(null);
    } else {
      // Guide for iOS Safari or browsers without beforeinstallprompt
      alert('Untuk memasang di perangkat: Ketuk menu Share (Bagikan) di browser Anda, lalu pilih "Add to Home Screen" (Tambah ke Layar Utama).');
    }
  };

  const handleCloseBanner = () => {
    setShowInstallBanner(false);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('blockarena_install_banner_closed', 'true');
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-5 p-4">
      {/* PWA INSTALL INFO BANNER (Full-width edge-to-edge di mobile) */}
      {showInstallBanner && !isInstalled && (
        <div className="-mx-4 -mt-4 mb-0 sm:mx-0 sm:mt-0 bg-gradient-to-r from-[#0d131f] via-[#162238] to-[#0d131f] border-b sm:border border-[#243149] sm:rounded-xl px-4 py-2 sm:py-2.5 flex items-center justify-between gap-2.5 shadow-md transition-all">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-[#2563eb]/20 border border-[#3b82f6]/40 flex items-center justify-center text-[#38bdf8] shrink-0">
              <Smartphone className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0 flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <span className="text-xs font-bold text-white tracking-wide whitespace-nowrap">
                Install BlockArena
              </span>
              <span className="text-[11px] text-[#94a3b8] truncate hidden sm:inline">
                • Main lebih lancar layar penuh &amp; tanpa kuota (offline)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={handleInstallClick}
              className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-[#2563eb] to-[#3b82f6] hover:from-[#1d4ed8] hover:to-[#2563eb] text-white text-xs font-mono font-bold rounded-lg transition-all shadow-md cursor-pointer border border-[#60a5fa]"
            >
              <Download className="w-3.5 h-3.5" />
              <span>INSTALL</span>
            </button>

            <button
              onClick={handleCloseBanner}
              className="p-1 text-[#64748b] hover:text-white hover:bg-[#1a2333] rounded-lg transition-colors cursor-pointer"
              title="Tutup pemberitahuan"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Top Bar on Dashboard */}
      <div className="flex items-center justify-between pb-3 border-b border-[#202636] flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-[#151924] border border-[#232b3c] rounded-lg text-xs font-mono">
            <span className="text-[#94a3b8]">SOLO BEST:</span>
            <span className="font-bold text-[#3b82f6]">{highScore.toLocaleString()}</span>
          </div>

         

          {/* Check-in Button */}
          {onOpenCheckinModal && (
            <button
              onClick={onOpenCheckinModal}
              className={`relative flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer border ${
                canClaimCheckin
                  ? 'bg-gradient-to-r from-[#2563eb] to-[#38bdf8] hover:from-[#1d4ed8] hover:to-[#0284c7] text-white border-[#60a5fa] shadow-[0_0_12px_rgba(56,189,248,0.35)]'
                  : 'bg-[#151924] hover:bg-[#1b2130] text-[#94a3b8] hover:text-white border-[#232b3c]'
              }`}
            >
              <span>📅 CHECK-IN</span>
              {canClaimCheckin && (
                <span className="w-2 h-2 rounded-full bg-[#ef4444] animate-ping" />
              )}
            </button>
          )}
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

      {/* Button Baca Update Terbaru */}
      {onOpenUpdatesModal && (
        <div className="flex justify-center -mt-2">
          <button
            onClick={onOpenUpdatesModal}
            className="flex items-center gap-2 px-4 py-2 bg-[#121622] hover:bg-[#181f32] border border-[#232b3c] hover:border-[#38bdf8] rounded-xl text-xs font-mono font-bold text-[#94a3b8] hover:text-[#38bdf8] transition-all cursor-pointer shadow-md group"
            title="Lihat info fitur dan update terbaru di BlockArena"
          >
            <Sparkles className="w-4 h-4 text-[#38bdf8] group-hover:rotate-12 transition-transform" />
            <span>BACA UPDATE TERBARU</span>
          </button>
        </div>
      )}

      {/* Footer System Status */}
      <div className="mt-4 text-center">
        <span className="text-[11px] font-mono text-[#64748b]">
         Created By <a className='text-red-500 font-semibold' href="https://www.google.com/search?q=Anjas+Rani&oq=Anjas+Rani" target='_blank'>Anjaszzz</a>
        </span>
      </div>
    </div>
  );
};
