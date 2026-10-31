import React from 'react';
import { Settings, Volume2, Palette, ShieldCheck, Zap } from 'lucide-react';
import { sound } from '../utils/audio';

interface SettingsViewProps {
  currentTheme: string;
  onThemeChange: (theme: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ currentTheme, onThemeChange }) => {
  const [soundEnabled, setSoundEnabled] = React.useState(sound.isEnabled());

  const handleSoundToggle = () => {
    const next = !soundEnabled;
    sound.setEnabled(next);
    setSoundEnabled(next);
  };

  const themes = [
    { id: 'green', name: 'Chess.com Classic Green', light: '#ebecd0', dark: '#739552' },
    { id: 'wood', name: 'Natural Warm Wood', light: '#f0d9b5', dark: '#b58863' },
    { id: 'dark', name: 'Modern Dark Carbon', light: '#3b3e40', dark: '#2b2d2f' },
    { id: 'glass', name: 'Ice & Glass Blue', light: '#dee3e6', dark: '#8ca2ad' },
  ];

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto p-3 select-none">
      <div className="bg-chess-sidebar border border-chess-border rounded-xl p-5 shadow-xl flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center">
          <Settings className="w-6 h-6 text-zinc-300" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-white">Application Settings</h1>
          <p className="text-xs text-zinc-400">
            Customize board themes, audio effects, and client engine parameters.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Board Theme */}
        <div className="bg-chess-card border border-chess-border rounded-xl p-4 shadow-md">
          <div className="flex items-center gap-2 mb-3">
            <Palette size={18} className="text-chess-green" />
            <h3 className="font-extrabold text-sm text-white">Board Theme</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => onThemeChange(t.id)}
                className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                  currentTheme === t.id
                    ? 'border-chess-green bg-zinc-800 ring-2 ring-chess-green/40 shadow-lg'
                    : 'border-zinc-700/60 bg-zinc-800/40 hover:bg-zinc-800'
                }`}
              >
                <span className="text-xs font-bold text-zinc-200">{t.name}</span>
                <div className="flex w-8 h-8 rounded border border-zinc-600 overflow-hidden shadow">
                  <div className="w-1/2 h-full" style={{ backgroundColor: t.light }} />
                  <div className="w-1/2 h-full" style={{ backgroundColor: t.dark }} />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Audio settings */}
        <div className="bg-chess-card border border-chess-border rounded-xl p-4 shadow-md flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Volume2 size={20} className="text-chess-green" />
            <div>
              <span className="font-bold text-sm text-white block">Sound Effects</span>
              <span className="text-xs text-zinc-400">
                Play synthesized Web Audio taps, checks, and brilliant chimes
              </span>
            </div>
          </div>
          <button
            onClick={handleSoundToggle}
            className={`w-12 h-6 rounded-full transition-colors relative ${
              soundEnabled ? 'bg-chess-green' : 'bg-zinc-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5 ${
                soundEnabled ? 'left-6.5' : 'left-0.5'
              }`}
            />
          </button>
        </div>

        {/* Engine settings */}
        <div className="bg-chess-card border border-chess-border rounded-xl p-4 shadow-md">
          <div className="flex items-center gap-3 mb-2">
            <Zap size={20} className="text-chess-green" />
            <div>
              <span className="font-bold text-sm text-white block">Stockfish WASM Depth</span>
              <span className="text-xs text-zinc-400">
                Evaluation depth for move classification (Default: Depth 18)
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-3">
            <span className="text-xs font-mono font-bold text-chess-green bg-zinc-900 px-3 py-1 rounded-lg border border-zinc-700">
              Depth 18
            </span>
            <span className="text-xs text-zinc-400">
              Meets official brilliant move detection and blunder threshold criteria.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
