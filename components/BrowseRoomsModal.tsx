'use client';

import React, { useState, useEffect } from 'react';
import { Search, X, Lock, Globe, RotateCcw, Users, KeyRound, ArrowRight } from 'lucide-react';
import { RoomInfo } from '@/lib/types';
import { fetchRoomsFromDb } from '@/lib/supabase';

interface BrowseRoomsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoinRoom: (room: RoomInfo, enteredPassword?: string) => void;
}

export const BrowseRoomsModal: React.FC<BrowseRoomsModalProps> = ({
  isOpen,
  onClose,
  onJoinRoom,
}) => {
  const [rooms, setRooms] = useState<RoomInfo[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // Password prompt state for private room
  const [selectedPrivateRoom, setSelectedPrivateRoom] = useState<RoomInfo | null>(null);
  const [inputPassword, setInputPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const loadRooms = async (query?: string) => {
    setLoading(true);
    try {
      const data = await fetchRoomsFromDb(query);
      setRooms(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadRooms(search);
      setSelectedPrivateRoom(null);
      setInputPassword('');
      setPasswordError('');
    }
  }, [isOpen]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearch(val);
    loadRooms(val);
  };

  const handleJoinClick = (room: RoomInfo) => {
    if (room.is_private) {
      setSelectedPrivateRoom(room);
      setInputPassword('');
      setPasswordError('');
    } else {
      onJoinRoom(room);
      onClose();
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPrivateRoom) return;

    if (!inputPassword.trim()) {
      setPasswordError('Password wajib diisi!');
      return;
    }

    // Validate password
    if (selectedPrivateRoom.password && selectedPrivateRoom.password !== inputPassword.trim()) {
      setPasswordError('Password salah! Silakan coba lagi.');
      return;
    }

    onJoinRoom(selectedPrivateRoom, inputPassword.trim());
    setSelectedPrivateRoom(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-[#11141d] rounded-xl border border-[#202636] p-5 sm:p-6 shadow-2xl flex flex-col gap-4 max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#202636]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-[#181d2a] border border-[#262e3f] rounded">
              <Search className="w-4 h-4 text-[#3b82f6]" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white tracking-wide">CARI STAGE ROOM</h3>
              <p className="text-[10px] font-mono text-[#94a3b8]">GABUNG KE STAGE 5 PEMAIN</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => loadRooms(search)}
              disabled={loading}
              className="p-1.5 text-[#94a3b8] hover:text-white rounded hover:bg-[#181d2a] transition-colors"
              title="Refresh Room List"
            >
              <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-[#94a3b8] hover:text-white rounded hover:bg-[#181d2a] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#94a3b8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Cari nama room atau kode..."
            className="w-full bg-[#161a25] border border-[#262e3f] text-white text-xs pl-9 pr-3 py-2.5 rounded-lg focus:outline-none focus:border-[#3b82f6]"
          />
        </div>

        {/* Private Room Password Prompt Modal Overlay */}
        {selectedPrivateRoom && (
          <div className="p-4 bg-[#19151e] border-2 border-[#dc2626] rounded-xl flex flex-col gap-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#ef4444]" />
                <span className="text-xs font-bold text-white">
                  ROOM PRIVATE: {selectedPrivateRoom.name}
                </span>
              </div>
              <button
                onClick={() => setSelectedPrivateRoom(null)}
                className="text-[10px] text-[#94a3b8] hover:text-white underline cursor-pointer"
              >
                Batal
              </button>
            </div>

            {passwordError && (
              <span className="text-xs text-[#f87171]">{passwordError}</span>
            )}

            <form onSubmit={handlePasswordSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <KeyRound className="w-3.5 h-3.5 text-[#94a3b8] absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={inputPassword}
                  onChange={(e) => {
                    setInputPassword(e.target.value);
                    setPasswordError('');
                  }}
                  placeholder="Masukkan password..."
                  autoFocus
                  className="w-full bg-[#10131c] border border-[#dc2626]/60 text-white text-xs pl-8 pr-3 py-2 rounded-lg focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-[#dc2626] hover:bg-[#ef4444] text-white text-xs font-bold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>MASUK</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </form>
          </div>
        )}

        {/* Room List Content */}
        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 min-h-[220px]">
          {loading ? (
            <div className="py-12 text-center text-xs font-mono text-[#94a3b8]">
              MEMUAT DAFTAR ROOM...
            </div>
          ) : rooms.length === 0 ? (
            <div className="py-12 text-center text-xs font-mono text-[#94a3b8] flex flex-col items-center gap-2">
              <span>TIDAK ADA ROOM YANG DITEMUKAN.</span>
              <span className="text-[11px] text-[#64748b]">Buat room baru menggunakan tombol "Create Room"!</span>
            </div>
          ) : (
            rooms.map((room) => {
              return (
                <div
                  key={room.id}
                  className="p-3 bg-[#151924] border border-[#202738] rounded-xl flex items-center justify-between gap-3 hover:border-[#3b82f6]/50 transition-colors"
                >
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-white truncate">
                        {room.name}
                      </span>
                      {room.is_private ? (
                        <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-[#2b1417] text-[#ef4444] text-[9px] font-bold rounded border border-[#ef4444]/40">
                          <Lock className="w-2.5 h-2.5" />
                          PRIVATE
                        </span>
                      ) : (
                        <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-[#14233a] text-[#3b82f6] text-[9px] font-bold rounded border border-[#3b82f6]/40">
                          <Globe className="w-2.5 h-2.5" />
                          PUBLIK
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-[10px] font-mono text-[#94a3b8]">
                      <span>CODE: <strong className="text-white">{room.code}</strong></span>
                      <span>HOST: {room.host_name}</span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-[#3b82f6]" />
                        <span>{room.player_count}/{room.max_players}</span>
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleJoinClick(room)}
                    className={`shrink-0 px-3.5 py-2 rounded-lg text-xs font-bold tracking-wide flex items-center gap-1.5 transition-colors cursor-pointer border ${
                      room.is_private
                        ? 'bg-[#1e1518] hover:bg-[#2b171c] border-[#dc2626] text-[#ef4444]'
                        : 'bg-[#162035] hover:bg-[#1e2e4f] border-[#2563eb] text-[#3b82f6]'
                    }`}
                  >
                    <span>JOIN</span>
                    {room.is_private ? <Lock className="w-3 h-3" /> : <ArrowRight className="w-3 h-3" />}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
