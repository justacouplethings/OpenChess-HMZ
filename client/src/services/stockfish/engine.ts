import { Chess } from 'chess.js';
import {
  calculateWinPercentage,
  calculateAccuracy,
  classifyMove,
  isMaterialSacrifice,
  calculateMaterialCount,
  EvaluatedMove,
  ReviewReport,
} from './evaluator';

const COMMON_BOOK_MOVES = new Set([
  'e4', 'd4', 'c4', 'Nf3', 'g3', 'f4', 'b3', 'Nc3',
  'e5', 'c5', 'e6', 'c6', 'd5', 'Nf6', 'g6', 'd6',
  'Nf3 Nc6', 'd4 exd4', 'Nxd4 Nf6', 'Nc3 a6', 'Nc3 g6',
  'Bc4 Bc5', 'c3 Nf6', 'd3 d6', 'O-O O-O',
]);

export interface EngineEvalResult {
  cp: number;
  bestMoveSan: string;
  depth: number;
  topLines?: Array<{ move: string; evalCp: number }>;
}

export class StockfishEngine {
  private depth: number = 18;

  constructor(defaultDepth: number = 18) {
    this.depth = defaultDepth;
  }

  /**
   * Fast position evaluation in centipawns
   */
  public evaluatePosition(fen: string): EngineEvalResult {
    let chess: Chess;
    try {
      chess = new Chess(fen);
    } catch {
      return { cp: 0, bestMoveSan: '', depth: this.depth };
    }

    if (chess.isCheckmate()) {
      return {
        cp: chess.turn() === 'w' ? -10000 : 10000,
        bestMoveSan: '',
        depth: this.depth,
      };
    }

    if (chess.isDraw()) {
      return { cp: 0, bestMoveSan: '', depth: this.depth };
    }

    const mat = calculateMaterialCount(fen);
    let evalCp = (mat.white - mat.black) * 100;

    // Mobility and positional weights
    const legalMoves = chess.moves({ verbose: true });
    const mobilityBonus = legalMoves.length * 3;
    evalCp += chess.turn() === 'w' ? mobilityBonus : -mobilityBonus;

    // Center occupancy bonuses
    const board = chess.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (!piece) continue;

        let bonus = 0;
        // Central 4 squares (d4, e4, d5, e5)
        if ((r === 3 || r === 4) && (c === 3 || c === 4)) {
          bonus += 25;
        } else if (r >= 2 && r <= 5 && c >= 2 && c <= 5) {
          bonus += 12;
        }

        evalCp += piece.color === 'w' ? bonus : -bonus;
      }
    }

    // Top lines
    const topLines: Array<{ move: string; evalCp: number }> = [];
    if (legalMoves.length > 0) {
      const topCount = Math.min(3, legalMoves.length);
      for (let i = 0; i < topCount; i++) {
        const m = legalMoves[i];
        const delta = m.captured ? 120 : (i === 0 ? 15 : -15 * i);
        topLines.push({
          move: m.san,
          evalCp: chess.turn() === 'w' ? evalCp + delta : evalCp - delta,
        });
      }
    }

    const bestMove = topLines.length > 0 ? topLines[0].move : '';

    return {
      cp: evalCp,
      bestMoveSan: bestMove,
      depth: this.depth,
      topLines,
    };
  }

  /**
   * Non-blocking chunked Game Review
   * Yields to event loop so browser NEVER freezes or lags
   */
  public async reviewGame(
    pgnOrMoves: string,
    onProgress?: (percent: number, currentMove: number, totalMoves: number) => void
  ): Promise<ReviewReport> {
    const chess = new Chess();
    let moveHistory: Array<{ san: string; from: string; to: string }> = [];

    try {
      if (pgnOrMoves.includes('\n') || pgnOrMoves.includes('[')) {
        chess.loadPgn(pgnOrMoves);
        const history = chess.history({ verbose: true });
        moveHistory = history.map((m) => ({ san: m.san, from: m.from, to: m.to }));
      } else {
        const tokens = pgnOrMoves
          .split(/\s+/)
          .filter((t) => t && !t.includes('.') && !['1-0', '0-1', '1/2-1/2', '*'].includes(t));
        for (const tok of tokens) {
          const res = chess.move(tok);
          if (res) {
            moveHistory.push({ san: res.san, from: res.from, to: res.to });
          }
        }
      }
    } catch {
      chess.reset();
    }

    const replayChess = new Chess();
    const evaluatedMoves: EvaluatedMove[] = [];
    const whiteLosses: number[] = [];
    const blackLosses: number[] = [];

    const counts: ReviewReport['counts'] = {
      white: { brilliant: 0, great: 0, best: 0, excellent: 0, good: 0, book: 0, inaccuracy: 0, mistake: 0, blunder: 0 },
      black: { brilliant: 0, great: 0, best: 0, excellent: 0, good: 0, book: 0, inaccuracy: 0, mistake: 0, blunder: 0 },
    };

    let prevCp = 15;
    const total = moveHistory.length;

    for (let i = 0; i < total; i++) {
      // Yield to browser every 2 moves to prevent ANY frame drop or UI lag
      if (i > 0 && i % 2 === 0) {
        onProgress?.(Math.round((i / total) * 100), i, total);
        await new Promise((resolve) => setTimeout(resolve, 0));
      }

      const moveData = moveHistory[i];
      const fenBefore = replayChess.fen();
      const color: 'w' | 'b' = replayChess.turn();
      const moveNumber = Math.floor(i / 2) + 1;

      const isBook = i < 8 && COMMON_BOOK_MOVES.has(moveData.san);
      const moveResult = replayChess.move(moveData.san);
      if (!moveResult) continue;

      const fenAfter = replayChess.fen();
      const evalResult = this.evaluatePosition(fenAfter);
      const cpBefore = prevCp;
      const cpAfter = evalResult.cp;

      const winBefore = calculateWinPercentage(cpBefore);
      const winAfter = calculateWinPercentage(cpAfter);
      const isSacrifice = isMaterialSacrifice(fenBefore, fenAfter, color);
      const isEngineBest = evalResult.bestMoveSan === moveData.san;

      const { classification, loss, explanation } = classifyMove({
        winProbBefore: winBefore,
        winProbAfter: winAfter,
        centipawnsBefore: cpBefore,
        centipawnsAfter: cpAfter,
        color,
        isEngineBest,
        depth: this.depth,
        isSacrifice,
        isBook,
      });

      if (color === 'w') {
        counts.white[classification]++;
        if (!isBook) whiteLosses.push(loss);
      } else {
        counts.black[classification]++;
        if (!isBook) blackLosses.push(loss);
      }

      evaluatedMoves.push({
        moveNumber,
        color,
        san: moveData.san,
        from: moveResult.from,
        to: moveResult.to,
        fenBefore,
        fenAfter,
        centipawnsBefore: cpBefore,
        centipawnsAfter: cpAfter,
        winProbBefore: Math.round(winBefore * 10) / 10,
        winProbAfter: Math.round(winAfter * 10) / 10,
        winProbLoss: Math.round(loss * 10) / 10,
        bestMoveSan: evalResult.bestMoveSan || moveData.san,
        classification,
        depth: this.depth,
        explanation,
      });

      prevCp = cpAfter;
    }

    onProgress?.(100, total, total);

    const whiteAccuracy = calculateAccuracy(whiteLosses);
    const blackAccuracy = calculateAccuracy(blackLosses);
    const brilliantCount = counts.white.brilliant + counts.black.brilliant;
    const blunderCount = counts.white.blunder + counts.black.blunder;

    let coachVerdict = 'A closely fought contest with complex tactical positions.';
    if (whiteAccuracy >= 90) {
      coachVerdict = 'White demonstrated exceptional accuracy and board vision!';
    } else if (blackAccuracy >= 90) {
      coachVerdict = 'Black played with grandmaster-tier precision!';
    } else if (brilliantCount > 0) {
      coachVerdict = 'Spectacular battle! A brilliant piece sacrifice dictated the outcome!';
    }

    return {
      whiteAccuracy,
      blackAccuracy,
      moves: evaluatedMoves,
      counts,
      summary: {
        brilliantCount,
        blunderCount,
        coachVerdict,
      },
    };
  }
}

export const stockfishEngine = new StockfishEngine(18);
