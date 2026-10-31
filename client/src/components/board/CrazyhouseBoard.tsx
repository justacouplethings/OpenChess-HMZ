import React, { useState } from 'react';
import { Chess, Square } from 'chess.js';
import { PieceIcon } from '../../assets/pieces';
import { sound } from '../../utils/audio';

export interface PiecePocketMap {
  p: number;
  n: number;
  b: number;
  r: number;
  q: number;
}

export interface CrazyhouseBoardProps {
  fen: string;
  whitePocket: PiecePocketMap;
  blackPocket: PiecePocketMap;
  onMove?: (from: string, to: string, capturedPiece?: string) => void;
  onDropPiece?: (piece: string, square: string) => void;
  orientation?: 'w' | 'b';
  theme?: string;
  turn?: 'w' | 'b';
}

const THEME_COLORS: Record<string, { light: string; dark: string; lightText: string; darkText: string }> = {
  green: { light: '#ebecd0', dark: '#739552', lightText: '#739552', darkText: '#ebecd0' },
  wood: { light: '#f0d9b5', dark: '#b58863', lightText: '#b58863', darkText: '#f0d9b5' },
  dark: { light: '#3b3e40', dark: '#2b2d2f', lightText: '#888888', darkText: '#aaaaaa' },
  glass: { light: '#dee3e6', dark: '#8ca2ad', lightText: '#8ca2ad', darkText: '#dee3e6' },
};

export const CrazyhouseBoard: React.FC<CrazyhouseBoardProps> = ({
  fen,
  whitePocket,
  blackPocket,
  onMove,
  onDropPiece,
  orientation = 'w',
  theme = 'green',
  turn = 'w',
}) => {
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [selectedDropPiece, setSelectedDropPiece] = useState<{ color: 'w' | 'b'; piece: string } | null>(null);

  const colors = THEME_COLORS[theme] || THEME_COLORS.green;
  const chess = new Chess(fen);

  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['1', '2', '3', '4', '5', '6', '7', '8'];

  const displayFiles = orientation === 'w' ? files : [...files].reverse();
  const displayRanks = orientation === 'w' ? [...ranks].reverse() : ranks;

  const handlePocketPieceClick = (color: 'w' | 'b', piece: string, count: number) => {
    if (count <= 0 || turn !== color) return;

    if (selectedDropPiece && selectedDropPiece.piece === piece && selectedDropPiece.color === color) {
      setSelectedDropPiece(null);
    } else {
      setSelectedDropPiece({ color, piece });
      setSelectedSquare(null);
    }
  };

  const handleSquareClick = (square: Square) => {
    // If a pocket piece is selected for dropping:
    if (selectedDropPiece) {
      // Cannot drop on occupied square
      if (chess.get(square)) {
        setSelectedDropPiece(null);
        return;
      }

      // Pawns cannot be dropped on rank 1 or 8
      if (selectedDropPiece.piece === 'p' && (square[1] === '1' || square[1] === '8')) {
        return;
      }

      sound.playMove();
      onDropPiece?.(selectedDropPiece.piece, square);
      setSelectedDropPiece(null);
      return;
    }

    // Normal board move
    if (selectedSquare) {
      try {
        const testChess = new Chess(fen);
        const capturedPiece = testChess.get(square)?.type;
        const result = testChess.move({ from: selectedSquare, to: square });
        if (result) {
          if (result.captured) {
            sound.playCapture();
          } else {
            sound.playMove();
          }
          onMove?.(selectedSquare, square, capturedPiece);
        }
      } catch {
        // illegal
      }
      setSelectedSquare(null);
      return;
    }

    const piece = chess.get(square);
    if (piece && piece.color === turn) {
      setSelectedSquare(square);
    }
  };

  const renderPocket = (color: 'w' | 'b', pocket: PiecePocketMap) => {
    const pieces: Array<'p' | 'n' | 'b' | 'r' | 'q'> = ['p', 'n', 'b', 'r', 'q'];
    const isActive = turn === color;

    return (
      <div
        className={`w-full py-2 px-3 rounded-lg flex items-center justify-between border transition-all ${
          isActive
            ? 'bg-chess-card border-chess-green/50 shadow-md ring-1 ring-chess-green/30'
            : 'bg-chess-sidebar/60 border-zinc-800 opacity-85'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
            {color === 'w' ? 'White Pocket' : 'Black Pocket'}
          </span>
          {isActive && (
            <span className="w-2 h-2 rounded-full bg-chess-green animate-pulse" />
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {pieces.map((p) => {
            const count = pocket[p] || 0;
            const isSelected =
              selectedDropPiece &&
              selectedDropPiece.color === color &&
              selectedDropPiece.piece === p;

            return (
              <button
                key={p}
                onClick={() => handlePocketPieceClick(color, p, count)}
                disabled={count <= 0 || !isActive}
                className={`relative w-10 h-10 rounded-md flex items-center justify-center p-1 transition-all ${
                  count > 0 && isActive
                    ? 'hover:scale-110 cursor-pointer'
                    : 'opacity-35 cursor-not-allowed'
                } ${
                  isSelected
                    ? 'bg-chess-green/30 ring-2 ring-chess-green shadow-lg scale-105'
                    : 'bg-zinc-800/80 hover:bg-zinc-700/80'
                }`}
                title={count > 0 ? `Click to drop ${p.toUpperCase()} on board` : `Empty`}
              >
                <PieceIcon code={`${color}${p}`} size={26} />
                {count > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-chess-green text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center shadow">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const topPocket = orientation === 'w' ? blackPocket : whitePocket;
  const topColor = orientation === 'w' ? 'b' : 'w';

  const bottomPocket = orientation === 'w' ? whitePocket : blackPocket;
  const bottomColor = orientation === 'w' ? 'w' : 'b';

  return (
    <div className="flex flex-col gap-3 max-w-[620px] w-full">
      {/* Top player pocket */}
      {renderPocket(topColor, topPocket)}

      {/* Main 8x8 Board */}
      <div className="relative select-none aspect-square w-full rounded shadow-2xl overflow-hidden border-2 border-zinc-700/50">
        <div className="grid grid-cols-8 grid-rows-8 w-full h-full">
          {displayRanks.map((rank) =>
            displayFiles.map((file) => {
              const square = `${file}${rank}` as Square;
              const piece = chess.get(square);
              const isLight = (file.charCodeAt(0) - 97 + parseInt(rank)) % 2 !== 0;
              const squareBg = isLight ? colors.light : colors.dark;
              const isSelected = selectedSquare === square;
              const isDropTarget = selectedDropPiece && !piece;

              return (
                <div
                  key={square}
                  onClick={() => handleSquareClick(square)}
                  className={`relative w-full h-full flex items-center justify-center cursor-pointer transition-colors ${
                    isDropTarget ? 'hover:bg-chess-green/40' : ''
                  }`}
                  style={{ backgroundColor: squareBg }}
                >
                  {isSelected && (
                    <div className="absolute inset-0 bg-[#f7f769] opacity-60 pointer-events-none" />
                  )}

                  {piece && (
                    <div className="w-[84%] h-[84%] flex items-center justify-center z-10">
                      <PieceIcon code={`${piece.color}${piece.type}`} className="w-full h-full drop-shadow" />
                    </div>
                  )}

                  {/* Drop hint when pocket piece is selected */}
                  {selectedDropPiece && !piece && (
                    <div className="absolute w-3 h-3 rounded-full bg-chess-green/50 pointer-events-none" />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Bottom player pocket */}
      {renderPocket(bottomColor, bottomPocket)}
    </div>
  );
};
