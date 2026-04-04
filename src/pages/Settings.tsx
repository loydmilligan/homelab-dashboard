import { useState, useEffect } from 'react';
import { Card } from '../components/Card';

type Theme = 'dark' | 'light' | 'system';

export function Settings() {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('theme') as Theme) || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
    const root = document.documentElement;
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('light-mode', !prefersDark);
    } else {
      root.classList.toggle('light-mode', theme === 'light');
    }
  }, [theme]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-100">Settings</h2>

      <Card>
        <h3 className="text-lg font-medium text-gray-100 mb-4">General</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Theme</label>
            <div className="flex gap-2">
              {(['dark', 'light', 'system'] as Theme[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`px-4 py-2 rounded-lg text-sm capitalize transition-colors ${
                    theme === t
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
