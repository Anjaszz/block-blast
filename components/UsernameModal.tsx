'use client';

import React, { useState, useEffect } from 'react';
import { User, X, Check, AlertCircle, Loader2 } from 'lucide-react';
import { checkUsernameAvailable } from '@/lib/supabase';

interface UsernameModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUsername: string;
  onSave: (newUsername: string) => Promise<void> | void;
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
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(false);

  // Sync nilai input saat modal dibuka dengan currentUsername yang sedang aktif
  useEffect(() => {
    if (isOpen) {
      setVal(currentUsername || '');
      setError('');
      setIsChecking(false);
    }
  }, [isOpen, currentUsername]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = val.trim();

    if (!clean) {
      setError('Username tidak boleh kosong.');
      return;
    }

    if (clean.length < 3) {
      setError('Username minimal 3 karakter.');
      return;
    }

    setIsChecking(true);
    setError('');

    try {
      // Validasi keunikan username (tidak boleh sama dengan pemain lain)
      const check = await checkUsernameAvailable(
        clean,
        isMandatory ? undefined : currentUsername
      );

      if (!check.available) {
        setError(check.message || 'Username sudah digunakan oleh pemain lain.');
        setIsChecking(false);
        return;
      }

      await onSave(clean);
      onClose();
    } catch {
      setError('Gagal memverifikasi username, silakan coba lagi.');
    } finally {
      setIsChecking(false);
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
            ? 'Selamat datang di BlockArena! Masukkan username unik kamu untuk mulai bermain.'
            : 'Ganti username kamu. Skor tertinggi kamu akan otomatis diperbarui ke username baru.'}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <input
              type="text"
              value={val}
              onChange={(e) => {
                setVal(e.target.value);
                if (error) setError('');
              }}
              placeholder="Contoh: Striker99"
              maxLength={16}
              autoFocus
              disabled={isChecking}
              className={`w-full bg-[#181d2a] border text-white text-sm font-semibold px-3 py-2.5 rounded-lg focus:outline-none transition-colors ${
                error
                  ? 'border-[#ef4444] focus:border-[#ef4444]'
                  : 'border-[#262e3f] focus:border-[#3b82f6]'
              }`}
            />

            {error && (
              <div className="flex items-center gap-1.5 text-xs text-[#ef4444] mt-0.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-1">
            {!isMandatory && (
              <button
                type="button"
                onClick={onClose}
                disabled={isChecking}
                className="flex-1 py-2.5 text-xs font-semibold text-[#94a3b8] hover:text-white bg-[#161a25] border border-[#222938] rounded-lg transition-colors cursor-pointer"
              >
                BATAL
              </button>
            )}
            <button
              type="submit"
              disabled={!val.trim() || isChecking}
              className="flex-1 py-2.5 text-xs font-bold text-white bg-[#2563eb] hover:bg-[#3b82f6] disabled:opacity-40 border border-[#1d4ed8] rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              {isChecking ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              <span>{isChecking ? 'MEMERIKSA...' : isMandatory ? 'MULAI MAIN' : 'SIMPAN'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
