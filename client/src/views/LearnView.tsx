import React from 'react';
import { GraduationCap, BookOpen, Swords, Shield, Target, Award } from 'lucide-react';

export const LearnView: React.FC = () => {
  const lessons = [
    {
      title: 'Sicilian Defense - Najdorf Variation',
      eco: 'B90',
      moves: '1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6',
      desc: 'The sharpest and most revered defense against 1. e4, favored by Fischer and Kasparov.',
      icon: Swords,
    },
    {
      title: 'Ruy Lopez - Closed Defense',
      eco: 'C84',
      moves: '1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7',
      desc: 'Classical mastery of pawn structures, center control, and slow strategic maneuvering.',
      icon: Shield,
    },
    {
      title: "Queen's Gambit Declined",
      eco: 'D30',
      moves: '1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5 Be7',
      desc: 'The rock-solid bulwark played at the highest World Championship level for over a century.',
      icon: Target,
    },
    {
      title: 'King’s Indian Defense - Mar del Plata',
      eco: 'E97',
      moves: '1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. Nf3 O-O',
      desc: 'Hypermodern counter-attack sacrificing space for a devastating kingside pawn storm.',
      icon: Award,
    },
  ];

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto p-3 select-none">
      <div className="bg-chess-sidebar border border-chess-border rounded-xl p-5 shadow-xl flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center">
          <GraduationCap className="w-7 h-7 text-purple-400" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-white">Opening Explorer & Lessons</h1>
          <p className="text-xs text-zinc-400">
            Master fundamental chess openings and tactical structures with 0 paywalls.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {lessons.map((l) => {
          const Icon = l.icon;
          return (
            <div
              key={l.title}
              className="bg-chess-card border border-chess-border hover:border-zinc-700 rounded-xl p-4 shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon size={18} className="text-chess-green" />
                    <span className="font-extrabold text-white text-sm">{l.title}</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded">
                    {l.eco}
                  </span>
                </div>
                <div className="bg-zinc-900/80 p-2 rounded-lg font-mono text-xs text-chess-green mb-2.5">
                  {l.moves}
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">{l.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
