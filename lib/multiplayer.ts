import { RealtimeChannel } from '@supabase/supabase-js';
import { Player, RoomState } from './types';
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

// Helper to rank players primarily by Survival (Last Man Standing), then by score
export function sortStagePlayers(players: Player[]): Player[] {
  return [...players].sort((a, b) => {
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
  private callbacks: MultiplayerCallbacks;
  public state: RoomState;

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
    asBotMode: boolean = false
  ) {
    this.roomCode = code.toUpperCase();
    this.state.code = this.roomCode;
    this.state.name = roomName || `Stage ${this.roomCode}`;
    this.state.is_private = isPrivate;
    this.state.host_id = hostId || this.localPlayer.id;
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
    this.channel.on('broadcast', { event: 'game_start' }, () => {
      this.startGame();
    });

    // Handle game finished broadcast
    this.channel.on('broadcast', { event: 'game_finished' }, ({ payload }) => {
      this.finishGame(payload?.winner || null);
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
    const merged = players.map((p) => (p.id === this.localPlayer.id ? this.localPlayer : p));
    if (!merged.some((p) => p.id === this.localPlayer.id)) {
      merged.push(this.localPlayer);
    }

    // Assign consistent accent colors
    merged.forEach((p, idx) => {
      p.accentColor = PLAYER_COLORS[idx % PLAYER_COLORS.length];
    });

    // Limit to max 5 players, sorted by Survival rank
    const sorted = sortStagePlayers(merged.slice(0, 5));
    sorted.forEach((p, index) => {
      p.rank = index + 1;
    });

    this.state.players = sorted;
    this.callbacks.onRoomStateChange({ ...this.state });

    this.checkSurvivalWinCondition();
  }

  private updatePlayerScore(player: Player) {
    const list = this.state.players.map((p) => {
      if (p.id === player.id) {
        const elimAt =
          !player.isAlive && p.isAlive && !player.eliminatedAt
            ? Date.now()
            : player.eliminatedAt || p.eliminatedAt;
        return { ...player, eliminatedAt: elimAt };
      }
      return p;
    });

    const sorted = sortStagePlayers(list);
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

    // In a multiplayer match (2+ players), when exactly 1 survivor is left: they win immediately!
    if (totalPlayers >= 2 && alivePlayers.length === 1) {
      this.finishGame(alivePlayers[0]);
    } else if (alivePlayers.length === 0) {
      // If all players are eliminated, finish and rank by survival time / score
      this.finishGame();
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
        payload: {},
      });
      this.startGame();
    }
  }

  private startGame() {
    this.state.status = 'playing';
    this.callbacks.onGameStart();
    this.callbacks.onRoomStateChange({ ...this.state });
  }

  public finishGame(winnerParam?: Player | null) {
    if (this.state.status === 'finished') return;
    if (this.botInterval) clearInterval(this.botInterval);

    this.state.status = 'finished';
    const ranked = sortStagePlayers(this.state.players);
    ranked.forEach((p, index) => {
      p.rank = index + 1;
    });
    this.state.players = ranked;

    // Winner is designated winnerParam, or first alive player (The Last Survivor), or #1 ranked
    const alivePlayers = ranked.filter((p) => p.isAlive);
    const winner = winnerParam !== undefined ? winnerParam : (alivePlayers[0] || ranked[0] || null);
    this.state.winner = winner;

    this.callbacks.onGameOver(winner, ranked);
    this.callbacks.onRoomStateChange({ ...this.state });

    if (this.channel && !this.isBotMode) {
      this.channel.send({
        type: 'broadcast',
        event: 'game_finished',
        payload: { winner },
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

      const sorted = sortStagePlayers(this.state.players);
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
