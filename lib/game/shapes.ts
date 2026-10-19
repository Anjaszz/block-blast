import { Grid, Shape } from '../types';

export const BOARD_SIZE = 8;

export interface ShapeTemplate {
  name: string;
  matrix: number[][];
  color: string; // Signature color per shape
}

export const SHAPE_TEMPLATES: ShapeTemplate[] = [
  // 1-cell (Golden Spark)
  { name: 'dot', matrix: [[1]], color: '#eab308' },
  
  // 2-cell (Sky Blue)
  { name: 'h2', matrix: [[1, 1]], color: '#38bdf8' },
  { name: 'v2', matrix: [[1], [1]], color: '#38bdf8' },

  // 3-cell Lines (Cyan)
  { name: 'h3', matrix: [[1, 1, 1]], color: '#06b6d4' },
  { name: 'v3', matrix: [[1], [1], [1]], color: '#06b6d4' },

  // 3-cell Small Corners (Emerald Green)
  { name: 'corner-sm-1', matrix: [[1, 0], [1, 1]], color: '#10b981' },
  { name: 'corner-sm-2', matrix: [[0, 1], [1, 1]], color: '#10b981' },
  { name: 'corner-sm-3', matrix: [[1, 1], [1, 0]], color: '#10b981' },
  { name: 'corner-sm-4', matrix: [[1, 1], [0, 1]], color: '#10b981' },

  // 4-cell Lines (Royal Blue)
  { name: 'h4', matrix: [[1, 1, 1, 1]], color: '#2563eb' },
  { name: 'v4', matrix: [[1], [1], [1], [1]], color: '#2563eb' },

  // 4-cell Square 2x2 (Radiant Orange)
  { name: 'square2x2', matrix: [[1, 1], [1, 1]], color: '#f97316' },

  // 4-cell L-shapes (Neon Purple)
  { name: 'l-shape-1', matrix: [[1, 0], [1, 0], [1, 1]], color: '#a855f7' },
  { name: 'l-shape-2', matrix: [[0, 1], [0, 1], [1, 1]], color: '#a855f7' },
  { name: 'l-shape-3', matrix: [[1, 1, 1], [1, 0, 0]], color: '#a855f7' },
  { name: 'l-shape-4', matrix: [[1, 1, 1], [0, 0, 1]], color: '#a855f7' },

  // 4-cell T-shapes (Hot Pink / Magenta)
  { name: 't-shape-1', matrix: [[1, 1, 1], [0, 1, 0]], color: '#ec4899' },
  { name: 't-shape-2', matrix: [[0, 1], [1, 1], [0, 1]], color: '#ec4899' },

  // 4-cell Z & S shapes (Amber / Gold)
  { name: 'z-shape-1', matrix: [[1, 1, 0], [0, 1, 1]], color: '#f59e0b' },
  { name: 'z-shape-2', matrix: [[0, 1, 1], [1, 1, 0]], color: '#f59e0b' },

  // 5-cell Lines (Indigo)
  { name: 'h5', matrix: [[1, 1, 1, 1, 1]], color: '#6366f1' },
  { name: 'v5', matrix: [[1], [1], [1], [1], [1]], color: '#6366f1' },

  // 5-cell Large Corners (Lime Green)
  { name: 'corner-lg-1', matrix: [[1, 0, 0], [1, 0, 0], [1, 1, 1]], color: '#84cc16' },
  { name: 'corner-lg-2', matrix: [[0, 0, 1], [0, 0, 1], [1, 1, 1]], color: '#84cc16' },
  { name: 'corner-lg-3', matrix: [[1, 1, 1], [1, 0, 0], [1, 0, 0]], color: '#84cc16' },
  { name: 'corner-lg-4', matrix: [[1, 1, 1], [0, 0, 1], [0, 0, 1]], color: '#84cc16' },

  // Plus / Cross (Bright Rose)
  { name: 'plus', matrix: [[0, 1, 0], [1, 1, 1], [0, 1, 0]], color: '#f43f5e' },

  // 3x3 big square (Vibrant Crimson Red)
  { name: 'square3x3', matrix: [[1, 1, 1], [1, 1, 1], [1, 1, 1]], color: '#ef4444' },
];

// Pembagian Tier Balok
export const SMALL_SHAPES: ShapeTemplate[] = SHAPE_TEMPLATES.slice(0, 9);
export const MEDIUM_SHAPES: ShapeTemplate[] = SHAPE_TEMPLATES.slice(9, 20);
export const LARGE_SHAPES: ShapeTemplate[] = SHAPE_TEMPLATES.slice(20);

/**
 * Cek apakah template balok muat diletakkan di posisi mana pun pada papan
 */
export function canTemplateFitOnGrid(grid: Grid, template: ShapeTemplate): boolean {
  const height = template.matrix.length;
  const width = template.matrix[0].length;

  for (let r = 0; r <= BOARD_SIZE - height; r++) {
    for (let c = 0; c <= BOARD_SIZE - width; c++) {
      let fits = true;
      for (let tr = 0; tr < height; tr++) {
        for (let tc = 0; tc < width; tc++) {
          if (template.matrix[tr][tc] === 1 && grid[r + tr][c + tc] !== null) {
            fits = false;
            break;
          }
        }
        if (!fits) break;
      }
      if (fits) return true;
    }
  }
  return false;
}

/**
 * Cek apakah meletakkan template balok ini bisa meledakkan minimal 1 baris atau kolom
 */
export function canTemplateClearLinesOnGrid(grid: Grid, template: ShapeTemplate): boolean {
  const height = template.matrix.length;
  const width = template.matrix[0].length;

  for (let r = 0; r <= BOARD_SIZE - height; r++) {
    for (let c = 0; c <= BOARD_SIZE - width; c++) {
      let fits = true;
      for (let tr = 0; tr < height; tr++) {
        for (let tc = 0; tc < width; tc++) {
          if (template.matrix[tr][tc] === 1 && grid[r + tr][c + tc] !== null) {
            fits = false;
            break;
          }
        }
        if (!fits) break;
      }

      if (fits) {
        // Cek baris horizontal yang akan terisi penuh
        for (let tr = 0; tr < height; tr++) {
          const checkR = r + tr;
          let rowComplete = true;
          for (let tc = 0; tc < BOARD_SIZE; tc++) {
            const willBeFilled =
              grid[checkR][tc] !== null ||
              (tc >= c && tc < c + width && template.matrix[tr][tc - c] === 1);
            if (!willBeFilled) {
              rowComplete = false;
              break;
            }
          }
          if (rowComplete) return true;
        }

        // Cek kolom vertikal yang akan terisi penuh
        for (let tc = 0; tc < width; tc++) {
          const checkC = c + tc;
          let colComplete = true;
          for (let tr = 0; tr < BOARD_SIZE; tr++) {
            const willBeFilled =
              grid[tr][checkC] !== null ||
              (tr >= r && tr < r + height && template.matrix[tr - r][tc] === 1);
            if (!willBeFilled) {
              colComplete = false;
              break;
            }
          }
          if (colComplete) return true;
        }
      }
    }
  }
  return false;
}

export function instantiateShape(template: ShapeTemplate): Shape {
  return {
    id: `${template.name}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    matrix: template.matrix,
    color: template.color,
    width: template.matrix[0].length,
    height: template.matrix.length,
  };
}

export function generateRandomShape(): Shape {
  const roll = Math.random();
  let pool = MEDIUM_SHAPES;
  if (roll < 0.60) {
    pool = SMALL_SHAPES;
  } else if (roll < 0.90) {
    pool = MEDIUM_SHAPES;
  } else {
    pool = LARGE_SHAPES;
  }
  const template = pool[Math.floor(Math.random() * pool.length)];
  return instantiateShape(template);
}

/**
 * Smart Adaptive Trio Generator (Block Blast Style):
 * - Menjamin minimal 2 dari 3 balok BISA diletakkan di papan
 * - Maksimal hanya 1 balok besar per trio (mencegah trio maut)
 * - Jika papan sedang padat (>44% terisi), otomatis mengutamakan balok kecil atau balok pemecah garis
 */
export function generateShapeTrio(grid?: Grid): Shape[] {
  let filledCells = 0;
  if (grid) {
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (grid[r][c] !== null) filledCells++;
      }
    }
  }

  const isCrowded = filledCells >= 28; // ~44% papan terisi
  const isEmergency = filledCells >= 38; // ~60% papan terisi (kritis)

  const chosenTemplates: ShapeTemplate[] = [];

  const pickFromPool = (pool: ShapeTemplate[], filterFit: boolean = false): ShapeTemplate => {
    let candidates = pool;
    if (grid && filterFit) {
      const fitting = pool.filter((t) => canTemplateFitOnGrid(grid, t));
      if (fitting.length > 0) candidates = fitting;
    }

    // Hindari duplikat bentuk yang persis sama dalam 1 trio
    const unused = candidates.filter((t) => !chosenTemplates.some((c) => c.name === t.name));
    const finalPool = unused.length > 0 ? unused : candidates;
    return finalPool[Math.floor(Math.random() * finalPool.length)];
  };

  // SLOT 1: Primary Piece
  if (isEmergency) {
    const clearingSmall = SMALL_SHAPES.filter((t) => grid && canTemplateClearLinesOnGrid(grid, t));
    if (clearingSmall.length > 0) {
      chosenTemplates.push(clearingSmall[Math.floor(Math.random() * clearingSmall.length)]);
    } else {
      chosenTemplates.push(pickFromPool(SMALL_SHAPES, true));
    }
  } else if (isCrowded) {
    const roll = Math.random();
    if (roll < 0.65) {
      chosenTemplates.push(pickFromPool(SMALL_SHAPES, true));
    } else {
      chosenTemplates.push(pickFromPool(MEDIUM_SHAPES, true));
    }
  } else {
    const roll = Math.random();
    if (roll < 0.12) {
      // Hanya 12% peluang balok besar di kondisi papan normal
      chosenTemplates.push(pickFromPool(LARGE_SHAPES, true));
    } else if (roll < 0.60) {
      chosenTemplates.push(pickFromPool(MEDIUM_SHAPES, true));
    } else {
      chosenTemplates.push(pickFromPool(SMALL_SHAPES, true));
    }
  }

  const hasLargePiece = chosenTemplates.some((t) => LARGE_SHAPES.some((l) => l.name === t.name));

  // SLOT 2: Complementary Piece (Jika Slot 1 besar, Slot 2 wajib kecil/sedang)
  if (hasLargePiece || isCrowded) {
    const roll = Math.random();
    if (roll < 0.65) {
      chosenTemplates.push(pickFromPool(SMALL_SHAPES, true));
    } else {
      chosenTemplates.push(pickFromPool(MEDIUM_SHAPES, true));
    }
  } else {
    const roll = Math.random();
    if (roll < 0.50) {
      chosenTemplates.push(pickFromPool(SMALL_SHAPES, true));
    } else {
      chosenTemplates.push(pickFromPool(MEDIUM_SHAPES, true));
    }
  }

  // SLOT 3: Lifeline Piece (Jaminan balok kecil atau pemecah garis)
  if (isEmergency || isCrowded) {
    const clearingPieces = [...SMALL_SHAPES, ...MEDIUM_SHAPES].filter(
      (t) => grid && canTemplateClearLinesOnGrid(grid, t)
    );
    if (clearingPieces.length > 0 && Math.random() < 0.7) {
      chosenTemplates.push(clearingPieces[Math.floor(Math.random() * clearingPieces.length)]);
    } else {
      chosenTemplates.push(pickFromPool(SMALL_SHAPES, true));
    }
  } else {
    const roll = Math.random();
    if (roll < 0.70) {
      chosenTemplates.push(pickFromPool(SMALL_SHAPES, true));
    } else {
      chosenTemplates.push(pickFromPool(MEDIUM_SHAPES, true));
    }
  }

  // GUARANTEE CHECK:
  // Pastikan MINIMAL 2 dari 3 balok bisa diletakkan di papan saat ini
  if (grid) {
    let fittingCount = chosenTemplates.filter((t) => canTemplateFitOnGrid(grid, t)).length;

    if (fittingCount < 2) {
      for (let i = 0; i < chosenTemplates.length; i++) {
        if (!canTemplateFitOnGrid(grid, chosenTemplates[i])) {
          const fittingSmall = SMALL_SHAPES.filter((t) => canTemplateFitOnGrid(grid, t));
          if (fittingSmall.length > 0) {
            chosenTemplates[i] = fittingSmall[Math.floor(Math.random() * fittingSmall.length)];
            fittingCount++;
            if (fittingCount >= 2) break;
          }
        }
      }
    }

    // Safety fallback mutlak: jika papan sangat sempit, pastikan minimal balok dot muat
    if (fittingCount === 0) {
      const dotTemplate = SMALL_SHAPES[0];
      if (canTemplateFitOnGrid(grid, dotTemplate)) {
        chosenTemplates[0] = dotTemplate;
      }
    }
  }

  return chosenTemplates.map(instantiateShape);
}

// 4 Pilihan Balok Raksasa untuk Gift Attack ke Lawan
export const ATTACK_GIFT_TEMPLATES: ShapeTemplate[] = [
  {
    name: 'GIANT SQUARE (3x3)',
    matrix: [
      [1, 1, 1],
      [1, 1, 1],
      [1, 1, 1],
    ],
    color: '#ef4444', // Danger Crimson
  },
  {
    name: 'MEGA CROSS (3x3)',
    matrix: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 1, 0],
    ],
    color: '#f97316', // Fiery Orange
  },
  {
    name: 'GIANT BAR (5-CELL)',
    matrix: [[1, 1, 1, 1, 1]],
    color: '#a855f7', // Neon Purple
  },
  {
    name: 'GIANT CORNER (3x3)',
    matrix: [
      [1, 0, 0],
      [1, 0, 0],
      [1, 1, 1],
    ],
    color: '#ec4899', // Hot Pink
  },
];

export function createAttackShape(templateIndex: number, attackerName: string = ''): Shape {
  const template = ATTACK_GIFT_TEMPLATES[templateIndex] || ATTACK_GIFT_TEMPLATES[0];
  return {
    id: `attack-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    matrix: template.matrix,
    color: template.color,
    width: template.matrix[0].length,
    height: template.matrix.length,
    isAttackGift: true,
    attackerName,
  };
}

/**
 * Rotate a Shape 90 degrees clockwise
 */
export function rotateShape(shape: Shape): Shape {
  const oldMatrix = shape.matrix;
  const rows = oldMatrix.length;
  const cols = oldMatrix[0].length;

  const newMatrix: number[][] = Array.from({ length: cols }, () => Array(rows).fill(0));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      newMatrix[c][rows - 1 - r] = oldMatrix[r][c];
    }
  }

  return {
    ...shape,
    matrix: newMatrix,
    width: newMatrix[0].length,
    height: newMatrix.length,
  };
}
