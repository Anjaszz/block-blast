import { RealtimeChannel } from '@supabase/supabase-js';
import { Player, RoomState, StageMode } from './types';
import { supabase, isSupabaseConfigured, generateRoomCode, deleteRoomFromDb } from './supabase';
export { generateRoomCode };

const PLAYER_COLORS = [
  '#3b82f6', // Player 1 - Blue
  '#ef4444', // Player 2 - Red
  '#60a5fa', // Player 3 - Sky Blue
  '#f87171', // Player 4 - Light Red
  '#1d4ed8', // Player 5 - Deep Blue
];

export function getRandomColor(index: number = 0): string {
  return PLAYER_COLORS[index % PLAYER_COLORS.length];
}

export interface MultiplayerCallbacks {
  onRoomStateChange: (state: RoomState) => void;
  onGameStart: () => void;
  onGameOver: (winner: Player | null, rankedPlayers?: Player[]) => void;
  onRoomClosed?: (message: string) => void;
}

// Helper to rank players:
// - Survival: primarily by Survival (Last Man Standing), then by score
// - Timer: primarily by Score (Highest Score Rush), then by alive status & survival time
export function sortStagePlayers(players: Player[], mode: StageMode = 'survival'): Player[] {
  return [...players].sort((a, b) => {
    if (mode === 'timer') {
      // In Timer mode, highest score wins!
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      // If score is tied, alive player beats dead player
      if (a.isAlive && !b.isAlive) return -1;
      if (!a.isAlive && b.isAlive) return 1;
      // If both dead, survived longer wins
      const aElim = a.eliminatedAt || 0;
      const bElim = b.eliminatedAt || 0;
      return bElim - aElim;
    }

    // Default: Survival (Last Man Standing)
    // 1. Alive players ALWAYS rank above eliminated players
    if (a.isAlive && !b.isAlive) return -1;
    if (!a.isAlive && b.isAlive) return 1;

    // 2. If both are alive, higher score ranks higher
    if (a.isAlive && b.isAlive) {
      return b.score - a.score;
    }

    // 3. If both are eliminated: the one who survived longer (eliminated later) ranks higher
    const aElim = a.eliminatedAt || 0;
    const bElim = b.eliminatedAt || 0;
    if (aElim !== bElim) {
      return bElim - aElim; // Higher timestamp = eliminated later = better rank
    }

    // 4. Tie-breaker: higher score
    return b.score - a.score;
  });
}

export class StageManager {
  private channel: RealtimeChannel | null = null;
  private roomCode: string = '';
  private localPlayer: Player;
  private isBotMode: boolean = false;
  private botInterval: NodeJS.Timeout | null = null;
  private timerInterval: NodeJS.Timeout | null = null;
  private callbacks: MultiplayerCallbacks;
  public state: RoomState;
  private initialPlayerCount: number = 0;

  constructor(localPlayer: Player, callbacks: MultiplayerCallbacks) {
    this.localPlayer = localPlayer;
    this.callbacks = callbacks;
    this.state = {
      code: '',
      name: '',
      is_private: false,
      status: 'waiting',
      players: [localPlayer],
      maxPlayers: 5,
      winner: null,
      host_id: localPlayer.id,
      mode: 'survival',
      duration_minutes: 2,
      timeLeft: 0,
    };
  }

  public getRoomState(): RoomState {
    return this.state;
  }

  public joinOrCreate(
    code: string,
    roomName: string = '',
    isPrivate: boolean = false,
    hostId: string = '',
    asBotMode: boolean = false,
    mode: StageMode = 'survival',
    durationMinutes: number = 2
  ) {
    this.roomCode = code.toUpperCase();
    this.state.code = this.roomCode;
    this.state.name = roomName || `Stage ${this.roomCode}`;
    this.state.is_private = isPrivate;
    this.state.host_id = hostId || this.localPlayer.id;
    this.state.mode = mode;
    this.state.duration_minutes = durationMinutes;
    this.state.timeLeft = mode === 'timer' ? durationMinutes * 60 : 0;
    this.isBotMode = asBotMode;

    if (this.isBotMode) {
      this.initBotSimulation();
      return;
    }

    if (!supabase) {
      this.state.players = [this.localPlayer];
      this.callbacks.onRoomStateChange({ ...this.state });
      return;
    }

    this.channel = supabase.channel(`stage:${this.roomCode}`, {
      config: {
        presence: { key: this.localPlayer.id },
      },
    });

    // Handle presence (players list up to 5)
    this.channel.on('presence', { event: 'sync' }, () => {
      if (!this.channel) return;
      const presenceState = this.channel.presenceState<{
        player: Player;
      }>();
      const playersList: Player[] = [];

      Object.values(presenceState).forEach((presences) => {
        presences.forEach((p) => {
          if (p.player && !playersList.some((pl) => pl.id === p.player.id)) {
            playersList.push(p.player);
          }
        });
      });

      // Check if room master disconnected
      const isMeHost = this.state.host_id === this.localPlayer.id || Boolean(this.localPlayer.isHost);
      if (!isMeHost && this.state.host_id) {
        const hostIsPresent = playersList.some((p) => p.id === this.state.host_id);
        if (!hostIsPresent && playersList.length > 0) {
          this.callbacks.onRoomClosed?.('Room Master telah keluar. Room dibubarkan.');
          return;
        }
      }

      this.updatePlayers(playersList);
    });

    // Handle broadcast room closed (when host leaves)
    this.channel.on('broadcast', { event: 'room_closed' }, ({ payload }) => {
      this.callbacks.onRoomClosed?.(payload?.message || 'Room telah ditutup oleh Room Master.');
    });

    // Handle broadcast score updates
    this.channel.on('broadcast', { event: 'score_update' }, ({ payload }) => {
      const updatedPlayer = payload as Player;
      this.updatePlayerScore(updatedPlayer);
    });

    // Handle game start broadcast
    this.channel.on('broadcast', { event: 'game_start' }, ({ payload }) => {
      if (payload?.mode) {
        this.state.mode = payload.mode;
      }
      if (payload?.duration_minutes) {
        this.state.duration_minutes = payload.duration_minutes;
      }
      this.startGame();
    });

    // Handle game finished broadcast
    this.channel.on('broadcast', { event: 'game_finished' }, ({ payload }) => {
      this.finishGame(payload?.winner || null, payload?.ranked || undefined);
    });

    this.channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await this.channel?.track({
          player: this.localPlayer,
        });
      }
    });
  }

  private updatePlayers(players: Player[]) {
    // Ensure local player is included with latest local state
    // AND preserve in-game state (score, isAlive, eliminatedAt) for remote players so presence doesn't wipe them out!
    const merged = players.map((p) => {
      if (p.id === this.localPlayer.id) return this.localPlayer;
      const existing = this.state.players.find((ep) => ep.id === p.id);
      if (existing) {
        return {
          ...p,
          score: existing.score,
          combo: existing.combo,
          linesCleared: existing.linesCleared,
          isAlive: existing.isAlive,
          eliminatedAt: existing.eliminatedAt,
        };
      }
      return p;
    });

    if (!merged.some((p) => p.id === this.localPlayer.id)) {
      merged.push(this.localPlayer);
    }

    // Assign consistent accent colors
    merged.forEach((p, idx) => {
      p.accentColor = PLAYER_COLORS[idx % PLAYER_COLORS.length];
    });

    // Limit to max 5 players, sorted by active mode
    const sorted = sortStagePlayers(merged.slice(0, 5), this.state.mode);
    sorted.forEach((p, index) => {
      p.rank = index + 1;
    });

    this.state.players = sorted;
    this.callbacks.onRoomStateChange({ ...this.state });

    this.checkSurvivalWinCondition();
  }

  private updatePlayerScore(player: Player) {
    let playerExisted = false;
    const list = this.state.players.map((p) => {
      if (p.id === player.id) {
        playerExisted = true;
        // Critical: once eliminated, player CANNOT become alive again
        const isAlive = !p.isAlive ? false : Boolean(player.isAlive);
        const elimAt =
          !isAlive && !p.eliminatedAt
            ? player.eliminatedAt || Date.now()
            : p.eliminatedAt || player.eliminatedAt;
        return {
          ...p,
          ...player,
          isAlive,
          eliminatedAt: elimAt,
        };
      }
      return p;
    });

    if (!playerExisted) {
      list.push(player);
    }

    const sorted = sortStagePlayers(list, this.state.mode);
    sorted.forEach((p, index) => {
      p.rank = index + 1;
    });

    this.state.players = sorted;
    this.callbacks.onRoomStateChange({ ...this.state });

    this.checkSurvivalWinCondition();
  }

  public broadcastScore(score: number, combo: number, linesCleared: number, isAlive: boolean = true) {
    this.localPlayer.score = score;
    this.localPlayer.combo = combo;
    this.localPlayer.linesCleared = linesCleared;

    if (!isAlive && this.localPlayer.isAlive) {
      this.localPlayer.eliminatedAt = Date.now();
    }
    this.localPlayer.isAlive = isAlive;

    this.updatePlayerScore(this.localPlayer);

    if (this.channel && !this.isBotMode) {
      this.channel.send({
        type: 'broadcast',
        event: 'score_update',
        payload: this.localPlayer,
      });
    }

    this.checkSurvivalWinCondition();
  }

  // Check whether only 1 player remains alive (Winner) or everyone is eliminated
  private checkSurvivalWinCondition() {
    if (this.state.status !== 'playing') return;

    const totalPlayers = this.state.players.length;
    const alivePlayers = this.state.players.filter((p) => p.isAlive);
    const effectiveTotal = Math.max(totalPlayers, this.initialPlayerCount);

    if (this.state.mode === 'survival') {
      // In a multiplayer match (2+ players), when exactly 1 survivor is left: they win immediately!
      if (effectiveTotal >= 2 && alivePlayers.length === 1) {
        this.finishGame(alivePlayers[0]);
      } else if (alivePlayers.length === 0) {
        // If all players are eliminated, finish and rank by survival time / score
        this.finishGame();
      }
    } else {
      // Mode TIMER:
      // Game finishes when time expires!
      // The only early finish is if ALL players are eliminated (no one left alive).
      // If 1 player dies while others are still playing, the game DOES NOT finish early.
      if (alivePlayers.length === 0) {
        this.finishGame();
      }
    }
  }

  public forceFinishAsWinner() {
    this.finishGame(this.localPlayer);
  }

  public triggerStart() {
    if (this.isBotMode) {
      this.startGame();
      return;
    }

    if (this.channel) {
      this.channel.send({
        type: 'broadcast',
        event: 'game_start',
        payload: {
          mode: this.state.mode,
          duration_minutes: this.state.duration_minutes,
        },
      });
      this.startGame();
    }
  }

  private startGame() {
    this.initialPlayerCount = this.state.players.length;
    this.state.status = 'playing';

    if (this.timerInterval) clearInterval(this.timerInterval);

    if (this.state.mode === 'timer') {
      const totalSeconds = (this.state.duration_minutes || 2) * 60;
      this.state.timeLeft = totalSeconds;

      this.timerInterval = setInterval(() => {
        if (this.state.status !== 'playing') {
          if (this.timerInterval) clearInterval(this.timerInterval);
          return;
        }

        const newTimeLeft = Math.max(0, (this.state.timeLeft ?? 0) - 1);
        this.state.timeLeft = newTimeLeft;
        this.callbacks.onRoomStateChange({ ...this.state });

        if (newTimeLeft <= 0) {
          if (this.timerInterval) clearInterval(this.timerInterval);
          this.finishGame();
        }
      }, 1000);
    }

    this.callbacks.onGameStart();
    this.callbacks.onRoomStateChange({ ...this.state });
  }

  public finishGame(winnerParam?: Player | null, rankedParam?: Player[]) {
    if (this.state.status === 'finished') return;
    if (this.botInterval) clearInterval(this.botInterval);
    if (this.timerInterval) clearInterval(this.timerInterval);

    this.state.status = 'finished';

    let ranked: Player[];
    if (rankedParam && rankedParam.length > 0) {
      ranked = [...rankedParam];
    } else {
      ranked = sortStagePlayers(this.state.players, this.state.mode);
    }

    // Determine the absolute winner:
    const alivePlayers = this.state.players.filter((p) => p.isAlive);
    let winner: Player | null = null;

    if (this.state.mode === 'timer') {
      // IN TIMER MODE: Highest score (ranked[0]) is ALWAYS the absolute winner!
      // Even if the player with highest score was eliminated earlier.
      winner = ranked[0] || null;
    } else if (winnerParam !== undefined && winnerParam !== null) {
      winner = winnerParam;
    } else {
      // In survival mode, last remaining alive player is the winner
      winner = alivePlayers[0] || ranked[0] || null;
    }

    // CRITICAL: The winner MUST be placed at index 0 (Rank 1) in ranked!
    if (winner) {
      const winnerIdx = ranked.findIndex((p) => p.id === winner.id);
      if (winnerIdx > 0) {
        const [w] = ranked.splice(winnerIdx, 1);
        ranked.unshift(w);
      }
    }

    ranked.forEach((p, index) => {
      p.rank = index + 1;
    });
    this.state.players = ranked;
    this.state.winner = winner;

    this.callbacks.onGameOver(winner, ranked);
    this.callbacks.onRoomStateChange({ ...this.state });

    if (this.channel && !this.isBotMode) {
      this.channel.send({
        type: 'broadcast',
        event: 'game_finished',
        payload: { winner, ranked },
      });
    }
  }

  // Realistic Bot Simulation for quick testing
  private initBotSimulation() {
    const botNames = ['ApexRival', 'CyberRush', 'Vortex99', 'NovaStrike'];
    const botPlayers: Player[] = botNames.map((name, i) => ({
      id: `bot-${i + 1}`,
      username: name,
      score: 0,
      combo: 0,
      linesCleared: 0,
      isAlive: true,
      isReady: true,
      isHost: false,
      accentColor: PLAYER_COLORS[(i + 1) % PLAYER_COLORS.length],
    }));

    this.state.players = [this.localPlayer, ...botPlayers];
    this.callbacks.onRoomStateChange({ ...this.state });

    const origStart = this.startGame.bind(this);
    this.startGame = () => {
      origStart();
      this.startBotRivalsLoop();
    };
  }

  private startBotRivalsLoop() {
    if (this.botInterval) clearInterval(this.botInterval);

    this.botInterval = setInterval(() => {
      if (this.state.status !== 'playing') {
        if (this.botInterval) clearInterval(this.botInterval);
        return;
      }

      this.state.players = this.state.players.map((p) => {
        if (p.id.startsWith('bot-') && p.isAlive) {
          const rand = Math.random();
          if (rand > 0.45) {
            const linesCleared = rand > 0.88 ? 2 : rand > 0.7 ? 1 : 0;
            const points = linesCleared > 0 ? (linesCleared === 2 ? 350 : 150) : 30;
            const newCombo = linesCleared > 0 ? p.combo + 1 : 0;
            return {
              ...p,
              score: p.score + points,
              combo: newCombo,
              linesCleared: p.linesCleared + linesCleared,
            };
          }
        }
        return p;
      });

      const sorted = sortStagePlayers(this.state.players, this.state.mode);
      sorted.forEach((p, idx) => {
        p.rank = idx + 1;
      });
      this.state.players = sorted;
      this.callbacks.onRoomStateChange({ ...this.state });

      this.checkSurvivalWinCondition();
    }, 1400);
  }

  public leave() {
    if (this.botInterval) clearInterval(this.botInterval);
    if (this.timerInterval) clearInterval(this.timerInterval);

    const isMeHost = this.state.host_id === this.localPlayer.id || Boolean(this.localPlayer.isHost);

    if (this.channel) {
      if (isMeHost && !this.isBotMode) {
        try {
          this.channel.send({
            type: 'broadcast',
            event: 'room_closed',
            payload: { message: 'Room Master telah keluar. Room dibubarkan.' },
          });
        } catch {
          // Ignore
        }
      }
      this.channel.unsubscribe();
      this.channel = null;
    }

    if (isMeHost && this.roomCode) {
      deleteRoomFromDb(this.roomCode);
    }
  }
}
