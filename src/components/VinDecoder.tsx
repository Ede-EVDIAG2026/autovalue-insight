import { useState, useRef, useCallback } from 'react';
import { Eye } from 'lucide-react';
import { MARKET_API } from '@/lib/marketApi';
import VinResultModal from './VinResultModal';

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

interface VehicleIdentity {
  make?: string;
  model?: string;
  year?: number;
  body_class?: string;
  electrification?: string;
  manufacturer?: string;
  plant_country?: string;
}

function mapPowertrain(electrification: string | undefined): string {
  if (!electrification) return '';
  const upper = electrification.toUpperCase();
  if (upper === 'BEV') return 'BEV';
  if (upper.includes('PHEV')) return 'PHEV';
  if (upper.includes('HEV')) return 'HEV';
  return '';
}

const electrificationColor: Record<string, string> = {
  BEV: '#22c55e',
  PHEV: '#3b82f6',
  HEV: '#eab308',
  ICE: '#9ca3af',
};

export default function VinDecoder({ onVehicleDecoded, styles }: VinDecoderProps) {
  const [vin, setVin] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const isValid = vin.length === 17;

  const handleVinChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setVin(e.target.value.toUpperCase().slice(0, 17));
    setError('');
    setResult(null);
  }, []);

  const decode = useCallback(async () => {
    if (!isValid) return;
    setLoading(true);
    setError('');
    setResult(null);

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

      setResult(data);

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

  const vi: VehicleIdentity | undefined = result?.vehicle_identity;

  const handleApplyFromModal = () => {
    if (vi?.make) {
      onVehicleDecoded(
        vi.make,
        vi.model || '',
        vi.year ? String(vi.year) : '',
        mapPowertrain(vi.electrification),
        result
      );
    }
    setModalOpen(false);
  };

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

      {/* Hero Card — single vehicle identified card */}
      {result && vi && (
        <div
          style={{
            ...styles.card,
            borderLeft: '4px solid #22c55e',
            padding: 20,
            marginTop: 20,
            cursor: 'pointer',
            transition: 'box-shadow 0.2s',
          }}
          onClick={() => setModalOpen(true)}
          onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)')}
          onMouseLeave={e => (e.currentTarget.style.boxShadow = '')}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#22c55e', marginBottom: 6 }}>✓ Jármű azonosítva</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#1a1a2a', marginBottom: 8 }}>
                {vi.make} {vi.model} {vi.year}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                {vi.body_class && (
                  <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: '#f3f4f6', color: '#374151' }}>{vi.body_class}</span>
                )}
                {vi.electrification && (
                  <span style={{
                    padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                    background: `${electrificationColor[vi.electrification.toUpperCase()] || '#9ca3af'}20`,
                    color: electrificationColor[vi.electrification.toUpperCase()] || '#9ca3af',
                  }}>
                    {vi.electrification}
                  </span>
                )}
              </div>
              {(vi.manufacturer || vi.plant_country) && (
                <div style={{ fontSize: 12, color: '#6b7280' }}>
                  {vi.manufacturer}{vi.manufacturer && vi.plant_country ? ' · ' : ''}{vi.plant_country}
                </div>
              )}
            </div>

            {/* Eye icon action */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 10,
              background: '#eff6ff', border: '1px solid #bfdbfe',
              cursor: 'pointer', flexShrink: 0,
            }}>
              <Eye size={16} color="#2563eb" />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#2563eb', whiteSpace: 'nowrap' }}>
                Összes adat megtekintése
              </span>
            </div>
          </div>
        </div>
      )}

      {/* VIN Details Modal */}
      {modalOpen && result && (
        <VinResultModal
          data={result}
          onClose={() => setModalOpen(false)}
          onApply={handleApplyFromModal}
        />
      )}

      {/* Spinner keyframe */}
      <style>{`@keyframes avSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
