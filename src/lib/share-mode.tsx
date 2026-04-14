import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

const SHARE_SAFE_MODE_KEY = 'shost.shareSafeMode';

type ShareModeContextValue = {
  shareSafeMode: boolean;
  setShareSafeMode: (value: boolean) => void;
};

const ShareModeContext = createContext<ShareModeContextValue | null>(null);

export function ShareModeProvider({ children }: { children: ReactNode }) {
  const [shareSafeMode, setShareSafeMode] = useState<boolean>(() => {
    return localStorage.getItem(SHARE_SAFE_MODE_KEY) === 'true';
  });

  useEffect(() => {
    localStorage.setItem(SHARE_SAFE_MODE_KEY, String(shareSafeMode));
  }, [shareSafeMode]);

  return (
    <ShareModeContext.Provider value={{ shareSafeMode, setShareSafeMode }}>
      {children}
    </ShareModeContext.Provider>
  );
}

export function useShareMode() {
  const context = useContext(ShareModeContext);
  if (!context) {
    throw new Error('useShareMode must be used within ShareModeProvider');
  }

  return context;
}

export function getRedactedLabel() {
  return 'Hidden in share-safe mode';
}
