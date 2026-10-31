import React, { useState } from 'react';
import { PieceIcon } from '../../assets/pieces';
import { sound } from '../../utils/audio';

export type FourColor = 'R' | 'B' | 'Y' | 'G';

export interface FourPlayerPiece {
  color: FourColor;
  type: 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
}

export interface FourPlayerBoardProps {
  onMove?: (from: string, to: string) => void;
  activeColor?: FourColor;
  redTime?: number;
  blueTime?: number;
  yellowTime?: number;
  greenTime?: number;
}

// Initial 14x14 4-Player Board Setup
function createInitialBoard(): Record<string, FourPlayerPiece> {
  const board: Record<string, FourPlayerPiece> = {};
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n'];

  // Red (Bottom): Ranks 1-2, Files d-k
  const redBackRow: Array<'r' | 'n' | 'b' | 'q' | 'k' | 'b' | 'n' | 'r'> = [
    'r', 'n', 'b', 'q', 'k', 'b', 'n', 'r',
  ];
  for (let i = 0; i < 8; i++) {
    const f = files[3 + i]; // d to k
    board[`${f}1`] = { color: 'R', type: redBackRow[i] };
    board[`${f}2`] = { color: 'R', type: 'p' };
  }

  // Yellow (Top): Ranks 14 (back) and 13 (pawns), Files d-k
  const yellowBackRow: Array<'r' | 'n' | 'b' | 'k' | 'q' | 'b' | 'n' | 'r'> = [
    'r', 'n', 'b', 'k', 'q', 'b', 'n', 'r',
  ];
  for (let i = 0; i < 8; i++) {
    const f = files[3 + i];
    board[`${f}14`] = { color: 'Y', type: yellowBackRow[i] };
    board[`${f}13`] = { color: 'Y', type: 'p' };
  }

  // Blue (Left): Files a (back) and b (pawns), Ranks 4-11
  const blueBackCol: Array<'r' | 'n' | 'b' | 'q' | 'k' | 'b' | 'n' | 'r'> = [
    'r', 'n', 'b', 'q', 'k', 'b', 'n', 'r',
  ];
  for (let i = 0; i < 8; i++) {
    const r = (4 + i).toString();
    board[`a${r}`] = { color: 'B', type: blueBackCol[i] };
    board[`b${r}`] = { color: 'B', type: 'p' };
  }

  // Green (Right): Files n (back) and m (pawns), Ranks 4-11
  const greenBackCol: Array<'r' | 'n' | 'b' | 'k' | 'q' | 'b' | 'n' | 'r'> = [
    'r', 'n', 'b', 'k', 'q', 'b', 'n', 'r',
  ];
  for (let i = 0; i < 8; i++) {
    const r = (4 + i).toString();
    board[`n${r}`] = { color: 'G', type: greenBackCol[i] };
    board[`m${r}`] = { color: 'G', type: 'p' };
  }

  return board;
}

export const FourPlayerBoard: React.FC<FourPlayerBoardProps> = ({
  onMove,
  activeColor = 'R',
  redTime = 180,
  blueTime = 180,
  yellowTime = 180,
  greenTime = 180,
}) => {
  const [boardState, setBoardState] = useState<Record<string, FourPlayerPiece>>(createInitialBoard);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);

  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n'];
  const ranks = ['14', '13', '12', '11', '10', '9', '8', '7', '6', '5', '4', '3', '2', '1'];

  // Check if a square is one of the 36 void corner cutouts
  const isVoidSquare = (fIdx: number, rIdx: number): boolean => {
    const isLeftCol = fIdx < 3;
    const isRightCol = fIdx > 10;
    const isTopRow = rIdx < 3; // ranks 14, 13, 12
    const isBottomRow = rIdx > 10; // ranks 3, 2, 1

    return (isLeftCol || isRightCol) && (isTopRow || isBottomRow);
  };

  const handleSquareClick = (square: string) => {
    if (selectedSquare) {
      if (selectedSquare === square) {
        setSelectedSquare(null);
        return;
      }

      const piece = boardState[selectedSquare];
      const targetPiece = boardState[square];

      // Move piece
      const nextBoard = { ...boardState };
      delete nextBoard[selectedSquare];
      nextBoard[square] = piece;

      if (targetPiece) {
        sound.playCapture();
      } else {
        sound.playMove();
      }

      setBoardState(nextBoard);
      onMove?.(selectedSquare, square);
      setSelectedSquare(null);
    } else {
      const piece = boardState[square];
      if (piece && piece.color === activeColor) {
        setSelectedSquare(square);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const playerConfigs = [
    { color: 'R', name: 'Red', time: redTime, bg: 'bg-red-600', ring: 'ring-red-500' },
    { color: 'B', name: 'Blue', time: blueTime, bg: 'bg-blue-600', ring: 'ring-blue-500' },
    { color: 'Y', name: 'Yellow', time: yellowTime, bg: 'bg-yellow-500', ring: 'ring-yellow-400' },
    { color: 'G', name: 'Green', time: greenTime, bg: 'bg-green-600', ring: 'ring-green-500' },
  ];

  return (
    <div className="flex flex-col items-center gap-4 max-w-[680px] w-full">
      {/* 4-Player Badges Header */}
      <div className="grid grid-cols-4 gap-2 w-full">
        {playerConfigs.map((p) => {
          const isActive = activeColor === p.color;
          return (
            <div
              key={p.color}
              className={`py-2 px-2.5 rounded-lg border transition-all flex flex-col items-center justify-center ${
                isActive
                  ? `${p.bg}/25 border-zinc-400 ring-2 ${p.ring} scale-105 shadow-lg`
                  : 'bg-chess-sidebar border-zinc-800 opacity-75'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className={`w-2.5 h-2.5 rounded-full ${p.bg}`} />
                <span className="text-xs font-bold text-zinc-200">{p.name}</span>
              </div>
              <span className="text-sm font-mono font-extrabold text-white">
                {formatTime(p.time)}
              </span>
            </div>
          );
        })}
      </div>

      {/* 14x14 Grid Board with Cutout Void Corners */}
      <div className="relative select-none aspect-square w-full rounded-xl shadow-2xl overflow-hidden border-2 border-zinc-700/60 bg-[#21201d] p-1.5">
        <div className="grid grid-cols-14 grid-rows-14 w-full h-full gap-[1px]">
          {ranks.map((rank, rIdx) =>
            files.map((file, fIdx) => {
              const square = `${file}${rank}`;
              const isVoid = isVoidSquare(fIdx, rIdx);

              if (isVoid) {
                return (
                  <div
                    key={square}
                    className="w-full h-full bg-[#1e1c18] pointer-events-none opacity-40"
                  />
                );
              }

              const piece = boardState[square];
              const isLight = (fIdx + parseInt(rank)) % 2 !== 0;
              const squareBg = isLight ? '#ebecd0' : '#739552';
              const isSelected = selectedSquare === square;

              return (
                <div
                  key={square}
                  onClick={() => handleSquareClick(square)}
                  className={`relative w-full h-full flex items-center justify-center cursor-pointer transition-all ${
                    isSelected ? 'ring-2 ring-yellow-300 z-20' : ''
                  }`}
                  style={{ backgroundColor: squareBg }}
                >
                  {isSelected && (
                    <div className="absolute inset-0 bg-[#f7f769] opacity-60 pointer-events-none" />
                  )}

                  {piece && (
                    <div className="w-[88%] h-[88%] flex items-center justify-center z-10 hover:scale-110 transition-transform">
                      <PieceIcon
                        code={`${piece.color}_${piece.type}`}
                        className="w-full h-full drop-shadow"
                      />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
