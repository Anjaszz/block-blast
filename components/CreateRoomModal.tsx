'use client';

import React, { useState } from 'react';
import { Plus, X, Lock, Globe, Shield } from 'lucide-react';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRoom: (params: {
    name: string;
    is_private: boolean;
    password?: string;
  }) => void;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
  isOpen,
  onClose,
  onCreateRoom,
}) => {
  const [roomName, setRoomName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim()) {
      setError('Nama room wajib diisi!');
      return;
    }
    if (isPrivate && !password.trim()) {
      setError('Password wajib diisi untuk room private!');
      return;
    }

    setError('');
    onCreateRoom({
      name: roomName.trim(),
      is_private: isPrivate,
      password: isPrivate ? password.trim() : undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#11141d] rounded-xl border border-[#202636] p-6 shadow-2xl flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#202636]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#181d2a] border border-[#262e3f] rounded">
              <Plus className="w-4 h-4 text-[#ef4444]" />
            </div>
            <h3 className="font-bold text-sm text-white tracking-wide">BUAT STAGE ROOM</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#94a3b8] hover:text-white rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-2.5 bg-[#2a1316] border border-[#dc2626] rounded text-xs text-[#f87171]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Input Nama Room */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-white">
              NAMA ROOM <span className="text-[#ef4444]">*</span>
            </label>
            <input
              type="text"
              value={roomName}
              onChange={(e) => {
                setRoomName(e.target.value);
                setError('');
              }}
              placeholder="Contoh: Arena Juara 5P"
              maxLength={24}
              autoFocus
              className="w-full bg-[#161a25] border border-[#262e3f] text-white text-xs font-medium px-3 py-2.5 rounded-lg focus:outline-none focus:border-[#3b82f6]"
            />
          </div>

          {/* Room Visibility Selection */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-white">TIPE AKSES</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsPrivate(false);
                  setPassword('');
                }}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border text-xs font-bold transition-colors cursor-pointer ${
                  !isPrivate
                    ? 'bg-[#1b2333] border-[#2563eb] text-[#3b82f6]'
                    : 'bg-[#161a25] border-[#202636] text-[#94a3b8] hover:text-white'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>PUBLIK</span>
              </button>

              <button
                type="button"
                onClick={() => setIsPrivate(true)}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border text-xs font-bold transition-colors cursor-pointer ${
                  isPrivate
                    ? 'bg-[#261518] border-[#dc2626] text-[#ef4444]'
                    : 'bg-[#161a25] border-[#202636] text-[#94a3b8] hover:text-white'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>PRIVATE</span>
              </button>
            </div>
          </div>

          {/* Password Input if Private */}
          {isPrivate && (
            <div className="flex flex-col gap-1.5 animate-fadeIn">
              <label className="text-xs font-semibold text-[#ef4444] flex items-center gap-1">
                <Shield className="w-3 h-3" />
                <span>PASSWORD ROOM *</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder="Masukkan password room..."
                maxLength={16}
                className="w-full bg-[#181d2a] border border-[#dc2626]/50 text-white text-xs font-mono px-3 py-2.5 rounded-lg focus:outline-none focus:border-[#ef4444]"
              />
              <span className="text-[10px] text-[#94a3b8]">
                Hanya pemain dengan password yang dapat bergabung ke stage ini.
              </span>
            </div>
          )}

          {/* Info Badge */}
          <div className="p-2.5 bg-[#161a25] border border-[#202636] rounded-lg text-[11px] text-[#94a3b8] leading-relaxed">
            Maksimal <strong className="text-white">5 pemain</strong> per stage. Pertandingan dimulai serentak dengan skor real-time!
          </div>

          {/* Submit */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-xs font-semibold text-[#94a3b8] hover:text-white bg-[#161a25] border border-[#222938] rounded-lg transition-colors cursor-pointer"
            >
              BATAL
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 text-xs font-bold text-white bg-[#dc2626] hover:bg-[#ef4444] border border-[#b91c1c] rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>BUAT ROOM</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
