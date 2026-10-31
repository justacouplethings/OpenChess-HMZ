import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Swords,
  Bot,
  UserCheck,
  BarChart2,
  Trophy,
  Layers,
  History,
  GraduationCap,
  BookOpen,
  Dumbbell,
  Search,
  Lightbulb,
  Crosshair,
  Flag,
  Users,
  Shield,
  Globe,
  Award,
  Radio,
  FileText,
  MessageSquare,
  HelpCircle,
  Puzzle,
  Eye,
  MoreHorizontal,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface NavbarProps {
  currentTheme: string;
  onThemeChange: (theme: string) => void;
}

export const Navbar: React.FC<NavbarProps> = () => {
  const navigate = useNavigate();
  const [activeFlyout, setActiveFlyout] = useState<string | null>(null);

  // Play flyout items from user screenshot
  const playSubmenu = [
    { label: 'Play Online', icon: Swords, to: '/play' },
    { label: 'Play Bots', icon: Bot, to: '/play' },
    { label: 'Play Coach', icon: UserCheck, to: '/analysis' },
    { divider: true },
    { label: 'Stats', icon: BarChart2, to: '/profile' },
    { label: 'Tournaments', icon: Trophy, to: '/play' },
    { label: 'Variants', icon: Layers, to: '/variants' },
    { label: 'Game History', icon: History, to: '/profile' },
  ];

  // Learn flyout items from user screenshot
  const learnSubmenu = [
    { label: 'Lessons', icon: GraduationCap, to: '/learn' },
    { label: 'Play Coach', icon: UserCheck, to: '/analysis' },
    { label: 'Openings', icon: BookOpen, to: '/learn' },
  ];

  // Train flyout items from user screenshot
  const trainSubmenu = [
    { label: 'Courses', icon: BookOpen, to: '/learn' },
    { label: 'Analysis', icon: Search, to: '/analysis' },
    { label: 'Game Review', icon: Sparkles, to: '/review' },
    { label: 'Insights', icon: Lightbulb, to: '/analysis' },
    { label: 'Classroom', icon: Layers, to: '/learn' },
    { label: 'Endgames', icon: Trophy, to: '/puzzles' },
    { label: 'Practice', icon: Crosshair, to: '/play' },
    { label: 'Aimchess', icon: Users, to: '/analysis' },
  ];

  // Community flyout items from user screenshot
  const communitySubmenu = [
    { label: 'Friends', icon: Users, to: '/leaderboard' },
    { label: 'Clubs', icon: Shield, to: '/leaderboard' },
    { label: 'Members', icon: Globe, to: '/leaderboard' },
    { label: 'Coaches', icon: UserCheck, to: '/learn' },
    { divider: true },
    { label: 'Top Players', icon: Award, to: '/leaderboard' },
    { label: 'Chess Ratings', icon: BarChart2, to: '/leaderboard' },
    { label: 'Leaderboards', icon: Trophy, to: '/leaderboard' },
    { divider: true },
    { label: 'Chess Today', icon: Radio, to: '/learn' },
    { label: 'News', icon: FileText, to: '/learn' },
    { label: 'Articles', icon: FileText, to: '/learn' },
    { label: 'Blogs', icon: FileText, to: '/learn' },
    { label: 'Forums', icon: MessageSquare, to: '/leaderboard' },
  ];

  const mainNav = [
    { id: 'play', label: 'Play', icon: Swords, to: '/play', submenu: playSubmenu },
    { id: 'puzzles', label: 'Puzzles', icon: Puzzle, to: '/puzzles' },
    { id: 'learn', label: 'Learn', icon: GraduationCap, to: '/learn', submenu: learnSubmenu },
    { id: 'train', label: 'Train', icon: Dumbbell, to: '/analysis', submenu: trainSubmenu },
    { id: 'watch', label: 'Watch', icon: Eye, to: '/play' },
    { id: 'community', label: 'Community', icon: Users, to: '/leaderboard', submenu: communitySubmenu },
    { id: 'other', label: 'Other', icon: MoreHorizontal, to: '/variants' },
  ];

  return (
    <aside
      className="hidden md:flex flex-col justify-between bg-[#262421] border-r border-[#383531] select-none w-[130px] h-screen sticky top-0 z-40"
      onMouseLeave={() => setActiveFlyout(null)}
    >
      <div>
        {/* Chess.com Brand Header from Screenshot */}
        <div className="h-14 flex items-center px-3.5 border-b border-[#383531]">
          <NavLink to="/" className="flex items-center gap-1.5 group">
            <div className="w-7 h-7 rounded bg-[#81b64c] flex items-center justify-center shadow">
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                <path d="M12 2a3 3 0 0 0-3 3c0 .72.26 1.38.69 1.9A3.99 3.99 0 0 0 7 10.5c0 1.05.4 2 1.05 2.73A6.98 6.98 0 0 0 5 19v1a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-1a6.98 6.98 0 0 0-3.05-5.77A3.98 3.98 0 0 0 17 10.5a3.99 3.99 0 0 0-2.69-3.6A3 3 0 0 0 12 2z" />
              </svg>
            </div>
            <span className="font-extrabold text-base tracking-tight text-white">
              Chess<span className="text-[#81b64c]">.com</span>
            </span>
          </NavLink>
        </div>

        {/* Primary Nav Items with Hover Flyout Popovers */}
        <nav className="p-1.5 space-y-0.5">
          {mainNav.map((item) => {
            const Icon = item.icon;
            const isHovered = activeFlyout === item.id;

            return (
              <div
                key={item.id}
                className="relative"
                onMouseEnter={() => setActiveFlyout(item.submenu ? item.id : null)}
              >
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2.5 rounded-lg font-bold text-sm transition-all ${
                      isActive || isHovered
                        ? 'bg-[#312e2b] text-white shadow-sm'
                        : 'text-[#9e9c98] hover:text-white hover:bg-[#312e2b]'
                    }`
                  }
                >
                  <Icon size={18} className="flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </NavLink>

                {/* Flyout Submenu Panel directly from screenshots */}
                {isHovered && item.submenu && (
                  <div
                    className="absolute left-full top-0 ml-1.5 w-52 bg-[#1b1916] border border-[#3d3b38] rounded-xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                    onMouseEnter={() => setActiveFlyout(item.id)}
                  >
                    <div className="space-y-0.5">
                      {item.submenu.map((sub, sIdx) => {
                        if (sub.divider) {
                          return <hr key={sIdx} className="my-1.5 border-[#383531]" />;
                        }

                        const SubIcon = sub.icon;
                        return (
                          <button
                            key={sub.label}
                            onClick={() => {
                              setActiveFlyout(null);
                              if (sub.to) navigate(sub.to);
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold text-zinc-300 hover:text-white hover:bg-[#2c2926] transition-colors text-left"
                          >
                            <SubIcon size={16} className="text-[#81b64c]" />
                            <span>{sub.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Bottom section matching Chess.com Screenshot */}
      <div className="p-2 border-t border-[#383531] space-y-1.5">
        <button
          onClick={() => navigate('/analysis')}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-bold text-[#9e9c98] hover:text-white hover:bg-[#312e2b] rounded-lg transition-colors"
        >
          <Search size={15} />
          <span>Search</span>
        </button>

        <button
          onClick={() => {}}
          className="w-full py-1.5 px-2 bg-[#81b64c] hover:bg-[#a3d160] active:bg-[#6f9c3f] text-white font-extrabold text-xs rounded-lg shadow transition-all"
        >
          Sign Up
        </button>

        <button
          onClick={() => {}}
          className="w-full py-1.5 px-2 bg-[#312e2b] hover:bg-[#3b3834] text-white font-bold text-xs rounded-lg border border-[#3d3b38] transition-all"
        >
          Log In
        </button>

        <div className="pt-1 flex items-center justify-between text-[10px] text-[#9e9c98] px-1">
          <span className="flex items-center gap-0.5 hover:text-white cursor-pointer">
            <HelpCircle size={12} /> Help
          </span>
          <span className="flex items-center gap-0.5 hover:text-white cursor-pointer">
            <Globe size={12} /> English
          </span>
        </div>
      </div>
    </aside>
  );
};
