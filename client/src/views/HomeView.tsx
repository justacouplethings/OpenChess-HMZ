import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Swords, Bot, Sparkles, Puzzle, GraduationCap, Trophy, ChevronRight } from 'lucide-react';
import { ChessBoard } from '../components/board/ChessBoard';

export const HomeView: React.FC = () => {
  const navigate = useNavigate();

  // Position from screenshot: 1. e4 e5 2. Nf3
  const [fen] = useState('r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3');

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-5rem)] max-w-6xl mx-auto px-4 py-8 select-none">
      {/* Hero Section matching Chess.com Screenshot */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center w-full">
        {/* Left: Signature Chessboard */}
        <div className="lg:col-span-7 flex justify-center">
          <div className="w-full max-w-[500px] shadow-2xl rounded-lg overflow-hidden border-4 border-[#262421]">
            <ChessBoard
              fen={fen}
              orientation="w"
              interactive={false}
              lastMove={{ from: 'g1', to: 'f3' }}
            />
          </div>
        </div>

        {/* Right: Call to action from screenshot */}
        <div className="lg:col-span-5 flex flex-col items-center lg:items-start text-center lg:text-left">
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-[1.1] mb-3">
            Play Chess Online on the #1 Site!
          </h1>
          <p className="text-base text-[#9e9c98] font-medium mb-8 max-w-md">
            Join 250+ million players in the world’s largest chess community. Zero paywalls, zero daily limits, and unlimited local Game Review.
          </p>

          {/* Big Green 'Get Started' Button from screenshot */}
          <button
            onClick={() => navigate('/play')}
            className="w-full sm:w-auto px-10 py-4 rounded-xl bg-[#81b64c] hover:bg-[#a3d160] active:bg-[#6f9c3f] text-white font-black text-xl shadow-xl transition-all duration-150 transform hover:scale-102 flex items-center justify-center gap-3 mb-4"
          >
            <span>Get Started</span>
            <ChevronRight size={24} />
          </button>

          {/* Quick mode shortcuts */}
          <div className="grid grid-cols-2 gap-3 w-full max-w-md">
            <button
              onClick={() => navigate('/play')}
              className="py-3 px-4 rounded-xl bg-[#262421] hover:bg-[#322f2b] border border-[#3d3b38] text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow"
            >
              <Swords size={18} className="text-[#81b64c]" />
              <span>Play Online</span>
            </button>
            <button
              onClick={() => navigate('/analysis')}
              className="py-3 px-4 rounded-xl bg-[#262421] hover:bg-[#322f2b] border border-[#3d3b38] text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow"
            >
              <Sparkles size={18} className="text-[#81b64c]" />
              <span>Free Review</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Feature Cards from screenshot */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-16 pt-12 border-t border-[#3d3b38]">
        {/* Card 1: Lessons */}
        <div
          onClick={() => navigate('/learn')}
          className="bg-[#262421] hover:bg-[#2c2926] border border-[#3d3b38] hover:border-[#81b64c]/50 rounded-2xl p-6 transition-all cursor-pointer group flex flex-col justify-between shadow-xl"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <GraduationCap className="w-6 h-6 text-cyan-400" />
            </div>
            <h3 className="text-lg font-black text-white mb-1.5">Improve with Lessons</h3>
            <p className="text-xs text-[#9e9c98] leading-relaxed">
              Learn key openings, endgames, and master concepts designed for players of all levels.
            </p>
          </div>
          <span className="text-xs font-bold text-cyan-400 mt-4 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            Explore Openings &rarr;
          </span>
        </div>

        {/* Card 2: Puzzles */}
        <div
          onClick={() => navigate('/puzzles')}
          className="bg-[#262421] hover:bg-[#2c2926] border border-[#3d3b38] hover:border-[#81b64c]/50 rounded-2xl p-6 transition-all cursor-pointer group flex flex-col justify-between shadow-xl"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Puzzle className="w-6 h-6 text-amber-400" />
            </div>
            <h3 className="text-lg font-black text-white mb-1.5">Solve Tactics Puzzles</h3>
            <p className="text-xs text-[#9e9c98] leading-relaxed">
              Sharpen your tactical radar with daily mating nets, pins, forks, and deflection puzzles.
            </p>
          </div>
          <span className="text-xs font-bold text-amber-400 mt-4 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            Solve Daily Puzzle &rarr;
          </span>
        </div>

        {/* Card 3: Free Game Review */}
        <div
          onClick={() => navigate('/analysis')}
          className="bg-[#262421] hover:bg-[#2c2926] border border-[#3d3b38] hover:border-[#81b64c]/50 rounded-2xl p-6 transition-all cursor-pointer group flex flex-col justify-between shadow-xl"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-[#81b64c]/20 border border-[#81b64c]/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Sparkles className="w-6 h-6 text-[#81b64c]" />
            </div>
            <h3 className="text-lg font-black text-white mb-1.5">Unlimited Game Review</h3>
            <p className="text-xs text-[#9e9c98] leading-relaxed">
              Every game reviewed at Stockfish Depth 18 with CAPS2 accuracy scoring and zero paywalls.
            </p>
          </div>
          <span className="text-xs font-bold text-[#81b64c] mt-4 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            Launch Analysis &rarr;
          </span>
        </div>
      </div>
    </div>
  );
};
