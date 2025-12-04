
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type AppMode = 'rentals' | 'realestate';

interface AppModeContextType {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  toggleMode: () => void;
  isRentals: boolean;
  isRealEstate: boolean;
}

const AppModeContext = createContext<AppModeContextType | undefined>(undefined);

export const AppModeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setModeState] = useState<AppMode>(() => {
    const saved = localStorage.getItem('tuleeto-app-mode');
    return (saved === 'realestate' ? 'realestate' : 'rentals') as AppMode;
  });

  useEffect(() => {
    localStorage.setItem('tuleeto-app-mode', mode);
    
    // Update document class for theme styling
    document.documentElement.classList.remove('theme-rentals', 'theme-realestate');
    document.documentElement.classList.add(`theme-${mode}`);
  }, [mode]);

  const setMode = (newMode: AppMode) => {
    setModeState(newMode);
  };

  const toggleMode = () => {
    setModeState(prev => prev === 'rentals' ? 'realestate' : 'rentals');
  };

  return (
    <AppModeContext.Provider value={{
      mode,
      setMode,
      toggleMode,
      isRentals: mode === 'rentals',
      isRealEstate: mode === 'realestate'
    }}>
      {children}
    </AppModeContext.Provider>
  );
};

export const useAppMode = () => {
  const context = useContext(AppModeContext);
  if (context === undefined) {
    throw new Error('useAppMode must be used within an AppModeProvider');
  }
  return context;
};
