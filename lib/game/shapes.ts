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
  if (roll < 0.30) {
    pool = SMALL_SHAPES;
  } else if (roll < 0.75) {
    pool = MEDIUM_SHAPES;
  } else {
    pool = LARGE_SHAPES;
  }
  const template = pool[Math.floor(Math.random() * pool.length)];
  return instantiateShape(template);
}

/**
 * Smart Balanced Trio Generator (Block Blast Sweet-Spot):
 * - Keseimbangan ideal: tidak membosankan (bukan spam balok 1-2 petak) & tidak mustahil (anti-trio maut).
 * - Menjaga variasi bentuk yang seru: balok sedang (45-50%), balok besar (25-30%), balok kecil (25-30%).
 * - Maksimal 1 balok besar per trio (mencegah kematian mendadak).
 * - Jamin minimal 1 langkah valid (dan 2 langkah valid saat darurat) agar keterampilan pemain tetap teruji.
 * - Beradaptasi secara wajar dengan kepadatan papan dan skor permainan.
 */
export function generateShapeTrio(grid?: Grid, currentScore: number = 0): Shape[] {
  let filledCells = 0;
  if (grid) {
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (grid[r][c] !== null) filledCells++;
      }
    }
  }

  // Ambang batas tekanan papan yang realistis (papan 64 sel)
  const isCrowded = filledCells >= 36; // >56% papan terisi (mulai padat)
  const isEmergency = filledCells >= 48; // >=75% papan terisi (kritis/zona bahaya)

  // Probabilitas kemunculan balok besar berdasarkan skor dan kondisi papan
  let largeProb = 0.28; // ~28% peluang balok besar di kondisi normal
  if (currentScore < 600) {
    largeProb = 0.18; // Pemula/awal permainan sedikit lebih bersahabat
  }
  if (isCrowded) {
    largeProb = 0.12; // Papan padat: kurangi balok besar
  }
  if (isEmergency) {
    largeProb = 0; // Papan kritis: jangan beri balok besar
  }

  const chosenTemplates: ShapeTemplate[] = [];

  const pickFromPool = (pool: ShapeTemplate[], filterFit: boolean = false): ShapeTemplate => {
    let candidates = pool;
    if (grid && filterFit) {
      const fitting = pool.filter((t) => canTemplateFitOnGrid(grid, t));
      if (fitting.length > 0) candidates = fitting;
    }

    // Hindari duplikat bentuk yang persis sama dalam 1 trio jika memungkinkan
    const unused = candidates.filter((t) => !chosenTemplates.some((c) => c.name === t.name));
    const finalPool = unused.length > 0 ? unused : candidates;
    return finalPool[Math.floor(Math.random() * finalPool.length)];
  };

  // SLOT 1: Primary Piece (Bisa Besar, Sedang, atau Kecil)
  if (isEmergency) {
    const clearingSmall = SMALL_SHAPES.filter((t) => grid && canTemplateClearLinesOnGrid(grid, t));
    if (clearingSmall.length > 0) {
      chosenTemplates.push(clearingSmall[Math.floor(Math.random() * clearingSmall.length)]);
    } else {
      chosenTemplates.push(pickFromPool(SMALL_SHAPES, true));
    }
  } else {
    const roll = Math.random();
    if (roll < largeProb) {
      chosenTemplates.push(pickFromPool(LARGE_SHAPES, !isCrowded));
    } else if (roll < largeProb + 0.48) {
      chosenTemplates.push(pickFromPool(MEDIUM_SHAPES, isCrowded));
    } else {
      chosenTemplates.push(pickFromPool(SMALL_SHAPES, isCrowded));
    }
  }

  const hasLargePiece = chosenTemplates.some((t) => LARGE_SHAPES.some((l) => l.name === t.name));

  // SLOT 2: Tactical Piece (Jika slot 1 sudah balok besar, slot 2 wajib sedang/kecil)
  if (hasLargePiece || isEmergency) {
    const roll = Math.random();
    if (roll < 0.60) {
      chosenTemplates.push(pickFromPool(MEDIUM_SHAPES, isEmergency));
    } else {
      chosenTemplates.push(pickFromPool(SMALL_SHAPES, isEmergency));
    }
  } else {
    // Normal: Medium (50%), Small (30%), Large (20% jika slot 1 bukan besar)
    const roll = Math.random();
    if (roll < 0.20 && !isCrowded) {
      chosenTemplates.push(pickFromPool(LARGE_SHAPES, false));
    } else if (roll < 0.70) {
      chosenTemplates.push(pickFromPool(MEDIUM_SHAPES, isCrowded));
    } else {
      chosenTemplates.push(pickFromPool(SMALL_SHAPES, isCrowded));
    }
  }

  const currentLargeCount = chosenTemplates.filter((t) => LARGE_SHAPES.some((l) => l.name === t.name)).length;

  // SLOT 3: Balancer Piece (Pelengkap & pemecah kebuntuan yang pas)
  if (isEmergency) {
    const clearingPieces = [...SMALL_SHAPES, ...MEDIUM_SHAPES].filter(
      (t) => grid && canTemplateClearLinesOnGrid(grid, t)
    );
    if (clearingPieces.length > 0 && Math.random() < 0.65) {
      chosenTemplates.push(clearingPieces[Math.floor(Math.random() * clearingPieces.length)]);
    } else {
      chosenTemplates.push(pickFromPool(SMALL_SHAPES, true));
    }
  } else if (currentLargeCount >= 1 || isCrowded) {
    const roll = Math.random();
    if (roll < 0.55) {
      chosenTemplates.push(pickFromPool(MEDIUM_SHAPES, isCrowded));
    } else {
      chosenTemplates.push(pickFromPool(SMALL_SHAPES, isCrowded));
    }
  } else {
    // Normal: seimbang Medium (55%) dan Small (45%)
    const roll = Math.random();
    if (roll < 0.55) {
      chosenTemplates.push(pickFromPool(MEDIUM_SHAPES, false));
    } else {
      chosenTemplates.push(pickFromPool(SMALL_SHAPES, false));
    }
  }

  // GUARANTEE CHECK:
  // Jamin minimal 1 langkah VALID agar pemain tidak langsung mati mendadak tanpa bisa bergerak.
  // Jika dalam kondisi kritis (isEmergency), jamin minimal 2 langkah valid.
  if (grid) {
    const requiredFitting = isEmergency ? 2 : 1;
    let fittingCount = chosenTemplates.filter((t) => canTemplateFitOnGrid(grid, t)).length;

    if (fittingCount < requiredFitting) {
      for (let i = chosenTemplates.length - 1; i >= 0; i--) {
        if (!canTemplateFitOnGrid(grid, chosenTemplates[i])) {
          // Cari pengganti dari balok sedang dulu agar tidak langsung jadi dot kecil membosankan
          const fittingMedium = MEDIUM_SHAPES.filter((t) => canTemplateFitOnGrid(grid, t));
          const fittingSmall = SMALL_SHAPES.filter((t) => canTemplateFitOnGrid(grid, t));

          if (fittingMedium.length > 0 && !isEmergency && Math.random() < 0.60) {
            chosenTemplates[i] = fittingMedium[Math.floor(Math.random() * fittingMedium.length)];
            fittingCount++;
          } else if (fittingSmall.length > 0) {
            chosenTemplates[i] = fittingSmall[Math.floor(Math.random() * fittingSmall.length)];
            fittingCount++;
          }

          if (fittingCount >= requiredFitting) break;
        }
      }
    }

    // Safety fallback mutlak jika benar-benar buntu total
    if (fittingCount === 0) {
      const dotTemplate = SMALL_SHAPES[0];
      if (canTemplateFitOnGrid(grid, dotTemplate)) {
        chosenTemplates[chosenTemplates.length - 1] = dotTemplate;
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
