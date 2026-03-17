import { useState, useRef, useCallback } from 'react';
import { MARKET_API } from '@/lib/marketApi';

// ── Types ──
interface VinDecoderProps {
  onVehicleDecoded: (make: string, model: string, year: string, powertrain: string, rawResult?: any) => void;
  styles: {
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

export default function VinDecoder({ onVehicleDecoded, styles }: VinDecoderProps) {
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
    <div style={{ ...styles.card, maxWidth: 680, margin: '0 auto 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <span style={{ fontSize: 20 }}>🔍</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, color: '#1a1a2a' }}>VIN azonosítás</div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>Add meg a VIN számot az automatikus kitöltéshez</div>
        </div>
      </div>

      {/* VIN Input */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <label style={styles.label}>VIN</label>
            <span style={{ fontSize: 12, fontWeight: 600, color: isValid ? '#22c55e' : '#9ca3af' }}>{vin.length}/17</span>
          </div>
          <input
            className="av-inp"
            style={{ ...styles.input, fontFamily: "'DM Mono', monospace", letterSpacing: '0.08em', textTransform: 'uppercase' }}
            value={vin}
            onChange={handleVinChange}
            maxLength={17}
            placeholder="pl. WVWZZZ3CZWE123456"
          />
        </div>
        <button
          className="av-btn"
          style={{ ...styles.btn, width: 'auto', minWidth: 160, opacity: isValid && !loading ? 1 : 0.4, cursor: isValid && !loading ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap' }}
          disabled={!isValid || loading}
          onClick={decode}
        >
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'avSpin 0.8s linear infinite' }} />
              5 AI ügynök elemzi...
            </span>
          ) : '🤖 AI Dekódolás'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* Spinner keyframe */}
      <style>{`@keyframes avSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
