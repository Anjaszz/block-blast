import { Grid, Shape } from '../types';

export const BOARD_SIZE = 8;

export function createEmptyGrid(): Grid {
  return Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => null)
  );
}

export function canPlaceShape(
  grid: Grid,
  shape: Shape,
  startRow: number,
  startCol: number
): boolean {
  const { matrix, height, width } = shape;

  if (startRow < 0 || startCol < 0) return false;
  if (startRow + height > BOARD_SIZE || startCol + width > BOARD_SIZE) return false;

  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      if (matrix[r][c] === 1) {
        if (grid[startRow + r][startCol + c] !== null) {
          return false;
        }
      }
    }
  }

  return true;
}

export function placeShape(
  grid: Grid,
  shape: Shape,
  startRow: number,
  startCol: number
): { nextGrid: Grid; cellsPlaced: number } {
  const nextGrid = grid.map((row) => [...row]);
  let cellsPlaced = 0;

  for (let r = 0; r < shape.height; r++) {
    for (let c = 0; c < shape.width; c++) {
      if (shape.matrix[r][c] === 1) {
        nextGrid[startRow + r][startCol + c] = shape.color;
        cellsPlaced++;
      }
    }
  }

  return { nextGrid, cellsPlaced };
}

export function checkCompletedLines(grid: Grid): {
  rowsToClear: number[];
  colsToClear: number[];
} {
  const rowsToClear: number[] = [];
  const colsToClear: number[] = [];

  // Check horizontal rows
  for (let r = 0; r < BOARD_SIZE; r++) {
    let full = true;
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (grid[r][c] === null) {
        full = false;
        break;
      }
    }
    if (full) rowsToClear.push(r);
  }

  // Check vertical columns
  for (let c = 0; c < BOARD_SIZE; c++) {
    let full = true;
    for (let r = 0; r < BOARD_SIZE; r++) {
      if (grid[r][c] === null) {
        full = false;
        break;
      }
    }
    if (full) colsToClear.push(c);
  }

  return { rowsToClear, colsToClear };
}

export function clearCompletedLines(
  grid: Grid,
  rowsToClear: number[],
  colsToClear: number[]
): { nextGrid: Grid; clearedCellsCount: number } {
  const nextGrid = grid.map((row) => [...row]);
  let clearedCellsCount = 0;
  const clearedSet = new Set<string>();

  for (const r of rowsToClear) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const key = `${r},${c}`;
      if (!clearedSet.has(key)) {
        clearedSet.add(key);
        clearedCellsCount++;
      }
      nextGrid[r][c] = null;
    }
  }

  for (const c of colsToClear) {
    for (let r = 0; r < BOARD_SIZE; r++) {
      const key = `${r},${c}`;
      if (!clearedSet.has(key)) {
        clearedSet.add(key);
        clearedCellsCount++;
      }
      nextGrid[r][c] = null;
    }
  }

  return { nextGrid, clearedCellsCount };
}

export function calculateScore(
  cellsPlaced: number,
  totalLinesCleared: number,
  currentCombo: number
): { scoreGained: number; newCombo: number } {
  // Placement points: 10 per cell
  const placementPoints = cellsPlaced * 10;

  if (totalLinesCleared === 0) {
    return {
      scoreGained: placementPoints,
      newCombo: 0,
    };
  }

  // Lines base score: 100 for 1 line, 300 for 2, 600 for 3, 1000 for 4+
  const baseLinePoints = totalLinesCleared * 100 + (totalLinesCleared - 1) * 100;
  
  // Combo multiplier: next combo gives +50% per streak
  const newCombo = currentCombo + 1;
  const comboBonus = Math.floor(baseLinePoints * (newCombo - 1) * 0.5);

  const scoreGained = placementPoints + baseLinePoints + comboBonus;

  return { scoreGained, newCombo };
}

export function hasAnyValidMove(grid: Grid, shapes: Shape[]): boolean {
  const activeShapes = shapes.filter(Boolean);
  if (activeShapes.length === 0) return true; // New trio will spawn

  for (const shape of activeShapes) {
    for (let r = 0; r <= BOARD_SIZE - shape.height; r++) {
      for (let c = 0; c <= BOARD_SIZE - shape.width; c++) {
        if (canPlaceShape(grid, shape, r, c)) {
          return true;
        }
      }
    }
  }

  return false;
}
