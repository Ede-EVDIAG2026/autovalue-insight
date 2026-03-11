import { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

// ── Types ──
interface VinResultModalProps {
  data: any;
  onClose: () => void;
  onApply: () => void;
}

const getStyles = (mobile: boolean) => ({
  overlay: {
    position: 'fixed' as const, inset: 0, zIndex: 10000,
    background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: mobile ? 'stretch' : 'center', justifyContent: 'center',
    padding: mobile ? 0 : 16,
  },
  modal: {
    background: '#ffffff', borderRadius: mobile ? 0 : 16, width: '100%', maxWidth: mobile ? '100%' : 800,
    maxHeight: mobile ? '100vh' : '90vh', height: mobile ? '100vh' : 'auto',
    overflow: 'auto', boxShadow: mobile ? 'none' : '0 24px 64px rgba(0,0,0,0.2)',
    position: 'relative' as const,
  },
  header: {
    position: 'sticky' as const, top: 0, zIndex: 1,
    background: '#ffffff', borderBottom: '1px solid #e5e7eb',
    padding: mobile ? '16px' : '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: mobile ? 0 : '16px 16px 0 0',
  },
  body: { padding: mobile ? '12px 16px 16px' : '16px 24px 24px' },
  footer: {
    position: 'sticky' as const, bottom: 0, zIndex: 1,
    background: '#ffffff', borderTop: '1px solid #e5e7eb',
    padding: mobile ? '12px 16px' : '16px 24px',
    display: 'flex', gap: 12, justifyContent: mobile ? 'stretch' : 'flex-end',
    flexDirection: mobile ? 'column-reverse' as const : 'row' as const,
    borderRadius: mobile ? 0 : '0 0 16px 16px',
  },
  closeBtn: {
    background: 'none', border: 'none', fontSize: 20, cursor: 'pointer',
    color: '#6b7280', padding: 4, lineHeight: 1,
  },
  sectionHeader: (color: string) => ({
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: mobile ? '10px 12px' : '12px 16px', borderRadius: 10, cursor: 'pointer',
    background: `${color}10`, border: `1px solid ${color}30`,
    marginBottom: 0, userSelect: 'none' as const,
  }),
  sectionBody: {
    padding: mobile ? '12px' : '16px', border: '1px solid #e5e7eb', borderTop: 'none',
    borderRadius: '0 0 10px 10px', marginBottom: 16,
  },
  kvGrid: {
    display: 'grid', gridTemplateColumns: mobile ? '1fr 1fr' : '1fr 1fr', gap: mobile ? '6px 12px' : '8px 24px', fontSize: mobile ? 12 : 13,
  },
  kvLabel: { color: '#6b7280' },
  kvValue: { color: '#1a1a2a', fontWeight: 600 as const },
  badge: (bg: string, color: string) => ({
    display: 'inline-block', padding: '2px 10px', borderRadius: 12,
    fontSize: 11, fontWeight: 600 as const, background: bg, color,
  }),
  btnSecondary: {
    background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 10,
    padding: '11px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
    color: '#374151', fontFamily: "'DM Sans', sans-serif",
    ...(mobile ? { width: '100%', textAlign: 'center' as const } : {}),
  } as React.CSSProperties,
  btnPrimary: {
    background: 'linear-gradient(135deg, #1a4a7a, #2880c4)', border: 'none',
    borderRadius: 10, padding: '11px 28px', fontSize: 14, fontWeight: 700,
    cursor: 'pointer', color: '#ffffff', fontFamily: "'DM Sans', sans-serif",
    ...(mobile ? { width: '100%', textAlign: 'center' as const } : {}),
  } as React.CSSProperties,
});

function KV({ label, value, styles }: { label: string; value: React.ReactNode; styles: ReturnType<typeof getStyles> }) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <>
      <div style={styles.kvLabel}>{label}</div>
      <div style={styles.kvValue}>{value}</div>
    </>
  );
}

function BoolBadge({ value, yes = 'Igen', no = 'Nem', styles }: { value?: boolean; yes?: string; no?: string; styles: ReturnType<typeof getStyles> }) {
  if (value === undefined) return null;
  return value
    ? <span style={styles.badge('#dcfce7', '#166534')}>{yes}</span>
    : <span style={styles.badge('#fee2e2', '#991b1b')}>{no}</span>;
}

function Section({ title, emoji, color, children, defaultOpen = true, styles }: {
  title: string; emoji: string; color: string; children: React.ReactNode; defaultOpen?: boolean; styles: ReturnType<typeof getStyles>;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: open ? 0 : 16 }}>
      <div style={styles.sectionHeader(color)} onClick={() => setOpen(o => !o)}>
        <span style={{ fontWeight: 700, fontSize: 14, color }}>{emoji} {title}</span>
        <span style={{ fontSize: 12, color, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', display: 'inline-block' }}>▼</span>
      </div>
      {open && <div style={styles.sectionBody}>{children}</div>}
    </div>
  );
}

export default function VinResultModal({ data, onClose, onApply }: VinResultModalProps) {
  const mobile = useIsMobile();
  const S = getStyles(mobile);
  const vi = data?.vehicle_identity;
  const agents = data?.agents?.vin_decode;
  const trim = data?.agents?.trim_intelligence;
  const safety = data?.safety;
  const impact = data?.valuation_impact;
  const eq = data?.equipment;

  const make = vi?.make || '';
  const model = vi?.model || '';
  const year = vi?.year || '';
  const isTesla = make.toUpperCase() === 'TESLA';
  const isEV = ['BEV', 'PHEV'].includes((vi?.electrification || '').toUpperCase());

  const recallCount = safety?.recall_count ?? 0;
  const condScore = impact?.overall_condition_score ?? 0;
  const condColor = condScore >= 8 ? '#22c55e' : condScore >= 5 ? '#eab308' : '#ef4444';

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={S.header}>
          <div style={{ fontWeight: 800, fontSize: mobile ? 15 : 18, color: '#1a1a2a' }}>
            🔍 {make} {model} {year} – VIN Elemzés
          </div>
          <button style={S.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div style={S.body}>
          {/* Section A – Vehicle Identity */}
          <Section title="Jármű azonosítás" emoji="🚗" color="#22c55e" styles={S}>
            <div style={S.kvGrid}>
              <KV label="Márka" value={make} styles={S} />
              <KV label="Modell" value={model} styles={S} />
              <KV label="Évjárat" value={year} styles={S} />
              <KV label="Karosszéria" value={vi?.body_class} styles={S} />
              <KV label="Jármű típus" value={vi?.vehicle_type} styles={S} />
              <KV label="Hajtáslánc típus" value={vi?.electrification} styles={S} />
              <KV label="Üzemanyag" value={vi?.fuel_type || agents?.fuel_type} styles={S} />
              <KV label="Gyártó" value={vi?.manufacturer} styles={S} />
              <KV label="Gyártási ország" value={vi?.plant_country} styles={S} />
              <KV label="Gyártási város" value={vi?.plant_city} styles={S} />
              <KV label="WMI kód" value={vi?.wmi} styles={S} />
              <KV label="VIN" value={
                data?.vin ? <span style={{ fontFamily: "'DM Mono', monospace", letterSpacing: '0.06em', fontSize: mobile ? 11 : undefined }}>{data.vin}</span> : undefined
              } styles={S} />
            </div>
          </Section>

          {/* Section B – Technical Data */}
          <Section title="Műszaki adatok" emoji="🔧" color="#3b82f6" styles={S}>
            <div style={S.kvGrid}>
              <KV label="Motor teljesítmény" value={agents?.engine_power_kw ? `${agents.engine_power_kw} kW` : undefined} styles={S} />
              <KV label="Hengerűrtartalom" value={agents?.engine_displacement ? `${agents.engine_displacement} L` : undefined} styles={S} />
              <KV label="Meghajtás" value={agents?.drive_type} styles={S} />
              <KV label="Váltó típus" value={agents?.transmission} styles={S} />
              <KV label="Ajtók száma" value={agents?.doors} styles={S} />
              <KV label="Ülőhelyek" value={agents?.seats} styles={S} />
            </div>

            {/* Safety systems */}
            {(agents?.abs !== undefined || agents?.esc !== undefined || agents?.traction_control !== undefined) && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>Fékrendszer</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {agents?.abs !== undefined && <BoolBadge value={agents.abs} yes="ABS ✓" no="ABS ✗" styles={S} />}
                  {agents?.esc !== undefined && <BoolBadge value={agents.esc} yes="ESC ✓" no="ESC ✗" styles={S} />}
                  {agents?.traction_control !== undefined && <BoolBadge value={agents.traction_control} yes="TC ✓" no="TC ✗" styles={S} />}
                </div>
              </div>
            )}

            {/* EV-specific */}
            {isEV && (
              <div style={{ marginTop: 12, padding: mobile ? 8 : 12, borderRadius: 8, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#166534', marginBottom: 6 }}>⚡ EV adatok</div>
                <div style={S.kvGrid}>
                  <KV label="Akkumulátor típus" value={agents?.battery_type} styles={S} />
                  <KV label="Akkumulátor kapacitás" value={agents?.battery_kwh ? `${agents.battery_kwh} kWh` : undefined} styles={S} />
                  <KV label="Töltő szint" value={agents?.charger_level} styles={S} />
                  <KV label="Töltési teljesítmény" value={agents?.charging_power_kw ? `${agents.charging_power_kw} kW` : undefined} styles={S} />
                  <KV label="EV hajtásegység" value={agents?.ev_drive_unit} styles={S} />
                </div>
              </div>
            )}
          </Section>

          {/* Section C – Equipment & Valuation */}
          <Section title="Felszereltség & Értékelés" emoji="🛡️" color="#8b5cf6" styles={S}>
            <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap: mobile ? 16 : 24 }}>
              {/* Left column */}
              <div>
                {(trim?.trim_level || eq?.trim_level) && (
                  <div style={{ marginBottom: 12 }}>
                    <span style={{ fontWeight: 700, fontSize: 15, color: '#1a1a2a' }}>{trim?.trim_level || eq?.trim_level}</span>
                    {' '}
                    {(trim?.confidence || eq?.confidence) && (
                      <ConfBadge level={trim?.confidence || eq?.confidence} />
                    )}
                  </div>
                )}

                {eq?.standard_equipment && eq.standard_equipment.length > 0 && (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Alapfelszereltség</div>
                    <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: '#374151' }}>
                      {eq.standard_equipment.map((item: string, i: number) => (
                        <li key={i} style={{ marginBottom: 2 }}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {eq?.value_positive && eq.value_positive.length > 0 && (
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
                    {eq.value_positive.map((v: string, i: number) => (
                      <span key={i} style={S.badge('#dcfce7', '#166534')}>{v}</span>
                    ))}
                  </div>
                )}

                {eq?.value_negative && eq.value_negative.length > 0 && (
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
                    {eq.value_negative.map((v: string, i: number) => (
                      <span key={i} style={S.badge('#fee2e2', '#991b1b')}>{v}</span>
                    ))}
                  </div>
                )}

                {eq?.eu_market_notes && (
                  <div style={{ fontSize: 12, color: '#9ca3af', fontStyle: 'italic' }}>{eq.eu_market_notes}</div>
                )}
              </div>

              {/* Right column */}
              <div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Visszahívások</div>
                  <div style={{
                    display: 'inline-block', padding: '4px 14px', borderRadius: 12, fontSize: 16, fontWeight: 700,
                    background: recallCount === 0 ? '#dcfce7' : '#fef3c7',
                    color: recallCount === 0 ? '#166534' : '#92400e',
                  }}>
                    {recallCount === 0 ? '✓ 0' : `⚠ ${recallCount}`}
                  </div>
                </div>

                {safety?.complaints_count !== undefined && (
                  <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>{safety.complaints_count} NHTSA panasz</div>
                )}

                {impact?.impact_level && (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>Értékhatás</div>
                    <ConfBadge level={impact.impact_level} />
                  </div>
                )}

                {safety?.recalls && safety.recalls.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    {safety.recalls.slice(0, 3).map((r: any, i: number) => (
                      <div key={i} style={{ padding: '4px 0', borderTop: i > 0 ? '1px solid #e5e7eb' : 'none', fontSize: 11, color: '#374151' }}>
                        <strong>{r.component}</strong>
                        <div style={{ color: '#6b7280', marginTop: 1 }}>
                          {(r.summary || '').length > 80 ? (r.summary || '').slice(0, 80) + '…' : r.summary}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {impact?.overall_condition_score !== undefined && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>Állapot pontszám</div>
                    <span style={{ fontSize: 28, fontWeight: 800, color: condColor }}>{condScore}<span style={{ fontSize: 14, color: '#6b7280' }}>/10</span></span>
                  </div>
                )}

                {impact?.total_adjustment_pct !== undefined && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>Értékkiigazítás</div>
                    <span style={{ fontSize: 20, fontWeight: 700, color: impact.total_adjustment_pct >= 0 ? '#22c55e' : '#ef4444' }}>
                      {impact.total_adjustment_pct >= 0 ? '+' : ''}{impact.total_adjustment_pct}%
                    </span>
                  </div>
                )}

                {impact?.confidence && (
                  <div style={{ marginTop: 6 }}><ConfBadge level={impact.confidence} /></div>
                )}

                {impact?.recommendation && (
                  <p style={{ fontSize: 12, color: '#374151', lineHeight: 1.5, marginTop: 8 }}>{impact.recommendation}</p>
                )}
              </div>
            </div>
          </Section>

          {/* Section D – Tesla specific */}
          {isTesla && safety?.tesla_specific && (
            <Section title="Tesla specifikus" emoji="⚡" color="#c9a84c">
              <div style={S.kvGrid}>
                <KV label="HW verzió" value={safety.tesla_specific.hw_version} />
                <KV label="FSD képes" value={
                  safety.tesla_specific.fsd_capable !== undefined
                    ? <BoolBadge value={safety.tesla_specific.fsd_capable} yes="Igen ✓" no="Nem ✗" />
                    : undefined
                } />
                <KV label="Autopilot szint" value={safety.tesla_specific.autopilot_level} />
                <KV label="Szoftver opciók értéke" value={
                  safety.tesla_specific.software_options_value_eur !== undefined
                    ? `€${safety.tesla_specific.software_options_value_eur.toLocaleString()}`
                    : undefined
                } />
                <KV label="OTA frissíthetőség" value={
                  safety.tesla_specific.ota_updatable !== undefined
                    ? <BoolBadge value={safety.tesla_specific.ota_updatable} yes="Igen ✓" no="Nem" />
                    : undefined
                } />
                <KV label="Hatótáv becslés" value={
                  safety.tesla_specific.range_km ? `${safety.tesla_specific.range_km} km` : undefined
                } />
                <KV label="Akkumulátor degradáció" value={
                  safety.tesla_specific.battery_degradation_risk
                    ? <ConfBadge level={safety.tesla_specific.battery_degradation_risk} />
                    : undefined
                } />
              </div>
            </Section>
          )}
        </div>

        {/* Footer */}
        <div style={S.footer}>
          <button style={S.btnSecondary} onClick={onClose}>✕ Bezárás</button>
          <button style={S.btnPrimary} onClick={onApply}>✓ Adatok átvitele a formba</button>
        </div>
      </div>
    </div>
  );
}

function ConfBadge({ level }: { level: string }) {
  const colors: Record<string, string> = { high: '#22c55e', medium: '#eab308', low: '#9ca3af', none: '#9ca3af' };
  const c = colors[level] || '#9ca3af';
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 12,
      fontSize: 11, fontWeight: 600, background: `${c}20`, color: c, border: `1px solid ${c}40`,
    }}>
      {level}
    </span>
  );
}
