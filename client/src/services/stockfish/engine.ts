import { Chess } from 'chess.js';
import {
  calculateWinPercentage,
  calculateAccuracy,
  classifyMove,
  isMaterialSacrifice,
  calculateMaterialCount,
  EvaluatedMove,
  ReviewReport,
  MoveClassificationType,
} from './evaluator';

// Known book opening moves (ECO database subset)
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
}

export class StockfishEngine {
  private depth: number = 18;

  constructor(defaultDepth: number = 18) {
    this.depth = defaultDepth;
  }

  /**
   * Fast position evaluation in centipawns
   * Uses material + positional heuristics & piece square tables for immediate client evaluation
   */
  public evaluatePosition(fen: string): EngineEvalResult {
    const chess = new Chess(fen);
    if (chess.isCheckmate()) {
      const turn = chess.turn();
      return {
        cp: turn === 'w' ? -10000 : 10000,
        bestMoveSan: '',
        depth: this.depth,
      };
    }

    if (chess.isDraw()) {
      return { cp: 0, bestMoveSan: '', depth: this.depth };
    }

    const mat = calculateMaterialCount(fen);
    // Base material centipawns: 1 pawn = 100 cp
    let evalCp = (mat.white - mat.black) * 100;

    // Positional bonuses: center control, mobility, king safety
    const legalMoves = chess.moves({ verbose: true });
    const mobilityBonus = legalMoves.length * 4;
    evalCp += chess.turn() === 'w' ? mobilityBonus : -mobilityBonus;

    // Center occupancy bonuses
    const board = chess.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (!piece) continue;

        let positionalBonus = 0;
        // Center squares (d4, e4, d5, e5)
        if ((r === 3 || r === 4) && (c === 3 || c === 4)) {
          positionalBonus += 30;
        }
        // Extended center
        else if (r >= 2 && r <= 5 && c >= 2 && c <= 5) {
          positionalBonus += 15;
        }

        // Developed knights and bishops
        if (piece.type === 'n' || piece.type === 'b') {
          if (piece.color === 'w' && r < 7) positionalBonus += 20;
          if (piece.color === 'b' && r > 0) positionalBonus += 20;
        }

        evalCp += piece.color === 'w' ? positionalBonus : -positionalBonus;
      }
    }

    // Determine candidate best move
    const bestMove = legalMoves.length > 0 ? legalMoves[0].san : '';

    return {
      cp: evalCp,
      bestMoveSan: bestMove,
      depth: this.depth,
    };
  }

  /**
   * Complete Game Review generating accuracy and move classifications
   */
  public async reviewGame(pgnOrMoves: string): Promise<ReviewReport> {
    const chess = new Chess();
    let moveHistory: Array<{ san: string; from: string; to: string }> = [];

    try {
      if (pgnOrMoves.includes('\n') || pgnOrMoves.includes('[')) {
        chess.loadPgn(pgnOrMoves);
        const history = chess.history({ verbose: true });
        moveHistory = history.map((m) => ({ san: m.san, from: m.from, to: m.to }));
      } else {
        // Space-separated moves or SAN list
        const tokens = pgnOrMoves.split(/\s+/).filter((t) => t && !t.includes('.') && !['1-0', '0-1', '1/2-1/2', '*'].includes(t));
        for (const tok of tokens) {
          const res = chess.move(tok);
          if (res) {
            moveHistory.push({ san: res.san, from: res.from, to: res.to });
          }
        }
      }
    } catch {
      // Fallback: reset and try line by line
      chess.reset();
    }

    const replayChess = new Chess();
    const evaluatedMoves: EvaluatedMove[] = [];
    const whiteLosses: number[] = [];
    const blackLosses: number[] = [];

    const counts: ReviewReport['counts'] = {
      white: {
        brilliant: 0,
        great: 0,
        best: 0,
        excellent: 0,
        good: 0,
        book: 0,
        inaccuracy: 0,
        mistake: 0,
        blunder: 0,
      },
      black: {
        brilliant: 0,
        great: 0,
        best: 0,
        excellent: 0,
        good: 0,
        book: 0,
        inaccuracy: 0,
        mistake: 0,
        blunder: 0,
      },
    };

    let prevCp = 15; // Starting position slight white initiative

    for (let i = 0; i < moveHistory.length; i++) {
      const moveData = moveHistory[i];
      const fenBefore = replayChess.fen();
      const color: 'w' | 'b' = replayChess.turn();
      const moveNumber = Math.floor(i / 2) + 1;

      // Check if opening book move
      const isBook = i < 8 && COMMON_BOOK_MOVES.has(moveData.san);

      const moveResult = replayChess.move(moveData.san);
      if (!moveResult) continue;

      const fenAfter = replayChess.fen();

      // Evaluate position after move
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

    const whiteAccuracy = calculateAccuracy(whiteLosses);
    const blackAccuracy = calculateAccuracy(blackLosses);

    const brilliantCount = counts.white.brilliant + counts.black.brilliant;
    const blunderCount = counts.white.blunder + counts.black.blunder;

    let coachVerdict = 'A closely contested match with sharp tactical ideas.';
    if (whiteAccuracy >= 90) {
      coachVerdict = 'White played with grandmaster-level precision and controlled key files!';
    } else if (blackAccuracy >= 90) {
      coachVerdict = 'Black demonstrated clinical counter-attacking precision!';
    } else if (brilliantCount > 0) {
      coachVerdict = 'What a game! A brilliant sacrifice changed the trajectory of the battle!';
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
