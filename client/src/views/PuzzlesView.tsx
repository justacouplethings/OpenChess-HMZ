import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Chess } from 'chess.js';
import { Puzzle, CheckCircle2, RotateCcw, Lightbulb, ChevronRight, Trophy } from 'lucide-react';
import { ChessBoard } from '../components/board/ChessBoard';
import { sound } from '../utils/audio';

interface PuzzleData {
  id: string;
  title: string;
  rating: number;
  theme: string;
  fen: string;
  playerColor: 'w' | 'b';
  solutionMoves: Array<{ from: string; to: string }>;
  explanation: string;
}

const PUZZLES: PuzzleData[] = [
  {
    id: 'puz-1',
    title: 'Smothered Mate Sequence',
    rating: 1650,
    theme: 'Mating Net',
    fen: '6k1/5ppp/8/8/8/8/1Q4PP/4q1K1 w - - 0 1', // Simple mate puzzle
    playerColor: 'b',
    solutionMoves: [{ from: 'e1', to: 'e8' }],
    explanation: 'Defend your back rank with e1e8 or mate in 1!',
  },
  {
    id: 'puz-2',
    title: 'Back-Rank Decapitation',
    rating: 1420,
    theme: 'Back Rank Mate',
    fen: '3r2k1/5ppp/8/8/8/8/4QPPP/6K1 b - - 0 1',
    playerColor: 'b',
    solutionMoves: [{ from: 'd8', to: 'd1' }],
    explanation: 'Rook penetrates the undefended 1st rank with checkmate!',
  },
  {
    id: 'puz-3',
    title: 'Anastasia Mate Pattern',
    rating: 1820,
    theme: 'Tactics & Mate',
    fen: '5rk1/1p3ppp/8/8/4N3/8/5PPP/R5K1 w - - 0 1',
    playerColor: 'w',
    solutionMoves: [{ from: 'a1', to: 'a8' }],
    explanation: 'Pin and back-rank dominance leads to an unstoppable attack.',
  },
];

export const PuzzlesView: React.FC = () => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userRating, setUserRating] = useState(1500);
  const [status, setStatus] = useState<'playing' | 'solved' | 'failed'>('playing');
  const [hintUsed, setHintUsed] = useState(false);

  const currentPuzzle = PUZZLES[currentIdx];
  const [fen, setFen] = useState(currentPuzzle.fen);

  const handlePuzzleMove = (from: string, to: string) => {
    if (status === 'solved') return;

    const expected = currentPuzzle.solutionMoves[0];
    if (expected.from === from && expected.to === to) {
      // Correct!
      const nextChess = new Chess(fen);
      nextChess.move({ from, to });
      setFen(nextChess.fen());
      setStatus('solved');
      setUserRating((r) => r + 15);
      sound.playGameOver();
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
    } else {
      // Wrong
      setStatus('failed');
      setUserRating((r) => Math.max(100, r - 8));
      sound.playCheck();
    }
  };

  const nextPuzzle = () => {
    const nextI = (currentIdx + 1) % PUZZLES.length;
    setCurrentIdx(nextI);
    setFen(PUZZLES[nextI].fen);
    setStatus('playing');
    setHintUsed(false);
  };

  const restartPuzzle = () => {
    setFen(currentPuzzle.fen);
    setStatus('playing');
    setHintUsed(false);
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto p-3 select-none">
      {/* Puzzles Header */}
      <div className="bg-chess-sidebar border border-chess-border rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
            <Puzzle className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white">Daily Tactics Trainer</h1>
            <p className="text-xs text-zinc-400">
              Find the best tactical sequence to solve each puzzle.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-zinc-800/80 px-3.5 py-1.5 rounded-lg border border-zinc-700 flex items-center gap-2">
            <Trophy size={16} className="text-amber-400" />
            <div>
              <span className="text-[10px] text-zinc-400 font-bold block leading-none">
                Puzzle Rating
              </span>
              <span className="text-sm font-black text-white font-mono">{userRating}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Board */}
        <div className="md:col-span-8 flex justify-center">
          <div className="w-full max-w-[560px]">
            <ChessBoard
              fen={fen}
              onMove={handlePuzzleMove}
              orientation={currentPuzzle.playerColor}
              interactive={status !== 'solved'}
            />
          </div>
        </div>

        {/* Puzzle Card Info */}
        <div className="md:col-span-4 flex flex-col gap-4">
          <div className="bg-chess-card border border-chess-border rounded-xl p-4 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                Puzzle #{currentIdx + 1}
              </span>
              <span className="text-xs bg-zinc-800 text-zinc-300 font-mono px-2 py-0.5 rounded font-bold">
                Rating {currentPuzzle.rating}
              </span>
            </div>

            <h3 className="text-lg font-black text-white mb-1">{currentPuzzle.title}</h3>
            <span className="text-xs text-zinc-400 block mb-4">Theme: {currentPuzzle.theme}</span>

            {/* Status indicator */}
            {status === 'solved' && (
              <div className="bg-emerald-950/60 border border-emerald-500/50 rounded-xl p-3 text-emerald-400 flex items-start gap-2.5 mb-4">
                <CheckCircle2 size={20} className="flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-extrabold text-sm block">Puzzle Solved! (+15)</span>
                  <p className="text-xs text-emerald-300/90 mt-0.5">{currentPuzzle.explanation}</p>
                </div>
              </div>
            )}

            {status === 'failed' && (
              <div className="bg-red-950/60 border border-red-500/50 rounded-xl p-3 text-red-400 mb-4">
                <span className="font-extrabold text-sm block">Incorrect Move (-8)</span>
                <p className="text-xs text-red-300/90 mt-0.5">That is not the winning sequence. Try again!</p>
              </div>
            )}

            {hintUsed && (
              <div className="bg-amber-950/60 border border-amber-500/40 rounded-xl p-3 text-amber-300 text-xs mb-4">
                Hint: Look for piece moving from{' '}
                <span className="font-mono font-bold text-white">
                  {currentPuzzle.solutionMoves[0].from}
                </span>
                !
              </div>
            )}

            {/* Controls */}
            <div className="space-y-2">
              {status === 'solved' ? (
                <button
                  onClick={nextPuzzle}
                  className="w-full py-3 rounded-lg bg-chess-green hover:bg-chess-green-hover text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg transition-transform hover:scale-102"
                >
                  Next Puzzle <ChevronRight size={16} />
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => setHintUsed(true)}
                    className="flex-1 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-400 font-bold text-xs flex items-center justify-center gap-1.5 border border-zinc-700 transition-colors"
                  >
                    <Lightbulb size={16} /> Hint
                  </button>
                  <button
                    onClick={restartPuzzle}
                    className="flex-1 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs flex items-center justify-center gap-1.5 border border-zinc-700 transition-colors"
                  >
                    <RotateCcw size={16} /> Retry
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
