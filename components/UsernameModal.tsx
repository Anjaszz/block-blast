'use client';

import React, { useState } from 'react';
import { User, X, Check, Sparkles } from 'lucide-react';

interface UsernameModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUsername: string;
  onSave: (newUsername: string) => void;
  isMandatory?: boolean;
}

export const UsernameModal: React.FC<UsernameModalProps> = ({
  isOpen,
  onClose,
  currentUsername,
  onSave,
  isMandatory = false,
}) => {
  const [val, setVal] = useState(currentUsername);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (val.trim()) {
      onSave(val.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#11141d] rounded-xl border border-[#202636] p-6 shadow-2xl flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#181d2a] border border-[#262e3f] rounded">
              <User className="w-4 h-4 text-[#3b82f6]" />
            </div>
            <h3 className="font-bold text-sm text-white tracking-wide">
              {isMandatory ? 'MASUKKAN USERNAME' : 'GANTI USERNAME'}
            </h3>
          </div>
          {!isMandatory && (
            <button
              onClick={onClose}
              className="p-1 text-[#94a3b8] hover:text-white rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <p className="text-xs text-[#94a3b8] leading-relaxed">
          {isMandatory
            ? 'Selamat datang di BlockArena! Cukup masukkan username kamu untuk mulai bermain (tidak perlu registrasi/login).'
            : 'Username ini akan ditampilkan di leaderboard global skor solo dan room multiplayer kamu.'}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            placeholder="Contoh: Striker99"
            maxLength={16}
            autoFocus
            className="w-full bg-[#181d2a] border border-[#262e3f] text-white text-sm font-semibold px-3 py-2.5 rounded-lg focus:outline-none focus:border-[#3b82f6]"
          />

          <div className="flex gap-2 mt-1">
            {!isMandatory && (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 text-xs font-semibold text-[#94a3b8] hover:text-white bg-[#161a25] border border-[#222938] rounded-lg transition-colors cursor-pointer"
              >
                BATAL
              </button>
            )}
            <button
              type="submit"
              disabled={!val.trim()}
              className="flex-1 py-2.5 text-xs font-bold text-white bg-[#2563eb] hover:bg-[#3b82f6] disabled:opacity-40 border border-[#1d4ed8] rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isMandatory ? 'MULAI MAIN' : 'SIMPAN'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
