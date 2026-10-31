import React from 'react';
import { calculateWinPercentage } from '../../services/stockfish/evaluator';

interface EvalBarProps {
  centipawns: number;
  orientation?: 'w' | 'b';
  height?: string | number;
}

export const EvalBar: React.FC<EvalBarProps> = ({ centipawns, orientation = 'w', height = '100%' }) => {
  const winProb = calculateWinPercentage(centipawns);
  // White percentage of the bar
  const whitePercent = Math.min(98, Math.max(2, winProb));

  // Display text formatted like chess.com (+1.5, -0.4, 0.0, M3)
  let displayText = '';
  if (Math.abs(centipawns) >= 9000) {
    const mateIn = Math.round((10000 - Math.abs(centipawns)) / 100);
    displayText = `M${Math.max(1, mateIn)}`;
  } else {
    const pawns = centipawns / 100;
    displayText = pawns > 0 ? `+${pawns.toFixed(1)}` : pawns.toFixed(1);
    if (displayText === '-0.0') displayText = '0.0';
  }

  const isWhiteTop = orientation === 'b';
  const whiteHeightPercent = isWhiteTop ? 100 - whitePercent : whitePercent;

  return (
    <div
      className="w-7 bg-zinc-900 rounded-md overflow-hidden flex flex-col justify-between relative shadow-md border border-zinc-700/60 select-none"
      style={{ height }}
      title={`Evaluation: ${displayText} (Win Chance: ${winProb.toFixed(1)}%)`}
    >
      {/* Top half (Black by default if orientation is white) */}
      <div
        className="w-full bg-[#262421] transition-all duration-300 relative flex items-start justify-center pt-1"
        style={{ height: `${100 - whiteHeightPercent}%` }}
      >
        {!isWhiteTop && whitePercent < 50 && (
          <span className="text-[10px] font-bold text-zinc-300 drop-shadow">
            {displayText}
          </span>
        )}
      </div>

      {/* Bottom half (White by default if orientation is white) */}
      <div
        className="w-full bg-[#f1f1f1] transition-all duration-300 relative flex items-end justify-center pb-1"
        style={{ height: `${whiteHeightPercent}%` }}
      >
        {(isWhiteTop ? whitePercent < 50 : whitePercent >= 50) && (
          <span className="text-[10px] font-bold text-zinc-800 drop-shadow">
            {displayText}
          </span>
        )}
      </div>
    </div>
  );
};
