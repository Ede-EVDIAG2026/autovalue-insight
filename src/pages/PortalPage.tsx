import { useState, useEffect } from 'react';
import AppHeader from '@/components/AppHeader';
import { useLanguage } from '@/i18n/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Car, Calendar, TrendingUp } from 'lucide-react';
import { listSessions } from '@/lib/avApi';

const PortalPage = () => {
  const { tr } = useLanguage();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const data = await listSessions();
      setSessions(data?.sessions || data || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const filtered = sessions.filter(s => {
    if (filter === 'all') return true;
    if (filter === 'completed') return s.status === 'completed';
    return s.status === 'pending';
  });

  const formatPrice = (val: number | null) => {
    if (!val) return '—';
    return new Intl.NumberFormat('hu-HU').format(val) + ' Ft';
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-display font-bold text-foreground">
            {tr('portal_title')}
          </h1>
          <Button onClick={() => navigate('/valuation')} className="hero-gradient">
            {tr('new_valuation')}
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {(['all', 'completed', 'pending'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {tr(f === 'all' ? 'all' : f === 'completed' ? 'completed' : 'in_progress')}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20 text-muted-foreground">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">{tr('no_valuations')}</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate('/valuation')}>
              {tr('start_valuation')}
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {filtered.map(session => {
              const result = session.auto_value_results?.[0] || session.result;
              return (
                <div key={session.id} className="glass-card p-6 flex items-center gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-display font-bold text-foreground">
                        {session.vehicle_make} {session.vehicle_model}
                      </h3>
                      <Badge variant={session.status === 'completed' ? 'default' : 'secondary'}>
                        {session.status === 'completed' ? tr('completed') : tr('in_progress')}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {session.vehicle_year}
                      </span>
                      <span>{session.vehicle_mileage_km?.toLocaleString()} km</span>
                      <span>{new Date(session.created_at).toLocaleDateString('hu-HU')}</span>
                    </div>
                  </div>
                  {result && (
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">
                        {formatPrice(result.recommended_ask_huf)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {tr('recommended_ask')}
                      </p>
                    </div>
                  )}
                  <Button variant="outline" size="sm">
                    {tr('open')}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PortalPage;
