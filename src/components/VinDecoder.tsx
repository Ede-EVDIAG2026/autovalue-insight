import { useState, useRef, useCallback } from 'react';
import { MARKET_API } from '@/lib/marketApi';

// ── Types ──
interface VinDecoderProps {
  onVehicleDecoded: (make: string, model: string, year: string, powertrain: string, rawResult?: any) => void;
  styles?: {
    card: React.CSSProperties;
    input: React.CSSProperties;
    btn: React.CSSProperties;
    label: React.CSSProperties;
    muted: React.CSSProperties;
  };
}

function mapPowertrain(electrification: string | undefined): string {
  if (!electrification) return '';
  const upper = electrification.toUpperCase();
  if (upper === 'BEV') return 'BEV';
  if (upper.includes('PHEV')) return 'PHEV';
  if (upper.includes('HEV')) return 'HEV';
  return '';
}

export default function VinDecoder({ onVehicleDecoded }: VinDecoderProps) {
  const [vin, setVin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  const isValid = vin.length === 17;

  const handleVinChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setVin(e.target.value.toUpperCase().slice(0, 17));
    setError('');
  }, []);

  const decode = useCallback(async () => {
    if (!isValid) return;
    setLoading(true);
    setError('');

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(`${MARKET_API}/vin/decode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ vin, include_market_price: true }),
        signal: controller.signal,
      });

      if (res.status === 400) {
        setError('❌ Érvénytelen VIN – ellenőrizd a 17 karaktert');
        return;
      }
      if (!res.ok) throw new Error(`API ${res.status}`);

      const data = await res.json();

      const hasIdentity = Boolean(data.vehicle_identity?.make);
      if (!hasIdentity) {
        setError('🔌 API nem elérhető');
        return;
      }

      const vi = data.vehicle_identity;
      if (vi?.make) {
        onVehicleDecoded(
          vi.make,
          vi.model || '',
          vi.year ? String(vi.year) : '',
          mapPowertrain(vi.electrification),
          data
        );
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.name === 'AbortError') return;
      setError('🔌 API nem elérhető');
    } finally {
      setLoading(false);
    }
  }, [vin, isValid, onVehicleDecoded]);

  return (
    <div className="bg-card rounded-2xl shadow-md p-6 md:p-8 max-w-[680px] mx-auto mb-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <span className="text-2xl text-blue-600">🔍</span>
        <div>
          <div className="font-bold text-xl text-foreground">VIN azonosítás</div>
          <div className="text-sm text-muted-foreground mt-1">Add meg a VIN számot az automatikus kitöltéshez</div>
        </div>
      </div>

      {/* VIN Input */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
        <div className="flex-1">
          <div className="flex justify-between mb-1.5">
            <label className="text-sm font-medium text-foreground">VIN</label>
            <span className={`text-xs font-semibold ${isValid ? 'text-green-500' : 'text-muted-foreground'}`}>{vin.length}/17</span>
          </div>
          <input
            className="w-full border border-border rounded-xl px-4 py-3 text-base bg-background font-mono tracking-widest uppercase placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            value={vin}
            onChange={handleVinChange}
            maxLength={17}
            placeholder="pl. WVWZZZ3CZWE123456"
          />
        </div>
        <button
          className={`w-full sm:w-auto min-w-[160px] rounded-xl px-6 py-3 font-semibold text-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors whitespace-nowrap ${!isValid || loading ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
          disabled={!isValid || loading}
          onClick={decode}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              5 AI ügynök elemzi...
            </span>
          ) : '🤖 AI Dekódolás'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-3 px-3.5 py-2.5 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
