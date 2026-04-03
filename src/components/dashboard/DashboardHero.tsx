import { useLanguage } from '@/i18n/LanguageContext';

interface DashboardHeroProps {
  onVinFlow: () => void;
  onManualFlow: () => void;
}

const BayesianCard = () => {
  const { tr } = useLanguage();
  const cells = [
    { label: tr('hero_bgCellLabel1'), value: 'NMC', sub: tr('hero_bgCellSub1') },
    { label: tr('hero_bgCellLabel2'), value: '101.7 kWh', sub: '' },
    { label: tr('hero_bgCellLabel3'), value: '93.6 kWh | 92%', sub: '' },
    { label: tr('hero_bgCellLabel4'), value: '625 km', sub: '' },
    { label: tr('hero_bgCellLabel5'), value: '575 km', sub: '' },
    { label: tr('hero_bgCellLabel6'), value: '1.5% / év', sub: '', color: '#14532d' },
  ];

  return (
    <div style={{ background: '#fff', borderRadius: 8, padding: 11, width: 420, opacity: 1 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#334155', marginBottom: 8, letterSpacing: '0.04em' }}>
        {tr('hero_bgCardTitle')}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
        {cells.map((c, i) => (
          <div key={i} style={{ background: '#f8fafc', borderRadius: 4, padding: '6px 8px' }}>
            <div style={{ fontSize: 9, color: '#64748b', marginBottom: 2 }}>{c.label}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: c.color || '#0f172a' }}>
              {c.value}
            </div>
            {c.sub && <div style={{ fontSize: 8, color: '#94a3b8' }}>{c.sub}</div>}
          </div>
        ))}
      </div>
    </div>
  );
};

const DegradationChart = () => {
  const { tr } = useLanguage();
  return (
    <div style={{ background: '#fff', borderRadius: 8, padding: 11, width: 420, marginTop: 10, opacity: 1 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#334155', marginBottom: 8, letterSpacing: '0.04em' }}>
        {tr('hero_bgChartTitle')}
      </div>
      <svg viewBox="0 0 380 160" width="100%" height="auto" style={{ display: 'block' }}>
        {/* Y axis labels */}
        <text x="8" y="20" fontSize="9" fill="#94a3b8">100</text>
        <text x="12" y="60" fontSize="9" fill="#94a3b8">80</text>
        <text x="12" y="110" fontSize="9" fill="#94a3b8">65</text>
        {/* X axis labels */}
        <text x="35" y="155" fontSize="8" fill="#94a3b8">0</text>
        <text x="145" y="155" fontSize="8" fill="#94a3b8">5</text>
        <text x="255" y="155" fontSize="8" fill="#94a3b8">10</text>
        <text x="355" y="155" fontSize="8" fill="#94a3b8">15</text>
        {/* Grid area */}
        <line x1="35" y1="15" x2="35" y2="145" stroke="#e2e8f0" strokeWidth="0.5" />
        <line x1="35" y1="145" x2="370" y2="145" stroke="#e2e8f0" strokeWidth="0.5" />
        {/* "Most" vertical dashed line at year 5 */}
        <line x1="145" y1="15" x2="145" y2="145" stroke="#475569" strokeWidth="1" strokeDasharray="4 3" />
        <text x="145" y="12" fontSize="8" fill="#475569" textAnchor="middle">{tr('hero_chartNow')}</text>
        {/* EU 80% line */}
        <line x1="35" y1="55" x2="370" y2="55" stroke="#b45309" strokeWidth="1" strokeDasharray="4 3" />
        <text x="372" y="58" fontSize="7" fill="#b45309">EU</text>
        {/* Ga 65% line */}
        <line x1="35" y1="105" x2="370" y2="105" stroke="#c2410c" strokeWidth="1" strokeDasharray="4 3" />
        <text x="372" y="108" fontSize="7" fill="#c2410c">Ga</text>
        {/* Optimista line (dashed, green) */}
        <polyline points="35,18 145,32 255,48 370,62" fill="none" stroke="#14532d" strokeWidth="3" strokeDasharray="6 4" />
        {/* Várható line (solid, blue) */}
        <polyline points="35,18 145,38 255,60 370,82" fill="none" stroke="#1e3a8a" strokeWidth="3.5" />
        {/* Konzervatív line (dashed, red) */}
        <polyline points="35,18 145,50 255,85 370,115" fill="none" stroke="#c2410c" strokeWidth="3" strokeDasharray="6 4" />
        {/* Legend */}
        <circle cx="80" cy="140" r="3" fill="#14532d" />
        <text x="87" y="143" fontSize="8" fill="#334155">{tr('hero_chartOptimistic')}</text>
        <circle cx="160" cy="140" r="3" fill="#1e3a8a" />
        <text x="167" y="143" fontSize="8" fill="#334155">{tr('hero_chartExpected')}</text>
        <circle cx="240" cy="140" r="3" fill="#c2410c" />
        <text x="247" y="143" fontSize="8" fill="#334155">{tr('hero_chartConservative')}</text>
      </svg>
    </div>
  );
};

export default function DashboardHero({ onVinFlow, onManualFlow }: DashboardHeroProps) {
  const { tr } = useLanguage();

  const pills = [
    tr('hero_pill1'), tr('hero_pill2'), tr('hero_pill3'), tr('hero_pill4'), tr('hero_pill5'),
  ];

  const stats = [
    { val: tr('hero_stat1Val'), lbl: tr('hero_stat1Lbl') },
    { val: tr('hero_stat2Val'), lbl: tr('hero_stat2Lbl') },
    { val: tr('hero_stat3Val'), lbl: tr('hero_stat3Lbl') },
    { val: tr('hero_stat4Val'), lbl: tr('hero_stat4Lbl') },
  ];

  return (
    <section
      className="relative overflow-hidden"
      style={{ background: '#eef2f7', minHeight: 560 }}
    >
      {/* Background cards layer */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
        style={{ zIndex: 0, opacity: 0.38 }}
      >
        <BayesianCard />
        <DegradationChart />
      </div>

      {/* Gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 1,
          background: 'linear-gradient(180deg, rgba(238,242,247,0.65) 0%, rgba(238,242,247,0.26) 45%, rgba(238,242,247,0.68) 100%)',
        }}
      />

      {/* Content */}
      <div className="relative flex flex-col items-center text-center" style={{ zIndex: 2, padding: '52px 24px 44px' }}>
        <div className="max-w-[740px] w-full">
          {/* Label row */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="h-px w-12" style={{ background: '#d97706', opacity: 0.7 }} />
            <span
              className="uppercase"
              style={{ fontSize: 10, letterSpacing: '0.13em', color: '#d97706', fontWeight: 700 }}
            >
              ✦ {tr('hero_label')}
            </span>
            <div className="h-px w-12" style={{ background: '#d97706', opacity: 0.7 }} />
          </div>

          {/* Heading */}
          <h1 style={{ fontSize: 46, fontWeight: 800, lineHeight: 1.08, color: '#0f172a' }} className="md:text-6xl text-3xl">
            <span className="block" style={{ color: '#0f172a' }}>{tr('hero_title1')}</span>
            <em className="block not-italic" style={{ color: '#1d4ed8' }}>{tr('hero_title2')}</em>
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mt-4 mb-6" style={{ fontSize: 14, color: '#475569', maxWidth: 560 }}>
            {tr('hero_subtitle')}
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-1.5 mb-8">
            {pills.map((p) => (
              <span
                key={p}
                className="inline-flex items-center gap-1.5"
                style={{
                  background: 'rgba(255,255,255,0.92)',
                  border: '1px solid #cbd5e1',
                  borderRadius: 999,
                  padding: '4px 12px',
                  fontSize: 11,
                  color: '#1e40af',
                }}
              >
                <span className="inline-block rounded-full" style={{ width: 5, height: 5, background: '#3b82f6' }} />
                {p}
              </span>
            ))}
          </div>

          {/* CTA cards */}
          <div className="flex flex-col sm:flex-row justify-center gap-3 mb-9">
            <button
              onClick={onVinFlow}
              className="flex items-center text-left"
              style={{
                background: 'rgba(255,255,255,0.96)',
                border: '1px solid #e2e8f0',
                borderRadius: 14,
                padding: '15px 22px',
                minWidth: 205,
                boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                cursor: 'pointer',
              }}
            >
              <div className="flex-1">
                <div className="uppercase" style={{ fontSize: 10, color: '#1d4ed8', fontWeight: 700 }}>{tr('hero_cta1Label')}</div>
                <div style={{ fontSize: 13, color: '#0f172a', fontWeight: 500, marginTop: 2 }}>{tr('hero_cta1Title')}</div>
              </div>
              <span style={{ color: '#1d4ed8', fontSize: 20, marginLeft: 12 }}>›</span>
            </button>
            <button
              onClick={onManualFlow}
              className="flex items-center text-left"
              style={{
                background: 'rgba(255,255,255,0.96)',
                border: '1px solid #e2e8f0',
                borderRadius: 14,
                padding: '15px 22px',
                minWidth: 205,
                boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                cursor: 'pointer',
              }}
            >
              <div className="flex-1">
                <div className="uppercase" style={{ fontSize: 10, color: '#1d4ed8', fontWeight: 700 }}>{tr('hero_cta2Label')}</div>
                <div style={{ fontSize: 13, color: '#0f172a', fontWeight: 500, marginTop: 2 }}>{tr('hero_cta2Title')}</div>
              </div>
              <span style={{ color: '#1d4ed8', fontSize: 20, marginLeft: 12 }}>›</span>
            </button>
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap justify-center items-center gap-0 pt-5" style={{ borderTop: '1px solid #e2e8f0' }}>
            {stats.map((s, i) => (
              <div key={i} className="flex items-center">
                {i > 0 && <div className="hidden sm:block mx-4" style={{ width: 1, height: 28, background: '#e2e8f0' }} />}
                <div className="text-center px-3 py-1">
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>{s.val}</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>{s.lbl}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
