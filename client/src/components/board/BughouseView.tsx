import React, { useState } from 'react';
import { CrazyhouseBoard, PiecePocketMap } from './CrazyhouseBoard';
import { Users, Swords } from 'lucide-react';

export const BughouseView: React.FC = () => {
  const [activeBoardTab, setActiveBoardTab] = useState<'1' | '2'>('1');

  // Board 1 State
  const [board1Fen, setBoard1Fen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const [board1Turn, setBoard1Turn] = useState<'w' | 'b'>('w');
  const [board1WhitePocket, setBoard1WhitePocket] = useState<PiecePocketMap>({ p: 0, n: 0, b: 0, r: 0, q: 0 });
  const [board1BlackPocket, setBoard1BlackPocket] = useState<PiecePocketMap>({ p: 0, n: 0, b: 0, r: 0, q: 0 });

  // Board 2 State
  const [board2Fen, setBoard2Fen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const [board2Turn, setBoard2Turn] = useState<'w' | 'b'>('w');
  const [board2WhitePocket, setBoard2WhitePocket] = useState<PiecePocketMap>({ p: 0, n: 0, b: 0, r: 0, q: 0 });
  const [board2BlackPocket, setBoard2BlackPocket] = useState<PiecePocketMap>({ p: 0, n: 0, b: 0, r: 0, q: 0 });

  // Bughouse Partner Pocket Routing Directive:
  // When White captures on Board 1 (Team 1) -> sent to Black on Board 2 (Team 1)!
  // When Black captures on Board 1 (Team 2) -> sent to White on Board 2 (Team 2)!
  const handleBoard1Move = (_from: string, _to: string, captured?: string) => {
    if (captured) {
      const piece = captured.toLowerCase() as keyof PiecePocketMap;
      if (board1Turn === 'w') {
        // Player 1W (Team 1) captured -> Goes to Player 2B (Team 1) pocket on Board 2!
        setBoard2BlackPocket((prev) => ({ ...prev, [piece]: prev[piece] + 1 }));
      } else {
        // Player 1B (Team 2) captured -> Goes to Player 2W (Team 2) pocket on Board 2!
        setBoard2WhitePocket((prev) => ({ ...prev, [piece]: prev[piece] + 1 }));
      }
    }
    setBoard1Turn((t) => (t === 'w' ? 'b' : 'w'));
  };

  const handleBoard2Move = (_from: string, _to: string, captured?: string) => {
    if (captured) {
      const piece = captured.toLowerCase() as keyof PiecePocketMap;
      if (board2Turn === 'w') {
        // Player 2W (Team 2) captured -> Goes to Player 1B (Team 2) pocket on Board 1!
        setBoard1BlackPocket((prev) => ({ ...prev, [piece]: prev[piece] + 1 }));
      } else {
        // Player 2B (Team 1) captured -> Goes to Player 1W (Team 1) pocket on Board 1!
        setBoard1WhitePocket((prev) => ({ ...prev, [piece]: prev[piece] + 1 }));
      }
    }
    setBoard2Turn((t) => (t === 'w' ? 'b' : 'w'));
  };

  return (
    <div className="flex flex-col gap-5 w-full max-w-6xl mx-auto p-2">
      {/* Header with Teams Info */}
      <div className="bg-chess-sidebar border border-chess-border rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-chess-green/20 border border-chess-green/40 flex items-center justify-center">
            <Users className="w-5 h-5 text-chess-green" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Bughouse Dual-Board Arena
              <span className="text-xs bg-chess-green text-white font-extrabold px-2 py-0.5 rounded-full">
                4-Player Co-op
              </span>
            </h2>
            <p className="text-xs text-zinc-400">
              Captures on Board 1 automatically transfer to your partner's piece pocket on Board 2 in real-time.
            </p>
          </div>
        </div>

        {/* Team Rosters */}
        <div className="flex gap-4 text-xs">
          <div className="bg-zinc-800/80 px-3 py-1.5 rounded-lg border border-zinc-700">
            <span className="font-bold text-chess-green block">Team 1</span>
            <span className="text-zinc-300">Board 1 (White) + Board 2 (Black)</span>
          </div>
          <div className="bg-zinc-800/80 px-3 py-1.5 rounded-lg border border-zinc-700">
            <span className="font-bold text-blue-400 block">Team 2</span>
            <span className="text-zinc-300">Board 1 (Black) + Board 2 (White)</span>
          </div>
        </div>
      </div>

      {/* Mobile Tab switcher */}
      <div className="md:hidden flex rounded-lg bg-zinc-800 p-1">
        <button
          onClick={() => setActiveBoardTab('1')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-md ${
            activeBoardTab === '1' ? 'bg-chess-green text-white' : 'text-zinc-400'
          }`}
        >
          Board 1
        </button>
        <button
          onClick={() => setActiveBoardTab('2')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-md ${
            activeBoardTab === '2' ? 'bg-chess-green text-white' : 'text-zinc-400'
          }`}
        >
          Board 2
        </button>
      </div>

      {/* Side-by-side or Tabbed Boards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        {/* Board 1 */}
        <div
          className={`flex flex-col items-center bg-chess-card border border-chess-border rounded-xl p-4 ${
            activeBoardTab === '1' ? 'block' : 'hidden md:flex'
          }`}
        >
          <div className="w-full flex items-center justify-between mb-3">
            <span className="font-bold text-sm text-zinc-200 flex items-center gap-1.5">
              <Swords size={16} className="text-chess-green" /> Board 1
            </span>
            <span className="text-xs bg-zinc-800 px-2 py-0.5 rounded text-zinc-400 font-mono">
              Turn: {board1Turn === 'w' ? 'White' : 'Black'}
            </span>
          </div>
          <CrazyhouseBoard
            fen={board1Fen}
            whitePocket={board1WhitePocket}
            blackPocket={board1BlackPocket}
            onMove={handleBoard1Move}
            orientation="w"
            turn={board1Turn}
          />
        </div>

        {/* Board 2 */}
        <div
          className={`flex flex-col items-center bg-chess-card border border-chess-border rounded-xl p-4 ${
            activeBoardTab === '2' ? 'block' : 'hidden md:flex'
          }`}
        >
          <div className="w-full flex items-center justify-between mb-3">
            <span className="font-bold text-sm text-zinc-200 flex items-center gap-1.5">
              <Swords size={16} className="text-blue-400" /> Board 2
            </span>
            <span className="text-xs bg-zinc-800 px-2 py-0.5 rounded text-zinc-400 font-mono">
              Turn: {board2Turn === 'w' ? 'White' : 'Black'}
            </span>
          </div>
          <CrazyhouseBoard
            fen={board2Fen}
            whitePocket={board2WhitePocket}
            blackPocket={board2BlackPocket}
            onMove={handleBoard2Move}
            orientation="w"
            turn={board2Turn}
          />
        </div>
      </div>
    </div>
  );
};
