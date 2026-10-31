import React, { useState, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { useNavigate } from 'react-router-dom';
import {
  Swords,
  Bot,
  RotateCcw,
  Flag,
  Handshake,
  Sparkles,
  Zap,
  Clock,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { ChessBoard } from '../components/board/ChessBoard';
import { CrazyhouseBoard, PiecePocketMap } from '../components/board/CrazyhouseBoard';
import { EvalBar } from '../components/board/EvalBar';
import { sound } from '../utils/audio';
import { stockfishEngine } from '../services/stockfish/engine';

type PlayMode = 'engine' | 'online' | 'pass';
type Variant = 'standard' | 'crazyhouse';

export const PlayView: React.FC = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<PlayMode>('engine');
  const [variant, setVariant] = useState<Variant>('standard');
  const [engineLevel, setEngineLevel] = useState<number>(5);

  const [fen, setFen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const [chessInstance, setChessInstance] = useState<Chess>(() => new Chess());
  const [orientation, setOrientation] = useState<'w' | 'b'>('w');
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);

  // Clocks in seconds
  const [baseTimeSeconds, setBaseTimeSeconds] = useState(180);
  const [whiteTime, setWhiteTime] = useState(180);
  const [blackTime, setBlackTime] = useState(180);
  const [isClockRunning, setIsClockRunning] = useState(false);
  const [gameOver, setGameOver] = useState<string | null>(null);

  // Crazyhouse pockets
  const [whitePocket, setWhitePocket] = useState<PiecePocketMap>({ p: 0, n: 0, b: 0, r: 0, q: 0 });
  const [blackPocket, setBlackPocket] = useState<PiecePocketMap>({ p: 0, n: 0, b: 0, r: 0, q: 0 });

  const [movesHistory, setMovesHistory] = useState<string[]>([]);
  const [evalCp, setEvalCp] = useState<number>(15);

  // Clock countdown timer
  useEffect(() => {
    if (!isClockRunning || gameOver) return;

    const timer = setInterval(() => {
      const turn = chessInstance.turn();
      if (turn === 'w') {
        setWhiteTime((t) => {
          if (t <= 1) {
            setGameOver('Black wins on time!');
            setIsClockRunning(false);
            sound.playGameOver();
            return 0;
          }
          return t - 1;
        });
      } else {
        setBlackTime((t) => {
          if (t <= 1) {
            setGameOver('White wins on time!');
            setIsClockRunning(false);
            sound.playGameOver();
            return 0;
          }
          return t - 1;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isClockRunning, gameOver, chessInstance]);

  const resetGame = () => {
    const c = new Chess();
    setChessInstance(c);
    setFen(c.fen());
    setWhiteTime(baseTimeSeconds);
    setBlackTime(baseTimeSeconds);
    setIsClockRunning(false);
    setGameOver(null);
    setLastMove(null);
    setMovesHistory([]);
    setWhitePocket({ p: 0, n: 0, b: 0, r: 0, q: 0 });
    setBlackPocket({ p: 0, n: 0, b: 0, r: 0, q: 0 });
    setEvalCp(15);
    sound.playGameStart();
  };

  const handlePlayerMove = (from: string, to: string, promotion?: string, san?: string) => {
    if (gameOver) return;

    const nextChess = new Chess(chessInstance.fen());
    try {
      const result = nextChess.move({ from, to, promotion: promotion || 'q' });
      if (result) {
        setChessInstance(nextChess);
        setFen(nextChess.fen());
        setLastMove({ from, to });
        setMovesHistory((prev) => [...prev, san || result.san]);
        setIsClockRunning(true);

        // Update live evaluation
        const evalRes = stockfishEngine.evaluatePosition(nextChess.fen());
        setEvalCp(evalRes.cp);

        // Check game end conditions
        if (nextChess.isCheckmate()) {
          const winner = nextChess.turn() === 'w' ? 'Black' : 'White';
          setGameOver(`Checkmate! ${winner} wins!`);
          setIsClockRunning(false);
          sound.playGameOver();
          return;
        }
        if (nextChess.isDraw()) {
          setGameOver('Game drawn!');
          setIsClockRunning(false);
          sound.playGameOver();
          return;
        }

        // If playing against engine, trigger bot move after delay
        if (mode === 'engine' && nextChess.turn() === 'b') {
          setTimeout(() => {
            makeEngineMove(nextChess);
          }, 350 + Math.random() * 300);
        }
      }
    } catch (err) {
      console.error('Invalid move', err);
    }
  };

  const makeEngineMove = (chess: Chess) => {
    if (chess.isGameOver()) return;

    const legal = chess.moves({ verbose: true });
    if (legal.length === 0) return;

    // Pick move based on engine level
    let chosenMove = legal[0];
    if (engineLevel > 1) {
      // Choose best tactical/positional move
      const evalResult = stockfishEngine.evaluatePosition(chess.fen());
      const match = legal.find((m) => m.san === evalResult.bestMoveSan);
      if (match && Math.random() < engineLevel / 10) {
        chosenMove = match;
      } else {
        chosenMove = legal[Math.floor(Math.random() * legal.length)];
      }
    }

    try {
      const result = chess.move(chosenMove);
      if (result) {
        if (result.captured) sound.playCapture();
        else sound.playMove();

        setChessInstance(new Chess(chess.fen()));
        setFen(chess.fen());
        setLastMove({ from: result.from, to: result.to });
        setMovesHistory((prev) => [...prev, result.san]);

        const nextEval = stockfishEngine.evaluatePosition(chess.fen());
        setEvalCp(nextEval.cp);

        if (chess.isCheckmate()) {
          setGameOver('Checkmate! Black wins!');
          setIsClockRunning(false);
          sound.playGameOver();
        } else if (chess.isDraw()) {
          setGameOver('Draw!');
          setIsClockRunning(false);
          sound.playGameOver();
        }
      }
    } catch {
      // error
    }
  };

  const handleCrazyhouseCapture = (from: string, to: string, captured?: string) => {
    if (captured) {
      const p = captured.toLowerCase() as keyof PiecePocketMap;
      if (chessInstance.turn() === 'w') {
        setWhitePocket((prev) => ({ ...prev, [p]: prev[p] + 1 }));
      } else {
        setBlackPocket((prev) => ({ ...prev, [p]: prev[p] + 1 }));
      }
    }
    handlePlayerMove(from, to);
  };

  const handleCrazyhouseDrop = (piece: string, square: string) => {
    // Drop piece into board square
    const p = piece.toLowerCase() as keyof PiecePocketMap;
    const turn = chessInstance.turn();

    if (turn === 'w') {
      if (whitePocket[p] <= 0) return;
      setWhitePocket((prev) => ({ ...prev, [p]: prev[p] - 1 }));
    } else {
      if (blackPocket[p] <= 0) return;
      setBlackPocket((prev) => ({ ...prev, [p]: prev[p] - 1 }));
    }

    // Place piece on board via custom FEN update
    const c = new Chess(fen);
    c.put({ type: p as any, color: turn }, square as any);
    // Switch turn
    const fenParts = c.fen().split(' ');
    fenParts[1] = turn === 'w' ? 'b' : 'w';
    const nextFen = fenParts.join(' ');

    setFen(nextFen);
    setChessInstance(new Chess(nextFen));
    setMovesHistory((prev) => [...prev, `${p.toUpperCase()}@${square}`]);
  };

  const formatClock = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="flex flex-col gap-5 w-full max-w-7xl mx-auto p-2 select-none">
      {/* Top Header Mode / Variant Switcher */}
      <div className="bg-chess-sidebar border border-chess-border rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setMode('engine');
              resetGame();
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              mode === 'engine'
                ? 'bg-chess-green text-white shadow'
                : 'bg-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            <Bot size={16} /> vs Computer
          </button>
          <button
            onClick={() => {
              setMode('pass');
              resetGame();
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              mode === 'pass'
                ? 'bg-chess-green text-white shadow'
                : 'bg-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            <Swords size={16} /> Pass & Play
          </button>
        </div>

        {/* Variant selection */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-400 font-semibold">Variant:</span>
          <select
            value={variant}
            onChange={(e) => {
              setVariant(e.target.value as Variant);
              resetGame();
            }}
            className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-bold rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-chess-green"
          >
            <option value="standard">Standard Chess</option>
            <option value="crazyhouse">Crazyhouse (Piece Pockets)</option>
          </select>
        </div>

        {/* Time Control */}
        <div className="flex items-center gap-2">
          <Clock size={15} className="text-zinc-400" />
          <select
            value={baseTimeSeconds}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              setBaseTimeSeconds(val);
              setWhiteTime(val);
              setBlackTime(val);
            }}
            className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-bold rounded-lg px-2.5 py-1.5 focus:outline-none"
          >
            <option value={60}>1 min · Bullet</option>
            <option value={180}>3 min · Blitz</option>
            <option value={300}>5 min · Blitz</option>
            <option value={600}>10 min · Rapid</option>
          </select>
        </div>
      </div>

      {/* Main Game Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Board column (col-span-8) */}
        <div className="lg:col-span-8 flex flex-col items-center gap-2">
          {/* Opponent Player Bar */}
          <div className="w-full max-w-[620px] bg-chess-card border border-chess-border rounded-xl px-4 py-2.5 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center font-bold text-zinc-300">
                {mode === 'engine' ? <Bot size={20} className="text-chess-green" /> : 'B'}
              </div>
              <div>
                <span className="text-sm font-bold text-white block leading-none">
                  {mode === 'engine' ? `Stockfish Lv.${engineLevel}` : 'Opponent'}
                </span>
                <span className="text-[11px] text-zinc-400 font-medium">
                  {mode === 'engine' ? 'Engine · 1500' : 'Player · 1500'}
                </span>
              </div>
            </div>

            <div
              className={`px-3 py-1.5 rounded-lg font-mono font-black text-sm tracking-wide ${
                chessInstance.turn() === 'b' && isClockRunning
                  ? 'bg-zinc-200 text-zinc-950 ring-2 ring-chess-green'
                  : 'bg-zinc-800 text-zinc-300'
              }`}
            >
              {formatClock(blackTime)}
            </div>
          </div>

          {/* Board with Eval Bar */}
          <div className="flex items-stretch gap-3 w-full justify-center my-1">
            <EvalBar centipawns={evalCp} orientation={orientation} height="auto" />

            <div className="flex-1 max-w-[580px] flex justify-center">
              {variant === 'crazyhouse' ? (
                <CrazyhouseBoard
                  fen={fen}
                  whitePocket={whitePocket}
                  blackPocket={blackPocket}
                  onMove={handleCrazyhouseCapture}
                  onDropPiece={handleCrazyhouseDrop}
                  orientation={orientation}
                  turn={chessInstance.turn()}
                />
              ) : (
                <ChessBoard
                  fen={fen}
                  onMove={handlePlayerMove}
                  orientation={orientation}
                  lastMove={lastMove}
                  interactive={!gameOver}
                />
              )}
            </div>
          </div>

          {/* User Player Bar */}
          <div className="w-full max-w-[620px] bg-chess-card border border-chess-border rounded-xl px-4 py-2.5 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-chess-green/20 border border-chess-green/40 flex items-center justify-center font-bold text-chess-green">
                kyn
              </div>
              <div>
                <span className="text-sm font-bold text-white block leading-none">kyn</span>
                <span className="text-[11px] text-zinc-400 font-medium">Player · 1850</span>
              </div>
            </div>

            <div
              className={`px-3 py-1.5 rounded-lg font-mono font-black text-sm tracking-wide ${
                chessInstance.turn() === 'w' && isClockRunning
                  ? 'bg-zinc-200 text-zinc-950 ring-2 ring-chess-green'
                  : 'bg-zinc-800 text-zinc-300'
              }`}
            >
              {formatClock(whiteTime)}
            </div>
          </div>
        </div>

        {/* Sidebar Panel (col-span-4) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Game Over Banner & Review Trigger */}
          {gameOver && (
            <div className="bg-chess-card border-2 border-chess-green rounded-xl p-4 shadow-2xl flex flex-col items-center text-center">
              <span className="text-lg font-extrabold text-white mb-1">{gameOver}</span>
              <p className="text-xs text-zinc-400 mb-4">
                The game has concluded. Review every move for free with Stockfish 16.1.
              </p>
              <button
                onClick={() => navigate('/review')}
                className="w-full py-3 rounded-lg bg-chess-green hover:bg-chess-green-hover text-white font-extrabold text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-transform hover:scale-102"
              >
                <Sparkles size={18} /> Game Review (100% Free)
              </button>
            </div>
          )}

          {/* Move History */}
          <div className="bg-chess-card border border-chess-border rounded-xl p-4 shadow-md flex flex-col h-72">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
              Moves
            </span>
            <div className="flex-1 overflow-y-auto space-y-1 font-mono text-xs pr-1">
              {movesHistory.length === 0 ? (
                <div className="h-full flex items-center justify-center text-zinc-500">
                  No moves played yet.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                  {movesHistory.map((m, idx) => (
                    <div
                      key={idx}
                      className="py-1 px-2 rounded bg-zinc-800/50 flex items-center justify-between text-zinc-300"
                    >
                      <span className="text-zinc-500 font-medium">
                        {idx % 2 === 0 ? `${idx / 2 + 1}.` : ''}
                      </span>
                      <span className="font-bold">{m}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Game Actions */}
          <div className="bg-chess-card border border-chess-border rounded-xl p-3 shadow-md grid grid-cols-3 gap-2">
            <button
              onClick={() => setOrientation((o) => (o === 'w' ? 'b' : 'w'))}
              className="py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold flex flex-col items-center gap-1 transition-colors"
            >
              <RotateCcw size={16} /> Flip
            </button>
            <button
              onClick={() => {
                setGameOver('Draw agreed!');
                setIsClockRunning(false);
              }}
              disabled={!!gameOver}
              className="py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold flex flex-col items-center gap-1 transition-colors disabled:opacity-40"
            >
              <Handshake size={16} /> Draw
            </button>
            <button
              onClick={() => {
                setGameOver('Resigned. Game Over!');
                setIsClockRunning(false);
              }}
              disabled={!!gameOver}
              className="py-2 rounded-lg bg-zinc-800 hover:bg-red-900/60 text-red-400 text-xs font-bold flex flex-col items-center gap-1 transition-colors disabled:opacity-40"
            >
              <Flag size={16} /> Resign
            </button>
          </div>

          <button
            onClick={resetGame}
            className="w-full py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow"
          >
            New Game
          </button>
        </div>
      </div>
    </div>
  );
};
