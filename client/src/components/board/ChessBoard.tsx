import React, { useState, useEffect, useRef } from 'react';
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
}

interface AnimatedPiece {
  id: string;
  color: 'w' | 'b';
  type: string;
  square: Square;
  isMoving?: boolean;
}

export const ChessBoard: React.FC<ChessBoardProps> = ({
  fen,
  onMove,
  orientation = 'w',
  interactive = true,
  lastMove = null,
  checkSquare = null,
}) => {
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalTargets, setLegalTargets] = useState<Move[]>([]);
  const [pendingPromotion, setPendingPromotion] = useState<{ from: Square; to: Square } | null>(null);

  // Dragging state
  const [draggedSquare, setDraggedSquare] = useState<Square | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  const chess = new Chess(fen);
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  const displayFiles = orientation === 'w' ? files : [...files].reverse();
  const displayRanks = orientation === 'w' ? ranks : [...ranks].reverse();

  // Clear selection on FEN change
  useEffect(() => {
    setSelectedSquare(null);
    setLegalTargets([]);
  }, [fen]);

  // Compute piece position percentages (0% to 87.5%)
  const getCoordinates = (square: Square) => {
    const file = square[0];
    const rank = square[1];
    const fileIdx = displayFiles.indexOf(file);
    const rankIdx = displayRanks.indexOf(rank);
    return {
      left: `${fileIdx * 12.5}%`,
      top: `${rankIdx * 12.5}%`,
    };
  };

  // Convert board pieces
  const pieces: AnimatedPiece[] = [];
  const board = chess.board();
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p) {
        const file = String.fromCharCode(97 + c);
        const rank = String(8 - r);
        const sq = `${file}${rank}` as Square;
        pieces.push({
          id: `${sq}-${p.color}${p.type}`,
          color: p.color,
          type: p.type,
          square: sq,
          isMoving: lastMove?.to === sq,
        });
      }
    }
  }

  const handleSquareClick = (square: Square) => {
    if (!interactive) return;

    if (selectedSquare) {
      const match = legalTargets.find((m) => m.to === square);
      if (match) {
        triggerMove(selectedSquare, square);
        return;
      }
    }

    const piece = chess.get(square);
    if (piece) {
      setSelectedSquare(square);
      setLegalTargets(chess.moves({ square, verbose: true }));
    } else {
      setSelectedSquare(null);
      setLegalTargets([]);
    }
  };

  const triggerMove = (from: Square, to: Square) => {
    const piece = chess.get(from);
    const isPromotion =
      piece &&
      piece.type === 'p' &&
      ((piece.color === 'w' && to[1] === '8') || (piece.color === 'b' && to[1] === '1'));

    if (isPromotion) {
      setPendingPromotion({ from, to });
      return;
    }

    executeMoveDirect(from, to);
  };

  const executeMoveDirect = (from: Square, to: Square, promo?: string) => {
    const testChess = new Chess(fen);
    try {
      const res = testChess.move({ from, to, promotion: promo });
      if (res) {
        if (res.captured) sound.playCapture();
        else if (res.flags.includes('k') || res.flags.includes('q')) sound.playCastle();
        else sound.playMove();

        if (testChess.inCheck()) sound.playCheck();

        onMove?.(from, to, promo, res.san);
      }
    } catch {
      // Invalid
    }

    setSelectedSquare(null);
    setLegalTargets([]);
    setPendingPromotion(null);
  };

  // Mouse / Touch Drag handlers
  const handleMouseDown = (e: React.MouseEvent, square: Square) => {
    if (!interactive) return;
    const piece = chess.get(square);
    if (!piece) return;

    setSelectedSquare(square);
    setLegalTargets(chess.moves({ square, verbose: true }));
    setDraggedSquare(square);

    if (boardRef.current) {
      const rect = boardRef.current.getBoundingClientRect();
      setDragPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggedSquare || !boardRef.current) return;
    const rect = boardRef.current.getBoundingClientRect();
    setDragPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!draggedSquare || !boardRef.current) return;
    const rect = boardRef.current.getBoundingClientRect();
    const squareWidth = rect.width / 8;
    const squareHeight = rect.height / 8;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const fileIdx = Math.floor(x / squareWidth);
    const rankIdx = Math.floor(y / squareHeight);

    if (fileIdx >= 0 && fileIdx < 8 && rankIdx >= 0 && rankIdx < 8) {
      const targetSquare = `${displayFiles[fileIdx]}${displayRanks[rankIdx]}` as Square;
      if (targetSquare !== draggedSquare) {
        const match = legalTargets.find((m) => m.to === targetSquare);
        if (match) {
          triggerMove(draggedSquare, targetSquare);
        }
      }
    }

    setDraggedSquare(null);
    setDragPos(null);
  };

  return (
    <div
      ref={boardRef}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className="relative select-none aspect-square w-full max-w-[620px] rounded-lg shadow-2xl overflow-hidden border-4 border-[#262421]"
    >
      {/* 8x8 Board Background Grid */}
      <div className="grid grid-cols-8 grid-rows-8 w-full h-full">
        {displayRanks.map((rank, rIdx) =>
          displayFiles.map((file, fIdx) => {
            const sq = `${file}${rank}` as Square;
            const isLight = (file.charCodeAt(0) - 97 + parseInt(rank)) % 2 !== 0;
            const bg = isLight ? '#ebecd0' : '#739552';

            const isSelected = selectedSquare === sq;
            const isLastMove = lastMove && (lastMove.from === sq || lastMove.to === sq);
            const isTarget = legalTargets.some((m) => m.to === sq);
            const isCapture = isTarget && chess.get(sq);
            const isKingInCheck =
              checkSquare === sq ||
              (chess.inCheck() && chess.get(sq)?.type === 'k' && chess.get(sq)?.color === chess.turn());

            return (
              <div
                key={sq}
                onClick={() => handleSquareClick(sq)}
                onMouseDown={(e) => handleMouseDown(e, sq)}
                className="relative w-full h-full flex items-center justify-center cursor-pointer"
                style={{ backgroundColor: bg }}
              >
                {/* Last move highlight */}
                {isLastMove && (
                  <div className="absolute inset-0 bg-[#f7f769] opacity-45 pointer-events-none" />
                )}

                {/* Selected square highlight */}
                {isSelected && (
                  <div className="absolute inset-0 bg-[#f7f769] opacity-60 pointer-events-none" />
                )}

                {/* Check pulse */}
                {isKingInCheck && (
                  <div className="absolute inset-0 bg-red-600/75 rounded-full blur-sm pointer-events-none" />
                )}

                {/* Rank label on left column */}
                {fIdx === 0 && (
                  <span
                    className="absolute top-0.5 left-1 text-[11px] font-black pointer-events-none select-none"
                    style={{ color: isLight ? '#739552' : '#ebecd0' }}
                  >
                    {rank}
                  </span>
                )}

                {/* File label on bottom row */}
                {rIdx === 7 && (
                  <span
                    className="absolute bottom-0.5 right-1 text-[11px] font-black pointer-events-none select-none"
                    style={{ color: isLight ? '#739552' : '#ebecd0' }}
                  >
                    {file}
                  </span>
                )}

                {/* Legal Move Indicators */}
                {isTarget && !isCapture && (
                  <div className="w-3.5 h-3.5 rounded-full bg-black/20 pointer-events-none z-10" />
                )}
                {isCapture && (
                  <div className="absolute inset-1 rounded-full border-4 border-black/25 pointer-events-none z-10" />
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Animated Pieces Layer */}
      <div className="absolute inset-0 pointer-events-none">
        {pieces.map((p) => {
          const isDragged = draggedSquare === p.square;
          if (isDragged) return null; // Rendered in drag overlay

          const coords = getCoordinates(p.square);

          return (
            <div
              key={p.square}
              className={`absolute w-[12.5%] h-[12.5%] flex items-center justify-center p-1 transition-all duration-200 ease-out ${
                p.isMoving ? 'z-20 scale-102 drop-shadow-xl' : 'z-10'
              }`}
              style={{
                left: coords.left,
                top: coords.top,
                transitionProperty: 'left, top, transform',
                transitionDuration: '220ms',
                transitionTimingFunction: 'cubic-bezier(0.2, 0, 0.2, 1)',
              }}
            >
              <PieceIcon
                code={`${p.color}${p.type.toUpperCase()}`}
                className="w-full h-full drop-shadow-md"
              />
            </div>
          );
        })}
      </div>

      {/* Dragging Piece Floating Overlay */}
      {draggedSquare && dragPos && (
        <div
          className="absolute w-[12.5%] h-[12.5%] pointer-events-none z-50 transform -translate-x-1/2 -translate-y-1/2 scale-110 drop-shadow-2xl transition-transform"
          style={{
            left: `${dragPos.x}px`,
            top: `${dragPos.y}px`,
          }}
        >
          {chess.get(draggedSquare) && (
            <PieceIcon
              code={`${chess.get(draggedSquare)?.color}${chess.get(draggedSquare)?.type.toUpperCase()}`}
              className="w-full h-full"
            />
          )}
        </div>
      )}

      {/* Pawn Promotion Modal */}
      {pendingPromotion && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#262421] border border-[#3d3b38] rounded-xl p-4 shadow-2xl flex flex-col items-center">
            <h4 className="text-sm font-black text-white mb-3 uppercase tracking-wider">
              Choose Promotion Piece
            </h4>
            <div className="flex gap-2">
              {['Q', 'R', 'B', 'N'].map((promoType) => (
                <button
                  key={promoType}
                  onClick={() =>
                    executeMoveDirect(
                      pendingPromotion.from,
                      pendingPromotion.to,
                      promoType.toLowerCase()
                    )
                  }
                  className="w-14 h-14 bg-[#302e2b] hover:bg-[#81b64c]/30 border border-[#3d3b38] hover:border-[#81b64c] rounded-xl flex items-center justify-center p-1 transition-all"
                >
                  <PieceIcon
                    code={`${chess.turn() === 'w' ? 'w' : 'b'}${promoType}`}
                    size={42}
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
