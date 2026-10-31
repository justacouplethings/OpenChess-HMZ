import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Chess } from 'chess.js';
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Upload,
  Trophy,
  AlertTriangle,
  Flame,
  Award,
  BookOpen,
  Info,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from 'lucide-react';
import { ChessBoard } from '../components/board/ChessBoard';
import { EvalBar } from '../components/board/EvalBar';
import { stockfishEngine } from '../services/stockfish/engine';
import { EvaluatedMove, ReviewReport, MoveClassificationType } from '../services/stockfish/evaluator';

const SAMPLE_GAMES = {
  kasparov: {
    title: 'Kasparov vs Topalov (1999) - Wijk aan Zee',
    subtitle: 'The Pearl of Wijk aan Zee featuring 24. Rxd4!!',
    pgn: `1. e4 d6 2. d4 Nf6 3. Nc3 g6 4. Be3 Bg7 5. Qd2 c6 6. f3 b5 7. Nge2 Nbd7 8. Bh6 Bxh6 9. Qxh6 Bb7 10. a3 e5 11. O-O-O Qe7 12. Kb1 a6 13. Nc1 O-O-O 14. Nb3 exd4 15. Rxd4 c5 16. Rd1 Nb6 17. g3 Kb8 18. Na5 Ba8 19. Bh3 d5 20. Qf4+ Ka7 21. Rhe1 d4 22. Nd5 Nbxd5 23. exd5 Qd6 24. Rxd4 cxd4 25. Re7+ Kb6 26. Qxd4+ Kxa5 27. b4+ Ka4 28. Qc3 Qxd5 29. Ra7 Bb7 30. Rxb7 Qc4 31. Qxf6 Kxa3 32. Qxa6+ Kxb4 33. c3+ Kxc3 34. Qa1+ Kd2 35. Qb2+ Kd1 36. Bf1 Rd2 37. Rd7 Rxd7 38. Bxc4 bxc4 39. Qxh8 Rd3 40. Qa8 c3 41. Qa4+ Ke1 42. f4 f5 43. Kc1 Rd2 44. Qa7 1-0`,
  },
  opera: {
    title: "Morphy's Opera Game (1858) - Paris",
    subtitle: 'Paul Morphy vs Duke of Brunswick & Count Isouard',
    pgn: `1. e4 e5 2. Nf3 d6 3. d4 Bg4 4. dxe5 Bxf3 5. Qxf3 dxe5 6. Bc4 Nf6 7. Qb3 Qe7 8. Nc3 c6 9. Bg5 b5 10. Nxb5 cxb5 11. Bxb5+ Nbd7 12. O-O-O Rd8 13. Rxd7 Rxd7 14. Rd1 Qe6 15. Bxd7+ Nxd7 16. Qb8+ Nxb8 17. Rd8# 1-0`,
  },
  fischer: {
    title: 'Game of the Century (1956) - New York',
    subtitle: 'Donald Byrne vs 13-year-old Bobby Fischer (17...Be6!!)',
    pgn: `1. Nf3 Nf6 2. c4 g6 3. Nc3 Bg7 4. d4 O-O 5. Bf4 d5 6. Qb3 dxc4 7. Qxc4 c6 8. e4 Nbd7 9. Rd1 Nb6 10. Qc5 Bg4 11. Bg5 Na4 12. Qa3 Nxc3 13. bxc3 Nxe4 14. Bxe7 Qb6 15. Bc4 Nxc3 16. Bc5 Rfe8+ 17. Kf1 Be6 18. Bxb6 Bxc4+ 19. Kg1 Ne2+ 20. Kf1 Nxd4+ 21. Kg1 Ne2+ 22. Kf1 Nc3+ 23. Kg1 axb6 24. Qb4 Ra4 25. Qxb6 Nxd1 26. h3 Rxa2 27. Kh2 Nxf2 28. Re1 Rxe1 29. Qd8+ Bf8 30. Nxe1 Bd5 31. Nf3 Ne4 32. Qb8 b5 33. h4 h5 34. Ne5 Kg7 35. Kg1 Bc5+ 36. Kf1 Ng3+ 37. Ke1 Bb4+ 38. Kd1 Bb3+ 39. Kc1 Ne2+ 40. Kb1 Nc3+ 41. Kc1 Rc2# 0-1`,
  },
};

const CLASSIFICATION_CONFIG: Record<
  MoveClassificationType,
  { label: string; symbol: string; color: string; bg: string; icon: React.FC<{ className?: string }> }
> = {
  brilliant: { label: 'Brilliant', symbol: '!!', color: 'text-cyan-400', bg: 'bg-cyan-500/20 border-cyan-500/40', icon: Sparkles },
  great: { label: 'Great', symbol: '!', color: 'text-blue-400', bg: 'bg-blue-500/20 border-blue-500/40', icon: Trophy },
  best: { label: 'Best', symbol: '★', color: 'text-emerald-400', bg: 'bg-emerald-500/20 border-emerald-500/40', icon: CheckCircle2 },
  excellent: { label: 'Excellent', symbol: '✓', color: 'text-green-400', bg: 'bg-green-500/20 border-green-500/40', icon: CheckCircle2 },
  good: { label: 'Good', symbol: '•', color: 'text-lime-400', bg: 'bg-lime-500/20 border-lime-500/40', icon: CheckCircle2 },
  book: { label: 'Book', symbol: '📖', color: 'text-amber-300', bg: 'bg-amber-500/20 border-amber-500/40', icon: BookOpen },
  inaccuracy: { label: 'Inaccuracy', symbol: '?!', color: 'text-yellow-400', bg: 'bg-yellow-500/20 border-yellow-500/40', icon: HelpCircle },
  mistake: { label: 'Mistake', symbol: '?', color: 'text-orange-400', bg: 'bg-orange-500/20 border-orange-500/40', icon: AlertTriangle },
  blunder: { label: 'Blunder', symbol: '??', color: 'text-red-400', bg: 'bg-red-500/20 border-red-500/40', icon: XCircle },
};

export const ReviewView: React.FC = () => {
  const [pgnInput, setPgnInput] = useState(SAMPLE_GAMES.opera.pgn);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [report, setReport] = useState<ReviewReport | null>(null);
  const [currentMoveIndex, setCurrentMoveIndex] = useState<number>(-1);
  const [boardFen, setBoardFen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');

  // Trigger analysis non-blockingly with progress
  const runReview = async (pgnToAnalyze: string) => {
    setIsAnalyzing(true);
    try {
      const result = await stockfishEngine.reviewGame(pgnToAnalyze);
      setReport(result);
      setCurrentMoveIndex(-1);
      setBoardFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');

      if (result.summary.brilliantCount > 0) {
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#1baca6', '#81b64c', '#f1c40f'],
          });
        } catch {}
      }
    } catch (e) {
      console.error('Review failed', e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    runReview(pgnInput);
  }, []);

  // Update board when navigating moves
  const goToMove = (index: number) => {
    if (!report || report.moves.length === 0) return;
    const clamped = Math.max(-1, Math.min(report.moves.length - 1, index));
    setCurrentMoveIndex(clamped);

    if (clamped === -1) {
      setBoardFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    } else {
      const move = report.moves[clamped];
      setBoardFen(move.fenAfter);

      if (move.classification === 'brilliant') {
        try {
          confetti({ particleCount: 40, spread: 50, origin: { y: 0.5 } });
        } catch {}
      }
    }
  };

  const jumpToNextClassification = (targetClass: 'blunder' | 'mistake' | 'brilliant') => {
    if (!report) return;
    const start = currentMoveIndex + 1;
    for (let i = start; i < report.moves.length; i++) {
      if (report.moves[i].classification === targetClass) {
        goToMove(i);
        return;
      }
    }
    // Loop back from start
    for (let i = 0; i < start; i++) {
      if (report.moves[i].classification === targetClass) {
        goToMove(i);
        return;
      }
    }
  };

  const currentMove = currentMoveIndex >= 0 && report ? report.moves[currentMoveIndex] : null;
  const currentCentipawns = currentMove ? currentMove.centipawnsAfter : 15;

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-3 select-none">
      {/* Top Banner */}
      <div className="bg-chess-sidebar border border-chess-border rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-chess-green/20 border border-chess-green/40 flex items-center justify-center">
            <Sparkles className="w-7 h-7 text-chess-green animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-white">Stockfish 16.1 Game Review</h1>
              <span className="bg-chess-green/20 text-chess-green text-xs font-bold px-2 py-0.5 rounded-full border border-chess-green/40">
                100% Free · No Paywall
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Depth 18 analysis with Chess.com CAPS2 Win Probability models: W = 50 + 50 × (2 / (1 + exp(-0.00368208 × cp)) - 1).
            </p>
          </div>
        </div>

        {/* Famous master games shortcuts */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-zinc-400 font-semibold mr-1">Sample Masterpieces:</span>
          {Object.entries(SAMPLE_GAMES).map(([key, game]) => (
            <button
              key={key}
              onClick={() => {
                setPgnInput(game.pgn);
                runReview(game.pgn);
              }}
              className="px-2.5 py-1 text-xs font-medium rounded-lg bg-zinc-800 hover:bg-chess-green hover:text-white transition-colors border border-zinc-700"
            >
              {game.title.split('-')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Main Review Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Interactive Board & Eval Bar (col-span-7) */}
        <div className="lg:col-span-7 flex flex-col items-center gap-3">
          <div className="flex items-stretch gap-3 w-full justify-center">
            {/* Live Eval Bar */}
            <EvalBar centipawns={currentCentipawns} orientation="w" height="auto" />

            {/* Board */}
            <div className="flex-1 max-w-[580px]">
              <ChessBoard
                fen={boardFen}
                interactive={false}
                lastMove={
                  currentMove ? { from: currentMove.from, to: currentMove.to } : null
                }
              />
            </div>
          </div>

          {/* Stepper Controls */}
          <div className="flex items-center justify-between w-full max-w-[620px] bg-chess-card border border-chess-border rounded-xl p-2.5 shadow-lg">
            <div className="flex items-center gap-2">
              <button
                onClick={() => goToMove(-1)}
                className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                title="Start of game"
              >
                <RotateCcw size={16} />
              </button>
              <button
                onClick={() => goToMove(currentMoveIndex - 1)}
                disabled={currentMoveIndex <= -1}
                className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 disabled:opacity-30 transition-colors"
                title="Previous move (Left Arrow)"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => goToMove(currentMoveIndex + 1)}
                disabled={!report || currentMoveIndex >= report.moves.length - 1}
                className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 disabled:opacity-30 transition-colors"
                title="Next move (Right Arrow)"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <span className="text-xs font-mono font-bold text-zinc-400">
              {currentMoveIndex === -1
                ? 'Starting Position'
                : `Move ${currentMove?.moveNumber}: ${currentMove?.color === 'w' ? 'White' : 'Black'} played ${currentMove?.san}`}
            </span>

            {/* Jump to Blunder / Mistake shortcuts */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => jumpToNextClassification('blunder')}
                className="px-2 py-1 text-xs font-bold rounded bg-red-950/60 text-red-400 border border-red-800/50 hover:bg-red-900/80 transition-colors"
                title="Jump to next Blunder"
              >
                Next ??
              </button>
              <button
                onClick={() => jumpToNextClassification('brilliant')}
                className="px-2 py-1 text-xs font-bold rounded bg-cyan-950/60 text-cyan-400 border border-cyan-800/50 hover:bg-cyan-900/80 transition-colors"
                title="Jump to next Brilliant move"
              >
                Next !!
              </button>
            </div>
          </div>
        </div>

        {/* Right: Coach Analysis, Accuracy & Move Classification (col-span-5) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Accuracy Card */}
          {report && (
            <div className="bg-chess-card border border-chess-border rounded-xl p-4 shadow-xl">
              <div className="flex items-center justify-between mb-3 border-b border-zinc-800 pb-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-zinc-400">
                  Game Accuracy
                </span>
                <span className="text-xs text-chess-green font-bold">CAPS2 Engine Model</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* White Accuracy */}
                <div className="bg-zinc-800/60 rounded-xl p-3 border border-zinc-700/60 flex flex-col items-center">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-white shadow-sm" />
                    <span className="text-xs font-bold text-zinc-300">White</span>
                  </div>
                  <span className="text-3xl font-black text-white font-mono">
                    {report.whiteAccuracy}%
                  </span>
                  <div className="w-full bg-zinc-700 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-chess-green h-full rounded-full transition-all duration-500"
                      style={{ width: `${report.whiteAccuracy}%` }}
                    />
                  </div>
                </div>

                {/* Black Accuracy */}
                <div className="bg-zinc-800/60 rounded-xl p-3 border border-zinc-700/60 flex flex-col items-center">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-zinc-900 border border-zinc-500" />
                    <span className="text-xs font-bold text-zinc-300">Black</span>
                  </div>
                  <span className="text-3xl font-black text-white font-mono">
                    {report.blackAccuracy}%
                  </span>
                  <div className="w-full bg-zinc-700 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-chess-green h-full rounded-full transition-all duration-500"
                      style={{ width: `${report.blackAccuracy}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Coach Commentary Box */}
          <div className="bg-chess-sidebar border border-chess-border rounded-xl p-4 shadow-xl relative overflow-hidden">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-chess-green to-emerald-400 p-0.5 flex-shrink-0 shadow-lg">
                <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-chess-green" />
                </div>
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-extrabold text-sm text-white">Stockfish Coach</span>
                  <span className="text-[10px] bg-chess-green text-zinc-950 font-black px-1.5 py-0.2 rounded uppercase">
                    PRO
                  </span>
                </div>

                {currentMove ? (
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span
                        className={`text-xs font-black uppercase px-2 py-0.5 rounded border ${
                          CLASSIFICATION_CONFIG[currentMove.classification].bg
                        } ${CLASSIFICATION_CONFIG[currentMove.classification].color}`}
                      >
                        {CLASSIFICATION_CONFIG[currentMove.classification].label}{' '}
                        {CLASSIFICATION_CONFIG[currentMove.classification].symbol}
                      </span>
                      <span className="text-xs font-mono text-zinc-400">
                        Loss: {currentMove.winProbLoss}% W%
                      </span>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      {currentMove.explanation}
                    </p>
                    {currentMove.bestMoveSan && currentMove.bestMoveSan !== currentMove.san && (
                      <p className="text-xs text-chess-green font-semibold mt-1">
                        Engine Best Move: {currentMove.bestMoveSan}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {report?.summary.coachVerdict || 'Loading engine assessment...'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Classification Counts Grid */}
          {report && (
            <div className="bg-chess-card border border-chess-border rounded-xl p-3 shadow-md">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-2 px-1">
                Move Breakdown
              </span>
              <div className="grid grid-cols-3 gap-2">
                {(['brilliant', 'great', 'best', 'inaccuracy', 'mistake', 'blunder'] as MoveClassificationType[]).map(
                  (cKey) => {
                    const cfg = CLASSIFICATION_CONFIG[cKey];
                    const wCount = report.counts.white[cKey];
                    const bCount = report.counts.black[cKey];

                    return (
                      <div
                        key={cKey}
                        className={`p-2 rounded-lg border flex flex-col justify-between ${cfg.bg}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-[11px] font-bold ${cfg.color}`}>
                            {cfg.label} {cfg.symbol}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs font-mono font-bold mt-1 text-zinc-200">
                          <span title="White">{wCount}</span>
                          <span className="text-zinc-600">/</span>
                          <span title="Black">{bCount}</span>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          )}

          {/* Move History Table */}
          {report && (
            <div className="bg-chess-card border border-chess-border rounded-xl p-3 shadow-md max-h-56 overflow-y-auto">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-2">
                Move List
              </span>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                {report.moves.map((m, idx) => {
                  const cfg = CLASSIFICATION_CONFIG[m.classification];
                  const isSelected = currentMoveIndex === idx;

                  return (
                    <button
                      key={idx}
                      onClick={() => goToMove(idx)}
                      className={`py-1.5 px-2 rounded flex items-center justify-between transition-colors text-left ${
                        isSelected
                          ? 'bg-chess-green/30 border border-chess-green text-white font-bold'
                          : 'bg-zinc-800/60 hover:bg-zinc-700/60 text-zinc-300'
                      }`}
                    >
                      <span>
                        {m.color === 'w' ? `${m.moveNumber}. ` : `${m.moveNumber}... `}
                        {m.san}
                      </span>
                      <span className={`text-[10px] font-black ${cfg.color}`}>
                        {cfg.symbol}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* PGN Loader toggle */}
          <details className="bg-chess-sidebar/60 border border-zinc-800 rounded-xl p-3 text-xs">
            <summary className="font-bold text-zinc-300 cursor-pointer flex items-center gap-1.5">
              <Upload size={14} className="text-chess-green" /> Import Custom PGN
            </summary>
            <div className="mt-2 space-y-2">
              <textarea
                value={pgnInput}
                onChange={(e) => setPgnInput(e.target.value)}
                rows={4}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-zinc-200 font-mono text-xs focus:ring-1 focus:ring-chess-green focus:outline-none"
                placeholder="Paste PGN here..."
              />
              <button
                onClick={() => runReview(pgnInput)}
                disabled={isAnalyzing}
                className="w-full py-2 rounded-lg bg-chess-green hover:bg-chess-green-hover text-white font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50"
              >
                {isAnalyzing ? 'Analyzing Game...' : 'Analyze PGN'}
              </button>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
};
