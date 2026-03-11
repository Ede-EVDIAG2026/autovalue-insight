import { useState } from 'react';
import { Download, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MARKET_API = 'https://market.evdiag.hu';

interface PdfDownloadButtonProps {
  vin?: string;
  /** Use inline styles instead of shadcn Button */
  inline?: boolean;
}

const PdfDownloadButton = ({ vin, inline }: PdfDownloadButtonProps) => {
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  const handleDownload = async () => {
    if (!vin || loading) return;
    setLoading(true);
    setReady(false);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const response = await fetch(`${MARKET_API}/vin/report/${vin}`, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      clearTimeout(timeout);
      const data = await response.json();

      if (data.download_url) {
        window.open(data.download_url, '_blank');
        setReady(true);
        setTimeout(() => setReady(false), 3000);
      } else {
        alert('PDF generálás sikertelen. Kérjük próbálja újra.');
      }
    } catch {
      alert('Kapcsolódási hiba. Kérjük ellenőrizze az internetkapcsolatát.');
    } finally {
      setLoading(false);
    }
  };

  if (!vin) return null;

  const label = ready
    ? '✅ Letöltés kész!'
    : loading
      ? '⏳ Generálás folyamatban...'
      : null;

  if (inline) {
    return (
      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <button
          onClick={handleDownload}
          disabled={loading || !vin}
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
            background: ready ? '#22c55e' : '#2563eb',
            color: '#fff',
            fontSize: 15,
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
            transition: 'all 0.2s ease',
            fontFamily: "'DM Sans', sans-serif",
          }}
          onMouseEnter={e => { if (!loading && !ready) (e.currentTarget.style.background = '#1d4ed8'); }}
          onMouseLeave={e => { if (!loading && !ready) (e.currentTarget.style.background = '#2563eb'); }}
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : ready ? (
            <CheckCircle size={16} />
          ) : (
            <Download size={16} />
          )}
          {label || 'Riport letöltése (PDF)'}
        </button>
        <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 8, lineHeight: 1.5 }}>
          📄 A riport tartalmazza a teljes értékelést, visszahívásokat és piaci árelemzést.
          <br />
          Érvényes: 30 napig • Formátum: PDF • Méret: ~60 KB
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 text-center">
      <Button
        onClick={handleDownload}
        disabled={loading || !vin}
        className="w-full sm:w-auto min-w-[220px] h-auto py-3 px-7 text-[15px] font-semibold transition-all duration-200"
        style={{ background: ready ? '#22c55e' : undefined }}
      >
        {loading ? (
          <Loader2 size={16} className="animate-spin mr-2" />
        ) : ready ? (
          <CheckCircle size={16} className="mr-2" />
        ) : (
          <Download size={16} className="mr-2" />
        )}
        {label || 'Riport letöltése (PDF)'}
      </Button>
      <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
        📄 A riport tartalmazza a teljes értékelést, visszahívásokat és piaci árelemzést.
        <br />
        Érvényes: 30 napig • Formátum: PDF • Méret: ~60 KB
      </p>
    </div>
  );
};

export default PdfDownloadButton;
