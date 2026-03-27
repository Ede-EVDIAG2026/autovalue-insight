import { useLanguage } from '@/i18n/LanguageContext';
import type { Lang } from '@/i18n/translations';

const tx: Record<string, Record<Lang, string>> = {
  data_quality: { HU: 'Adatminőség', EN: 'Data quality', DE: 'Datenqualität' },
  details: { HU: 'Részletek', EN: 'Details', DE: 'Details' },
};

export interface EVModelCardProps {
  make: string;
  model: string;
  variant: string;
  battery_kwh: number | null;
  range_km_wltp: number | null;
  fast_charge_kw: number | null;
  ac_charge_kw?: number | null;
  motor_kw?: number | null;
  cell_chemistry: string | null;
  model_type?: string;
  data_confidence: number | null;
  image_url?: string | null;
  onClick: () => void;
  isCompareSelected?: boolean;
  onCompareToggle?: () => void;
  compareDisabled?: boolean;
}

const heroGradients: Record<string, string> = {
  BEV: 'linear-gradient(135deg, #1a2a4a 0%, #0f3460 100%)',
  PHEV: 'linear-gradient(135deg, #1a2d0e 0%, #2d5c10 100%)',
  HEV: 'linear-gradient(135deg, #2d1a0e 0%, #5c3a0a 100%)',
  MHEV: 'linear-gradient(135deg, #1a1a1a 0%, #3a3a3a 100%)',
};

const badgeStyles: Record<string, { bg: string; text: string }> = {
  BEV: { bg: '#B5D4F4', text: '#0C447C' },
  PHEV: { bg: '#C0DD97', text: '#3B6D11' },
  HEV: { bg: '#FAC775', text: '#633806' },
  MHEV: { bg: '#D3D1C7', text: '#444441' },
};

/* Simple SVG silhouettes per type */
function CarSilhouette({ type }: { type: string }) {
  const color = 'rgba(255,255,255,0.12)';
  if (type === 'BEV') {
    // sleek sedan / crossover
    return (
      <svg viewBox="0 0 200 80" className="w-[140px] h-auto">
        <path d="M20 60 Q20 45 40 40 L60 28 Q80 18 120 18 L150 22 Q170 26 175 40 L180 50 Q182 58 180 60 Z" fill={color} />
        <circle cx="55" cy="62" r="10" fill={color} />
        <circle cx="155" cy="62" r="10" fill={color} />
      </svg>
    );
  }
  if (type === 'PHEV') {
    // compact hatchback
    return (
      <svg viewBox="0 0 200 80" className="w-[130px] h-auto">
        <path d="M25 58 Q22 42 45 38 L65 22 Q85 14 110 14 L140 18 Q158 22 160 28 L165 38 Q172 48 170 58 Z" fill={color} />
        <circle cx="55" cy="60" r="10" fill={color} />
        <circle cx="150" cy="60" r="10" fill={color} />
      </svg>
    );
  }
  if (type === 'HEV') {
    // SUV / crossover (taller)
    return (
      <svg viewBox="0 0 200 80" className="w-[135px] h-auto">
        <path d="M22 58 Q20 38 42 32 L60 16 Q78 8 115 8 L148 12 Q168 18 172 32 L178 46 Q180 56 178 58 Z" fill={color} />
        <circle cx="55" cy="62" r="11" fill={color} />
        <circle cx="155" cy="62" r="11" fill={color} />
      </svg>
    );
  }
  // MHEV / default
  return (
    <svg viewBox="0 0 200 80" className="w-[130px] h-auto">
      <path d="M24 58 Q22 42 44 36 L62 22 Q82 14 118 14 L148 18 Q166 24 168 36 L174 48 Q176 56 174 58 Z" fill={color} />
      <circle cx="56" cy="60" r="10" fill={color} />
      <circle cx="152" cy="60" r="10" fill={color} />
    </svg>
  );
}

function confColor(pct: number) {
  if (pct < 70) return 'hsl(0 84% 60%)';
  if (pct < 85) return 'hsl(30 90% 50%)';
  return 'hsl(var(--primary))';
}

function statsForType(type: string, props: EVModelCardProps): { val: string; lbl: string }[] {
  const fmt = (v: number | null | undefined, unit: string) => v != null ? `${v}` : '—';

  if (type === 'PHEV') {
    return [
      { val: fmt(props.battery_kwh, ''), lbl: 'kWh' },
      { val: fmt(props.range_km_wltp, ''), lbl: 'km EV' },
      { val: fmt(props.ac_charge_kw, ''), lbl: 'kW AC' },
    ];
  }
  if (type === 'HEV') {
    return [
      { val: fmt(props.motor_kw, ''), lbl: 'kW' },
      { val: fmt(props.range_km_wltp, ''), lbl: 'km' },
      { val: '—', lbl: '' },
    ];
  }
  if (type === 'MHEV') {
    return [
      { val: fmt(props.motor_kw, ''), lbl: 'kW' },
      { val: fmt(props.range_km_wltp, ''), lbl: 'km' },
      { val: '48V', lbl: 'MHEV' },
    ];
  }
  // BEV default
  return [
    { val: fmt(props.battery_kwh, ''), lbl: 'kWh' },
    { val: fmt(props.range_km_wltp, ''), lbl: 'km WLTP' },
    { val: fmt(props.fast_charge_kw, ''), lbl: 'kW DC' },
  ];
}

export default function EVModelCard(props: EVModelCardProps) {
  const {
    make, model, variant, model_type, data_confidence, image_url, onClick,
    isCompareSelected, onCompareToggle, compareDisabled,
  } = props;
  const { lang } = useLanguage();
  const l = (key: string) => tx[key]?.[lang] ?? tx[key]?.HU ?? key;

  const type = model_type || 'BEV';
  const confPct = Math.round((data_confidence ?? 0) * 100);
  const badge = badgeStyles[type] || badgeStyles.MHEV;
  const stats = statsForType(type, props);

  const initials = make.length >= 2 ? make.slice(0, 2).toUpperCase() : make.toUpperCase();

  return (
    <div
      className={`overflow-hidden rounded-lg cursor-pointer transition-shadow hover:shadow-md ${
        isCompareSelected ? 'ring-2 ring-primary/40' : ''
      }`}
      style={{ border: '0.5px solid hsl(var(--border))' }}
      onClick={onClick}
    >
      {/* Hero area */}
      <div
        className="relative overflow-hidden flex flex-col items-center justify-center"
        style={{ height: 130, background: heroGradients[type] || heroGradients.MHEV }}
      >
        {image_url ? (
          <img
            src={image_url}
            alt={`${make} ${model}`}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: 'center 60%' }}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        ) : (
          <>
            <span style={{ fontSize: 48, fontWeight: 500, color: 'rgba(255,255,255,0.15)', letterSpacing: -2, lineHeight: 1 }}>
              {initials}
            </span>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
              {model}
            </span>
          </>
        )}

        {/* Compare checkbox */}
        {onCompareToggle && (
          <label
            className="absolute top-2 left-2 flex items-center gap-1 cursor-pointer z-10"
            onClick={e => e.stopPropagation()}
          >
            <input
              type="checkbox"
              checked={!!isCompareSelected}
              onChange={() => onCompareToggle()}
              disabled={compareDisabled && !isCompareSelected}
              className="w-3.5 h-3.5 rounded accent-white"
            />
          </label>
        )}

        {/* Badge */}
        <span
          className="absolute top-2 right-2 text-[10px] font-semibold px-2 py-0.5 rounded-full z-[2]"
          style={{ backgroundColor: badge.bg, color: badge.text }}
        >
          {type}
        </span>
      </div>

      {/* Body */}
      <div className="bg-card p-3 space-y-2.5">
        {/* Title */}
        <div>
          <div className="text-sm font-medium text-foreground leading-tight">
            {make} {model}
          </div>
          {variant && (
            <div className="text-[11px] text-muted-foreground mt-0.5 truncate">{variant}</div>
          )}
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-1.5">
          {stats.map((s, i) => (
            <div key={i} className="bg-secondary/40 rounded-md py-1.5 px-1 text-center">
              <div className="text-[13px] font-medium text-foreground leading-tight">{s.val}</div>
              <div className="text-[10px] text-muted-foreground">{s.lbl}</div>
            </div>
          ))}
        </div>

        {/* Confidence */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-[3px] rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${confPct}%`, backgroundColor: confColor(confPct) }}
            />
          </div>
          <span className="text-[11px] font-medium text-muted-foreground whitespace-nowrap">
            {confPct}%
          </span>
        </div>

        {/* Details link */}
        <button
          className="text-xs text-primary hover:underline mt-1"
          onClick={e => { e.stopPropagation(); onClick(); }}
        >
          {l('details')} →
        </button>
      </div>
    </div>
  );
}
