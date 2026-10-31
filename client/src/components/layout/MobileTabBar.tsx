import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Swords, SlidersHorizontal, Puzzle, Layers } from 'lucide-react';

export const MobileTabBar: React.FC = () => {
  const tabs = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/play', label: 'Play', icon: Swords },
    { to: '/analysis', label: 'Analysis', icon: SlidersHorizontal },
    { to: '/puzzles', label: 'Puzzles', icon: Puzzle },
    { to: '/variants', label: 'Variants', icon: Layers },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#262421] border-t border-[#3d3b38] flex items-center justify-around z-40 px-2">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 px-3 rounded-lg text-xs font-bold transition-colors ${
                isActive ? 'text-[#81b64c]' : 'text-[#9e9c98] hover:text-white'
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
