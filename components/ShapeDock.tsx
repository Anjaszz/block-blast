'use client';

import React from 'react';
import { Shape } from '@/lib/types';

interface ShapeDockProps {
  shapes: (Shape | null)[];
  selectedShapeId: string | null;
  onSelectShape: (shape: Shape) => void;
  onStartDrag: (shape: Shape, e: React.PointerEvent) => void;
}

export const ShapeDock: React.FC<ShapeDockProps> = ({
  shapes,
  selectedShapeId,
  onSelectShape,
  onStartDrag,
}) => {
  return (
    <div className="w-full max-w-[420px] mx-auto mt-4 p-3 bg-[#11141d] rounded-xl border border-[#202636] flex items-center justify-around gap-2 sm:gap-3 min-h-[110px] sm:min-h-[120px]">
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

        return (
          <div
            key={shape.id}
            onPointerDown={(e) => {
              onSelectShape(shape);
              onStartDrag(shape, e);
            }}
            onClick={() => onSelectShape(shape)}
            className={`flex-1 h-24 rounded-lg bg-[#161a25] border flex items-center justify-center p-2 cursor-grab active:cursor-grabbing transition-all select-none touch-none ${
              isSelected
                ? 'border-2 border-[#3b82f6] bg-[#1d2333] scale-105'
                : 'border-[#222938] hover:border-[#3b82f6]/60 hover:bg-[#1a202c]'
            }`}
          >
            <div
              className="grid gap-1"
              style={{
                gridTemplateColumns: `repeat(${shape.width}, minmax(0, 1fr))`,
              }}
            >
              {shape.matrix.map((row, r) =>
                row.map((cell, c) => (
                  <div
                    key={`${r}-${c}`}
                    className={`w-4 h-4 sm:w-5 sm:h-5 rounded-xs ${
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
