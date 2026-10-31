import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Shield, Sparkles, Swords, Zap, Clock, Award, History, Download } from 'lucide-react';

export const ProfileView: React.FC = () => {
  const navigate = useNavigate();

  const ratings = [
    { variant: 'Bullet', rating: 2540, rd: '±45', games: 320, icon: Zap, color: 'text-amber-400' },
    { variant: 'Blitz', rating: 2680, rd: '±38', games: 1420, icon: FlameIcon, color: 'text-yellow-400' },
    { variant: 'Rapid', rating: 2490, rd: '±52', games: 180, icon: Clock, color: 'text-blue-400' },
    { variant: 'Crazyhouse', rating: 2310, rd: '±65', games: 650, icon: Swords, color: 'text-purple-400' },
    { variant: 'Bughouse', rating: 2390, rd: '±58', games: 520, icon: Swords, color: 'text-indigo-400' },
    { variant: '4-Player', rating: 2280, rd: '±70', games: 380, icon: Award, color: 'text-red-400' },
  ];

  const recentGames = [
    {
      id: 'g-1',
      opponent: 'GrandmasterBot',
      result: '1-0',
      variant: 'Blitz (3+0)',
      movesCount: 42,
      accuracy: 94.2,
      date: 'Today',
    },
    {
      id: 'g-2',
      opponent: 'TacticsMaster',
      result: '1-0',
      variant: 'Crazyhouse',
      movesCount: 28,
      accuracy: 91.5,
      date: 'Yesterday',
    },
    {
      id: 'g-3',
      opponent: 'BlitzWizard',
      result: '1/2-1/2',
      variant: 'Blitz (3+0)',
      movesCount: 56,
      accuracy: 89.1,
      date: '2 days ago',
    },
  ];

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto p-3 select-none">
      {/* Profile Header */}
      <div className="bg-chess-sidebar border border-chess-border rounded-xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-chess-green to-emerald-400 p-0.5 shadow-xl">
            <div className="w-full h-full rounded-2xl bg-zinc-900 flex items-center justify-center font-black text-2xl text-chess-green">
              kyn
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-white">kyn</h1>
              <span className="text-xs bg-chess-green text-zinc-950 font-black px-2 py-0.5 rounded uppercase">
                Architect
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Member since October 2026 · Lead Developer / Architect designation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-zinc-800/80 px-4 py-2 rounded-xl border border-zinc-700 text-center">
            <span className="text-[10px] text-zinc-400 uppercase font-bold block">
              Total Games
            </span>
            <span className="text-lg font-black font-mono text-white">3,470</span>
          </div>
          <div className="bg-zinc-800/80 px-4 py-2 rounded-xl border border-zinc-700 text-center">
            <span className="text-[10px] text-zinc-400 uppercase font-bold block">
              Win Rate
            </span>
            <span className="text-lg font-black font-mono text-chess-green">69.4%</span>
          </div>
        </div>
      </div>

      {/* Ratings Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {ratings.map((r) => {
          const Icon = r.icon;
          return (
            <div
              key={r.variant}
              className="bg-chess-card border border-chess-border rounded-xl p-3.5 flex flex-col justify-between shadow-md hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-zinc-400">{r.variant}</span>
                <Icon size={16} className={r.color} />
              </div>
              <div>
                <span className="text-2xl font-black font-mono text-white block leading-none">
                  {r.rating}
                </span>
                <span className="text-[10px] text-zinc-500 font-semibold">
                  {r.rd} · {r.games} games
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Games with Free Review Action */}
      <div className="bg-chess-card border border-chess-border rounded-xl p-4 shadow-xl">
        <div className="flex items-center justify-between mb-4 border-b border-zinc-800 pb-2">
          <div className="flex items-center gap-2">
            <History size={18} className="text-chess-green" />
            <h3 className="font-extrabold text-sm text-white uppercase tracking-wider">
              Recent Matches
            </h3>
          </div>
          <span className="text-xs text-zinc-400">Unlimited Stockfish 16.1 Game Review</span>
        </div>

        <div className="space-y-2">
          {recentGames.map((g) => (
            <div
              key={g.id}
              className="bg-zinc-800/50 hover:bg-zinc-800/80 rounded-xl p-3 border border-zinc-700/60 flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`text-xs font-mono font-black px-2 py-0.5 rounded ${
                    g.result === '1-0'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                  }`}
                >
                  {g.result}
                </span>
                <div>
                  <span className="text-sm font-bold text-white block leading-none">
                    vs {g.opponent}
                  </span>
                  <span className="text-xs text-zinc-400">
                    {g.variant} · {g.movesCount} moves · {g.date}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-xs font-black font-mono text-chess-green block leading-none">
                    {g.accuracy}%
                  </span>
                  <span className="text-[10px] text-zinc-500 uppercase font-semibold">Accuracy</span>
                </div>

                <button
                  onClick={() => navigate('/review')}
                  className="px-3 py-1.5 rounded-lg bg-chess-green hover:bg-chess-green-hover text-white font-bold text-xs flex items-center gap-1.5 shadow transition-transform hover:scale-102"
                >
                  <Sparkles size={14} /> Review
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

function FlameIcon(props: { size?: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={props.size || 16}
      height={props.size || 16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
    >
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  );
}
