import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Swords,
  Puzzle,
  GraduationCap,
  Sparkles,
  Trophy,
  Layers,
  Search,
  HelpCircle,
  Globe,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { sound } from '../../utils/audio';

interface NavbarProps {
  currentTheme: string;
  onThemeChange: (theme: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTheme, onThemeChange }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [soundOn, setSoundOn] = useState(sound.isEnabled());

  const toggleSound = () => {
    const next = !soundOn;
    sound.setEnabled(next);
    setSoundOn(next);
  };

  const navLinks = [
    { to: '/play', label: 'Play', icon: Swords, color: 'text-[#81b64c]' },
    { to: '/puzzles', label: 'Puzzles', icon: Puzzle, color: 'text-amber-400' },
    { to: '/learn', label: 'Learn', icon: GraduationCap, color: 'text-cyan-400' },
    { to: '/analysis', label: 'Analysis', icon: SlidersHorizontal, color: 'text-blue-400' },
    { to: '/review', label: 'Game Review', icon: Sparkles, color: 'text-[#1baca6]', badge: 'FREE' },
    { to: '/variants', label: 'Variants', icon: Layers, color: 'text-purple-400' },
    { to: '/leaderboard', label: 'Leaderboard', icon: Trophy, color: 'text-yellow-400' },
  ];

  return (
    <aside
      className={`hidden md:flex flex-col justify-between bg-[#262421] border-r border-[#3d3b38] select-none transition-all duration-300 z-30 ${
        collapsed ? 'w-18' : 'w-56'
      } h-screen sticky top-0`}
    >
      <div>
        {/* Header / Logo matching Chess.com */}
        <div className="h-16 flex items-center justify-between px-3.5 border-b border-[#3d3b38]">
          <NavLink to="/" className="flex items-center gap-2.5 group">
            {/* Iconic Green Pawn / Crown logo */}
            <div className="w-8 h-8 rounded-lg bg-[#81b64c] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
                <path d="M12 2a3 3 0 0 0-3 3c0 .72.26 1.38.69 1.9A3.99 3.99 0 0 0 7 10.5c0 1.05.4 2 1.05 2.73A6.98 6.98 0 0 0 5 19v1a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-1a6.98 6.98 0 0 0-3.05-5.77A3.98 3.98 0 0 0 17 10.5a3.99 3.99 0 0 0-2.69-3.6A3 3 0 0 0 12 2z" />
              </svg>
            </div>
            {!collapsed && (
              <span className="font-black text-xl tracking-tight text-white block leading-none">
                Chess<span className="text-[#81b64c]">.com</span>
              </span>
            )}
          </NavLink>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-zinc-400 hover:text-white p-1 rounded hover:bg-[#302e2b]"
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Navigation list */}
        <nav className="p-2 space-y-1">
          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg font-bold text-sm transition-colors ${
                    isActive
                      ? 'bg-[#21201d] text-white border-l-4 border-[#81b64c] pl-2'
                      : 'text-[#9e9c98] hover:text-white hover:bg-[#302e2b]'
                  } ${collapsed ? 'justify-center' : ''}`
                }
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${item.color}`} />
                {!collapsed && (
                  <span className="flex-1 flex items-center justify-between">
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-[#81b64c] text-zinc-950">
                        {item.badge}
                      </span>
                    )}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom section matching Chess.com Screenshot */}
      <div className="p-3 border-t border-[#3d3b38] space-y-2">
        {!collapsed ? (
          <>
            {/* Search */}
            <button
              onClick={() => {}}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-[#9e9c98] hover:text-white hover:bg-[#302e2b] rounded-lg transition-colors"
            >
              <Search size={16} />
              <span>Search</span>
            </button>

            {/* Sign Up Green Button from Screenshot */}
            <button
              onClick={() => {}}
              className="w-full py-2 px-3 bg-[#81b64c] hover:bg-[#a3d160] active:bg-[#6f9c3f] text-white font-extrabold text-sm rounded-lg shadow transition-all"
            >
              Sign Up
            </button>

            {/* Log In Dark Button from Screenshot */}
            <button
              onClick={() => {}}
              className="w-full py-2 px-3 bg-[#302e2b] hover:bg-[#3b3834] text-white font-bold text-sm rounded-lg border border-[#3d3b38] transition-all"
            >
              Log In
            </button>

            {/* Help & Support + Language */}
            <div className="pt-1 flex items-center justify-between text-[11px] text-[#9e9c98]">
              <span className="flex items-center gap-1 hover:text-white cursor-pointer">
                <HelpCircle size={14} /> Help
              </span>
              <span className="flex items-center gap-1 hover:text-white cursor-pointer">
                <Globe size={14} /> English
              </span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={toggleSound}
              className="p-2 text-zinc-400 hover:text-white rounded"
            >
              {soundOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
