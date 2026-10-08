'use client';

import React from 'react';
import { AlertTriangle, ArrowLeft, Play } from 'lucide-react';

interface ConfirmExitModalProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export const ConfirmExitModal: React.FC<ConfirmExitModalProps> = ({
  isOpen,
  onCancel,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#11141d] rounded-xl border-2 border-[#202636] p-6 shadow-2xl flex flex-col gap-5 text-center">
        {/* Warning Icon */}
        <div className="mx-auto p-3.5 bg-[#2a1417] border border-[#dc2626] rounded-xl inline-flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-[#ef4444]" />
        </div>

        <div>
          <h3 className="text-lg font-black text-white tracking-wide">
            YAKIN INGIN KELUAR?
          </h3>
          <p className="text-xs text-[#94a3b8] mt-2 leading-relaxed">
            Permainan sedang berlangsung. Jika keluar sekarang, progres match ini akan dihentikan.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-2 pt-1">
          <button
            onClick={onCancel}
            className="w-full py-3 px-4 bg-[#2563eb] hover:bg-[#3b82f6] text-white font-bold text-xs tracking-wider rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer border border-[#1d4ed8]"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>LANJUT MAIN</span>
          </button>

          <button
            onClick={onConfirm}
            className="w-full py-2.5 px-4 bg-[#161a25] hover:bg-[#261518] text-[#94a3b8] hover:text-[#ef4444] hover:border-[#dc2626] font-semibold text-xs tracking-wide rounded-lg transition-colors cursor-pointer border border-[#222938]"
          >
            YA, KELUAR KE MENU
          </button>
        </div>
      </div>
    </div>
  );
};
