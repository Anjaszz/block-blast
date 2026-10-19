'use client';

import React from 'react';
import { Shape } from '@/lib/types';

interface ShapeDockProps {
  shapes: (Shape | null)[];
  selectedShapeId: string | null;
  onSelectShape: (shape: Shape) => void;
  onStartDrag: (shape: Shape, e: React.PointerEvent) => void;
  isRotateMode?: boolean;
  isToolActive?: boolean;
}

export const ShapeDock: React.FC<ShapeDockProps> = ({
  shapes,
  selectedShapeId,
  onSelectShape,
  onStartDrag,
  isRotateMode = false,
  isToolActive = false,
}) => {
  return (
    <div className={`w-full max-w-[420px] mx-auto mt-4 p-3 bg-[#11141d] rounded-xl border transition-all flex items-center justify-around gap-2 sm:gap-3 min-h-[110px] sm:min-h-[120px] ${
      isRotateMode
        ? 'border-[#38bdf8] ring-2 ring-[#38bdf8]/30 shadow-[0_0_20px_rgba(56,189,248,0.25)]'
        : 'border-[#202636]'
    }`}>
      {shapes.map((shape, index) => {
        if (!shape) {
          return (
            <div
              key={`empty-${index}`}
              className="flex-1 h-24 rounded-lg border border-dashed border-[#1c2230] flex items-center justify-center opacity-30"
            />
          );
        }

        const isSelected = selectedShapeId === shape.id;
        const isGift = Boolean(shape.isAttackGift);
        const maxDim = Math.max(shape.width, shape.height);

        // Dynamic sizing: sesuaikan ukuran balok agar balok 5 petak (panjang/tinggi) tidak meluap dari kotak cover
        let cellSizeClass = 'w-4 h-4 sm:w-4.5 sm:h-4.5';
        let gapClass = 'gap-1';

        if (maxDim >= 5) {
          cellSizeClass = 'w-2.5 h-2.5 sm:w-3 sm:h-3';
          gapClass = 'gap-0.5';
        } else if (maxDim === 4) {
          cellSizeClass = 'w-3 h-3 sm:w-3.5 sm:h-3.5';
          gapClass = 'gap-0.5 sm:gap-1';
        }

        return (
          <div
            key={shape.id}
            onPointerDown={(e) => {
              if (isToolActive && !isRotateMode) {
                // Ignore pointer events on dock if hammer or bomb is active
                return;
              }
              onSelectShape(shape);
              if (!isRotateMode && !isToolActive) {
                onStartDrag(shape, e);
              }
            }}
            className={`relative flex-1 h-24 rounded-lg border flex items-center justify-center p-1.5 transition-all select-none touch-none overflow-hidden ${
              isRotateMode
                ? 'border-2 border-[#38bdf8] bg-[#12233b] ring-2 ring-[#38bdf8]/40 animate-pulse cursor-pointer hover:scale-105'
                : isToolActive
                ? 'opacity-40 cursor-not-allowed border-[#1c2230] bg-[#121620]'
                : 'cursor-grab active:cursor-grabbing hover:border-[#3b82f6]/60 hover:bg-[#1a202c]'
            } ${
              !isRotateMode && !isToolActive
                ? isGift
                  ? isSelected
                    ? 'border-2 border-[#ef4444] bg-[#2a1317] scale-105 shadow-[0_0_15px_rgba(239,68,68,0.5)]'
                    : 'border-[#ef4444] bg-[#221215] animate-pulse hover:border-[#f87171]'
                  : isSelected
                  ? 'border-2 border-[#3b82f6] bg-[#1d2333] scale-105'
                  : 'border-[#222938] bg-[#161a25]'
                : ''
            }`}
          >
            {isRotateMode && (
              <span className="absolute top-1.5 px-2 py-0.5 bg-[#0284c7] text-[9px] font-mono font-bold text-white rounded-full shadow-xs tracking-wider">
                PILIH 🔄
              </span>
            )}
            {isGift && !isRotateMode && (
              <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-[#dc2626] border border-white/40 text-[8px] font-mono font-black text-white rounded-full tracking-wider whitespace-nowrap shadow-sm flex items-center gap-0.5 z-10">
                ⚠️ GIFT!
              </span>
            )}

            <div
              className={`grid ${gapClass} transition-all`}
              style={{
                gridTemplateColumns: `repeat(${shape.width}, minmax(0, 1fr))`,
              }}
            >
              {shape.matrix.map((row, r) =>
                row.map((cell, c) => (
                  <div
                    key={`${r}-${c}`}
                    className={`${cellSizeClass} rounded-xs shrink-0 ${
                      cell === 1 ? 'border border-white/20' : 'opacity-0'
                    }`}
                    style={{
                      backgroundColor: cell === 1 ? shape.color : 'transparent',
                    }}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
