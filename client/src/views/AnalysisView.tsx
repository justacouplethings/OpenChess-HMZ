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
  CheckCircle2,
  XCircle,
  HelpCircle,
  Search,
  Zap,
  SlidersHorizontal,
} from 'lucide-react';
import { ChessBoard } from '../components/board/ChessBoard';
import { EvalBar } from '../components/board/EvalBar';
import { stockfishEngine, EngineEvalResult } from '../services/stockfish/engine';
import { EvaluatedMove, ReviewReport, MoveClassificationType } from '../services/stockfish/evaluator';

const SAMPLE_GAMES = {
  opera: {
    title: "Morphy's Opera Game (1858)",
    pgn: `1. e4 e5 2. Nf3 d6 3. d4 Bg4 4. dxe5 Bxf3 5. Qxf3 dxe5 6. Bc4 Nf6 7. Qb3 Qe7 8. Nc3 c6 9. Bg5 b5 10. Nxb5 cxb5 11. Bxb5+ Nbd7 12. O-O-O Rd8 13. Rxd7 Rxd7 14. Rd1 Qe6 15. Bxd7+ Nxd7 16. Qb8+ Nxb8 17. Rd8# 1-0`,
  },
  kasparov: {
    title: 'Kasparov vs Topalov (1999)',
    pgn: `1. e4 d6 2. d4 Nf6 3. Nc3 g6 4. Be3 Bg7 5. Qd2 c6 6. f3 b5 7. Nge2 Nbd7 8. Bh6 Bxh6 9. Qxh6 Bb7 10. a3 e5 11. O-O-O Qe7 12. Kb1 a6 13. Nc1 O-O-O 14. Nb3 exd4 15. Rxd4 c5 16. Rd1 Nb6 17. g3 Kb8 18. Na5 Ba8 19. Bh3 d5 20. Qf4+ Ka7 21. Rhe1 d4 22. Nd5 Nbxd5 23. exd5 Qd6 24. Rxd4 cxd4 25. Re7+ Kb6 26. Qxd4+ Kxa5 27. b4+ Ka4 28. Qc3 Qxd5 29. Ra7 Bb7 30. Rxb7 Qc4 31. Qxf6 Kxa3 32. Qxa6+ Kxb4 33. c3+ Kxc3 34. Qa1+ Kd2 35. Qb2+ Kd1 36. Bf1 Rd2 37. Rd7 Rxd7 38. Bxc4 bxc4 39. Qxh8 Rd3 40. Qa8 c3 41. Qa4+ Ke1 42. f4 f5 43. Kc1 Rd2 44. Qa7 1-0`,
  },
};

const CLASSIFICATION_CONFIG: Record<
  MoveClassificationType,
  { label: string; symbol: string; color: string; bg: string }
> = {
  brilliant: { label: 'Brilliant', symbol: '!!', color: 'text-[#1baca6]', bg: 'bg-[#1baca6]/15 border-[#1baca6]/40' },
  great: { label: 'Great', symbol: '!', color: 'text-[#5c8bb0]', bg: 'bg-[#5c8bb0]/15 border-[#5c8bb0]/40' },
  best: { label: 'Best', symbol: '★', color: 'text-[#95b945]', bg: 'bg-[#95b945]/15 border-[#95b945]/40' },
  excellent: { label: 'Excellent', symbol: '✓', color: 'text-[#95b945]', bg: 'bg-[#95b945]/15 border-[#95b945]/40' },
  good: { label: 'Good', symbol: '•', color: 'text-[#96bc4b]', bg: 'bg-[#96bc4b]/15 border-[#96bc4b]/40' },
  book: { label: 'Book', symbol: '📖', color: 'text-[#d5a47d]', bg: 'bg-[#d5a47d]/15 border-[#d5a47d]/40' },
  inaccuracy: { label: 'Inaccuracy', symbol: '?!', color: 'text-[#f7c631]', bg: 'bg-[#f7c631]/15 border-[#f7c631]/40' },
  mistake: { label: 'Mistake', symbol: '?', color: 'text-[#e6912c]', bg: 'bg-[#e6912c]/15 border-[#e6912c]/40' },
  blunder: { label: 'Blunder', symbol: '??', color: 'text-[#ca3431]', bg: 'bg-[#ca3431]/15 border-[#ca3431]/40' },
};

export const AnalysisView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'analysis' | 'review'>('analysis');

  // Interactive Analysis Board State
  const [chessInstance, setChessInstance] = useState<Chess>(() => new Chess());
  const [fen, setFen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const [orientation, setOrientation] = useState<'w' | 'b'>('w');
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [evalResult, setEvalResult] = useState<EngineEvalResult>({
    cp: 15,
    bestMoveSan: 'e4',
    depth: 18,
    topLines: [
      { move: 'e4', evalCp: 25 },
      { move: 'd4', evalCp: 20 },
      { move: 'Nf3', evalCp: 15 },
    ],
  });

  // History for interactive step-through
  const [historyFens, setHistoryFens] = useState<string[]>([
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  ]);
  const [historyMoves, setHistoryMoves] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState<number>(0);

  // Review Report State
  const [pgnText, setPgnText] = useState(SAMPLE_GAMES.opera.pgn);
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewProgress, setReviewProgress] = useState(0);
  const [report, setReport] = useState<ReviewReport | null>(null);
  const [reviewMoveIdx, setReviewMoveIdx] = useState<number>(-1);

  // Update evaluation whenever FEN changes in Analysis mode
  useEffect(() => {
    const res = stockfishEngine.evaluatePosition(fen);
    setEvalResult(res);
  }, [fen]);

  // Handle board move in Analysis mode
  const handleAnalysisMove = (from: string, to: string, promotion?: string, san?: string) => {
    const c = new Chess(fen);
    try {
      const res = c.move({ from, to, promotion: promotion || 'q' });
      if (res) {
        const nextFen = c.fen();
        setFen(nextFen);
        setChessInstance(c);
        setLastMove({ from, to });

        // Update history
        const updatedFens = [...historyFens.slice(0, currentStep + 1), nextFen];
        const updatedMoves = [...historyMoves.slice(0, currentStep), san || res.san];
        setHistoryFens(updatedFens);
        setHistoryMoves(updatedMoves);
        setCurrentStep(updatedFens.length - 1);
      }
    } catch {
      // Invalid
    }
  };

  const jumpToHistoryStep = (step: number) => {
    if (step < 0 || step >= historyFens.length) return;
    setCurrentStep(step);
    setFen(historyFens[step]);
    setChessInstance(new Chess(historyFens[step]));
  };

  const resetAnalysisBoard = () => {
    const initialFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    setFen(initialFen);
    setChessInstance(new Chess(initialFen));
    setHistoryFens([initialFen]);
    setHistoryMoves([]);
    setCurrentStep(0);
    setLastMove(null);
  };

  // Run Game Review non-blockingly
  const handleStartReview = async (pgn: string) => {
    setIsReviewing(true);
    setReviewProgress(0);
    setActiveTab('review');

    try {
      const res = await stockfishEngine.reviewGame(pgn, (percent) => {
        setReviewProgress(percent);
      });
      setReport(res);
      setReviewMoveIdx(-1);

      if (res.summary.brilliantCount > 0) {
        try {
          confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
        } catch {}
      }
    } catch (err) {
      console.error('Analysis error', err);
    } finally {
      setIsReviewing(false);
    }
  };

  const currentReviewMove = reviewMoveIdx >= 0 && report ? report.moves[reviewMoveIdx] : null;

  return (
    <div className="flex flex-col gap-4 w-full max-w-7xl mx-auto p-2 select-none">
      {/* Top Header Mode Toggle */}
      <div className="bg-[#262421] border border-[#3d3b38] rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#81b64c]/20 border border-[#81b64c]/40 flex items-center justify-center">
            <Search className="w-5 h-5 text-[#81b64c]" />
          </div>
          <div>
            <h1 className="text-lg font-black text-white flex items-center gap-2">
              Stockfish 16.1 Analysis & Review
              <span className="text-[10px] bg-[#81b64c] text-zinc-950 font-black px-2 py-0.5 rounded-full uppercase">
                Free Unlimited
              </span>
            </h1>
            <p className="text-xs text-[#9e9c98]">
              Depth 18 engine evaluation with CAPS accuracy scoring and brilliant move detection.
            </p>
          </div>
        </div>

        {/* Tab switcher: Analysis vs Game Review */}
        <div className="flex bg-[#21201d] p-1 rounded-lg border border-[#3d3b38]">
          <button
            onClick={() => setActiveTab('analysis')}
            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'analysis'
                ? 'bg-[#81b64c] text-white shadow'
                : 'text-[#9e9c98] hover:text-white'
            }`}
          >
            <SlidersHorizontal size={14} /> Analysis Board
          </button>
          <button
            onClick={() => {
              setActiveTab('review');
              if (!report && !isReviewing) {
                handleStartReview(pgnText);
              }
            }}
            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'review'
                ? 'bg-[#81b64c] text-white shadow'
                : 'text-[#9e9c98] hover:text-white'
            }`}
          >
            <Sparkles size={14} /> Game Review
          </button>
        </div>
      </div>

      {/* Main Grid: Board + Eval Bar on Left, Panel on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: Board & Eval Bar (col-span-8) */}
        <div className="lg:col-span-8 flex flex-col items-center gap-3">
          <div className="flex items-stretch gap-3 w-full justify-center">
            {/* Live Evaluation Bar */}
            <EvalBar
              centipawns={
                activeTab === 'review' && currentReviewMove
                  ? currentReviewMove.centipawnsAfter
                  : evalResult.cp
              }
              orientation={orientation}
              height="auto"
            />

            {/* Chessboard */}
            <div className="flex-1 max-w-[600px] flex justify-center">
              <ChessBoard
                fen={
                  activeTab === 'review' && currentReviewMove
                    ? currentReviewMove.fenAfter
                    : fen
                }
                onMove={activeTab === 'analysis' ? handleAnalysisMove : undefined}
                orientation={orientation}
                lastMove={
                  activeTab === 'review' && currentReviewMove
                    ? { from: currentReviewMove.from, to: currentReviewMove.to }
                    : lastMove
                }
                interactive={activeTab === 'analysis'}
              />
            </div>
          </div>

          {/* Stepper & Navigation Buttons */}
          <div className="flex items-center justify-between w-full max-w-[640px] bg-[#262421] border border-[#3d3b38] rounded-xl p-2 shadow-lg">
            {activeTab === 'analysis' ? (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => jumpToHistoryStep(0)}
                    disabled={currentStep === 0}
                    className="p-2 rounded-lg bg-[#302e2b] hover:bg-[#3d3b38] text-zinc-300 disabled:opacity-30 transition-colors"
                    title="First move"
                  >
                    |&lt;&lt;
                  </button>
                  <button
                    onClick={() => jumpToHistoryStep(currentStep - 1)}
                    disabled={currentStep === 0}
                    className="p-2 rounded-lg bg-[#302e2b] hover:bg-[#3d3b38] text-zinc-300 disabled:opacity-30 transition-colors"
                    title="Previous move"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={() => jumpToHistoryStep(currentStep + 1)}
                    disabled={currentStep >= historyFens.length - 1}
                    className="p-2 rounded-lg bg-[#302e2b] hover:bg-[#3d3b38] text-zinc-300 disabled:opacity-30 transition-colors"
                    title="Next move"
                  >
                    <ChevronRight size={18} />
                  </button>
                  <button
                    onClick={() => jumpToHistoryStep(historyFens.length - 1)}
                    disabled={currentStep >= historyFens.length - 1}
                    className="p-2 rounded-lg bg-[#302e2b] hover:bg-[#3d3b38] text-zinc-300 disabled:opacity-30 transition-colors"
                    title="Last move"
                  >
                    &gt;&gt;|
                  </button>
                </div>

                <span className="text-xs font-mono font-bold text-zinc-400">
                  {currentStep === 0 ? 'Starting Position' : `Move ${currentStep}`}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setOrientation((o) => (o === 'w' ? 'b' : 'w'))}
                    className="px-2.5 py-1.5 rounded-lg bg-[#302e2b] hover:bg-[#3d3b38] text-zinc-300 text-xs font-bold transition-colors flex items-center gap-1"
                  >
                    <RotateCcw size={14} /> Flip
                  </button>
                  <button
                    onClick={resetAnalysisBoard}
                    className="px-2.5 py-1.5 rounded-lg bg-[#302e2b] hover:bg-[#3d3b38] text-zinc-300 text-xs font-bold transition-colors"
                  >
                    Reset
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setReviewMoveIdx(-1)}
                    className="p-2 rounded-lg bg-[#302e2b] hover:bg-[#3d3b38] text-zinc-300"
                    title="Start"
                  >
                    <RotateCcw size={16} />
                  </button>
                  <button
                    onClick={() => setReviewMoveIdx((i) => Math.max(-1, i - 1))}
                    disabled={reviewMoveIdx <= -1}
                    className="p-2 rounded-lg bg-[#302e2b] hover:bg-[#3d3b38] text-zinc-300 disabled:opacity-30"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={() =>
                      setReviewMoveIdx((i) =>
                        report ? Math.min(report.moves.length - 1, i + 1) : i
                      )
                    }
                    disabled={!report || reviewMoveIdx >= report.moves.length - 1}
                    className="p-2 rounded-lg bg-[#302e2b] hover:bg-[#3d3b38] text-zinc-300 disabled:opacity-30"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>

                <span className="text-xs font-mono font-bold text-zinc-300">
                  {currentReviewMove
                    ? `${currentReviewMove.color === 'w' ? 'White' : 'Black'}: ${
                        currentReviewMove.san
                      }`
                    : 'Game Start'}
                </span>

                <button
                  onClick={() => setOrientation((o) => (o === 'w' ? 'b' : 'w'))}
                  className="px-2.5 py-1.5 rounded-lg bg-[#302e2b] hover:bg-[#3d3b38] text-zinc-300 text-xs font-bold"
                >
                  Flip
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel (col-span-4) */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          {activeTab === 'analysis' ? (
            /* Analysis Panel */
            <div className="space-y-3">
              {/* Engine Stats Card */}
              <div className="bg-[#262421] border border-[#3d3b38] rounded-xl p-3.5 shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#81b64c] animate-pulse" />
                    <span className="text-xs font-black text-white uppercase tracking-wider">
                      Stockfish 16.1
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#81b64c] bg-[#21201d] px-2 py-0.5 rounded border border-[#3d3b38]">
                    Depth {evalResult.depth}
                  </span>
                </div>

                <div className="bg-[#21201d] rounded-lg p-2.5 border border-[#3d3b38] space-y-1.5">
                  <span className="text-[11px] font-bold text-[#9e9c98] uppercase block">
                    Top Engine Lines
                  </span>
                  {evalResult.topLines && evalResult.topLines.length > 0 ? (
                    evalResult.topLines.map((line, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs py-1 px-2 rounded bg-[#262421]"
                      >
                        <span className="font-bold text-white font-mono">
                          {idx + 1}. {line.move}
                        </span>
                        <span
                          className={`font-mono font-black ${
                            line.evalCp >= 0 ? 'text-[#81b64c]' : 'text-zinc-400'
                          }`}
                        >
                          {line.evalCp > 0 ? `+${(line.evalCp / 100).toFixed(1)}` : (line.evalCp / 100).toFixed(1)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-zinc-500">Calculating lines...</span>
                  )}
                </div>
              </div>

              {/* Big Green Game Review Action Button */}
              <button
                onClick={() => handleStartReview(pgnText)}
                disabled={isReviewing}
                className="w-full py-3.5 rounded-xl bg-[#81b64c] hover:bg-[#a3d160] active:bg-[#6f9c3f] text-white font-black text-sm uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-transform hover:scale-101"
              >
                <Sparkles size={18} /> Run Free Game Review
              </button>

              {/* Move Notation History Table */}
              <div className="bg-[#262421] border border-[#3d3b38] rounded-xl p-3 shadow-md max-h-56 overflow-y-auto">
                <span className="text-xs font-bold text-[#9e9c98] uppercase tracking-wider block mb-2">
                  Move History
                </span>
                {historyMoves.length === 0 ? (
                  <span className="text-xs text-zinc-500 block text-center py-4">
                    Make moves on the board or load a PGN.
                  </span>
                ) : (
                  <div className="grid grid-cols-2 gap-1 text-xs font-mono">
                    {historyMoves.map((m, idx) => (
                      <button
                        key={idx}
                        onClick={() => jumpToHistoryStep(idx + 1)}
                        className={`py-1 px-2 rounded text-left transition-colors ${
                          currentStep === idx + 1
                            ? 'bg-[#81b64c] text-white font-bold'
                            : 'bg-[#21201d] text-zinc-300 hover:bg-[#302e2b]'
                        }`}
                      >
                        {idx % 2 === 0 ? `${idx / 2 + 1}. ` : ''}
                        {m}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* PGN Loader */}
              <div className="bg-[#262421] border border-[#3d3b38] rounded-xl p-3 space-y-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Upload size={14} className="text-[#81b64c]" /> Load Masterpiece
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setPgnText(SAMPLE_GAMES.opera.pgn);
                      handleStartReview(SAMPLE_GAMES.opera.pgn);
                    }}
                    className="flex-1 py-1.5 px-2 bg-[#21201d] hover:bg-[#302e2b] rounded text-xs text-zinc-300 border border-[#3d3b38]"
                  >
                    Opera Game
                  </button>
                  <button
                    onClick={() => {
                      setPgnText(SAMPLE_GAMES.kasparov.pgn);
                      handleStartReview(SAMPLE_GAMES.kasparov.pgn);
                    }}
                    className="flex-1 py-1.5 px-2 bg-[#21201d] hover:bg-[#302e2b] rounded text-xs text-zinc-300 border border-[#3d3b38]"
                  >
                    Kasparov 24.Rxd4!!
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Game Review Panel */
            <div className="space-y-3">
              {isReviewing ? (
                <div className="bg-[#262421] border border-[#3d3b38] rounded-xl p-6 flex flex-col items-center justify-center text-center">
                  <Sparkles className="w-8 h-8 text-[#81b64c] animate-spin mb-3" />
                  <span className="font-extrabold text-sm text-white mb-1">
                    Analyzing Position at Depth 18...
                  </span>
                  <span className="text-xs text-[#9e9c98] mb-3">
                    Progress: {reviewProgress}%
                  </span>
                  <div className="w-full bg-[#21201d] h-2 rounded-full overflow-hidden border border-[#3d3b38]">
                    <div
                      className="bg-[#81b64c] h-full transition-all duration-300"
                      style={{ width: `${reviewProgress}%` }}
                    />
                  </div>
                </div>
              ) : report ? (
                <div className="space-y-3">
                  {/* Accuracy Card */}
                  <div className="bg-[#262421] border border-[#3d3b38] rounded-xl p-3.5 shadow-md">
                    <span className="text-xs font-black text-[#9e9c98] uppercase tracking-wider block mb-2">
                      Accuracy Score
                    </span>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-[#21201d] p-3 rounded-lg flex flex-col items-center border border-[#3d3b38]">
                        <span className="text-xs font-bold text-zinc-300 mb-0.5">White</span>
                        <span className="text-2xl font-black text-white font-mono">
                          {report.whiteAccuracy}%
                        </span>
                      </div>
                      <div className="bg-[#21201d] p-3 rounded-lg flex flex-col items-center border border-[#3d3b38]">
                        <span className="text-xs font-bold text-zinc-300 mb-0.5">Black</span>
                        <span className="text-2xl font-black text-white font-mono">
                          {report.blackAccuracy}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Coach Advice */}
                  <div className="bg-[#262421] border border-[#3d3b38] rounded-xl p-3.5 shadow-md">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-full bg-[#81b64c] flex items-center justify-center text-zinc-950 font-black text-xs">
                        C
                      </div>
                      <span className="text-xs font-extrabold text-white">Stockfish Coach</span>
                    </div>
                    {currentReviewMove ? (
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`text-xs font-black uppercase px-2 py-0.5 rounded border ${
                              CLASSIFICATION_CONFIG[currentReviewMove.classification].bg
                            } ${CLASSIFICATION_CONFIG[currentReviewMove.classification].color}`}
                          >
                            {CLASSIFICATION_CONFIG[currentReviewMove.classification].label}{' '}
                            {CLASSIFICATION_CONFIG[currentReviewMove.classification].symbol}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-300 mt-1">
                          {currentReviewMove.explanation}
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-300">{report.summary.coachVerdict}</p>
                    )}
                  </div>

                  {/* Move breakdown pills */}
                  <div className="bg-[#262421] border border-[#3d3b38] rounded-xl p-3 shadow-md grid grid-cols-3 gap-1.5 text-center">
                    {(['brilliant', 'great', 'best', 'inaccuracy', 'mistake', 'blunder'] as MoveClassificationType[]).map(
                      (k) => {
                        const cfg = CLASSIFICATION_CONFIG[k];
                        const totalCount = report.counts.white[k] + report.counts.black[k];
                        return (
                          <div key={k} className={`p-1.5 rounded border ${cfg.bg}`}>
                            <span className={`text-[10px] font-bold block ${cfg.color}`}>
                              {cfg.symbol} {cfg.label}
                            </span>
                            <span className="text-xs font-mono font-bold text-white">
                              {totalCount}
                            </span>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
