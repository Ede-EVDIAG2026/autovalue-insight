// Language context with localStorage persistence
import React, { createContext, useContext, useState, useCallback } from 'react';
import { Lang, t } from './translations';

type LanguageContextType = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  tr: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextType | null>(null);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Lang>(
    () => (localStorage.getItem('evdiag_lang') as Lang) || 'HU'
  );

  const setLang = (l: Lang) => {
    localStorage.setItem('evdiag_lang', l);
    setLangState(l);
  };

  const tr = useCallback((key: string): string => {
    return t[key]?.[lang] ?? key;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, tr }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
};
