import { useLanguage } from '@/i18n/LanguageContext';
import { useState } from 'react';

export default function DashboardFooter() {
  const { tr } = useLanguage();
  const [email, setEmail] = useState('');

  const columns = [
    {
      title: tr('footer_col1Title'),
      links: [tr('footer_col1Link1'), tr('footer_col1Link2'), tr('footer_col1Link3'), tr('footer_col1Link4')],
    },
    {
      title: tr('footer_col2Title'),
      links: [tr('footer_col2Link1'), tr('footer_col2Link2'), tr('footer_col2Link3')],
    },
    {
      title: tr('footer_col3Title'),
      links: [tr('footer_col3Link1'), tr('footer_col3Link2'), tr('footer_col3Link3')],
    },
    {
      title: tr('footer_col4Title'),
      links: [tr('footer_col4Link1'), tr('footer_col4Link2'), tr('footer_col4Link3')],
    },
  ];

  const bottomLinks = [
    tr('footer_privacy'), tr('footer_gdpr'), tr('footer_terms'), tr('footer_imprint'), tr('footer_contact'),
  ];

  return (
    <footer>
      {/* Top block */}
      <div style={{ background: '#0d1f3c', padding: '48px 40px 36px' }}>
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Brand */}
          <div className="lg:col-span-1" style={{ minWidth: 180 }}>
            <div className="flex items-center gap-2 mb-3">
              <img
                src="/ev_diag_logo.png"
                onError={(e) => { (e.target as HTMLImageElement).src = 'https://market.evdiag.hu/static/ev_diag_logo.png'; }}
                alt="EV DIAG"
                style={{ width: 40, height: 40, borderRadius: 8 }}
              />
              <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>EV DIAG</span>
            </div>
            <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>
              {tr('footer_tagline')}
            </p>
          </div>

          {/* Link columns */}
          {columns.map((col, i) => (
            <div key={i}>
              <div className="uppercase mb-3" style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.1em' }}>
                {col.title}
              </div>
              <ul className="space-y-2">
                {col.links.map((link, j) => (
                  <li key={j}>
                    <span className="cursor-pointer hover:underline" style={{ fontSize: 13, color: '#cbd5e1' }}>{link}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Newsletter */}
          <div style={{ minWidth: 200 }}>
            <div className="uppercase mb-3" style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.1em' }}>
              {tr('footer_newsletterTitle')}
            </div>
            <div className="flex">
              <input
                type="email"
                placeholder="Email*"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  border: '1px solid #334155',
                  background: 'transparent',
                  color: '#fff',
                  borderRadius: '6px 0 0 6px',
                  padding: '9px 12px',
                  fontSize: 13,
                  flex: 1,
                  minWidth: 0,
                  outline: 'none',
                }}
              />
              <button
                style={{
                  background: '#1d4ed8',
                  color: '#fff',
                  borderRadius: '0 6px 6px 0',
                  padding: '9px 14px',
                  fontWeight: 600,
                  fontSize: 13,
                  border: 'none',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {tr('footer_submitBtn')}
              </button>
            </div>
            <div className="mt-2" style={{ fontSize: 11, color: '#475569' }}>info@evdiag.hu</div>
          </div>
        </div>
      </div>

      {/* Bottom block */}
      <div
        className="flex flex-col sm:flex-row items-center justify-between gap-2"
        style={{ background: '#0d1f3c', borderTop: '1px solid #1e293b', padding: '16px 40px' }}
      >
        <div className="flex flex-wrap gap-3">
          {bottomLinks.map((l, i) => (
            <span key={i} className="cursor-pointer hover:underline" style={{ fontSize: 11, color: '#475569' }}>{l}</span>
          ))}
        </div>
        <div style={{ fontSize: 11, color: '#334155' }}>{tr('footer_copyright')}</div>
      </div>
    </footer>
  );
}
