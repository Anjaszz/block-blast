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

import { Grid, Shape, Player, RoomState, RoomInfo } from '@/lib/types';
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
import { generateShapeTrio } from '@/lib/game/shapes';
import { soundManager } from '@/lib/sound';
import { StageManager } from '@/lib/multiplayer';
import {
  submitSoloScore,
  createRoomInDb,
  getRoomByCode,
  migrateUsernameInLeaderboard,
} from '@/lib/supabase';
import { Flame, Sparkles } from 'lucide-react';
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

    if (!storedName) {
      // First time visitor: show modal input username
      setIsFirstVisit(true);
      setIsUsernameModalOpen(true);
      storedName = 'Player_1';
    } else {
      setUsername(storedName);
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
              initAndJoinRoom(room.code, room.name, room.is_private, room.host_id, storedName || 'Player');
            }
          }
        });
      }
    }

    // Initialize shapes
    setShapes(generateShapeTrio());
  }, []);

  // Cleanup room when closing tab/browser
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (stageManager) {
        stageManager.leave();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
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
    setIsNewHigh(false);
  }, []);

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
        setIsGameOver(true);

        const evalScore = currentScore !== undefined ? currentScore : score;
        const evalLines = currentLines !== undefined ? currentLines : linesCleared;
        const evalCombo = currentMaxCombo !== undefined ? currentMaxCombo : maxCombo;

        if (currentView === 'solo') {
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

      setTimeout(() => {
        checkEndGameCondition(finalGrid, updatedShapes, finalScore, finalLines, finalMaxCombo);
      }, 250);

      return true;
    },
    [grid, shapes, score, combo, linesCleared, currentView, stageManager, checkEndGameCondition]
  );

  // Cell Click (click to place)
  const handleCellClick = (row: number, col: number) => {
    if (isGameOver) return;
    if (!selectedShape) return;
    handleExecutePlacement(selectedShape, row, col);
  };

  // Cell Hover
  const handleCellHover = (row: number, col: number) => {
    if (row < 0 || col < 0) {
      setHoverPos(null);
    } else {
      setHoverPos({ row, col });
    }
  };

  // Start Dragging
  const handleStartDrag = (shape: Shape, e: React.PointerEvent) => {
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
    currentUserName: string
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
        setCurrentView('stage_playing');
      },
      onGameOver: (winner, rankedPlayers) => {
        setStageWinner(winner);
        setIsGameOver(true);
        const list =
          rankedPlayers && rankedPlayers.length > 0
            ? rankedPlayers
            : manager
            ? manager.getRoomState().players
            : [];
        const myRank = list.findIndex((p) => p.id === playerId) + 1;
        setStageRank(myRank > 0 ? myRank : winner?.id === playerId ? 1 : 2);
      },
      onRoomClosed: (message) => {
        alert(message);
        setStageManager(null);
        setRoomState(null);
        setCurrentView('dashboard');
      },
    });

    manager.joinOrCreate(code, name, isPrivate, hostId, false);
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
  }) => {
    const room = await createRoomInDb({
      name: params.name,
      is_private: params.is_private,
      password: params.password,
      host_name: username || 'Player',
      host_id: playerId,
    });

    initAndJoinRoom(room.code, room.name, room.is_private, playerId, username);
  };

  // Button 3: Join from Browse Rooms
  const handleJoinExistingRoom = (room: RoomInfo) => {
    initAndJoinRoom(room.code, room.name, room.is_private, room.host_id, username);
  };

  // Start Stage match by Host
  const handleStartStageMatch = () => {
    if (stageManager) {
      stageManager.triggerStart();
    }
  };

  // Leave Room
  const handleLeaveRoom = () => {
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
    if (stageManager) {
      stageManager.leave();
      setStageManager(null);
    }
    setRoomState(null);
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
                  activeShape={dragState ? dragState.shape : selectedShape}
                  hoverPos={hoverPos}
                  onCellClick={handleCellClick}
                  onCellHover={handleCellHover}
                  clearingCells={clearingCells}
                  combo={combo}
                />

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

              {/* Bottom Shapes Dock */}
              <ShapeDock
                shapes={shapes}
                selectedShapeId={selectedShape?.id || null}
                onSelectShape={(shape) => {
                  soundManager.playPickup();
                  setSelectedShape((prev) => (prev?.id === shape.id ? null : shape));
                }}
                onStartDrag={handleStartDrag}
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
        gameMode={currentView === 'stage_playing' ? 'stage' : 'solo'}
        stageWinner={stageWinner}
        stageRank={stageRank}
        onRestart={() => {
          if (currentView === 'stage_playing') {
            if (stageManager) stageManager.leave();
            setStageManager(null);
            setRoomState(null);
            setCurrentView('dashboard');
          } else {
            handleRestartBoard();
          }
        }}
        onBackToMenu={() => {
          setIsGameOver(false);
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
    </div>
  );
}
