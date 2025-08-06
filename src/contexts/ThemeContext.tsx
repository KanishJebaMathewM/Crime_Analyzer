import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeMode = 'light' | 'dark' | 'default';

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  isTransitioning: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const savedTheme = localStorage.getItem('crime-dashboard-theme') as ThemeMode;
    return savedTheme || 'default';
  });
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    localStorage.setItem('crime-dashboard-theme', theme);

    setIsTransitioning(true);

    document.documentElement.classList.remove('light', 'dark', 'default');
    document.body.classList.remove('light', 'dark', 'default');

    document.documentElement.offsetHeight; // force reflow

    if (theme === 'light') {
      document.documentElement.classList.add('light');
      document.body.classList.add('light');
      document.documentElement.style.setProperty(
        '--theme-background',
        'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 25%, #bdbdbd 50%, #9e9e9e 75%, #757575 100%)'
      );
    } else if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
      document.documentElement.style.setProperty(
        '--theme-background',
        'linear-gradient(135deg, #16161d 0%, #1e1e2f 25%, #263238 50%, #37474f 75%, #0f62fe 100%)'
      );
    } else {
      document.documentElement.classList.add('default');
      document.body.classList.add('default');

      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark');
        document.documentElement.style.setProperty(
          '--theme-background',
          'linear-gradient(135deg, #16161d 0%, #1e1e2f 25%, #263238 50%, #37474f 75%, #0f62fe 100%)'
        );
      } else {
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('dark');
        document.documentElement.style.setProperty(
          '--theme-background',
          'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 25%, #bdbdbd 50%, #9e9e9e 75%, #757575 100%)'
        );
      }
    }

    const timer = setTimeout(() => {
      setIsTransitioning(false);
    }, 400);

    if (theme === 'default') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        if (e.matches) {
          document.documentElement.classList.add('dark');
          document.body.classList.add('dark');
          document.documentElement.style.setProperty(
            '--theme-background',
            'linear-gradient(135deg, #16161d 0%, #1e1e2f 25%, #263238 50%, #37474f 75%, #0f62fe 100%)'
          );
        } else {
          document.documentElement.classList.remove('dark');
          document.body.classList.remove('dark');
          document.documentElement.style.setProperty(
            '--theme-background',
            'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 25%, #bdbdbd 50%, #9e9e9e 75%, #757575 100%)'
          );
        }
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => {
        mediaQuery.removeEventListener('change', handleChange);
        clearTimeout(timer);
      };
    }

    return () => clearTimeout(timer);
  }, [theme]);

  const toggleTheme = () => {
    const themes: ThemeMode[] = ['default', 'light', 'dark'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, isTransitioning }}>
      {children}
    </ThemeContext.Provider>
  );
};
