import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { MobileTabBar } from './components/layout/MobileTabBar';
import { HomeView } from './views/HomeView';
import { PlayView } from './views/PlayView';
import { AnalysisView } from './views/AnalysisView';
import { ReviewView } from './views/ReviewView';
import { VariantsView } from './views/VariantsView';
import { PuzzlesView } from './views/PuzzlesView';
import { LeaderboardView } from './views/LeaderboardView';
import { ProfileView } from './views/ProfileView';
import { LearnView } from './views/LearnView';
import { SettingsView } from './views/SettingsView';

export const App: React.FC = () => {
  const [currentTheme, setCurrentTheme] = useState<string>('green');

  return (
    <div className="flex min-h-screen bg-[#302e2b] text-white font-sans">
      {/* Left Navigation Sidebar matching Chess.com */}
      <Navbar currentTheme={currentTheme} onThemeChange={setCurrentTheme} />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 pb-20 md:pb-6 overflow-y-auto">
        <div className="flex-1 p-2 sm:p-4 md:p-6 max-w-7xl w-full mx-auto">
          <Routes>
            <Route path="/" element={<HomeView />} />
            <Route path="/play" element={<PlayView />} />
            <Route path="/analysis" element={<AnalysisView />} />
            <Route path="/review" element={<ReviewView />} />
            <Route path="/variants" element={<VariantsView />} />
            <Route path="/puzzles" element={<PuzzlesView />} />
            <Route path="/leaderboard" element={<LeaderboardView />} />
            <Route path="/profile" element={<ProfileView />} />
            <Route path="/learn" element={<LearnView />} />
            <Route
              path="/settings"
              element={
                <SettingsView
                  currentTheme={currentTheme}
                  onThemeChange={setCurrentTheme}
                />
              }
            />
          </Routes>
        </div>
      </main>

      {/* Bottom Mobile Tab Bar */}
      <MobileTabBar />
    </div>
  );
};

export default App;
