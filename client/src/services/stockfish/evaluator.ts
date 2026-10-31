// Stockfish Engine & Free Game Review Evaluator
// Mathematical precision adhering to Chess.com CAPS2 Win Probability models

export type MoveClassificationType =
  | 'brilliant'
  | 'great'
  | 'best'
  | 'excellent'
  | 'good'
  | 'book'
  | 'inaccuracy'
  | 'mistake'
  | 'blunder';

export interface EvaluatedMove {
  moveNumber: number;
  color: 'w' | 'b';
  san: string;
  from: string;
  to: string;
  fenBefore: string;
  fenAfter: string;
  centipawnsBefore: number;
  centipawnsAfter: number;
  winProbBefore: number;
  winProbAfter: number;
  winProbLoss: number;
  bestMoveSan: string;
  classification: MoveClassificationType;
  depth: number;
  explanation: string;
}

export interface ReviewReport {
  whiteAccuracy: number;
  blackAccuracy: number;
  moves: EvaluatedMove[];
  counts: {
    white: Record<MoveClassificationType, number>;
    black: Record<MoveClassificationType, number>;
  };
  summary: {
    brilliantCount: number;
    blunderCount: number;
    coachVerdict: string;
  };
}

/**
 * Maps Centipawns (cp) to Win Probability (W%) using:
 * W = 50 + 50 * (2 / (1 + exp(-0.00368208 * cp)) - 1)
 */
export function calculateWinPercentage(cp: number): number {
  // Clamp extreme values for numerical stability
  const clampedCp = Math.max(-2000, Math.min(2000, cp));
  const expVal = Math.exp(-0.00368208 * clampedCp);
  const winProb = 50 + 50 * (2 / (1 + expVal) - 1);
  return Math.max(0, Math.min(100, winProb));
}

/**
 * Calculates material balance on board from FEN
 */
export function calculateMaterialCount(fen: string): { white: number; black: number } {
  const piecePlacement = fen.split(' ')[0] || '';
  const pieceValues: Record<string, number> = {
    p: 1,
    n: 3,
    b: 3,
    r: 5,
    q: 9,
    k: 0,
  };

  let white = 0;
  let black = 0;

  for (const char of piecePlacement) {
    const lower = char.toLowerCase();
    if (pieceValues[lower] !== undefined) {
      if (char === char.toUpperCase()) {
        white += pieceValues[lower];
      } else {
        black += pieceValues[lower];
      }
    }
  }

  return { white, black };
}

/**
 * Checks if a move sacrificed material
 */
export function isMaterialSacrifice(
  fenBefore: string,
  fenAfter: string,
  color: 'w' | 'b'
): boolean {
  const before = calculateMaterialCount(fenBefore);
  const after = calculateMaterialCount(fenAfter);

  if (color === 'w') {
    const netChange = (after.white - after.black) - (before.white - before.black);
    return netChange <= -2; // Sacrificed at least 2 points of material (e.g. piece or exchange)
  } else {
    const netChange = (after.black - after.white) - (before.black - before.white);
    return netChange <= -2;
  }
}

/**
 * Classifies a move based on win probability loss and engine depth
 */
export function classifyMove(params: {
  winProbBefore: number;
  winProbAfter: number;
  centipawnsBefore: number;
  centipawnsAfter: number;
  color: 'w' | 'b';
  isEngineBest: boolean;
  depth: number;
  isSacrifice: boolean;
  isBook?: boolean;
}): { classification: MoveClassificationType; loss: number; explanation: string } {
  const {
    winProbBefore,
    winProbAfter,
    centipawnsBefore,
    centipawnsAfter,
    color,
    isEngineBest,
    depth,
    isSacrifice,
    isBook,
  } = params;

  if (isBook) {
    return { classification: 'book', loss: 0, explanation: 'Standard opening book move.' };
  }

  // Calculate loss from player's perspective
  // For White, higher W% is better. For Black, higher (100 - W%) is better.
  let playerWinBefore = color === 'w' ? winProbBefore : 100 - winProbBefore;
  let playerWinAfter = color === 'w' ? winProbAfter : 100 - winProbAfter;

  const loss = Math.max(0, playerWinBefore - playerWinAfter);

  // Brilliant (!!): Sacrifices material but maintains/improves engine eval at depth >= 18
  const evalMaintained = color === 'w'
    ? centipawnsAfter >= centipawnsBefore - 25
    : centipawnsAfter <= centipawnsBefore + 25;

  if (isSacrifice && evalMaintained && depth >= 18) {
    return {
      classification: 'brilliant',
      loss: 0,
      explanation: 'Brilliant move! You sacrificed material while maintaining full control and engine evaluation.',
    };
  }

  // Blunder (??): W% drops by > 20%
  if (loss > 20.0) {
    return {
      classification: 'blunder',
      loss,
      explanation: 'Blunder! This move drastically hurts your position and loses more than 20% win chance.',
    };
  }

  // Mistake (?): W% drops by 10% - 20%
  if (loss >= 10.0) {
    return {
      classification: 'mistake',
      loss,
      explanation: 'Mistake! A noticeable oversight that drops your win probability by 10% to 20%.',
    };
  }

  // Inaccuracy (?!): W% drops by 5% - 10%
  if (loss >= 5.0) {
    return {
      classification: 'inaccuracy',
      loss,
      explanation: 'Inaccuracy. There were more accurate alternatives available.',
    };
  }

  // Great Move (!): Found critical advantage preserving move in sharp position
  if (isEngineBest && playerWinBefore < 55 && playerWinAfter >= 60) {
    return {
      classification: 'great',
      loss: 0,
      explanation: 'Great move! An excellent tactical find that turns the game in your favor.',
    };
  }

  // Best Move (*)
  if (isEngineBest || loss < 0.5) {
    return {
      classification: 'best',
      loss: 0,
      explanation: 'Best move! Matches the engine top recommendation.',
    };
  }

  // Excellent
  if (loss < 2.0) {
    return {
      classification: 'excellent',
      loss,
      explanation: 'Excellent move. Very strong and keeps your advantage.',
    };
  }

  // Good
  return {
    classification: 'good',
    loss,
    explanation: 'Good, solid move.',
  };
}

/**
 * Calculates overall game accuracy (0% to 100%) for White and Black
 */
export function calculateAccuracy(losses: number[]): number {
  if (losses.length === 0) return 100;
  const avgLoss = losses.reduce((a, b) => a + b, 0) / losses.length;
  // CAPS accuracy model formula
  const acc = 100 * Math.exp(-0.038 * avgLoss);
  return Math.round(Math.max(15, Math.min(100, acc)) * 10) / 10;
}
