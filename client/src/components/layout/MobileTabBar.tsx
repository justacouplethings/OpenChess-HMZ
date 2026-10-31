import React from 'react';
import { NavLink } from 'react-router-dom';
import { Swords, Puzzle, Sparkles, Layers, User } from 'lucide-react';

export const MobileTabBar: React.FC = () => {
  const tabs = [
    { to: '/', label: 'Play', icon: Swords },
    { to: '/puzzles', label: 'Puzzles', icon: Puzzle },
    { to: '/review', label: 'Review', icon: Sparkles },
    { to: '/variants', label: 'Variants', icon: Layers },
    { to: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-chess-sidebar border-t border-chess-border flex items-center justify-around z-40 px-2">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 px-3 rounded-lg text-xs font-semibold transition-colors ${
                isActive ? 'text-chess-green font-bold' : 'text-zinc-400 hover:text-white'
              }`
            }
          >
            <Icon size={20} className="mb-0.5" />
            <span>{tab.label}</span>
          </NavLink>
        );
      })}
    </div>
  );
};
