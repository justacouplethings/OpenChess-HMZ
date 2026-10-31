import React, { useState } from 'react';
import { Layers, Users, Swords, Crown, Sparkles } from 'lucide-react';
import { CrazyhouseBoard, PiecePocketMap } from '../components/board/CrazyhouseBoard';
import { BughouseView } from '../components/board/BughouseView';
import { FourPlayerBoard } from '../components/board/FourPlayerBoard';

type ActiveVariantTab = 'crazyhouse' | 'bughouse' | '4-player';

export const VariantsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveVariantTab>('crazyhouse');

  // Crazyhouse state
  const [crazyFen, setCrazyFen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const [crazyTurn, setCrazyTurn] = useState<'w' | 'b'>('w');
  const [whitePocket, setWhitePocket] = useState<PiecePocketMap>({ p: 1, n: 1, b: 0, r: 0, q: 0 });
  const [blackPocket, setBlackPocket] = useState<PiecePocketMap>({ p: 1, n: 0, b: 1, r: 0, q: 0 });

  const handleCrazyMove = (_from: string, _to: string, captured?: string) => {
    if (captured) {
      const p = captured.toLowerCase() as keyof PiecePocketMap;
      if (crazyTurn === 'w') {
        setWhitePocket((prev) => ({ ...prev, [p]: prev[p] + 1 }));
      } else {
        setBlackPocket((prev) => ({ ...prev, [p]: prev[p] + 1 }));
      }
    }
    setCrazyTurn((t) => (t === 'w' ? 'b' : 'w'));
  };

  const handleCrazyDrop = (piece: string, _square: string) => {
    const p = piece.toLowerCase() as keyof PiecePocketMap;
    if (crazyTurn === 'w') {
      setWhitePocket((prev) => ({ ...prev, [p]: Math.max(0, prev[p] - 1) }));
    } else {
      setBlackPocket((prev) => ({ ...prev, [p]: Math.max(0, prev[p] - 1) }));
    }
    setCrazyTurn((t) => (t === 'w' ? 'b' : 'w'));
  };

  const variantCards = [
    {
      id: 'crazyhouse',
      title: 'Crazyhouse',
      icon: Swords,
      desc: 'Captured enemy pieces change color and enter your piece pocket. Drop them onto any legal empty square!',
      badge: 'Fast-Paced',
    },
    {
      id: 'bughouse',
      title: 'Bughouse (2v2)',
      icon: Users,
      desc: 'Two boards, four players in teams of two. Capturing an enemy piece immediately transfers it to your partner’s pocket!',
      badge: 'Team Battle',
    },
    {
      id: '4-player',
      title: '4-Player Chess',
      icon: Crown,
      desc: 'Massive 14x14 battlefield with Red, Blue, Yellow, and Green players circling clockwise with 3x3 void corner cutouts.',
      badge: 'Free-For-All',
    },
  ];

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-3 select-none">
      {/* Variants Navigation Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {variantCards.map((v) => {
          const Icon = v.icon;
          const isSelected = activeTab === v.id;
          return (
            <button
              key={v.id}
              onClick={() => setActiveTab(v.id as ActiveVariantTab)}
              className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden ${
                isSelected
                  ? 'bg-chess-card border-chess-green ring-2 ring-chess-green/50 shadow-xl scale-102'
                  : 'bg-chess-sidebar/80 border-chess-border hover:bg-chess-card hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      isSelected
                        ? 'bg-chess-green text-white shadow'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    <Icon size={20} />
                  </div>
                  <span className="font-extrabold text-white text-base">{v.title}</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-chess-green border border-chess-green/30">
                  {v.badge}
                </span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">{v.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Active Variant Interactive Arena */}
      <div className="bg-chess-sidebar border border-chess-border rounded-xl p-4 shadow-xl flex flex-col items-center">
        {activeTab === 'crazyhouse' && (
          <div className="flex flex-col items-center gap-4 w-full">
            <div className="text-center">
              <h2 className="text-lg font-black text-white flex items-center justify-center gap-2">
                <Swords className="text-chess-green" /> Crazyhouse Arena
              </h2>
              <p className="text-xs text-zinc-400">
                Click a piece in your pocket to select it, then click any empty board square to drop it!
              </p>
            </div>
            <CrazyhouseBoard
              fen={crazyFen}
              whitePocket={whitePocket}
              blackPocket={blackPocket}
              onMove={handleCrazyMove}
              onDropPiece={handleCrazyDrop}
              orientation="w"
              turn={crazyTurn}
            />
          </div>
        )}

        {activeTab === 'bughouse' && <BughouseView />}

        {activeTab === '4-player' && (
          <div className="flex flex-col items-center gap-4 w-full">
            <div className="text-center">
              <h2 className="text-lg font-black text-white flex items-center justify-center gap-2">
                <Crown className="text-amber-400" /> 14x14 4-Player Battle
              </h2>
              <p className="text-xs text-zinc-400">
                Turn cycle: Red (Bottom) → Blue (Left) → Yellow (Top) → Green (Right). The 4 corner 3x3 regions are void.
              </p>
            </div>
            <FourPlayerBoard />
          </div>
        )}
      </div>
    </div>
  );
};
