import { useState, useRef, useCallback } from 'react';

const MARKET_API = 'https://market.evdiag.hu';

// ── Types ──
interface VinDecoderProps {
  onVehicleDecoded: (make: string, model: string, year: string, powertrain: string) => void;
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

interface EquipmentData {
  trim_level?: string;
  confidence?: string;
  standard_equipment?: string[];
  value_positive?: string[];
  value_negative?: string[];
  eu_market_notes?: string;
}

interface RecallEntry {
  component?: string;
  summary?: string;
}

interface SafetyData {
  recall_count?: number;
  recalls?: RecallEntry[];
  complaints_count?: number;
  tesla_specific?: {
    hw_version?: string;
    fsd_capable?: boolean;
    autopilot_level?: string;
    software_options_value_eur?: number;
  };
}

interface ValuationImpact {
  overall_condition_score?: number;
  total_adjustment_pct?: number;
  confidence?: string;
  key_value_drivers?: string[];
  recommendation?: string;
  inspection_priorities?: string[];
}

interface VinResult {
  vehicle_identity?: VehicleIdentity;
  equipment?: EquipmentData;
  safety?: SafetyData;
  valuation_impact?: ValuationImpact;
}

function mapPowertrain(electrification: string | undefined): string {
  if (!electrification) return '';
  const upper = electrification.toUpperCase();
  if (upper === 'BEV') return 'BEV';
  if (upper.includes('PHEV')) return 'PHEV';
  if (upper.includes('HEV')) return 'HEV';
  return '';
}

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) + '…' : text;
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
  const [result, setResult] = useState<VinResult | null>(null);
  const [error, setError] = useState('');
  const [expandedRecalls, setExpandedRecalls] = useState(false);
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

      const data: VinResult = await res.json();

      // Check for partial data
      const hasIdentity = Boolean(data.vehicle_identity?.make);
      if (!hasIdentity) {
        setError('🔌 API nem elérhető');
        return;
      }

      setResult(data);

      // Auto-fill callback
      const vi = data.vehicle_identity;
      if (vi?.make) {
        onVehicleDecoded(
          vi.make,
          vi.model || '',
          vi.year ? String(vi.year) : '',
          mapPowertrain(vi.electrification)
        );
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.name === 'AbortError') return;
      setError('🔌 API nem elérhető');
    } finally {
      setLoading(false);
    }
  }, [vin, isValid, onVehicleDecoded]);

  const vi = result?.vehicle_identity;
  const eq = result?.equipment;
  const safety = result?.safety;
  const impact = result?.valuation_impact;

  const recallCount = safety?.recall_count ?? 0;
  const recallBorderColor = recallCount === 0 ? '#22c55e' : recallCount <= 2 ? '#eab308' : '#ef4444';

  const conditionScore = impact?.overall_condition_score ?? 0;
  const conditionColor = conditionScore >= 8 ? '#22c55e' : conditionScore >= 5 ? '#eab308' : '#ef4444';

  const confidenceBadge = (level: string | undefined) => {
    const colors: Record<string, string> = { high: '#22c55e', medium: '#eab308', low: '#9ca3af' };
    const color = colors[level || 'low'] || '#9ca3af';
    return (
      <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: `${color}20`, color, border: `1px solid ${color}40` }}>
        {level || 'low'}
      </span>
    );
  };

  // Check if any agent had partial errors
  const hasPartialData = result && vi?.make && (
    (eq && !eq.trim_level) || (safety && safety.recall_count === undefined) || (impact && impact.overall_condition_score === undefined)
  );

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

      {/* Results */}
      {result && vi && (
        <div style={{ marginTop: 20, display: 'grid', gap: 16 }}>
          {hasPartialData && (
            <div style={{ padding: '8px 12px', borderRadius: 8, background: '#fffbeb', border: '1px solid #fde68a', fontSize: 12, color: '#92400e' }}>
              ⚠ Részleges adat – európai jármű
            </div>
          )}

          {/* Card 1: Vehicle Identity */}
          <div style={{ ...styles.card, borderLeft: '4px solid #22c55e', padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2a', marginBottom: 10 }}>✓ Jármű azonosítva</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#1a1a2a', marginBottom: 10 }}>
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

          {/* Card 2: Equipment */}
          {eq && (
            <div style={{ ...styles.card, borderLeft: '4px solid #3b82f6', padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2a', marginBottom: 10 }}>🔧 Felszereltség</div>
              {eq.trim_level && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>{eq.trim_level}</span>
                  {confidenceBadge(eq.confidence)}
                </div>
              )}
              {eq.standard_equipment && eq.standard_equipment.length > 0 && (
                <ul style={{ margin: '0 0 10px 16px', padding: 0, fontSize: 13, color: '#374151' }}>
                  {eq.standard_equipment.slice(0, 5).map((item, i) => (
                    <li key={i} style={{ marginBottom: 3 }}>{item}</li>
                  ))}
                </ul>
              )}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                {eq.value_positive?.map((v, i) => (
                  <span key={i} style={{ padding: '2px 8px', borderRadius: 10, fontSize: 11, background: '#dcfce7', color: '#166534' }}>{v}</span>
                ))}
                {eq.value_negative?.map((v, i) => (
                  <span key={i} style={{ padding: '2px 8px', borderRadius: 10, fontSize: 11, background: '#fee2e2', color: '#991b1b' }}>{v}</span>
                ))}
              </div>
              {eq.eu_market_notes && (
                <div style={{ fontSize: 12, color: '#9ca3af', fontStyle: 'italic', marginTop: 6 }}>{eq.eu_market_notes}</div>
              )}
            </div>
          )}

          {/* Card 3: Safety & Recalls */}
          {safety && (
            <div style={{ ...styles.card, borderLeft: `4px solid ${recallBorderColor}`, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2a', marginBottom: 10 }}>🛡️ Biztonság & Visszahívások</div>
              <div style={{ marginBottom: 10 }}>
                <span style={{
                  display: 'inline-block', padding: '4px 14px', borderRadius: 12, fontSize: 14, fontWeight: 700,
                  background: recallCount === 0 ? '#dcfce7' : '#fef3c7',
                  color: recallCount === 0 ? '#166534' : '#92400e',
                }}>
                  {recallCount === 0 ? '✓ Nincs visszahívás' : `⚠ ${recallCount} visszahívás`}
                </span>
              </div>
              {safety.complaints_count !== undefined && (
                <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>{safety.complaints_count} NHTSA panasz</div>
              )}

              {/* Tesla-specific */}
              {vi.make?.toUpperCase() === 'TESLA' && safety.tesla_specific && (
                <div style={{ padding: 12, borderRadius: 8, background: '#f8f9fa', marginBottom: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#1a1a2a', marginBottom: 6 }}>Tesla specifikus</div>
                  <div style={{ fontSize: 12, color: '#374151', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                    {safety.tesla_specific.hw_version && <div>HW: <strong>{safety.tesla_specific.hw_version}</strong></div>}
                    <div>FSD: <strong>{safety.tesla_specific.fsd_capable ? '✓' : '✗'}</strong></div>
                    {safety.tesla_specific.autopilot_level && <div>AP: <strong>{safety.tesla_specific.autopilot_level}</strong></div>}
                    {safety.tesla_specific.software_options_value_eur !== undefined && (
                      <div>SW érték: <strong>€{safety.tesla_specific.software_options_value_eur.toLocaleString()}</strong></div>
                    )}
                  </div>
                </div>
              )}

              {/* Recalls list */}
              {safety.recalls && safety.recalls.length > 0 && (
                <div>
                  {safety.recalls.slice(0, expandedRecalls ? undefined : 3).map((r, i) => (
                    <div key={i} style={{ padding: '6px 0', borderTop: i > 0 ? '1px solid #e5e7eb' : 'none', fontSize: 12, color: '#374151' }}>
                      <strong>{r.component}</strong>
                      <div style={{ color: '#6b7280', marginTop: 2 }}>{truncate(r.summary || '', 80)}</div>
                    </div>
                  ))}
                  {safety.recalls.length > 3 && !expandedRecalls && (
                    <button onClick={() => setExpandedRecalls(true)} style={{ border: 'none', background: 'none', color: '#3b82f6', fontSize: 12, cursor: 'pointer', marginTop: 4 }}>
                      + {safety.recalls.length - 3} további
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Card 4: Valuation Impact */}
          {impact && (
            <div style={{ ...styles.card, borderLeft: '4px solid #c9a84c', padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2a', marginBottom: 10 }}>💰 Értékelési hatás</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
                {impact.overall_condition_score !== undefined && (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 36, fontWeight: 800, color: conditionColor }}>{conditionScore}<span style={{ fontSize: 16, color: '#6b7280' }}>/10</span></div>
                  </div>
                )}
                {impact.total_adjustment_pct !== undefined && (
                  <div style={{ fontSize: 22, fontWeight: 700, color: impact.total_adjustment_pct >= 0 ? '#22c55e' : '#ef4444' }}>
                    {impact.total_adjustment_pct >= 0 ? '+' : ''}{impact.total_adjustment_pct}%
                  </div>
                )}
                {impact.confidence && confidenceBadge(impact.confidence)}
              </div>

              {/* Key value drivers */}
              {impact.key_value_drivers && impact.key_value_drivers.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                  {impact.key_value_drivers.slice(0, 3).map((d, i) => (
                    <span key={i} style={{ padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>{d}</span>
                  ))}
                </div>
              )}

              {impact.recommendation && (
                <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.5, marginBottom: 10 }}>{impact.recommendation}</p>
              )}

              {impact.inspection_priorities && impact.inspection_priorities.length > 0 && (
                <ol style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: '#374151' }}>
                  {impact.inspection_priorities.slice(0, 3).map((p, i) => (
                    <li key={i} style={{ marginBottom: 3 }}>{p}</li>
                  ))}
                </ol>
              )}
            </div>
          )}
        </div>
      )}

      {/* Spinner keyframe */}
      <style>{`@keyframes avSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
