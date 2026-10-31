import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Swords,
  Puzzle,
  GraduationCap,
  Sparkles,
  Trophy,
  User,
  Settings,
  Layers,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  Crown,
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
    { to: '/', label: 'Play', icon: Swords },
    { to: '/puzzles', label: 'Puzzles', icon: Puzzle },
    { to: '/review', label: 'Game Review', icon: Sparkles, badge: 'FREE' },
    { to: '/variants', label: 'Variants', icon: Layers },
    { to: '/learn', label: 'Learn', icon: GraduationCap },
    { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { to: '/profile', label: 'Profile', icon: User },
  ];

  const themes = [
    { id: 'green', label: 'Green' },
    { id: 'wood', label: 'Wood' },
    { id: 'dark', label: 'Dark' },
    { id: 'glass', label: 'Glass' },
  ];

  return (
    <aside
      className={`hidden md:flex flex-col justify-between bg-chess-sidebar border-r border-chess-border select-none transition-all duration-300 z-30 ${
        collapsed ? 'w-20' : 'w-60'
      } h-screen sticky top-0`}
    >
      <div>
        {/* Header / Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-chess-border">
          <NavLink to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-lg bg-chess-green flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <Crown className="w-6 h-6 text-white" />
            </div>
            {!collapsed && (
              <div>
                <span className="font-extrabold text-xl tracking-tight text-white block leading-none">
                  Open<span className="text-chess-green">Chess</span>
                </span>
                <span className="text-[10px] text-zinc-400 font-semibold tracking-wider uppercase">
                  100% Free · No Limits
                </span>
              </div>
            )}
          </NavLink>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-zinc-400 hover:text-white p-1 rounded-md hover:bg-chess-card"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Navigation items */}
        <nav className="p-3 space-y-1">
          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3.5 px-3 py-3 rounded-lg font-semibold text-sm transition-colors ${
                    isActive
                      ? 'bg-chess-card text-white border-l-4 border-chess-green pl-2'
                      : 'text-zinc-400 hover:text-white hover:bg-chess-card/50'
                  } ${collapsed ? 'justify-center' : ''}`
                }
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && (
                  <span className="flex-1 flex items-center justify-between">
                    {item.label}
                    {item.badge && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-chess-green/20 text-chess-green border border-chess-green/30">
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

      {/* Footer controls: theme selector & sound */}
      <div className="p-3 border-t border-chess-border space-y-2">
        {!collapsed && (
          <div className="bg-chess-card/60 rounded-lg p-2.5 space-y-2">
            <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
              <span>Theme</span>
              <span className="capitalize text-zinc-300">{currentTheme}</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {themes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => onThemeChange(t.id)}
                  className={`text-xs py-1 rounded font-medium transition-all ${
                    currentTheme === t.id
                      ? 'bg-chess-green text-white font-bold'
                      : 'bg-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-2 py-1`}>
          <button
            onClick={toggleSound}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-chess-card flex items-center gap-2"
            title={soundOn ? 'Mute Sounds' : 'Unmute Sounds'}
          >
            {soundOn ? <Volume2 size={18} /> : <VolumeX size={18} className="text-red-400" />}
            {!collapsed && <span className="text-xs">{soundOn ? 'Sound On' : 'Muted'}</span>}
          </button>

          {!collapsed && (
            <NavLink
              to="/settings"
              className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-chess-card"
              title="Settings"
            >
              <Settings size={18} />
            </NavLink>
          )}
        </div>
      </div>
    </aside>
  );
};
