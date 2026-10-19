import { Shape } from '../types';

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

export function generateRandomShape(): Shape {
  const template = SHAPE_TEMPLATES[Math.floor(Math.random() * SHAPE_TEMPLATES.length)];
  
  return {
    id: `${template.name}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    matrix: template.matrix,
    color: template.color,
    width: template.matrix[0].length,
    height: template.matrix.length,
  };
}

export function generateShapeTrio(): Shape[] {
  return [generateRandomShape(), generateRandomShape(), generateRandomShape()];
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
