import { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLanguage } from '@/i18n/LanguageContext';
import { EVKBPanel } from './autovalue/EVKBPanel';

interface VinResultModalProps {
  data: any;
  onClose: () => void;
  onApply: () => void;
}

const getStyles = (mobile: boolean) => ({
  overlay: {
    position: 'fixed' as const, inset: 0, zIndex: 10000,
    background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
    display: 'flex', alignItems: mobile ? 'stretch' : 'center', justifyContent: 'center',
    padding: mobile ? 0 : 16,
  },
  modal: {
    background: '#ffffff', borderRadius: mobile ? 0 : 16, width: '100%', maxWidth: mobile ? '100%' : 860,
    maxHeight: mobile ? '100vh' : '92vh', height: mobile ? '100vh' : 'auto',
    overflow: 'auto', boxShadow: mobile ? 'none' : '0 24px 64px rgba(0,0,0,0.22)',
    position: 'relative' as const,
  },
  header: {
    position: 'sticky' as const, top: 0, zIndex: 1,
    background: '#ffffff', borderBottom: '1px solid #e5e7eb',
    padding: mobile ? '14px 16px' : '18px 24px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
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
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: mobile ? '6px 12px' : '8px 24px', fontSize: mobile ? 12 : 13,
  },
  kvLabel: { color: '#6b7280' },
  kvValue: { color: '#1a1a2a', fontWeight: 600 as const },
  badge: (bg: string, color: string) => ({
    display: 'inline-block', padding: '2px 10px', borderRadius: 12,
    fontSize: 11, fontWeight: 600 as const, background: bg, color,
  }),
  separator: { height: 1, background: '#e5e7eb', margin: '12px 0' },
  subHeading: { fontSize: 12, fontWeight: 700 as const, color: '#374151', marginBottom: 8, marginTop: 12 },
  bulletList: { margin: 0, paddingLeft: 16, fontSize: 12, color: '#374151', lineHeight: 1.6 },
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

function BoolBadge({ value, yes = 'Igen ✓', no = 'Nem ✗' }: { value?: boolean; yes?: string; no?: string }) {
  if (value === undefined) return null;
  return value
    ? <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: '#dcfce7', color: '#166534' }}>{yes}</span>
    : <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: '#fee2e2', color: '#991b1b' }}>{no}</span>;
}

function BadgeList({ items, color }: { items?: string[]; color: 'green' | 'red' | 'blue' }) {
  if (!items || items.length === 0) return null;
  const map = { green: ['#dcfce7', '#166534'], red: ['#fee2e2', '#991b1b'], blue: ['#eff6ff', '#1d4ed8'] };
  const [bg, fg] = map[color];
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {items.map((item, i) => (
        <span key={i} style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: bg, color: fg }}>{item}</span>
      ))}
    </div>
  );
}

function Section({ title, emoji, color, children, defaultOpen = true, styles, count }: {
  title: string; emoji: string; color: string; children: React.ReactNode; defaultOpen?: boolean; styles: ReturnType<typeof getStyles>; count?: number;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: open ? 0 : 16 }}>
      <div style={styles.sectionHeader(color)} onClick={() => setOpen(o => !o)}>
        <span style={{ fontWeight: 700, fontSize: 14, color, display: 'flex', alignItems: 'center', gap: 8 }}>
          {emoji} {title}
          {count !== undefined && (
            <span style={{ fontSize: 11, fontWeight: 600, padding: '1px 8px', borderRadius: 10, background: `${color}20`, color }}>{count}</span>
          )}
        </span>
        <span style={{ fontSize: 12, color, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', display: 'inline-block' }}>▼</span>
      </div>
      {open && <div style={styles.sectionBody}>{children}</div>}
    </div>
  );
}

export default function VinResultModal({ data, onClose, onApply }: VinResultModalProps) {
  const mobile = useIsMobile();
  const { tr } = useLanguage();
  const S = getStyles(mobile);

  const vi = data?.vehicle_identity;
  const evSpec = data?.agents?.ev_specialist;
  const recallSafety = data?.agents?.recall_safety;
  const trimIntel = data?.agents?.trim_intelligence;
  const valSynth = data?.agents?.valuation_synthesis;

  // Fallbacks for older response shapes
  const safety = data?.safety;
  const eq = data?.equipment;
  const impact = data?.valuation_impact;
  const agents = data?.agents?.vin_decode;

  const make = vi?.make || '';
  const model = vi?.model || '';
  const year = vi?.year || '';
  const isTesla = make.toUpperCase() === 'TESLA';

  // Battery data (prefer agents.ev_specialist, fallback to older shape)
  const battery = evSpec?.battery;
  const charging = evSpec?.charging;
  const software = evSpec?.software;
  const warranty = evSpec?.warranty;

  // Recalls (prefer agents.recall_safety, fallback)
  const recallCount = recallSafety?.recall_count ?? safety?.recall_count ?? 0;
  const complaintsCount = recallSafety?.complaints_count ?? safety?.complaints_count;
  const hasOpenRecalls = recallSafety?.has_open_recalls;
  const recalls = recallSafety?.recalls ?? safety?.recalls;
  const knownIssues = evSpec?.known_issues;

  // Trim (prefer agents.trim_intelligence, fallback)
  const trimLevel = trimIntel?.trim_level ?? eq?.trim_level;
  const trimConfidence = trimIntel?.trim_confidence ?? eq?.confidence;
  const stdEquipment = trimIntel?.standard_equipment ?? eq?.standard_equipment;
  const optionalPkgs = trimIntel?.optional_packages;
  const valuePos = trimIntel?.value_positive ?? eq?.value_positive;
  const valueNeg = trimIntel?.value_negative ?? eq?.value_negative;
  const segment = trimIntel?.segment;
  const euNotes = trimIntel?.eu_market_notes ?? eq?.eu_market_notes;

  // Valuation synthesis (prefer agents.valuation_synthesis, fallback)
  const condScore = valSynth?.overall_condition_score ?? impact?.overall_condition_score;
  const dataCompleteness = valSynth?.data_completeness;
  const keyDrivers = valSynth?.key_value_drivers ?? impact?.key_value_drivers;
  const valueAdj = valSynth?.value_adjustments;
  const totalAdjPct = valSynth?.total_adjustment_pct ?? impact?.total_adjustment_pct;
  const confLevel = valSynth?.confidence_level ?? impact?.confidence;
  const recommendation = valSynth?.recommendation ?? impact?.recommendation;
  const inspPriorities = valSynth?.inspection_priorities ?? impact?.inspection_priorities;

  const condColor = (condScore ?? 0) >= 8 ? '#22c55e' : (condScore ?? 0) >= 5 ? '#eab308' : '#ef4444';
  const recallBorderColor = recallCount === 0 ? '#22c55e' : recallCount <= 2 ? '#eab308' : '#ef4444';

  // ── Section checks ──
  const hasTechData = evSpec || agents || battery || charging || software || warranty;
  const hasRecalls = recallCount > 0 || complaintsCount !== undefined || recalls?.length || knownIssues?.length;
  const hasEquipVal = trimLevel || stdEquipment?.length || valuePos?.length || valueNeg?.length || condScore !== undefined || totalAdjPct !== undefined || recommendation;

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={S.header}>
          <div>
            <div style={{ fontWeight: 800, fontSize: mobile ? 15 : 18, color: '#1a1a2a' }}>
              🔍 {make} {model} {year}
            </div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>VIN elemzés · 5 AI ügynök</div>
          </div>
          <button style={S.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div style={S.body}>
          {/* ═══ Section 1 — Jármű azonosítás ═══ */}
          <Section title="Jármű azonosítás" emoji="🚗" color="#22c55e" styles={S}>
            <div style={S.kvGrid}>
              <KV label="VIN" value={
                data?.vin ? <span style={{ fontFamily: "'DM Mono', monospace", letterSpacing: '0.06em', fontSize: mobile ? 11 : 13 }}>{data.vin}</span> : undefined
              } styles={S} />
              <KV label="Gyártó" value={make} styles={S} />
              <KV label="Modell" value={model} styles={S} />
              <KV label="Évjárat" value={year} styles={S} />
              <KV label="Gyártómű" value={vi?.manufacturer} styles={S} />
              <KV label="Gyártás helye" value={vi?.plant_country} styles={S} />
              <KV label="Karosszéria" value={vi?.body_class} styles={S} />
              <KV label="Hajtás" value={vi?.electrification} styles={S} />
            </div>
          </Section>

          {/* ═══ Section 2 — Műszaki adatok ═══ */}
          {hasTechData && (
            <Section title="Műszaki adatok" emoji="🔧" color="#3b82f6" styles={S}>
              {/* EV type */}
              {evSpec?.ev_type && (
                <div style={{ marginBottom: 12 }}>
                  <span style={{ padding: '3px 12px', borderRadius: 12, fontSize: 12, fontWeight: 700, background: '#dcfce720', color: '#22c55e', border: '1px solid #22c55e30' }}>
                    {evSpec.ev_type}
                  </span>
                </div>
              )}

              {/* Battery */}
              {battery && (
                <>
                  <div style={S.subHeading}>⚡ Akkumulátor</div>
                  <div style={S.kvGrid}>
                    <KV label="Kapacitás" value={battery.capacity_kwh ? `${battery.capacity_kwh} kWh` : undefined} styles={S} />
                    <KV label="Kémia" value={battery.chemistry} styles={S} />
                    <KV label="WLTP hatótáv" value={battery.wltp_range_km ? `${battery.wltp_range_km} km` : undefined} styles={S} />
                    <KV label="Degradáció kockázat" value={battery.degradation_risk ? <ConfBadge level={battery.degradation_risk} /> : undefined} styles={S} />
                  </div>
                  {battery.degradation_note && (
                    <div style={{ fontSize: 12, color: '#6b7280', fontStyle: 'italic', marginTop: 6 }}>{battery.degradation_note}</div>
                  )}
                  <div style={S.separator} />
                </>
              )}

              {/* Charging */}
              {charging && (
                <>
                  <div style={S.subHeading}>🔌 Töltés</div>
                  <div style={S.kvGrid}>
                    <KV label="AC töltés" value={charging.ac_kw ? `${charging.ac_kw} kW` : undefined} styles={S} />
                    <KV label="DC töltés" value={charging.dc_kw ? `${charging.dc_kw} kW` : undefined} styles={S} />
                    <KV label="Csatlakozó" value={charging.connector} styles={S} />
                  </div>
                  <div style={S.separator} />
                </>
              )}

              {/* Software */}
              {software && (
                <>
                  <div style={S.subHeading}>💻 Szoftver</div>
                  <div style={S.kvGrid}>
                    <KV label="HW verzió" value={software.hw_version} styles={S} />
                    <KV label="OTA frissítés" value={software.ota_capable !== undefined ? <BoolBadge value={software.ota_capable} /> : undefined} styles={S} />
                    <KV label="Autopilot szint" value={software.autopilot_level} styles={S} />
                  </div>
                  {software.ota_value_note && (
                    <div style={{ fontSize: 12, color: '#6b7280', fontStyle: 'italic', marginTop: 6 }}>{software.ota_value_note}</div>
                  )}
                  <div style={S.separator} />
                </>
              )}

              {/* Warranty */}
              {warranty && (
                <>
                  <div style={S.subHeading}>🛡️ Garancia</div>
                  <div style={S.kvGrid}>
                    {Object.entries(warranty).map(([k, v]) => (
                      <KV key={k} label={k.replace(/_/g, ' ')} value={String(v)} styles={S} />
                    ))}
                  </div>
                </>
              )}

              {/* Fallback: older response shape fields */}
              {!evSpec && agents && (
                <div style={S.kvGrid}>
                  <KV label="Motor teljesítmény" value={agents.engine_power_kw ? `${agents.engine_power_kw} kW` : undefined} styles={S} />
                  <KV label="Hengerűrtartalom" value={agents.engine_displacement ? `${agents.engine_displacement} L` : undefined} styles={S} />
                  <KV label="Hajtás" value={agents.drive_type} styles={S} />
                  <KV label="Váltó" value={agents.transmission} styles={S} />
                  <KV label="Ajtók" value={agents.doors} styles={S} />
                  <KV label="Ülések" value={agents.seats} styles={S} />
                </div>
              )}
            </Section>
          )}

          {/* ═══ Section 3 — Visszahívások és ismert problémák ═══ */}
          {(hasRecalls || recallCount === 0) && (
            <Section title="Visszahívások és ismert problémák" emoji="⚠️" color={recallBorderColor} styles={S} count={recallCount}>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
                <div style={{
                  display: 'inline-block', padding: '5px 16px', borderRadius: 12, fontSize: 14, fontWeight: 700,
                  background: recallCount === 0 ? '#dcfce7' : '#fef3c7',
                  color: recallCount === 0 ? '#166534' : '#92400e',
                }}>
                  {recallCount === 0 ? '✓ Nincs visszahívás' : `⚠ ${recallCount} visszahívás`}
                </div>
                {hasOpenRecalls !== undefined && (
                  <div style={{
                    display: 'inline-block', padding: '5px 16px', borderRadius: 12, fontSize: 13, fontWeight: 600,
                    background: hasOpenRecalls ? '#fee2e2' : '#dcfce7',
                    color: hasOpenRecalls ? '#991b1b' : '#166534',
                  }}>
                    {hasOpenRecalls ? '🔴 Nyitott visszahívás' : '✓ Nincs nyitott'}
                  </div>
                )}
              </div>

              {complaintsCount !== undefined && (
                <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 10 }}>{complaintsCount} NHTSA panasz</div>
              )}

              {/* Recall details */}
              {recalls && recalls.length > 0 && (
                <RecallList recalls={recalls} mobile={mobile} />
              )}

              {/* Known issues */}
              {knownIssues && knownIssues.length > 0 && (
                <>
                  <div style={S.subHeading}>🔎 Ismert problémák</div>
                  <ul style={S.bulletList}>
                    {knownIssues.map((issue: any, i: number) => (
                      <li key={i}>{typeof issue === 'string' ? issue : issue.description || issue.summary || JSON.stringify(issue)}</li>
                    ))}
                  </ul>
                </>
              )}
            </Section>
          )}

          {/* ═══ Section 4 — Felszereltség és értékelés ═══ */}
          {hasEquipVal && (
            <Section title="Felszereltség és értékelés" emoji="💎" color="#8b5cf6" styles={S}>
              <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap: mobile ? 16 : 24 }}>
                {/* Left: Trim & Equipment */}
                <div>
                  {trimLevel && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <span style={{ fontWeight: 700, fontSize: 16, color: '#1a1a2a' }}>{trimLevel}</span>
                      {trimConfidence && <ConfBadge level={trimConfidence} />}
                    </div>
                  )}

                  {segment && (
                    <div style={{ marginBottom: 10 }}>
                      <span style={{ padding: '3px 12px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>{segment}</span>
                    </div>
                  )}

                  {stdEquipment && stdEquipment.length > 0 && (
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Alapfelszereltség</div>
                      <ul style={S.bulletList}>
                        {stdEquipment.map((item: string, i: number) => <li key={i}>{item}</li>)}
                      </ul>
                    </div>
                  )}

                  {optionalPkgs && optionalPkgs.length > 0 && (
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Opcionális csomagok</div>
                      <BadgeList items={optionalPkgs} color="blue" />
                    </div>
                  )}

                  {(valuePos?.length > 0 || valueNeg?.length > 0) && (
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Érték hatás</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <BadgeList items={valuePos} color="green" />
                        <BadgeList items={valueNeg} color="red" />
                      </div>
                    </div>
                  )}

                  {euNotes && (
                    <div style={{ fontSize: 12, color: '#9ca3af', fontStyle: 'italic', marginTop: 6 }}>{euNotes}</div>
                  )}
                </div>

                {/* Right: Valuation Synthesis */}
                <div>
                  {condScore !== undefined && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Állapot pontszám</div>
                      <span style={{ fontSize: 36, fontWeight: 800, color: condColor }}>{condScore}<span style={{ fontSize: 16, color: '#6b7280' }}>/10</span></span>
                    </div>
                  )}

                  {dataCompleteness && (
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>Adat teljesség</div>
                      <ConfBadge level={dataCompleteness} />
                    </div>
                  )}

                  {totalAdjPct !== undefined && (
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>Érték korrekció</div>
                      <span style={{ fontSize: 22, fontWeight: 700, color: totalAdjPct >= 0 ? '#22c55e' : '#ef4444' }}>
                        {totalAdjPct >= 0 ? '+' : ''}{totalAdjPct}%
                      </span>
                    </div>
                  )}

                  {confLevel && (
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>Megbízhatóság</div>
                      <ConfBadge level={confLevel} />
                    </div>
                  )}

                  {keyDrivers && keyDrivers.length > 0 && (
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Értékmeghatározó tényezők</div>
                      <BadgeList items={keyDrivers} color="blue" />
                    </div>
                  )}

                  {valueAdj && valueAdj.length > 0 && (
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Érték módosítások</div>
                      <ul style={S.bulletList}>
                        {valueAdj.map((adj: any, i: number) => (
                          <li key={i}>{typeof adj === 'string' ? adj : `${adj.factor || adj.label || ''}: ${adj.adjustment_pct !== undefined ? `${adj.adjustment_pct > 0 ? '+' : ''}${adj.adjustment_pct}%` : ''}`}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {recommendation && (
                    <div style={{ marginBottom: 10, padding: 10, borderRadius: 8, background: '#eff6ff', border: '1px solid #bfdbfe' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#1d4ed8', marginBottom: 4 }}>💡 Ajánlás</div>
                      <p style={{ fontSize: 12, color: '#374151', lineHeight: 1.5, margin: 0 }}>{recommendation}</p>
                    </div>
                  )}

                  {inspPriorities && inspPriorities.length > 0 && (
                    <div>
                      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>🔍 Vizsgálati prioritások</div>
                      <ol style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: '#374151', lineHeight: 1.6 }}>
                        {inspPriorities.map((p: string, i: number) => <li key={i}>{p}</li>)}
                      </ol>
                    </div>
                  )}
                </div>
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

/* ── Recall list with expand ── */
function RecallList({ recalls, mobile }: { recalls: any[]; mobile: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? recalls : recalls.slice(0, 3);
  return (
    <div>
      {shown.map((r: any, i: number) => (
        <div key={i} style={{ padding: '6px 0', borderTop: i > 0 ? '1px solid #e5e7eb' : 'none', fontSize: 12, color: '#374151' }}>
          <strong>{r.component}</strong>
          <div style={{ color: '#6b7280', marginTop: 2 }}>
            {(r.summary || '').length > 120 ? (r.summary || '').slice(0, 120) + '…' : r.summary}
          </div>
        </div>
      ))}
      {recalls.length > 3 && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          style={{ border: 'none', background: 'none', color: '#3b82f6', fontSize: 12, cursor: 'pointer', marginTop: 4 }}
        >
          + {recalls.length - 3} további visszahívás
        </button>
      )}
    </div>
  );
}
