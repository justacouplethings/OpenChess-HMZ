import { describe, it, expect } from 'vitest';
import {
  calculateWinPercentage,
  classifyMove,
  calculateAccuracy,
  isMaterialSacrifice,
} from './evaluator';

describe('Stockfish Win Probability Mathematical Formulas', () => {
  it('should evaluate 0 centipawns to exactly 50% win probability', () => {
    const w = calculateWinPercentage(0);
    expect(w).toBeCloseTo(50.0, 4);
  });

  it('should evaluate +300 cp advantage to ~75.1% win probability', () => {
    const w = calculateWinPercentage(300);
    // W = 50 + 50 * (2 / (1 + exp(-0.00368208 * 300)) - 1)
    // exp(-1.104624) = 0.33133
    // 2 / 1.33133 - 1 = 0.5022
    // 50 + 50 * 0.5022 = 75.11%
    expect(w).toBeGreaterThan(74.0);
    expect(w).toBeLessThan(76.5);
  });

  it('should evaluate -300 cp disadvantage symmetrically to ~24.9% win probability', () => {
    const w = calculateWinPercentage(-300);
    expect(w).toBeGreaterThan(23.5);
    expect(w).toBeLessThan(26.0);
    expect(calculateWinPercentage(300) + calculateWinPercentage(-300)).toBeCloseTo(100.0, 2);
  });

  it('should strictly classify W% drop > 20% as Blunder (??)', () => {
    // Before: White 70% W% (advantage)
    // After: White 45% W% (loss = 25%)
    const result = classifyMove({
      winProbBefore: 70.0,
      winProbAfter: 45.0,
      centipawnsBefore: 200,
      centipawnsAfter: -50,
      color: 'w',
      isEngineBest: false,
      depth: 18,
      isSacrifice: false,
    });

    expect(result.classification).toBe('blunder');
    expect(result.loss).toBeCloseTo(25.0);
  });

  it('should strictly classify W% drop between 10% and 20% as Mistake (?)', () => {
    // Before: White 60% W%
    // After: White 46% W% (loss = 14%)
    const result = classifyMove({
      winProbBefore: 60.0,
      winProbAfter: 46.0,
      centipawnsBefore: 100,
      centipawnsAfter: -30,
      color: 'w',
      isEngineBest: false,
      depth: 18,
      isSacrifice: false,
    });

    expect(result.classification).toBe('mistake');
    expect(result.loss).toBeCloseTo(14.0);
  });

  it('should strictly classify piece sacrifice that maintains engine eval at depth >= 18 as Brilliant (!!)', () => {
    // Player sacrifices a piece, but evaluation remains +150 cp at depth 18
    const result = classifyMove({
      winProbBefore: 65.0,
      winProbAfter: 66.0,
      centipawnsBefore: 150,
      centipawnsAfter: 160,
      color: 'w',
      isEngineBest: true,
      depth: 18,
      isSacrifice: true,
    });

    expect(result.classification).toBe('brilliant');
  });

  it('should compute accuracy correctly within 0% to 100% range', () => {
    const perfectAccuracy = calculateAccuracy([0, 0, 0]);
    expect(perfectAccuracy).toBe(100);

    const flawedAccuracy = calculateAccuracy([25, 30, 20]);
    expect(flawedAccuracy).toBeLessThan(50);
    expect(flawedAccuracy).toBeGreaterThan(0);
  });

  it('should detect material sacrifice from FEN before and after', () => {
    // Before: White has queen (Q) on d1
    const fenBefore = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    // After: White queen captured/sacrificed on d8
    const fenAfter = 'rnbq1bnr/pppppppp/8/8/8/8/PPPPPPPP/RNB1KBNR b KQkq - 0 1';
    const sacrificed = isMaterialSacrifice(fenBefore, fenAfter, 'w');
    expect(sacrificed).toBe(true);
  });
});
