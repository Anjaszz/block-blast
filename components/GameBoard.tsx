'use client';

import React from 'react';
import { Grid, Shape } from '@/lib/types';
import { canPlaceShape, checkCompletedLines, BOARD_SIZE } from '@/lib/game/engine';
import { X as XIcon, Zap } from 'lucide-react';

interface GameBoardProps {
  grid: Grid;
  activeShape: Shape | null;
  hoverPos: { row: number; col: number } | null;
  onCellClick: (row: number, col: number) => void;
  onCellHover: (row: number, col: number) => void;
  clearingCells: Set<string>; // 'r,c'
  combo: number;
}

interface CellPreview {
  status: 'valid' | 'overlap' | 'invalid_empty';
  color: string;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  grid,
  activeShape,
  hoverPos,
  onCellClick,
  onCellHover,
  clearingCells,
  combo,
}) => {
  // 1. Compute preview cells with high-visibility conflict detection
  const previewCells = React.useMemo(() => {
    const previewMap = new Map<string, CellPreview>();

    if (activeShape && hoverPos) {
      const isValid = canPlaceShape(grid, activeShape, hoverPos.row, hoverPos.col);

      for (let r = 0; r < activeShape.height; r++) {
        for (let c = 0; c < activeShape.width; c++) {
          if (activeShape.matrix[r][c] === 1) {
            const boardR = hoverPos.row + r;
            const boardC = hoverPos.col + c;

            if (boardR >= 0 && boardR < BOARD_SIZE && boardC >= 0 && boardC < BOARD_SIZE) {
              const isOccupied = grid[boardR][boardC] !== null;

              if (isValid) {
                previewMap.set(`${boardR},${boardC}`, {
                  status: 'valid',
                  color: activeShape.color,
                });
              } else if (isOccupied) {
                // Direct overlap collision with existing block
                previewMap.set(`${boardR},${boardC}`, {
                  status: 'overlap',
                  color: '#dc2626',
                });
              } else {
                // Empty cell on board but shape as a whole doesn't fit
                previewMap.set(`${boardR},${boardC}`, {
                  status: 'invalid_empty',
                  color: '#991b1b',
                });
              }
            }
          }
        }
      }
    }

    return previewMap;
  }, [activeShape, hoverPos, grid]);

  // 2. Pre-calculate which lines will be BLASTED if placed at hoverPos
  const willBlastCellKeys = React.useMemo(() => {
    const blastSet = new Set<string>();
    if (!activeShape || !hoverPos) return blastSet;
    if (!canPlaceShape(grid, activeShape, hoverPos.row, hoverPos.col)) return blastSet;

    // Simulate placing the shape on a temporary board
    const tempGrid = grid.map((row) => [...row]);
    for (let r = 0; r < activeShape.height; r++) {
      for (let c = 0; c < activeShape.width; c++) {
        if (activeShape.matrix[r][c] === 1) {
          tempGrid[hoverPos.row + r][hoverPos.col + c] = activeShape.color;
        }
      }
    }

    const { rowsToClear, colsToClear } = checkCompletedLines(tempGrid);

    for (const r of rowsToClear) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        blastSet.add(`${r},${c}`);
      }
    }
    for (const c of colsToClear) {
      for (let r = 0; r < BOARD_SIZE; r++) {
        blastSet.add(`${r},${c}`);
      }
    }

    return blastSet;
  }, [activeShape, hoverPos, grid]);

  const hasWillBlastLines = willBlastCellKeys.size > 0;

  return (
    <div
      className={`relative p-2.5 sm:p-3 bg-[#11141d] rounded-xl border-2 transition-all shadow-2xl ${
        hasWillBlastLines
          ? 'border-white/80 ring-2 ring-white/50 shadow-[0_0_25px_rgba(255,255,255,0.2)]'
          : 'border-[#202636]'
      }`}
    >
      {/* Combo badge floating over board */}
      {combo > 1 && (
        <div className="absolute -top-3.5 right-4 z-20 flex items-center gap-1.5 px-3 py-1 bg-[#dc2626] text-white text-xs font-black tracking-wider uppercase rounded shadow-lg animate-bounce">
          <span>🔥 COMBO x{combo}</span>
        </div>
      )}

      {/* Will Blast Line Notification Pill */}
      {hasWillBlastLines && (
        <div className="absolute -top-3.5 left-4 z-20 flex items-center gap-1.5 px-3 py-1 bg-[#2563eb] text-white text-[10px] font-black tracking-widest uppercase rounded shadow-lg animate-pulse border border-white/40">
          <Zap className="w-3 h-3 fill-current" />
          <span>BLAST READY!</span>
        </div>
      )}

      {/* 8x8 Grid */}
      <div 
        className="grid grid-cols-8 grid-rows-8 gap-1 sm:gap-1.5 w-[310px] h-[310px] sm:w-[400px] sm:h-[400px]"
        onMouseLeave={() => onCellHover(-1, -1)}
      >
        {grid.map((row, r) =>
          row.map((cellColor, c) => {
            const cellKey = `${r},${c}`;
            const isClearing = clearingCells.has(cellKey);
            const preview = previewCells.get(cellKey);
            const isWillBlast = willBlastCellKeys.has(cellKey);

            let cellBg = '#181d2a'; // Empty cell solid dark slate
            let cellBorder = 'border border-[#232b3c]';
            let cellClasses = 'transition-transform duration-75';
            let showOverlapIcon = false;

            if (cellColor) {
              // Existing placed block
              cellBg = cellColor;
              cellBorder = 'border border-white/20';

              if (preview && preview.status === 'overlap') {
                // Direct collision warning!
                cellBorder = 'border-2 border-red-500 animate-pulse';
                showOverlapIcon = true;
              }
            } else if (preview) {
              if (preview.status === 'valid') {
                // Valid placement preview: vibrant color with crisp solid border
                cellBg = preview.color;
                cellBorder = 'border-2 border-white';
                cellClasses += ' scale-95 opacity-85';
              } else if (preview.status === 'invalid_empty') {
                // Invalid: cannot place here
                cellBg = '#450a0a';
                cellBorder = 'border-2 border-[#ef4444]';
                showOverlapIcon = true;
              }
            }

            // Line blast preview shimmer
            if (isWillBlast && !showOverlapIcon) {
              cellClasses += ' will-blast-cell';
            }

            if (isClearing) {
              cellClasses += ' cell-cleared bg-white';
            }

            return (
              <div
                key={cellKey}
                onClick={() => onCellClick(r, c)}
                onMouseEnter={() => onCellHover(r, c)}
                style={{ backgroundColor: isClearing ? '#ffffff' : cellBg }}
                className={`relative rounded-md flex items-center justify-center cursor-pointer select-none overflow-hidden ${cellBorder} ${cellClasses}`}
              >
                {/* Visual conflict indicator when overlapping / invalid */}
                {showOverlapIcon && (
                  <div className="absolute inset-0 bg-red-600/85 flex items-center justify-center z-10 pointer-events-none">
                    <XIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white stroke-[3]" />
                  </div>
                )}

                {/* Shimmer pulse glow for cells that WILL clear */}
                {isWillBlast && !showOverlapIcon && !isClearing && (
                  <div className="absolute inset-0 bg-white/25 pointer-events-none flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_#ffffff] animate-ping" />
                  </div>
                )}

                {/* Subtle tactile inner bevel highlight for filled blocks */}
                {cellColor && !isClearing && !showOverlapIcon && (
                  <div className="absolute inset-0.5 rounded-[3px] border-t border-l border-white/30 pointer-events-none" />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
