import React, { useState } from 'react';
import { Trophy, Medal, Award, Flame, Swords, Search } from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  username: string;
  rating: number;
  winRate: number;
  gamesPlayed: number;
  country: string;
}

const SAMPLE_LEADERBOARDS: Record<string, LeaderboardEntry[]> = {
  blitz: [
    { rank: 1, username: 'MagnusCarlsen', rating: 2894, winRate: 74.2, gamesPlayed: 4520, country: '🇳🇴' },
    { rank: 2, username: 'HikaruNakamura', rating: 2888, winRate: 73.8, gamesPlayed: 8912, country: '🇺🇸' },
    { rank: 3, username: 'AlirezaFirouzja', rating: 2820, winRate: 71.5, gamesPlayed: 3105, country: '🇫🇷' },
    { rank: 4, username: 'kyn', rating: 2680, winRate: 69.4, gamesPlayed: 1420, country: '🌐' },
    { rank: 5, username: 'DanielNaroditsky', rating: 2650, winRate: 68.2, gamesPlayed: 5600, country: '🇺🇸' },
  ],
  crazyhouse: [
    { rank: 1, username: 'CrazyTactician', rating: 2450, winRate: 78.1, gamesPlayed: 840, country: '🌐' },
    { rank: 2, username: 'PocketMaster', rating: 2390, winRate: 75.4, gamesPlayed: 1120, country: '🇺🇸' },
    { rank: 3, username: 'kyn', rating: 2310, winRate: 72.0, gamesPlayed: 650, country: '🌐' },
  ],
  bughouse: [
    { rank: 1, username: 'BughouseDuo_Alpha', rating: 2520, winRate: 81.3, gamesPlayed: 990, country: '🇺🇸' },
    { rank: 2, username: 'CrossBoardSnipers', rating: 2480, winRate: 79.2, gamesPlayed: 750, country: '🇬🇧' },
    { rank: 3, username: 'kyn', rating: 2390, winRate: 76.5, gamesPlayed: 520, country: '🌐' },
  ],
  '4-player': [
    { rank: 1, username: 'FourCornersKing', rating: 2340, winRate: 64.5, gamesPlayed: 430, country: '🌐' },
    { rank: 2, username: 'kyn', rating: 2280, winRate: 61.2, gamesPlayed: 380, country: '🌐' },
    { rank: 3, username: 'QuadChaos', rating: 2210, winRate: 59.8, gamesPlayed: 510, country: '🇩🇪' },
  ],
};

export const LeaderboardView: React.FC = () => {
  const [variant, setVariant] = useState('blitz');
  const [searchTerm, setSearchTerm] = useState('');

  const entries = SAMPLE_LEADERBOARDS[variant] || SAMPLE_LEADERBOARDS.blitz;
  const filtered = entries.filter((e) =>
    e.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto p-3 select-none">
      {/* Header */}
      <div className="bg-chess-sidebar border border-chess-border rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center">
            <Trophy className="w-6 h-6 text-yellow-400" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white">Global Leaderboard</h1>
            <p className="text-xs text-zinc-400">
              Rankings calculated via Glicko-2 rating system across all variants.
            </p>
          </div>
        </div>

        {/* Variant selector */}
        <div className="flex gap-1.5 bg-zinc-800 p-1 rounded-lg">
          {['blitz', 'crazyhouse', 'bughouse', '4-player'].map((v) => (
            <button
              key={v}
              onClick={() => setVariant(v)}
              className={`px-3 py-1.5 rounded-md text-xs font-bold capitalize transition-colors ${
                variant === v
                  ? 'bg-chess-green text-white shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard Table Card */}
      <div className="bg-chess-card border border-chess-border rounded-xl overflow-hidden shadow-xl">
        <div className="p-3 border-b border-chess-border flex items-center justify-between">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
            Top Players · {variant.toUpperCase()}
          </span>

          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-2.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search player..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-zinc-800/80 border border-zinc-700 rounded-lg pl-8 pr-3 py-1 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-chess-green"
            />
          </div>
        </div>

        <div className="divide-y divide-zinc-800/80">
          {filtered.map((player) => {
            const isTop3 = player.rank <= 3;
            return (
              <div
                key={player.rank}
                className="px-4 py-3.5 flex items-center justify-between hover:bg-zinc-800/40 transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-7 text-center font-black font-mono text-sm">
                    {player.rank === 1 && <span className="text-yellow-400">🥇</span>}
                    {player.rank === 2 && <span className="text-zinc-300">🥈</span>}
                    {player.rank === 3 && <span className="text-amber-600">🥉</span>}
                    {player.rank > 3 && (
                      <span className="text-zinc-500 font-bold">#{player.rank}</span>
                    )}
                  </div>

                  <span className="text-lg">{player.country}</span>

                  <div>
                    <span className="font-extrabold text-sm text-white block leading-none">
                      {player.username}
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      {player.gamesPlayed} games · {player.winRate}% win rate
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="font-mono font-black text-base text-chess-green block leading-none">
                      {player.rating}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-bold uppercase">
                      Glicko Rating
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
