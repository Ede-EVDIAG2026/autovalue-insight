import { useState } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { Settings, LogOut, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Lang } from '@/i18n/translations';
import { useAuth } from '@/hooks/useAuth';
import AuthModal from '@/components/auth/AuthModal';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

const flags: Record<Lang, string> = { HU: '🇭🇺', EN: '🇬🇧', DE: '🇩🇪' };
const langLabels: Record<Lang, string> = { HU: 'HU', EN: 'EN', DE: 'DE' };

const AppHeader = () => {
  const { lang, setLang, tr } = useLanguage();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const langs: Lang[] = ['HU', 'EN', 'DE'];

  const navItems = [
    { path: '/', label: tr('nav_home') },
    { path: '/dashboard', label: tr('nav_dashboard') },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Left: Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl">📊</span>
            <span className="font-display font-bold text-foreground text-lg">EU AutoValue</span>
          </Link>

          {/* Center: Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === item.path
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right: Auth + Language */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link to="/account">
                      <Button variant="ghost" size="icon" className="h-9 w-9">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>{tr('settings')}</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9">
                      <User className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{user.email}</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => signOut()}>
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{tr('sign_out')}</TooltipContent>
                </Tooltip>
              </>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setAuthOpen(true)}>
                {tr('sign_in')}
              </Button>
            )}

            <div className="flex items-center gap-0.5 ml-2 border-l border-border/50 pl-2">
              {langs.map(l => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-2 py-1 rounded text-xs transition-colors ${
                    lang === l
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {flags[l]} {langLabels[l]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
    </>
  );
};

export default AppHeader;
