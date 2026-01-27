import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light' | 'system';
type FontSize = 'small' | 'medium' | 'large';
type FontStyle = 'default' | 'google-sans' | 'nunito-sans' | 'playfair-display' | 'roboto' | 'inter' | 'dm-sans' | 'merriweather' | 'ibm-plex-sans';

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

interface ThemeProviderState {
  theme: Theme;
  fontSize: FontSize;
  fontStyle: FontStyle;
  reducedMotion: boolean;
  highContrast: boolean;
  setTheme: (theme: Theme) => void;
  setFontSize: (size: FontSize) => void;
  setFontStyle: (style: FontStyle) => void;
  setReducedMotion: (enabled: boolean) => void;
  setHighContrast: (enabled: boolean) => void;
}

const initialState: ThemeProviderState = {
  theme: 'system',
  fontSize: 'medium',
  fontStyle: 'default',
  reducedMotion: false,
  highContrast: false,
  setTheme: () => null,
  setFontSize: () => null,
  setFontStyle: () => null,
  setReducedMotion: () => null,
  setHighContrast: () => null,
};

const ThemeContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'ui-theme-settings',
}: ThemeProviderProps) {
  // Initialize state from localStorage or defaults
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.theme || defaultTheme;
      }
    } catch (e) {
      console.warn("Failed to parse theme settings", e);
    }
    return defaultTheme;
  });

  const [fontSize, setFontSizeState] = useState<FontSize>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.fontSize || 'medium';
      }
    } catch { }
    return 'medium';
  });

  const [reducedMotion, setReducedMotionState] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.reducedMotion || false;
      }
    } catch { }
    return false;
  });

  const [highContrast, setHighContrastState] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.highContrast || false;
      }
    } catch { }
    return false;
  });

  const [fontStyle, setFontStyleState] = useState<FontStyle>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.fontStyle || 'default';
      }
    } catch { }
    return 'default';
  });

  // Persist all settings whenever they change
  useEffect(() => {
    const settings = { theme, fontSize, reducedMotion, highContrast, fontStyle };
    localStorage.setItem(storageKey, JSON.stringify(settings));
  }, [theme, fontSize, reducedMotion, highContrast, fontStyle, storageKey]);

  // Apply Font Style
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(
      'font-style-default', 
      'font-style-google-sans', 
      'font-style-nunito-sans', 
      'font-style-playfair-display', 
      'font-style-roboto',
      'font-style-inter',
      'font-style-dm-sans',
      'font-style-merriweather',
      'font-style-ibm-plex-sans'
    );
    root.classList.add(`font-style-${fontStyle}`);
  }, [fontStyle]);

  // Apply Theme
  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  // Apply Font Size
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('text-size-small', 'text-size-medium', 'text-size-large');
    root.classList.add(`text-size-${fontSize}`);
  }, [fontSize]);

  // Apply Accessibility Settings
  useEffect(() => {
    const root = window.document.documentElement;
    
    if (reducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }

    if (highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
  }, [reducedMotion, highContrast]);

  const value = {
    theme,
    fontSize,
    reducedMotion,
    highContrast,
    setTheme: (theme: Theme) => setThemeState(theme),
    setFontSize: (size: FontSize) => setFontSizeState(size),
    setReducedMotion: (enabled: boolean) => setReducedMotionState(enabled),
    setHighContrast: (enabled: boolean) => setHighContrastState(enabled),
    fontStyle,
    setFontStyle: (style: FontStyle) => setFontStyleState(style),
  };

  return (
    <ThemeContext.Provider {...{ value }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider');

  return context;
};
