import React, { useState, useEffect } from 'react';
import { Chess, Square, Move } from 'chess.js';
import { PieceIcon } from '../../assets/pieces';
import { sound } from '../../utils/audio';

export interface ChessBoardProps {
  fen: string;
  onMove?: (from: string, to: string, promotion?: string, san?: string) => void;
  orientation?: 'w' | 'b';
  theme?: string;
  interactive?: boolean;
  lastMove?: { from: string; to: string } | null;
  checkSquare?: string | null;
  premove?: { from: string; to: string } | null;
}

const THEME_COLORS: Record<string, { light: string; dark: string; lightText: string; darkText: string }> = {
  green: { light: '#ebecd0', dark: '#739552', lightText: '#739552', darkText: '#ebecd0' },
  wood: { light: '#f0d9b5', dark: '#b58863', lightText: '#b58863', darkText: '#f0d9b5' },
  dark: { light: '#3b3e40', dark: '#2b2d2f', lightText: '#888888', darkText: '#aaaaaa' },
  glass: { light: '#dee3e6', dark: '#8ca2ad', lightText: '#8ca2ad', darkText: '#dee3e6' },
};

export const ChessBoard: React.FC<ChessBoardProps> = ({
  fen,
  onMove,
  orientation = 'w',
  theme = 'green',
  interactive = true,
  lastMove = null,
  checkSquare = null,
  premove = null,
}) => {
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalTargets, setLegalTargets] = useState<Move[]>([]);
  const [pendingPromotion, setPendingPromotion] = useState<{ from: Square; to: Square } | null>(null);
  const [draggedSquare, setDraggedSquare] = useState<Square | null>(null);

  const colors = THEME_COLORS[theme] || THEME_COLORS.green;
  const chess = new Chess(fen);

  // Files and ranks
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['1', '2', '3', '4', '5', '6', '7', '8'];

  const displayFiles = orientation === 'w' ? files : [...files].reverse();
  const displayRanks = orientation === 'w' ? [...ranks].reverse() : ranks;

  // Clear selections when FEN changes
  useEffect(() => {
    setSelectedSquare(null);
    setLegalTargets([]);
  }, [fen]);

  const handleSquareClick = (square: Square) => {
    if (!interactive) return;

    // If square is one of legal targets, execute move
    if (selectedSquare) {
      const match = legalTargets.find((m) => m.to === square);
      if (match) {
        executeMove(selectedSquare, square, match);
        return;
      }
    }

    // Otherwise select piece on square if it belongs to active turn
    const piece = chess.get(square);
    if (piece) {
      setSelectedSquare(square);
      const moves = chess.moves({ square, verbose: true });
      setLegalTargets(moves);
    } else {
      setSelectedSquare(null);
      setLegalTargets([]);
    }
  };

  const executeMove = (from: Square, to: Square, moveCandidate?: Move) => {
    const piece = chess.get(from);

    // Check pawn promotion
    const isPromotion =
      piece &&
      piece.type === 'p' &&
      ((piece.color === 'w' && to[1] === '8') || (piece.color === 'b' && to[1] === '1'));

    if (isPromotion) {
      setPendingPromotion({ from, to });
      return;
    }

    const testChess = new Chess(fen);
    try {
      const result = testChess.move({ from, to });
      if (result) {
        if (result.captured) {
          sound.playCapture();
        } else if (result.flags.includes('k') || result.flags.includes('q')) {
          sound.playCastle();
        } else {
          sound.playMove();
        }

        if (testChess.inCheck()) {
          sound.playCheck();
        }

        onMove?.(from, to, undefined, result.san);
      }
    } catch {
      // Invalid move
    }

    setSelectedSquare(null);
    setLegalTargets([]);
  };

  const handlePromotionSelect = (promo: string) => {
    if (!pendingPromotion) return;
    const { from, to } = pendingPromotion;

    const testChess = new Chess(fen);
    try {
      const result = testChess.move({ from, to, promotion: promo });
      if (result) {
        sound.playCapture();
        onMove?.(from, to, promo, result.san);
      }
    } catch {
      // error
    }

    setPendingPromotion(null);
    setSelectedSquare(null);
    setLegalTargets([]);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, square: Square) => {
    if (!interactive) return;
    const piece = chess.get(square);
    if (!piece) return;
    setDraggedSquare(square);
    setSelectedSquare(square);
    setLegalTargets(chess.moves({ square, verbose: true }));
    e.dataTransfer.setData('text/plain', square);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, toSquare: Square) => {
    e.preventDefault();
    const fromSquare = (e.dataTransfer.getData('text/plain') || draggedSquare) as Square;
    if (fromSquare && fromSquare !== toSquare) {
      const match = legalTargets.find((m) => m.to === toSquare);
      if (match) {
        executeMove(fromSquare, toSquare, match);
      }
    }
    setDraggedSquare(null);
  };

  return (
    <div className="relative select-none aspect-square w-full max-w-[620px] rounded shadow-2xl overflow-hidden border-2 border-zinc-700/50">
      <div className="grid grid-cols-8 grid-rows-8 w-full h-full">
        {displayRanks.map((rank, rIdx) =>
          displayFiles.map((file, fIdx) => {
            const square = `${file}${rank}` as Square;
            const piece = chess.get(square);
            const isLight = (file.charCodeAt(0) - 97 + parseInt(rank)) % 2 !== 0;
            const squareBg = isLight ? colors.light : colors.dark;

            // Highlight conditions
            const isSelected = selectedSquare === square;
            const isLastMove = lastMove && (lastMove.from === square || lastMove.to === square);
            const isPremove = premove && (premove.from === square || premove.to === square);
            const isCheck = checkSquare === square || (piece?.type === 'k' && piece.color === chess.turn() && chess.inCheck());

            // Legal target check
            const targetMove = legalTargets.find((m) => m.to === square);
            const isCaptureTarget = targetMove && (targetMove.captured || chess.get(square));

            return (
              <div
                key={square}
                onClick={() => handleSquareClick(square)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, square)}
                className="relative w-full h-full flex items-center justify-center cursor-pointer transition-colors"
                style={{ backgroundColor: squareBg }}
              >
                {/* Last move highlight */}
                {isLastMove && (
                  <div className="absolute inset-0 bg-[#f7f769] opacity-45 pointer-events-none" />
                )}

                {/* Selected square highlight */}
                {isSelected && (
                  <div className="absolute inset-0 bg-[#f7f769] opacity-60 pointer-events-none" />
                )}

                {/* Pre-move highlight */}
                {isPremove && (
                  <div className="absolute inset-0 bg-red-500 opacity-40 pointer-events-none" />
                )}

                {/* In Check highlight */}
                {isCheck && (
                  <div className="absolute inset-0 bg-red-600/75 rounded-full blur-sm pointer-events-none" />
                )}

                {/* Coordinates */}
                {fIdx === 0 && (
                  <span
                    className="absolute top-0.5 left-1 text-[10px] font-bold pointer-events-none select-none leading-none"
                    style={{ color: isLight ? colors.lightText : colors.darkText }}
                  >
                    {rank}
                  </span>
                )}
                {rIdx === 7 && (
                  <span
                    className="absolute bottom-0.5 right-1 text-[10px] font-bold pointer-events-none select-none leading-none"
                    style={{ color: isLight ? colors.lightText : colors.darkText }}
                  >
                    {file}
                  </span>
                )}

                {/* Piece Icon */}
                {piece && (
                  <div
                    draggable={interactive}
                    onDragStart={(e) => handleDragStart(e, square)}
                    className="w-[84%] h-[84%] flex items-center justify-center z-10 hover:scale-105 active:scale-95 transition-transform"
                  >
                    <PieceIcon
                      code={`${piece.color}${piece.type}`}
                      className="w-full h-full drop-shadow"
                    />
                  </div>
                )}

                {/* Legal Move Indicators */}
                {targetMove && !isCaptureTarget && (
                  <div className="absolute w-3.5 h-3.5 rounded-full bg-black/20 pointer-events-none z-20" />
                )}
                {isCaptureTarget && (
                  <div className="absolute inset-1 rounded-full border-4 border-black/25 pointer-events-none z-20" />
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Pawn Promotion Modal */}
      {pendingPromotion && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-chess-card border border-zinc-700 rounded-xl p-4 shadow-2xl flex flex-col items-center">
            <h4 className="text-sm font-bold text-zinc-300 mb-3 uppercase tracking-wider">
              Choose Promotion
            </h4>
            <div className="flex gap-2">
              {['q', 'r', 'b', 'n'].map((p) => (
                <button
                  key={p}
                  onClick={() => handlePromotionSelect(p)}
                  className="w-14 h-14 bg-zinc-800 hover:bg-chess-green/30 border border-zinc-700 hover:border-chess-green rounded-lg flex items-center justify-center transition-all p-1"
                >
                  <PieceIcon
                    code={`${chess.turn() === 'w' ? 'w' : 'b'}${p}`}
                    size={44}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
