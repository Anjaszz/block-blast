'use client';

import React, { useState, useEffect } from 'react';
import { Player, Shape } from '@/lib/types';
import { ATTACK_GIFT_TEMPLATES, createAttackShape } from '@/lib/game/shapes';
import { Swords, Flame, X, Target, Zap } from 'lucide-react';

interface AttackModalProps {
  isOpen: boolean;
  onClose: () => void;
  rivals: Player[];
  onSendAttack: (targetPlayerId: string, shape: Shape) => void;
}

export const AttackModal: React.FC<AttackModalProps> = ({
  isOpen,
  onClose,
  rivals,
  onSendAttack,
}) => {
  const [selectedShapeIdx, setSelectedShapeIdx] = useState<number>(0);
  const [selectedTargetId, setSelectedTargetId] = useState<string>('');

  // Default target: highest ranking alive rival (first in rivals list)
  useEffect(() => {
    if (rivals.length > 0) {
      if (!rivals.some((r) => r.id === selectedTargetId)) {
        setSelectedTargetId(rivals[0].id);
      }
    }
  }, [rivals, selectedTargetId]);

  if (!isOpen) return null;

  const handleConfirmSend = () => {
    if (!selectedTargetId && rivals.length > 0) return;
    const shape = createAttackShape(selectedShapeIdx);
    onSendAttack(selectedTargetId || (rivals[0]?.id ?? ''), shape);
    onClose();
  };

  const targetPlayer = rivals.find((r) => r.id === selectedTargetId) || rivals[0];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-md bg-[#11141d] rounded-2xl border border-[#ef4444]/40 p-5 shadow-2xl flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#202636]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#2a1417] border border-[#ef4444] rounded-lg">
              <Swords className="w-5 h-5 text-[#ef4444]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-black text-sm text-white tracking-wider">
                  COMBO ATTACK!
                </span>
                <span className="flex items-center gap-0.5 text-[10px] font-mono font-bold bg-[#dc2626] text-white px-1.5 py-0.5 rounded">
                  <Flame className="w-2.5 h-2.5 fill-current" />
                  GIFT BLOCK
                </span>
              </div>
              <p className="text-[11px] text-[#94a3b8] mt-0.5">
                Pilih balok raksasa untuk dikirimkan ke slot balok lawan!
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-[#64748b] hover:text-white p-1 rounded-lg hover:bg-[#181d2a] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 4 Pilihan Balok Raksasa */}
        <div>
          <span className="text-[11px] font-mono text-[#94a3b8] tracking-wider uppercase block mb-2">
            1. PILIH BALOK RAKSASA:
          </span>

          <div className="grid grid-cols-2 gap-2.5">
            {ATTACK_GIFT_TEMPLATES.map((tmpl, idx) => {
              const isSelected = selectedShapeIdx === idx;
              const cellCount = tmpl.matrix.reduce(
                (sum, row) => sum + row.filter((c) => c === 1).length,
                0
              );

              const maxDim = Math.max(tmpl.matrix[0].length, tmpl.matrix.length);
              const previewCellSize = maxDim >= 5 ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5';
              const previewGap = maxDim >= 5 ? 'gap-0.5' : 'gap-1';

              return (
                <div
                  key={tmpl.name}
                  onClick={() => setSelectedShapeIdx(idx)}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-between gap-2.5 cursor-pointer transition-all overflow-hidden ${
                    isSelected
                      ? 'bg-[#261317] border-[#ef4444] shadow-[0_0_15px_rgba(239,68,68,0.25)] scale-[1.02]'
                      : 'bg-[#151924] border-[#222938] hover:border-[#ef4444]/50 hover:bg-[#1a202e]'
                  }`}
                >
                  {/* Matrix Preview */}
                  <div className="h-16 flex items-center justify-center">
                    <div
                      className={`grid ${previewGap}`}
                      style={{
                        gridTemplateColumns: `repeat(${tmpl.matrix[0].length}, minmax(0, 1fr))`,
                      }}
                    >
                      {tmpl.matrix.map((row, r) =>
                        row.map((cell, c) => (
                          <div
                            key={`${r}-${c}`}
                            className={`${previewCellSize} rounded-xs shrink-0 ${
                              cell === 1 ? 'border border-white/20' : 'opacity-0'
                            }`}
                            style={{
                              backgroundColor: cell === 1 ? tmpl.color : 'transparent',
                            }}
                          />
                        ))
                      )}
                    </div>
                  </div>

                  {/* Name & Cell Count */}
                  <div className="text-center w-full">
                    <div className="text-[11px] font-mono font-bold text-white truncate">
                      {tmpl.name}
                    </div>
                    <div className="text-[10px] font-mono text-[#ef4444]">
                      {cellCount} Petak Balok
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pilih Target Lawan (jika >1 lawan) */}
        {rivals.length > 1 ? (
          <div>
            <span className="text-[11px] font-mono text-[#94a3b8] tracking-wider uppercase block mb-2 flex items-center gap-1">
              <Target className="w-3.5 h-3.5 text-[#ef4444]" />
              2. PILIH SASARAN LAWAN:
            </span>

            <div className="flex flex-wrap gap-2">
              {rivals.map((rival) => {
                const isTarget = selectedTargetId === rival.id;
                return (
                  <button
                    key={rival.id}
                    onClick={() => setSelectedTargetId(rival.id)}
                    className={`flex-1 min-w-[120px] p-2 rounded-lg border text-left transition-all cursor-pointer ${
                      isTarget
                        ? 'bg-[#261317] border-[#ef4444] text-white'
                        : 'bg-[#151924] border-[#222938] text-[#94a3b8] hover:border-[#38bdf8]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="truncate">{rival.username}</span>
                      <span className="text-[10px] font-mono text-[#facc15]">
                        #{rival.rank || 1}
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-[#64748b]">
                      {rival.score.toLocaleString()} pts
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : targetPlayer ? (
          <div className="p-2.5 bg-[#161a25] border border-[#222938] rounded-lg flex items-center justify-between text-xs">
            <span className="text-[#94a3b8] flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-[#ef4444]" />
              Sasaran Lawan:
            </span>
            <span className="font-bold text-white flex items-center gap-1">
              {targetPlayer.username}{' '}
              <span className="text-[#facc15] font-mono text-[11px]">
                (Rank #{targetPlayer.rank || 1})
              </span>
            </span>
          </div>
        ) : null}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 mt-1">
          <button
            onClick={handleConfirmSend}
            disabled={rivals.length === 0}
            className="w-full py-3 px-4 bg-[#dc2626] hover:bg-[#ef4444] disabled:opacity-50 text-white font-mono font-bold text-xs tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(220,38,38,0.3)]"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>KIRIM GIFT KE LAWAN 🚀</span>
          </button>

          <button
            onClick={onClose}
            className="w-full py-2 bg-[#161a25] hover:bg-[#1d2332] text-xs font-mono text-[#94a3b8] hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            SIMPAN & SERANG NANTI
          </button>
        </div>
      </div>
    </div>
  );
};
