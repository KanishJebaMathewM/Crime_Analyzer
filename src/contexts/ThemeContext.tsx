import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeMode = 'light' | 'dark' | 'default';

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
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

  useEffect(() => {
    localStorage.setItem('crime-dashboard-theme', theme);
    
    // Remove all theme classes first
    document.documentElement.classList.remove('light', 'dark', 'default');
    
    // Apply the selected theme
    if (theme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      // Default mode - use system preference
      document.documentElement.classList.add('default');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [theme]);

  const toggleTheme = () => {
    const themes: ThemeMode[] = ['default', 'light', 'dark'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
