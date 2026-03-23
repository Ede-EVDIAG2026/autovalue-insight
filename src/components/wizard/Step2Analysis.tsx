import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { VehicleData } from '@/pages/AutoValuePage';
import { Check, Loader2, Circle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { createSession, runAnalysis } from '@/lib/avApi';

const AGENTS = [
  'agent_market',
  'agent_condition',
  'agent_regional',
  'agent_velocity',
  'agent_negotiation',
  'agent_bayesian',
  'agent_dealer',
];

type AgentStatus = 'pending' | 'running' | 'done' | 'error';

const Step2Analysis = ({ 
  vehicleData, 
  onComplete 
}: { 
  vehicleData: VehicleData; 
  onComplete: (result: any) => void;
}) => {
  const { tr } = useLanguage();
  const { user } = useAuth();
  const [agentStatuses, setAgentStatuses] = useState<AgentStatus[]>(
    AGENTS.map(() => 'pending')
  );
  const [elapsed, setElapsed] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    runFullAnalysis();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const simulateAgentProgress = (index: number, delay: number) => {
    return new Promise<void>(resolve => {
      setTimeout(() => {
        setAgentStatuses(prev => {
          const next = [...prev];
          next[index] = 'running';
          return next;
        });
      }, delay);
      setTimeout(() => {
        setAgentStatuses(prev => {
          const next = [...prev];
          next[index] = 'done';
          return next;
        });
        resolve();
      }, delay + 3000 + Math.random() * 4000);
    });
  };

  const runFullAnalysis = async () => {
    try {
      // Create session via API
      const session = await createSession({
        vehicle_make: vehicleData.vehicle_make,
        vehicle_model: vehicleData.vehicle_model,
        vehicle_year: vehicleData.vehicle_year,
        vehicle_mileage_km: vehicleData.vehicle_mileage_km,
        vehicle_color: vehicleData.vehicle_color || undefined,
        vehicle_fuel_type: vehicleData.vehicle_fuel_type,
        service_book: vehicleData.service_book,
        owners_count: vehicleData.owners_count,
        accident_free: vehicleData.accident_free,
        target_country: vehicleData.target_country,
        linked_result_id: vehicleData.linked_result_id || undefined,
      });

      if (!session?.id) {
        console.error('Session creation failed:', session);
        toast.error('Hiba történt a munkamenet létrehozásakor.');
        return;
      }

      console.log('Session created:', session.id);

      // Simulate agent progress while waiting for real analysis
      const progressPromises = AGENTS.map((_, i) => simulateAgentProgress(i, i * 2000));
      
      // Call edge function for analysis
      const result = await runAnalysis(session.id);

      // Wait for all visual progress to complete
      await Promise.all(progressPromises);

      if (!result) {
        console.error('Analysis returned no result');
        toast.error('Hiba történt az elemzés során.');
        return;
      }

      // Mark all done
      setAgentStatuses(AGENTS.map(() => 'done'));
      
      setTimeout(() => {
        onComplete(result);
      }, 500);
    } catch (e) {
      console.error('Analysis failed:', e);
      toast.error('Az elemzés sikertelen volt.');
    }
  };

  const estimatedRemaining = Math.max(0, 45 - elapsed);

  return (
    <div className="glass-card p-8 animate-slide-up">
      <div className="text-center mb-10">
        <div className="animate-pulse-slow text-2xl font-display font-bold text-foreground mb-2">
          {tr('analysis_running')}
        </div>
        <p className="text-sm text-muted-foreground">
          {tr('estimated_time')}: ~{estimatedRemaining} {tr('seconds')}
        </p>
      </div>

      <div className="space-y-4 max-w-md mx-auto">
        {AGENTS.map((agent, i) => (
          <div key={agent} className="flex items-center gap-4">
            <div className="w-8 h-8 flex items-center justify-center">
              {agentStatuses[i] === 'done' && (
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                  <Check className="h-4 w-4 text-secondary-foreground" />
                </div>
              )}
              {agentStatuses[i] === 'running' && (
                <Loader2 className="h-6 w-6 text-primary animate-spin" />
              )}
              {agentStatuses[i] === 'pending' && (
                <Circle className="h-6 w-6 text-muted-foreground/30" />
              )}
              {agentStatuses[i] === 'error' && (
                <div className="w-8 h-8 rounded-full bg-destructive flex items-center justify-center">
                  <span className="text-destructive-foreground text-xs">!</span>
                </div>
              )}
            </div>
            <span className={`text-sm font-medium ${
              agentStatuses[i] === 'done' ? 'text-foreground' :
              agentStatuses[i] === 'running' ? 'text-primary' :
              'text-muted-foreground'
            }`}>
              {tr(agent)}
            </span>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="mt-10 h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className="h-full hero-gradient rounded-full transition-all duration-1000"
          style={{ width: `${(agentStatuses.filter(s => s === 'done').length / AGENTS.length) * 100}%` }}
        />
      </div>
    </div>
  );
};

export default Step2Analysis;
