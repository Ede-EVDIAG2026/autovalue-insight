import React from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Handshake, FileText, ArrowRight, ChevronRight } from 'lucide-react';
import AppHeader from '@/components/AppHeader';

const LandingPage = () => {
  const { tr } = useLanguage();
  const navigate = useNavigate();

  const pillars = [
    { icon: BarChart3, title: tr('pillar1_title'), desc: tr('pillar1_desc'), emoji: '📊' },
    { icon: Handshake, title: tr('pillar2_title'), desc: tr('pillar2_desc'), emoji: '🤝' },
    { icon: FileText, title: tr('pillar3_title'), desc: tr('pillar3_desc'), emoji: '📝' },
  ];

  const steps = [
    { num: '1', label: tr('how_step1'), icon: '🚗' },
    { num: '2', label: tr('how_step2'), icon: '🤖' },
    { num: '3', label: tr('how_step3'), icon: '📊' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 hero-gradient opacity-[0.03]" />
        <div className="absolute top-20 right-10 w-72 h-72 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-10 left-10 w-56 h-56 rounded-full bg-secondary/5 blur-3xl" />
        
        <div className="container mx-auto px-4 pt-20 pb-24 relative">
          <div className="max-w-3xl mx-auto text-center animate-slide-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-light border border-primary/10 mb-8">
              <span className="text-sm font-medium text-primary">📊 EU AutoValue Intelligence™</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-foreground leading-tight mb-6">
              {tr('tagline')}
            </h1>
            
            <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              {tr('subtitle')}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg" 
                className="hero-gradient text-lg px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]"
                onClick={() => navigate('/valuation')}
              >
                {tr('start_valuation')}
              </Button>
            </div>
            
            <p className="text-sm text-muted-foreground mt-4">{tr('no_registration')}</p>
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pillars.map((p, i) => (
              <div 
                key={i} 
                className="glass-card p-8 text-center hover:scale-[1.02] transition-transform"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <span className="text-4xl mb-4 block">{p.emoji}</span>
                <h3 className="text-xl font-display font-bold text-foreground mb-3">{p.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-display font-bold text-center text-foreground mb-16">
            {tr('how_title')}
          </h2>
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 max-w-4xl mx-auto">
            {steps.map((s, i) => (
              <React.Fragment key={i}>
                <div className="flex flex-col items-center text-center gap-4 flex-1">
                  <div className="w-20 h-20 rounded-2xl hero-gradient flex items-center justify-center text-3xl shadow-lg">
                    {s.icon}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-primary mb-1">
                      {s.num}. lépés
                    </div>
                    <p className="font-display font-semibold text-foreground">{s.label}</p>
                  </div>
                </div>
                {i < steps.length - 1 && (
                  <ChevronRight className="text-muted-foreground hidden md:block" size={24} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* Audit Suite Banner */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto glass-card p-8 flex flex-col sm:flex-row items-center gap-6">
            <div className="text-4xl">🔗</div>
            <div className="flex-1">
              <p className="text-foreground font-medium mb-1">{tr('audit_banner')}</p>
            </div>
            <Button variant="outline" className="shrink-0 border-primary/20 text-primary hover:bg-primary-light">
              {tr('link_now')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground text-sm">
            EU AutoValue Intelligence™ | {tr('powered_by')}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
