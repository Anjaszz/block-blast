export type CellValue = string | null; // Color string or null

export type Grid = CellValue[][]; // 8x8

export interface Shape {
  id: string;
  matrix: number[][]; // 1s and 0s
  color: string; // solid blue or red shades
  width: number;
  height: number;
}

export interface Player {
  id: string;
  username: string;
  score: number;
  combo: number;
  linesCleared: number;
  isAlive: boolean;
  isReady: boolean;
  isHost?: boolean;
  rank?: number;
  accentColor: string;
  eliminatedAt?: number; // Timestamp when player got eliminated (for Last Man Standing survival rank)
}

export type StageMode = 'survival' | 'timer';

export interface RoomInfo {
  id: string;
  code: string;
  name: string;
  is_private: boolean;
  password?: string;
  mode?: StageMode;
  duration_minutes?: number; // 2, 5, or 10
  player_count: number;
  max_players: number;
  status: 'waiting' | 'playing' | 'finished';
  host_name: string;
  host_id: string;
  created_at: string;
}

export interface RoomState {
  code: string;
  name: string;
  is_private: boolean;
  password?: string;
  mode: StageMode;
  duration_minutes?: number;
  status: 'waiting' | 'countdown' | 'playing' | 'finished';
  timeLeft?: number;
  players: Player[];
  maxPlayers: number;
  winner?: Player | null;
  host_id: string;
}

export interface LeaderboardEntry {
  id: string;
  username: string;
  score: number; // Highest single match score
  lines_cleared: number;
  max_combo: number;
  created_at: string;
}
