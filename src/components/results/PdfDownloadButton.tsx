import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/i18n/LanguageContext';

import { MARKET_API } from '@/lib/marketApi';

interface PdfDownloadButtonProps {
  vin?: string;
  inline?: boolean;
}

const PdfDownloadButton = ({ vin, inline }: PdfDownloadButtonProps) => {
  const { tr, lang } = useLanguage();

  const handleDownload = () => {
    if (!vin) return;
    const langParam = lang === 'EN' ? 'en' : lang === 'DE' ? 'de' : 'hu';
    const url = `${MARKET_API}/vin/pdf/${vin}?lang=${langParam}`;
    window.open(url, '_blank');
  };

  if (!vin) return null;

  if (inline) {
    return (
      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <button
          onClick={handleDownload}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            minWidth: 220,
            width: '100%',
            maxWidth: 400,
            padding: '12px 28px',
            borderRadius: 8,
            border: 'none',
            background: '#2563eb',
            color: '#fff',
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            fontFamily: "'DM Sans', sans-serif",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#1d4ed8'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#2563eb'; }}
        >
          <Download size={16} />
          {tr('pdf_download')}
        </button>
        <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 8, lineHeight: 1.5 }}>
          📄 {tr('pdf_disclaimer')}
          <br />
          {tr('pdf_validity')}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 text-center">
      <Button
        onClick={handleDownload}
        className="w-full sm:w-auto min-w-[220px] h-auto py-3 px-7 text-[15px] font-semibold transition-all duration-200"
      >
        <Download size={16} className="mr-2" />
        {tr('pdf_download')}
      </Button>
      <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
        📄 {tr('pdf_disclaimer')}
        <br />
        {tr('pdf_validity')}
      </p>
    </div>
  );
};

export default PdfDownloadButton;
