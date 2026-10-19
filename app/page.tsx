'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Navbar } from '@/components/Navbar';
import { HomeDashboard } from '@/components/HomeDashboard';
import { GameBoard } from '@/components/GameBoard';
import { ShapeDock } from '@/components/ShapeDock';
import { RoomLobbyView } from '@/components/RoomLobbyView';
import { StageScoreboard } from '@/components/StageScoreboard';
import { CreateRoomModal } from '@/components/CreateRoomModal';
import { BrowseRoomsModal } from '@/components/BrowseRoomsModal';
import { LeaderboardModal } from '@/components/LeaderboardModal';
import { UsernameModal } from '@/components/UsernameModal';
import { GameOverModal } from '@/components/GameOverModal';
import { ConfirmExitModal } from '@/components/ConfirmExitModal';
import { AttackModal } from '@/components/AttackModal';
import { DailyCheckinModal } from '@/components/DailyCheckinModal';
import { UpdatesModal } from '@/components/UpdatesModal';
import { ShopModal } from '@/components/ShopModal';
import { PowerUpBar, PowerUpTool } from '@/components/PowerUpBar';
import { getUserGems, getCheckinStatus, consumeGem } from '@/lib/gems';

import { Grid, Shape, Player, RoomState, RoomInfo, StageMode } from '@/lib/types';
import {
  createEmptyGrid,
  canPlaceShape,
  placeShape,
  checkCompletedLines,
  clearCompletedLines,
  calculateScore,
  hasAnyValidMove,
  BOARD_SIZE,
} from '@/lib/game/engine';
import { generateShapeTrio, rotateShape } from '@/lib/game/shapes';
import { soundManager } from '@/lib/sound';
import { StageManager } from '@/lib/multiplayer';
import {
  submitSoloScore,
  createRoomInDb,
  getRoomByCode,
  migrateUsernameInLeaderboard,
  fetchRoomsFromDb,
  deleteRoomFromDb,
} from '@/lib/supabase';
import { Flame, Sparkles, Skull, Swords } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function Home() {
  // Navigation View State: 'dashboard' | 'solo' | 'room_lobby' | 'stage_playing'
  const [currentView, setCurrentView] = useState<'dashboard' | 'solo' | 'room_lobby' | 'stage_playing'>('dashboard');

  // User Profile
  const [username, setUsername] = useState('Player');
  const [playerId, setPlayerId] = useState('');
  const [highScore, setHighScore] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Modals
  const [isUsernameModalOpen, setIsUsernameModalOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);
  const [isBrowseRoomsOpen, setIsBrowseRoomsOpen] = useState(false);
  const [isConfirmExitOpen, setIsConfirmExitOpen] = useState(false);
  const [isCheckinModalOpen, setIsCheckinModalOpen] = useState(false);
  const [isUpdatesModalOpen, setIsUpdatesModalOpen] = useState(false);
  const [isShopModalOpen, setIsShopModalOpen] = useState(false);

  // Gems & Power-Ups (Alat Bantu) System
  const [gems, setGems] = useState(0);
  const [canClaimCheckin, setCanClaimCheckin] = useState(false);
  const [hasUsedContinue, setHasUsedContinue] = useState(false);
  const [activeTool, setActiveTool] = useState<PowerUpTool>(null);

  // Game Engine State
  const [grid, setGrid] = useState<Grid>(createEmptyGrid);
  const [shapes, setShapes] = useState<(Shape | null)[]>([]);
  const [selectedShape, setSelectedShape] = useState<Shape | null>(null);
  const [hoverPos, setHoverPos] = useState<{ row: number; col: number } | null>(null);
  const [clearingCells, setClearingCells] = useState<Set<string>>(new Set());

  // Stats
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [linesCleared, setLinesCleared] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isStageEliminated, setIsStageEliminated] = useState(false);
  const [isNewHigh, setIsNewHigh] = useState(false);

  // Festive Combo Celebration State
  const [comboCelebration, setComboCelebration] = useState<{
    combo: number;
    scoreGained: number;
    title: string;
  } | null>(null);
  const [isShakingBoard, setIsShakingBoard] = useState(false);

  // Stage Multiplayer State
  const [stageManager, setStageManager] = useState<StageManager | null>(null);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [stageWinner, setStageWinner] = useState<Player | null>(null);
  const [stageRank, setStageRank] = useState<number | null>(null);

  // Attack Gift System State (Combo >= 3)
  const [attackCharges, setAttackCharges] = useState(0);
  const [isAttackModalOpen, setIsAttackModalOpen] = useState(false);
  const [incomingAttackAlert, setIncomingAttackAlert] = useState<{
    attackerName: string;
    shapeName: string;
  } | null>(null);

  // Dragging State
  const [dragState, setDragState] = useState<{
    shape: Shape;
    x: number;
    y: number;
  } | null>(null);

  // Board Container Ref
  const boardRef = useRef<HTMLDivElement | null>(null);

  // 1. Initial Load: Check Username & URL Join Params
  useEffect(() => {
    setIsMounted(true);
    let storedName = localStorage.getItem('blockarena_username');
    let storedId = localStorage.getItem('blockarena_player_id');
    const storedBest = localStorage.getItem('blockarena_solo_high_score');

    if (!storedId) {
      storedId = `p-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      localStorage.setItem('blockarena_player_id', storedId);
    }
    setPlayerId(storedId);

    if (storedBest) {
      setHighScore(parseInt(storedBest, 10));
    }

    // Load Gems & Check-in status
    setGems(getUserGems());
    try {
      const checkinInfo = getCheckinStatus();
      setCanClaimCheckin(checkinInfo.canClaimToday);
    } catch {
      // Ignore fallback
    }

    if (!storedName) {
      // First time visitor: show modal input username
      setIsFirstVisit(true);
      setIsUsernameModalOpen(true);
      storedName = 'Player_1';
    } else {
      setUsername(storedName);
      // If user already has username, check if they have seen latest updates
      if (typeof window !== 'undefined' && !localStorage.getItem('blockarena_has_seen_updates_v1')) {
        setIsUpdatesModalOpen(true);
      }
    }

    // Check URL search params for direct room link: ?join=CODE
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const joinCode = params.get('join');
      if (joinCode) {
        getRoomByCode(joinCode).then((room) => {
          if (room) {
            if (room.is_private) {
              setIsBrowseRoomsOpen(true);
            } else {
              initAndJoinRoom(
                room.code,
                room.name,
                room.is_private,
                room.host_id,
                storedName || 'Player',
                room.mode || 'survival',
                room.duration_minutes || 2
              );
            }
          }
        });
      }
    }

    // Clean up any room previously hosted by this player if now back on dashboard
    if (storedId) {
      fetchRoomsFromDb().then((rooms) => {
        rooms.forEach((r) => {
          if (r.host_id === storedId) {
            deleteRoomFromDb(r.code);
          }
        });
      }).catch(() => {});
    }

    // Initialize shapes
    setShapes(generateShapeTrio());
  }, []);

  // Track live score in ref for reliable unload / pagehide access
  const currentScoreRef = useRef({
    score: 0,
    linesCleared: 0,
    maxCombo: 0,
    currentView: 'dashboard',
    username: 'Player',
    highScore: 0,
  });

  useEffect(() => {
    currentScoreRef.current = {
      score,
      linesCleared,
      maxCombo,
      currentView,
      username,
      highScore,
    };
  }, [score, linesCleared, maxCombo, currentView, username, highScore]);

  // Cleanup room & auto-save high score when closing tab/browser (beforeunload, pagehide, unload)
  useEffect(() => {
    const handleExit = () => {
      // 1. Leave stage room if in multiplayer
      if (stageManager) {
        stageManager.leave();
      }

      // 2. Auto-save Solo best score if current game set a new personal record
      const { score: s, linesCleared: l, maxCombo: c, currentView: v, username: u, highScore: h } = currentScoreRef.current;
      if (v === 'solo' && s > 0) {
        try {
          const storedBest = parseInt(localStorage.getItem('blockarena_solo_high_score') || '0', 10);
          const currentBest = Math.max(h, storedBest);
          if (s > currentBest) {
            localStorage.setItem('blockarena_solo_high_score', String(s));
            submitSoloScore(u, s, l, c);
          }
        } catch {
          // Ignore
        }
      }
    };
    window.addEventListener('beforeunload', handleExit);
    window.addEventListener('pagehide', handleExit);
    window.addEventListener('unload', handleExit);
    return () => {
      window.removeEventListener('beforeunload', handleExit);
      window.removeEventListener('pagehide', handleExit);
      window.removeEventListener('unload', handleExit);
    };
  }, [stageManager]);

  // Update username
  const handleUpdateUsername = async (newName: string) => {
    const oldName = username;
    setUsername(newName);
    localStorage.setItem('blockarena_username', newName);
    setIsFirstVisit(false);

    // Migrasi skor leaderboard lama agar tidak terduplikasi dengan skor yang sama
    if (oldName && oldName.trim().toLowerCase() !== newName.trim().toLowerCase()) {
      await migrateUsernameInLeaderboard(oldName, newName);
    }

    // Tampilkan modal update setelah selesai set username pertama kali (jika belum pernah lihat)
    if (typeof window !== 'undefined' && !localStorage.getItem('blockarena_has_seen_updates_v1')) {
      setIsUpdatesModalOpen(true);
    }
  };

  // Acknowledge Updates Note
  const handleAcknowledgeUpdates = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('blockarena_has_seen_updates_v1', 'true');
    }
    setIsUpdatesModalOpen(false);
  };

  // Toggle Sound
  const handleToggleSound = () => {
    const next = soundManager.toggleSound();
    setSoundEnabled(next);
  };

  // Restart Board
  const handleRestartBoard = useCallback(() => {
    setGrid(createEmptyGrid());
    setShapes(generateShapeTrio());
    setSelectedShape(null);
    setHoverPos(null);
    setClearingCells(new Set());
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setLinesCleared(0);
    setIsGameOver(false);
    setIsStageEliminated(false);
    setIsNewHigh(false);
    setAttackCharges(0);
    setIsAttackModalOpen(false);
    setIncomingAttackAlert(null);
    setHasUsedContinue(false);
    setActiveTool(null);
  }, []);

  // Power-Up: Rotate a specific Shape (1 Gem)
  const handleRotateTargetShape = useCallback(
    (targetShape: Shape) => {
      if (currentView !== 'solo' || isGameOver) return;
      const targetIdx = shapes.findIndex((s) => s && s.id === targetShape.id);
      if (targetIdx === -1 || !shapes[targetIdx]) return;

      const success = consumeGem(1);
      if (!success) return;

      setGems(getUserGems());
      soundManager.playRotate();

      const rotated = rotateShape(shapes[targetIdx]!);
      const nextShapes = [...shapes];
      nextShapes[targetIdx] = rotated;
      setShapes(nextShapes);
      setSelectedShape(rotated);
      setActiveTool(null);
    },
    [currentView, isGameOver, shapes]
  );

  // Power-Up: Rotate button from PowerUpBar (Toggle Rotate Mode to pick target shape)
  const handleRotateCurrentShape = useCallback(() => {
    if (currentView !== 'solo' || isGameOver) return;
    const activeShapes = shapes.filter((s): s is Shape => s !== null);
    if (activeShapes.length === 0) return;

    setSelectedShape(null);
    setHoverPos(null);
    // Aktifkan mode putar sehingga user bisa memilih balok mana yang ingin diputar
    setActiveTool((prev) => (prev === 'rotate' ? null : 'rotate'));
  }, [currentView, isGameOver, shapes]);

  // Continue / Revive Game (Hanya di mode Solo & 1x per game seharga 1 Permata)
  const handleContinueGame = useCallback(() => {
    if (hasUsedContinue) return;
    const success = consumeGem(1);
    if (!success) return;

    setGems(getUserGems());
    setHasUsedContinue(true);

    // Clears rows 3 & 4 (center rows) to give breathing space for the revived player
    setGrid((prev) =>
      prev.map((row, rIdx) =>
        rIdx === 3 || rIdx === 4 ? row.map(() => null) : [...row]
      )
    );

    // Provide 3 fresh guaranteed shapes
    setShapes(generateShapeTrio());
    setSelectedShape(null);
    setHoverPos(null);
    setIsGameOver(false);

    soundManager.playClear(2);
    try {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.5 },
        colors: ['#38bdf8', '#3b82f6', '#93c5fd', '#ffffff'],
      });
    } catch {
      // Confetti fallback
    }
  }, [hasUsedContinue]);

  // Check Game Over Condition
  const checkEndGameCondition = useCallback(
    (
      currentGrid: Grid,
      currentShapes: (Shape | null)[],
      currentScore?: number,
      currentLines?: number,
      currentMaxCombo?: number
    ) => {
      const activeShapes = currentShapes.filter((s): s is Shape => s !== null);
      if (activeShapes.length > 0 && !hasAnyValidMove(currentGrid, activeShapes)) {
        soundManager.playGameOver();

        const evalScore = currentScore !== undefined ? currentScore : score;
        const evalLines = currentLines !== undefined ? currentLines : linesCleared;
        const evalCombo = currentMaxCombo !== undefined ? currentMaxCombo : maxCombo;

        if (currentView === 'solo') {
          setIsGameOver(true);
          // Check personal best
          const storedBest = typeof window !== 'undefined'
            ? parseInt(localStorage.getItem('blockarena_solo_high_score') || '0', 10)
            : 0;
          const currentBest = Math.max(highScore, storedBest);

          if (evalScore > currentBest) {
            setIsNewHigh(true);
            setHighScore(evalScore);
            if (typeof window !== 'undefined') {
              localStorage.setItem('blockarena_solo_high_score', String(evalScore));
            }
          }

          // SUBMIT HANYA UNTUK SOLO: Skor tertinggi per 1 permainan (bukan akumulasi!)
          submitSoloScore(username, evalScore, evalLines, evalCombo);
        } else if (currentView === 'stage_playing' && stageManager) {
          setIsStageEliminated(true);
          // Notify stage players that local player is finished (eliminated)
          stageManager.broadcastScore(evalScore, combo, evalLines, false);
          const currentPlayers = stageManager.getRoomState().players;
          const myRank = currentPlayers.findIndex((p) => p.id === playerId) + 1;
          if (myRank > 0) setStageRank(myRank);
        }
      }
    },
    [currentView, score, highScore, username, linesCleared, maxCombo, combo, stageManager]
  );

  // Place Shape Handler
  const handleExecutePlacement = useCallback(
    (shape: Shape, startRow: number, startCol: number) => {
      if (!canPlaceShape(grid, shape, startRow, startCol)) return false;

      soundManager.playPlace();

      // 1. Place on grid
      const { nextGrid, cellsPlaced } = placeShape(grid, shape, startRow, startCol);

      // 2. Consume shape
      const nextShapes = shapes.map((s) => (s?.id === shape.id ? null : s));
      const allUsed = nextShapes.every((s) => s === null);
      const updatedShapes = allUsed ? generateShapeTrio() : nextShapes;

      // 3. Clear lines
      const { rowsToClear, colsToClear } = checkCompletedLines(nextGrid);
      const totalLines = rowsToClear.length + colsToClear.length;

      let finalGrid = nextGrid;
      let finalScore = score;
      let newComboVal = 0;

      if (totalLines > 0) {
        const clearingSet = new Set<string>();
        rowsToClear.forEach((r) => {
          for (let c = 0; c < BOARD_SIZE; c++) clearingSet.add(`${r},${c}`);
        });
        colsToClear.forEach((c) => {
          for (let r = 0; r < BOARD_SIZE; r++) clearingSet.add(`${r},${c}`);
        });
        setClearingCells(clearingSet);

        const cleared = clearCompletedLines(nextGrid, rowsToClear, colsToClear);
        finalGrid = cleared.nextGrid;

        const scoreResult = calculateScore(cellsPlaced, totalLines, combo);
        finalScore = score + scoreResult.scoreGained;
        newComboVal = scoreResult.newCombo;

        setScore(finalScore);
        setCombo(newComboVal);
        setMaxCombo((prev) => Math.max(prev, newComboVal));
        setLinesCleared((prev) => prev + totalLines);

        soundManager.playClear(totalLines);
        if (newComboVal > 1) {
          soundManager.playCombo(newComboVal);

          // Festive Board Rumble & Meriah Celebration
          setIsShakingBoard(true);
          setTimeout(() => setIsShakingBoard(false), 380);

          let bannerTitle = 'GREAT COMBO!';
          if (totalLines >= 3) bannerTitle = 'TRIPLE BLAST!';
          else if (totalLines === 2) bannerTitle = 'DOUBLE BLAST!';
          else if (newComboVal === 3) bannerTitle = 'SUPER BLAST!';
          else if (newComboVal === 4) bannerTitle = 'MEGA STREAK!';
          else if (newComboVal >= 5) bannerTitle = 'UNSTOPPABLE!';

          setComboCelebration({
            combo: newComboVal,
            scoreGained: scoreResult.scoreGained,
            title: bannerTitle,
          });

          try {
            if (newComboVal >= 3) {
              if (currentView === 'stage_playing') {
                setAttackCharges((prev) => prev + 1);
              }

              // Double fireworks cannon bursts from left and right
              confetti({
                particleCount: 50,
                spread: 75,
                origin: { x: 0.15, y: 0.6 },
                colors: ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#a855f7'],
              });
              confetti({
                particleCount: 50,
                spread: 75,
                origin: { x: 0.85, y: 0.6 },
                colors: ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#a855f7'],
              });
            } else {
              confetti({
                particleCount: 35,
                spread: 60,
                origin: { x: 0.5, y: 0.55 },
                colors: ['#3b82f6', '#ef4444', '#f59e0b', '#10b981'],
              });
            }
          } catch {
            // Ignore confetti error
          }

          setTimeout(() => {
            setComboCelebration(null);
          }, 1100);
        }

        setTimeout(() => {
          setClearingCells(new Set());
        }, 220);
      } else {
        const scoreResult = calculateScore(cellsPlaced, 0, 0);
        finalScore = score + scoreResult.scoreGained;
        setScore(finalScore);
        setCombo(0);
      }

      setGrid(finalGrid);
      setShapes(updatedShapes);
      setSelectedShape(null);
      setHoverPos(null);
      setDragState(null);

      // Broadcast score in stage mode (live ranking race)
      if (currentView === 'stage_playing' && stageManager) {
        stageManager.broadcastScore(finalScore, newComboVal, linesCleared + totalLines, true);
      }

      const finalLines = linesCleared + totalLines;
      const finalMaxCombo = Math.max(maxCombo, newComboVal);

      // Realtime auto-save high score in Solo mode whenever a new record is reached
      if (currentView === 'solo') {
        const storedBest = typeof window !== 'undefined'
          ? parseInt(localStorage.getItem('blockarena_solo_high_score') || '0', 10)
          : 0;
        const currentBest = Math.max(highScore, storedBest);

        if (finalScore > currentBest) {
          setHighScore(finalScore);
          setIsNewHigh(true);
          if (typeof window !== 'undefined') {
            localStorage.setItem('blockarena_solo_high_score', String(finalScore));
          }
          submitSoloScore(username, finalScore, finalLines, finalMaxCombo);
        }
      }

      setTimeout(() => {
        checkEndGameCondition(finalGrid, updatedShapes, finalScore, finalLines, finalMaxCombo);
      }, 250);

      return true;
    },
    [grid, shapes, score, combo, linesCleared, currentView, stageManager, checkEndGameCondition]
  );

  // Cell Click (click to place or use active power-up tool)
  const handleCellClick = (row: number, col: number) => {
    if (isGameOver || isStageEliminated) return;

    // Power-Up Tool: Hammer (Hancurkan 1 Balok Terisi) - Biaya 2 Permata
    if (activeTool === 'hammer' && currentView === 'solo') {
      if (grid[row][col] === null) return; // Hanya sel terisi yang bisa dipalu
      const success = consumeGem(2);
      if (!success) {
        setActiveTool(null);
        setSelectedShape(null);
        setHoverPos(null);
        return;
      }

      setGems(getUserGems());
      soundManager.playHammer();

      // Flash cell clearing animation
      setClearingCells(new Set([`${row},${col}`]));
      setTimeout(() => {
        setClearingCells(new Set());
      }, 250);

      const nextGrid = grid.map((r, rIdx) =>
        r.map((c, cIdx) => (rIdx === row && cIdx === col ? null : c))
      );
      setGrid(nextGrid);
      const nextScore = score + 10;
      setScore(nextScore);
      setActiveTool(null);
      setSelectedShape(null);
      setHoverPos(null);

      // Save best score if exceeded
      if (nextScore > highScore) {
        setHighScore(nextScore);
        if (typeof window !== 'undefined') {
          localStorage.setItem('blockarena_solo_high_score', String(nextScore));
        }
      }

      return;
    }

    // Power-Up Tool: Bomb Plus (+) - Ledakkan Area Silang Plus (+) - Biaya 3 Permata
    if (activeTool === 'bomb' && currentView === 'solo') {
      const success = consumeGem(3);
      if (!success) {
        setActiveTool(null);
        setSelectedShape(null);
        setHoverPos(null);
        return;
      }

      setGems(getUserGems());
      soundManager.playBomb();

      let destroyedCount = 0;
      const blastedKeys = new Set<string>();

      const nextGrid = grid.map((r, rIdx) =>
        r.map((c, cIdx) => {
          // Pola silang Plus (+): 4 sel horizontal (2 kiri, 2 kanan) dan 4 sel vertikal (2 atas, 2 bawah) dari titik bom
          const isPlusTarget =
            (rIdx === row && Math.abs(cIdx - col) <= 2) ||
            (cIdx === col && Math.abs(rIdx - row) <= 2);

          if (isPlusTarget) {
            if (c !== null) {
              destroyedCount++;
              blastedKeys.add(`${rIdx},${cIdx}`);
            }
            return null;
          }
          return c;
        })
      );

      // Flash explosion effect for all blasted blocks
      if (blastedKeys.size > 0) {
        setClearingCells(blastedKeys);
        setTimeout(() => {
          setClearingCells(new Set());
        }, 250);
      }

      setGrid(nextGrid);
      const gained = destroyedCount * 10 + 25;
      const nextScore = score + gained;
      setScore(nextScore);
      setActiveTool(null);
      setSelectedShape(null);
      setHoverPos(null);

      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.5 },
          colors: ['#ef4444', '#f97316', '#facc15', '#ffffff'],
        });
      } catch {
        // Confetti fallback
      }

      if (nextScore > highScore) {
        setHighScore(nextScore);
        if (typeof window !== 'undefined') {
          localStorage.setItem('blockarena_solo_high_score', String(nextScore));
        }
      }

      return;
    }

    // Normal placement
    if (!selectedShape) return;
    handleExecutePlacement(selectedShape, row, col);
  };

  // Cell Hover
  const handleCellHover = (row: number, col: number) => {
    if (isGameOver || isStageEliminated || row < 0 || col < 0) {
      setHoverPos(null);
    } else {
      setHoverPos({ row, col });
    }
  };

  // Start Dragging (Blocked when any power-up tool is active)
  const handleStartDrag = (shape: Shape, e: React.PointerEvent) => {
    if (isGameOver || isStageEliminated || activeTool !== null) return;
    soundManager.playPickup();
    setSelectedShape(shape);
    setDragState({
      shape,
      x: e.clientX,
      y: e.clientY,
    });
  };

  // Pointer drag tracking
  useEffect(() => {
    if (!dragState) return;

    const onPointerMove = (e: PointerEvent) => {
      setDragState((prev) => (prev ? { ...prev, x: e.clientX, y: e.clientY } : null));

      if (boardRef.current) {
        const rect = boardRef.current.getBoundingClientRect();
        const cellSize = rect.width / BOARD_SIZE;
        const targetX = e.clientX - rect.left - (dragState.shape.width * cellSize) / 2;
        const targetY = e.clientY - rect.top - (dragState.shape.height * cellSize) / 2 - 30;

        const col = Math.round(targetX / cellSize);
        const row = Math.round(targetY / cellSize);

        if (row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE) {
          setHoverPos({ row, col });
        } else {
          setHoverPos(null);
        }
      }
    };

    const onPointerUp = () => {
      if (dragState && hoverPos) {
        handleExecutePlacement(dragState.shape, hoverPos.row, hoverPos.col);
      }
      setDragState(null);
      setHoverPos(null);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [dragState, hoverPos, handleExecutePlacement]);

  // ==========================================
  // ROOM CREATION & JOIN LOGIC
  // ==========================================
  const initAndJoinRoom = (
    code: string,
    name: string,
    isPrivate: boolean,
    hostId: string,
    currentUserName: string,
    mode: StageMode = 'survival',
    durationMinutes: number = 2
  ) => {
    if (stageManager) {
      stageManager.leave();
    }

    const localPlayer: Player = {
      id: playerId,
      username: currentUserName || username || 'Player',
      score: 0,
      combo: 0,
      linesCleared: 0,
      isAlive: true,
      isReady: true,
      isHost: hostId === playerId,
      accentColor: '#3b82f6',
    };

    const manager = new StageManager(localPlayer, {
      onRoomStateChange: (state) => {
        setRoomState(state);
      },
      onGameStart: () => {
        handleRestartBoard();
        setIsStageEliminated(false);
        setCurrentView('stage_playing');
      },
      onGameOver: (winner, rankedPlayers) => {
        setStageWinner(winner);
        setIsStageEliminated(false);
        setIsGameOver(true);
        const list =
          rankedPlayers && rankedPlayers.length > 0
            ? rankedPlayers
            : manager
            ? manager.getRoomState().players
            : [];
        let myRank = list.findIndex((p) => p.id === playerId) + 1;
        if (winner && winner.id === playerId) {
          myRank = 1;
        } else if (winner && winner.id !== playerId && (myRank <= 1 || myRank === 0)) {
          myRank = 2;
        }
        setStageRank(myRank > 0 ? myRank : 2);
      },
      onRoomClosed: (message) => {
        alert(message);
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('blockarena_active_room');
        }
        setStageManager(null);
        setRoomState(null);
        setCurrentView('dashboard');
      },
      onIncomingAttack: (attackerName, shape) => {
        soundManager.playAttackWarning();
        const shapeLabel = shape.matrix.length >= 3 && shape.matrix[0].length >= 3 ? 'Balok 3x3' : 'Balok Rintangan';
        setIncomingAttackAlert({
          attackerName,
          shapeName: shapeLabel,
        });
        setTimeout(() => {
          setIncomingAttackAlert(null);
        }, 4000);

        setShapes((prev) => {
          const next = [...prev];
          const availableIdx = next.findIndex((s) => s !== null);
          if (availableIdx >= 0) {
            next[availableIdx] = shape;
          } else {
            next[0] = shape;
          }
          return next;
        });
      },
    });

    if (typeof window !== 'undefined') {
      sessionStorage.setItem('blockarena_active_room', code);
    }
    manager.joinOrCreate(code, name, isPrivate, hostId, false, mode, durationMinutes);
    setStageManager(manager);
    setRoomState(manager.getRoomState());
    setCurrentView('room_lobby');
  };

  // Button 1: Play Solo
  const handleStartSolo = () => {
    handleRestartBoard();
    setCurrentView('solo');
  };

  // Button 2: Create Room Handler
  const handleCreateRoomSubmit = async (params: {
    name: string;
    is_private: boolean;
    password?: string;
    mode?: StageMode;
    duration_minutes?: number;
  }) => {
    const room = await createRoomInDb({
      name: params.name,
      is_private: params.is_private,
      password: params.password,
      host_name: username || 'Player',
      host_id: playerId,
      mode: params.mode,
      duration_minutes: params.duration_minutes,
    });

    initAndJoinRoom(
      room.code,
      room.name,
      room.is_private,
      playerId,
      username,
      room.mode || params.mode || 'survival',
      room.duration_minutes || params.duration_minutes || 2
    );
  };

  // Button 3: Join from Browse Rooms
  const handleJoinExistingRoom = (room: RoomInfo) => {
    initAndJoinRoom(
      room.code,
      room.name,
      room.is_private,
      room.host_id,
      username,
      room.mode || 'survival',
      room.duration_minutes || 2
    );
  };

  // Start Stage match by Host
  const handleStartStageMatch = () => {
    if (stageManager) {
      stageManager.triggerStart();
    }
  };

  // Leave Room
  const handleLeaveRoom = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('blockarena_active_room');
    }
    if (stageManager) {
      stageManager.leave();
      setStageManager(null);
    }
    setRoomState(null);
    setCurrentView('dashboard');
  };

  // Request Exit (triggers confirmation modal if in active game)
  const handleRequestExit = () => {
    if (currentView === 'solo' || currentView === 'stage_playing') {
      setIsConfirmExitOpen(true);
    } else if (currentView === 'room_lobby') {
      handleLeaveRoom();
    } else {
      setCurrentView('dashboard');
    }
  };

  // Confirm Exit from active game
  const handleConfirmExit = () => {
    setIsConfirmExitOpen(false);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('blockarena_active_room');
    }

    // Auto-save Solo score if current run set a new record
    if (currentView === 'solo' && score > 0) {
      const storedBest = typeof window !== 'undefined'
        ? parseInt(localStorage.getItem('blockarena_solo_high_score') || '0', 10)
        : 0;
      const currentBest = Math.max(highScore, storedBest);
      if (score > currentBest) {
        setHighScore(score);
        if (typeof window !== 'undefined') {
          localStorage.setItem('blockarena_solo_high_score', String(score));
        }
        submitSoloScore(username, score, linesCleared, maxCombo);
      }
    }

    if (stageManager) {
      stageManager.leave();
      setStageManager(null);
    }
    setRoomState(null);
    setIsStageEliminated(false);
    setCurrentView('dashboard');
  };

  return (
    <div className="min-h-screen bg-[#0a0c12] text-white flex flex-col font-sans select-none" suppressHydrationWarning>
      {/* Top Navigation Bar */}
      <Navbar
        view={currentView}
        onGoHome={handleRequestExit}
        username={username || 'Player'}
        onOpenUsernameModal={() => setIsUsernameModalOpen(true)}
        onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        highScore={highScore}
        gems={gems}
        canClaimCheckin={canClaimCheckin}
        onOpenCheckinModal={() => setIsCheckinModalOpen(true)}
        onOpenShopModal={() => setIsShopModalOpen(true)}
      />

      {/* Main Screen Layout based on currentView */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 flex flex-col items-center justify-center">
        {/* VIEW 1: HOME DASHBOARD (4 BUTTONS) */}
        {currentView === 'dashboard' && (
          <HomeDashboard
            username={username || 'Player'}
            highScore={highScore}
            soundEnabled={soundEnabled}
            onToggleSound={handleToggleSound}
            onOpenUsernameModal={() => setIsUsernameModalOpen(true)}
            onPlaySolo={handleStartSolo}
            onCreateRoom={() => setIsCreateRoomOpen(true)}
            onBrowseRooms={() => setIsBrowseRoomsOpen(true)}
            onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
            gems={gems}
            canClaimCheckin={canClaimCheckin}
            onOpenCheckinModal={() => setIsCheckinModalOpen(true)}
            onOpenUpdatesModal={() => setIsUpdatesModalOpen(true)}
            onOpenShopModal={() => setIsShopModalOpen(true)}
          />
        )}

        {/* VIEW 2: ROOM LOBBY (WAITING PLAYERS & SHARE LINK) */}
        {currentView === 'room_lobby' && roomState && (
          <RoomLobbyView
            roomState={roomState}
            localPlayerId={playerId}
            onStartGame={handleStartStageMatch}
            onLeaveRoom={handleLeaveRoom}
          />
        )}

        {/* VIEW 3: PLAYING (SOLO or STAGE 5-PLAYER) */}
        {(currentView === 'solo' || currentView === 'stage_playing') && (
          <div className="w-full flex flex-col lg:flex-row items-center lg:items-start justify-center gap-6 lg:gap-8">
            {/* Left/Center: Game Board & HUD */}
            <div className="flex flex-col items-center">
              {/* Score HUD */}
              <div className="w-full max-w-[400px] flex items-center justify-between px-2 mb-3">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-[#94a3b8]">
                    {currentView === 'solo' ? 'SOLO SCORE' : 'STAGE SCORE'}
                  </span>
                  <span className="font-mono text-2xl font-black text-[#3b82f6]">
                    {score.toLocaleString()}
                  </span>
                </div>

                {combo > 1 && (
                  <div className="flex items-center gap-1 px-2.5 py-1 bg-[#dc2626] text-white font-mono font-bold text-xs rounded">
                    <Flame className="w-3.5 h-3.5" />
                    <span>COMBO x{combo}</span>
                  </div>
                )}

                <div className="flex flex-col items-end">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-[#94a3b8]">
                    {currentView === 'solo' ? 'SOLO BEST' : 'LINES CLEARED'}
                  </span>
                  <span className="font-mono text-xl font-bold text-white">
                    {currentView === 'solo' ? highScore.toLocaleString() : linesCleared}
                  </span>
                </div>
              </div>

              {/* 8x8 Board Container with Shake and Combo Celebration */}
              <div ref={boardRef} className={`relative ${isShakingBoard ? 'shake-board' : ''}`}>
                <GameBoard
                  grid={grid}
                  activeShape={activeTool ? null : (dragState ? dragState.shape : selectedShape)}
                  hoverPos={hoverPos}
                  onCellClick={handleCellClick}
                  onCellHover={handleCellHover}
                  clearingCells={clearingCells}
                  combo={combo}
                  toolMode={currentView === 'solo' && (activeTool === 'hammer' || activeTool === 'bomb') ? activeTool : null}
                />

                {/* Spectating Overlay saat tereliminasi di Stage Mode (menunggu permainan pemain lain selesai) */}
                {currentView === 'stage_playing' && isStageEliminated && !isGameOver && (
                  <div className="absolute inset-0 z-30 bg-black/80 backdrop-blur-[2px] rounded-xl flex flex-col items-center justify-center p-6 text-center border border-[#ef4444]/40">
                    <div className="w-12 h-12 rounded-full bg-[#2a1417] border border-[#ef4444] flex items-center justify-center mb-3">
                      <Skull className="w-6 h-6 text-[#ef4444]" />
                    </div>
                    <span className="text-sm font-black font-mono tracking-wider text-[#ef4444] uppercase mb-1">
                      KAMU TERELIMINASI
                    </span>
                    <p className="text-xs text-[#94a3b8] max-w-[240px] mb-3">
                      {roomState?.mode === 'timer'
                        ? 'Menunggu waktu habis... Skormu tetap tersimpan untuk penentuan juara skor tertinggi!'
                        : 'Menunggu pemain lain menyelesaikan pertandingan...'}
                    </p>
                    <div className="flex items-center gap-2 px-3 py-1 bg-[#161a25] border border-[#222938] rounded-full text-[11px] font-mono text-[#38bdf8]">
                      <span className="w-2 h-2 rounded-full bg-[#38bdf8] animate-ping" />
                      <span>LIVE SPECTATING</span>
                    </div>
                  </div>
                )}

                {/* Meriah Festive Combo Banner Overlay */}
                {comboCelebration && (
                  <div className="absolute inset-0 z-30 pointer-events-none flex flex-col items-center justify-center">
                    <div className="combo-banner-anim px-6 py-4 bg-[#0a0c12] border-2 border-white rounded-2xl shadow-[0_0_35px_rgba(255,255,255,0.4)] flex flex-col items-center gap-1.5">
                      <div className="flex items-center gap-1 text-xs font-black tracking-widest text-[#ef4444] uppercase">
                        <Flame className="w-4 h-4 fill-current animate-bounce" />
                        <span>{comboCelebration.title}</span>
                        <Flame className="w-4 h-4 fill-current animate-bounce" />
                      </div>
                      <div className="text-3xl sm:text-4xl font-black font-mono tracking-wider text-white">
                        COMBO x{comboCelebration.combo}
                      </div>
                      <div className="text-xs sm:text-sm font-mono font-bold text-[#38bdf8]">
                        +{comboCelebration.scoreGained} PTS
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Incoming Attack Alert Banner */}
              {incomingAttackAlert && (
                <div className="w-full max-w-[420px] mx-auto mt-2 px-3 py-2 bg-[#2d1115] border border-[#ef4444] rounded-xl flex items-center justify-between gap-2 animate-bounce">
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444] animate-ping shrink-0" />
                    <span className="text-xs font-mono font-bold text-white truncate">
                      ⚠️ Diserang <span className="text-[#f87171]">{incomingAttackAlert.attackerName}</span>! ({incomingAttackAlert.shapeName})
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-[#fca5a5] uppercase shrink-0 bg-[#ef4444]/20 px-1.5 py-0.5 rounded">
                    GIFT MASUK
                  </span>
                </div>
              )}

              {/* Attack Ready Button (When combo >= 3 was achieved in multiplayer) */}
              {currentView === 'stage_playing' && attackCharges > 0 && !isGameOver && !isStageEliminated && (
                <button
                  onClick={() => setIsAttackModalOpen(true)}
                  className="w-full max-w-[420px] mx-auto mt-2.5 py-2 px-3.5 bg-[#dc2626] hover:bg-[#ef4444] border-2 border-white/80 text-white font-mono font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-between shadow-[0_0_25px_rgba(239,68,68,0.6)] animate-pulse"
                >
                  <span className="flex items-center gap-1.5">
                    <Swords className="w-4 h-4 fill-current animate-bounce" />
                    <span>SERANG LAWAN! ({attackCharges}x KESEMPATAN)</span>
                  </span>
                  <span className="px-2 py-0.5 bg-black/40 rounded text-[10px] tracking-widest font-black">
                    PILIH GIFT ➔
                  </span>
                </button>
              )}

              {/* Solo Mode Power-Ups Toolbar (Rotate, Hammer, Bomb, Shop) */}
              {currentView === 'solo' && !isGameOver && (
                <PowerUpBar
                  gems={gems}
                  activeTool={activeTool}
                  onSelectTool={(tool) => {
                    setSelectedShape(null);
                    setHoverPos(null);
                    setActiveTool(tool);
                  }}
                  onRotateShape={() => {
                    setSelectedShape(null);
                    setHoverPos(null);
                    handleRotateCurrentShape();
                  }}
                  onOpenShop={() => setIsShopModalOpen(true)}
                  hasPlayableShapes={shapes.some((s) => s !== null)}
                />
              )}

              {/* Bottom Shapes Dock */}
              <ShapeDock
                shapes={shapes}
                selectedShapeId={activeTool ? null : (selectedShape?.id || null)}
                onSelectShape={(shape) => {
                  if (isGameOver || isStageEliminated) return;
                  if (activeTool === 'rotate' && currentView === 'solo') {
                    handleRotateTargetShape(shape);
                    return;
                  }
                  if (activeTool !== null) return;
                  soundManager.playPickup();
                  setSelectedShape((prev) => (prev?.id === shape.id ? null : shape));
                }}
                onStartDrag={handleStartDrag}
                isRotateMode={activeTool === 'rotate'}
                isToolActive={activeTool !== null}
              />

              <div className="text-[11px] font-mono text-[#64748b] text-center mt-3">
                Drag atau klik balok lalu klik petak papan untuk meletakkan
              </div>
            </div>

            {/* Right: Stage Live Scoreboard (Multiplayer Mode) */}
            {currentView === 'stage_playing' && roomState && (
              <div className="w-full max-w-[340px] flex flex-col gap-3">
                <StageScoreboard
                  players={roomState.players}
                  localPlayerId={playerId}
                  roomCode={roomState.code}
                  mode={roomState.mode}
                  timeLeft={roomState.timeLeft}
                />

                <button
                  onClick={handleRequestExit}
                  className="w-full py-2 bg-[#161a25] hover:bg-[#1d2332] text-xs font-mono text-[#94a3b8] hover:text-white rounded-lg border border-[#222938] transition-colors cursor-pointer"
                >
                  KELUAR STAGE
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Floating Dragging Ghost Block */}
      {dragState && (
        <div
          className="fixed pointer-events-none z-50 transform -translate-x-1/2 -translate-y-1/2 opacity-80"
          style={{
            left: `${dragState.x}px`,
            top: `${dragState.y - 45}px`,
          }}
        >
          <div
            className="grid gap-1"
            style={{
              gridTemplateColumns: `repeat(${dragState.shape.width}, minmax(0, 1fr))`,
            }}
          >
            {dragState.shape.matrix.map((row, r) =>
              row.map((cell, c) => (
                <div
                  key={`drag-${r}-${c}`}
                  className={`w-7 h-7 rounded-sm ${
                    cell === 1 ? 'border border-white/50' : 'opacity-0'
                  }`}
                  style={{
                    backgroundColor: cell === 1 ? dragState.shape.color : 'transparent',
                  }}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: USERNAME (Muncul di awal jika belum ada) */}
      <UsernameModal
        isOpen={isUsernameModalOpen}
        onClose={() => setIsUsernameModalOpen(false)}
        currentUsername={username}
        onSave={handleUpdateUsername}
        isMandatory={isFirstVisit}
      />

      {/* MODAL 2: CREATE ROOM */}
      <CreateRoomModal
        isOpen={isCreateRoomOpen}
        onClose={() => setIsCreateRoomOpen(false)}
        onCreateRoom={handleCreateRoomSubmit}
      />

      {/* MODAL 3: BROWSE ROOMS */}
      <BrowseRoomsModal
        isOpen={isBrowseRoomsOpen}
        onClose={() => setIsBrowseRoomsOpen(false)}
        onJoinRoom={handleJoinExistingRoom}
      />

      {/* MODAL 4: LEADERBOARD GLOBAL (Solo Skor Tertinggi) */}
      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
      />

      {/* MODAL 5: GAME OVER */}
      <GameOverModal
        isOpen={isGameOver}
        score={score}
        linesCleared={linesCleared}
        maxCombo={maxCombo}
        isNewHigh={isNewHigh}
        gameMode={currentView === 'stage_playing' || stageManager !== null || roomState !== null || stageWinner !== null ? 'stage' : 'solo'}
        stageMode={roomState?.mode || 'survival'}
        stageWinner={stageWinner}
        stageRank={stageRank}
        localPlayerId={playerId}
        gems={gems}
        hasUsedContinue={hasUsedContinue}
        onContinue={handleContinueGame}
        onRestart={() => {
          if (currentView === 'stage_playing' || stageManager !== null) {
            if (stageManager) stageManager.leave();
            setStageManager(null);
            setRoomState(null);
            setStageWinner(null);
            setStageRank(null);
            setCurrentView('dashboard');
          } else {
            handleRestartBoard();
          }
        }}
        onBackToMenu={() => {
          setIsGameOver(false);
          setStageWinner(null);
          setStageRank(null);
          if (stageManager) stageManager.leave();
          setStageManager(null);
          setRoomState(null);
          setCurrentView('dashboard');
        }}
      />

      {/* MODAL 6: CONFIRM EXIT */}
      <ConfirmExitModal
        isOpen={isConfirmExitOpen}
        onCancel={() => setIsConfirmExitOpen(false)}
        onConfirm={handleConfirmExit}
      />

      {/* MODAL 7: COMBO ATTACK SELECTION */}
      <AttackModal
        isOpen={isAttackModalOpen}
        onClose={() => setIsAttackModalOpen(false)}
        rivals={roomState ? roomState.players.filter((p) => p.id !== playerId && p.isAlive) : []}
        onSendAttack={(targetPlayerId, shape) => {
          if (stageManager) {
            stageManager.sendAttack(targetPlayerId, shape);
            soundManager.playAttackSent();
            setAttackCharges((prev) => Math.max(0, prev - 1));
          }
        }}
      />

      {/* MODAL 8: DAILY CHECK-IN REWARDS */}
      <DailyCheckinModal
        isOpen={isCheckinModalOpen}
        onClose={() => {
          setIsCheckinModalOpen(false);
          try {
            setCanClaimCheckin(getCheckinStatus().canClaimToday);
          } catch {
            // fallback
          }
        }}
        onGemsUpdated={(newGems) => {
          setGems(newGems);
          try {
            setCanClaimCheckin(getCheckinStatus().canClaimToday);
          } catch {
            // fallback
          }
        }}
      />

      {/* MODAL 9: WHAT'S NEW (CATATAN UPDATE) */}
      <UpdatesModal
        isOpen={isUpdatesModalOpen}
        onClose={() => setIsUpdatesModalOpen(false)}
        onAcknowledge={handleAcknowledgeUpdates}
      />

      {/* MODAL 10: TOKO PERMATA & ALAT BANTU (POWER-UPS) */}
      <ShopModal
        isOpen={isShopModalOpen}
        onClose={() => setIsShopModalOpen(false)}
        gems={gems}
        onOpenCheckin={() => setIsCheckinModalOpen(true)}
      />
    </div>
  );
}
