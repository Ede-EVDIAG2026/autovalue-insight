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
  onClick: () => void;
  isCompareSelected?: boolean;
  onCompareToggle?: () => void;
  compareDisabled?: boolean;
}

const heroGradients: Record<string, string> = {
  BEV: 'linear-gradient(135deg, hsl(224 71% 30%), hsl(224 71% 40%))',
  PHEV: 'linear-gradient(135deg, hsl(160 84% 18%), hsl(160 84% 28%))',
  HEV: 'linear-gradient(135deg, hsl(30 60% 25%), hsl(30 60% 35%))',
  MHEV: 'linear-gradient(135deg, hsl(220 10% 20%), hsl(220 10% 30%))',
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
    make, model, variant, model_type, data_confidence, onClick,
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
      {/* Compact colored header */}
      <div
        className="relative flex items-center justify-between px-3"
        style={{ height: 36, background: heroGradients[type] || heroGradients.MHEV }}
      >
        <div className="flex items-center gap-2">
          {/* Compare checkbox */}
          {onCompareToggle && (
            <label
              className="flex items-center cursor-pointer"
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
          <span className="text-[13px] font-semibold text-white/90 truncate">
            {make} {model}
          </span>
        </div>
        {/* Badge */}
        <span
          className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: badge.bg, color: badge.text }}
        >
          {type}
        </span>
      </div>

      {/* Body */}
      <div className="bg-card p-3 space-y-2.5">
        {/* Variant */}
        {variant && (
          <div className="text-[11px] text-muted-foreground truncate">{variant}</div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-1.5">
          {stats.map((s, i) => (
            <div key={i} className="bg-muted/50 rounded-md py-1.5 px-1 text-center">
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
