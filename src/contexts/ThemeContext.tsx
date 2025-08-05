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
    
    // Start transition
    setIsTransitioning(true);
    
    // Remove all theme classes first
    document.documentElement.classList.remove('light', 'dark', 'default');
    document.body.classList.remove('light', 'dark', 'default');
    
    // Force a reflow to ensure classes are removed
    document.documentElement.offsetHeight;
    
    // Apply the selected theme to both html and body
    if (theme === 'light') {
      document.documentElement.classList.add('light');
      document.body.classList.add('light');
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
      
      // Add light theme specific meta
      document.documentElement.style.setProperty('--theme-background', 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 25%, #bae6fd 50%, #7dd3fc 75%, #38bdf8 100%)');
      
    } else if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
      document.documentElement.classList.remove('light');
      document.body.classList.remove('light');
      
      // Add dark theme specific meta
      document.documentElement.style.setProperty('--theme-background', 'linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #334155 50%, #475569 75%, #64748b 100%)');
      
    } else {
      // Default mode - use system preference
      document.documentElement.classList.add('default');
      document.body.classList.add('default');
      
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark');
        document.documentElement.style.setProperty('--theme-background', 'linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #334155 50%, #475569 75%, #64748b 100%)');
      } else {
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('dark');
        document.documentElement.style.setProperty('--theme-background', 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 25%, #bae6fd 50%, #7dd3fc 75%, #38bdf8 100%)');
      }
    }
    
    // End transition after animation completes
    const timer = setTimeout(() => {
      setIsTransitioning(false);
    }, 400);
    
    // Listen for system theme changes when in default mode
    if (theme === 'default') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        if (e.matches) {
          document.documentElement.classList.add('dark');
          document.body.classList.add('dark');
          document.documentElement.style.setProperty('--theme-background', 'linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #334155 50%, #475569 75%, #64748b 100%)');
        } else {
          document.documentElement.classList.remove('dark');
          document.body.classList.remove('dark');
          document.documentElement.style.setProperty('--theme-background', 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 25%, #bae6fd 50%, #7dd3fc 75%, #38bdf8 100%)');
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
