import { useLanguage } from '@/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Lang } from '@/i18n/translations';

const flags: Record<Lang, string> = { HU: '🇭🇺', EN: '🇬🇧', DE: '🇩🇪' };

const AppHeader = () => {
  const { lang, setLang, tr } = useLanguage();
  const location = useLocation();
  const langs: Lang[] = ['HU', 'EN', 'DE'];

  const navItems = [
    { path: '/', label: tr('nav_home') },
    { path: '/valuation', label: tr('nav_valuation') },
    { path: '/portal', label: tr('nav_portal') },
  ];

  return (
    <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border/50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-xl">📊</span>
          <span className="font-display font-bold text-foreground text-lg">EU AutoValue</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === item.path
                  ? 'bg-primary-light text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          {langs.map(l => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`px-2 py-1 rounded text-sm transition-colors ${
                lang === l 
                  ? 'bg-primary-light text-primary font-medium' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {flags[l]}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
