import { useLanguage } from '@/i18n/LanguageContext';

interface DashboardServiceCardsProps {
  onCommercial: () => void;
  onDegradation: () => void;
  onInspection: () => void;
}

const BarChartSvg = () => (
  <div className="flex items-end justify-center h-full gap-2 relative pt-4 pb-2">
    {[68, 80, 120, 85, 72].map((h, i) => (
      <div
        key={i}
        className="rounded-t"
        style={{
          width: 28,
          height: h,
          background: ['#bfdbfe', '#93c5fd', '#1d4ed8', '#93c5fd', '#bfdbfe'][i],
        }}
      />
    ))}
    <div className="absolute top-4 left-4 right-4" style={{ borderBottom: '2px dashed #64748b' }}>
      <span className="absolute -top-1 right-0 text-[8px] text-[#64748b]">P50</span>
    </div>
    <div
      className="absolute top-2 right-3 text-[9px] font-bold text-white px-2 py-0.5 rounded"
      style={{ background: '#1e3a8a' }}
    >
      26 883 EUR átlag
    </div>
  </div>
);

const DegradationSvg = () => (
  <svg viewBox="0 0 200 100" width="100%" height="100%" className="p-2">
    <line x1="20" y1="10" x2="20" y2="85" stroke="#e2e8f0" strokeWidth="0.5" />
    <line x1="20" y1="85" x2="190" y2="85" stroke="#e2e8f0" strokeWidth="0.5" />
    <line x1="20" y1="35" x2="190" y2="35" stroke="#b45309" strokeWidth="0.8" strokeDasharray="3 2" />
    <text x="192" y="38" fontSize="5" fill="#b45309">EU</text>
    <line x1="90" y1="10" x2="90" y2="85" stroke="#475569" strokeWidth="0.8" strokeDasharray="3 2" />
    <text x="88" y="8" fontSize="5" fill="#475569" textAnchor="middle">Most</text>
    <polyline points="20,12 90,22 140,32 190,40" fill="none" stroke="#14532d" strokeWidth="2" strokeDasharray="4 3" />
    <polyline points="20,12 90,28 140,42 190,55" fill="none" stroke="#1e3a8a" strokeWidth="2.5" />
    <polyline points="20,12 90,38 140,58 190,72" fill="none" stroke="#c2410c" strokeWidth="2" strokeDasharray="4 3" />
    <rect x="135" y="3" width="50" height="14" rx="3" fill="#15803d" />
    <text x="160" y="12" fontSize="7" fill="white" textAnchor="middle" fontWeight="700">8% · LOW</text>
  </svg>
);

const RiskListSvg = () => {
  const rows = [
    { label: 'Akkumulátor: ALACSONY kockázat', bg: '#dcfce7', color: '#15803d' },
    { label: 'Hajtáslánc: KÖZEPES kockázat', bg: '#fef9c3', color: '#a16207' },
    { label: 'DTC hibakódok: 3 aktív', bg: '#fee2e2', color: '#dc2626' },
  ];
  return (
    <div className="flex flex-col gap-2 p-4 h-full justify-center relative">
      {rows.map((r, i) => (
        <div key={i} className="rounded-md px-3 py-2 text-[11px] font-medium" style={{ background: r.bg, color: r.color }}>
          {r.label}
        </div>
      ))}
      <div
        className="absolute top-3 right-3 text-[9px] font-bold text-white px-2 py-0.5 rounded"
        style={{ background: '#7c3aed' }}
      >
        Bayesian · 94%
      </div>
    </div>
  );
};

export default function DashboardServiceCards({ onCommercial, onDegradation, onInspection }: DashboardServiceCardsProps) {
  const { tr } = useLanguage();

  const cards = [
    {
      image: <BarChartSvg />,
      imgBg: '#dbeafe',
      tag: tr('card1_tag'),
      tagBg: '#eff6ff',
      tagColor: '#1d4ed8',
      tagBorder: '#bfdbfe',
      title: tr('card1_title'),
      desc: tr('card1_desc'),
      cta: tr('card1_cta'),
      ctaColor: '#1d4ed8',
      onClick: onCommercial,
    },
    {
      image: <DegradationSvg />,
      imgBg: '#dcfce7',
      tag: tr('card2_tag'),
      tagBg: '#f0fdf4',
      tagColor: '#15803d',
      tagBorder: '#bbf7d0',
      title: tr('card2_title'),
      desc: tr('card2_desc'),
      cta: tr('card2_cta'),
      ctaColor: '#15803d',
      onClick: onDegradation,
    },
    {
      image: <RiskListSvg />,
      imgBg: '#ede9fe',
      tag: tr('card3_tag'),
      tagBg: '#f5f3ff',
      tagColor: '#7c3aed',
      tagBorder: '#ddd6fe',
      title: tr('card3_title'),
      desc: tr('card3_desc'),
      cta: tr('card3_cta'),
      ctaColor: '#7c3aed',
      onClick: onInspection,
    },
  ];

  return (
    <section style={{ background: '#f8fafc', padding: '48px 24px' }}>
      <div className="max-w-[880px] mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="uppercase mb-2" style={{ fontSize: 10, color: '#94a3b8', letterSpacing: '0.12em', fontWeight: 600 }}>
            {tr('cards_sectionLabel')}
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a' }}>{tr('cards_sectionTitle')}</h2>
          <p className="mt-1" style={{ fontSize: 13, color: '#64748b' }}>{tr('cards_sectionSub')}</p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((c, i) => (
            <div
              key={i}
              className="rounded-xl overflow-hidden border border-[#e2e8f0] bg-white cursor-pointer hover:shadow-md transition-shadow"
              onClick={c.onClick}
            >
              <div style={{ height: 148, background: c.imgBg, overflow: 'hidden' }}>
                {c.image}
              </div>
              <div className="p-4">
                <span
                  className="inline-block rounded-full text-[11px] font-medium px-2.5 py-0.5 mb-2"
                  style={{ background: c.tagBg, color: c.tagColor, border: `1px solid ${c.tagBorder}` }}
                >
                  {c.tag}
                </span>
                <h3 className="font-bold text-[15px] mb-1" style={{ color: '#0f172a' }}>{c.title}</h3>
                <p className="text-[12px] leading-relaxed mb-3" style={{ color: '#64748b' }}>{c.desc}</p>
                <span className="text-[13px] font-semibold" style={{ color: c.ctaColor }}>{c.cta}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
