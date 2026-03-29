import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';
import type { Lang } from '@/i18n/translations';
import DegradationDetailModal from '@/components/DegradationDetailModal';

interface EVKBPanelProps {
  make: string;
  model: string;
  year: number;
  lang?: string;
}

interface FaultCode {
  dtc_code: string;
  severity: string;
  component: string;
  dtc_description: string;
}

interface EVKBData {
  battery_kwh: number;
  range_km_wltp: number;
  real_range_80pct_km: number;
  warranty_battery_years: number;
  warranty_battery_km: number;
  connector_type: string;
  ota_updates: string;
  adas_level: string;
  degradation_risk: string;
  rental_battery: boolean;
  fault_codes: FaultCode[];
  data_confidence: number;
  cell_chemistry?: string;
  known_issues?: string[];
  model_type?: string;
}

const ptx: Record<string, Record<Lang, string>> = {
  ev_kb_btn: { HU: '✦ Részletek az EV Adatbázisban →', EN: '✦ Details in EV Database →', DE: '✦ Details in der EV-Datenbank →' },
};

const degradationColor = (risk: string) => {
  switch (risk?.toUpperCase()) {
    case 'LOW': return 'bg-green-100 text-green-800 border-green-300';
    case 'MEDIUM': return 'bg-orange-100 text-orange-800 border-orange-300';
    case 'HIGH': return 'bg-red-100 text-red-800 border-red-300';
    case 'CRITICAL': return 'bg-red-200 text-red-900 border-red-500';
    default: return 'bg-muted text-muted-foreground';
  }
};

const severityColor = (sev: string) => {
  switch (sev?.toUpperCase()) {
    case 'HIGH': case 'CRITICAL': return 'bg-red-100 text-red-800';
    case 'MEDIUM': return 'bg-orange-100 text-orange-800';
    default: return 'bg-muted text-muted-foreground';
  }
};

export function EVKBPanel({ make, model, year }: EVKBPanelProps) {
  const { lang } = useLanguage();
  const l = (k: string) => ptx[k]?.[lang] ?? ptx[k]?.HU ?? k;
  const navigate = useNavigate();
  const [data, setData] = useState<EVKBData | null>(null);
  const [loading, setLoading] = useState(true);
  const [degModalOpen, setDegModalOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`https://api.evdiag.hu/api/v1/ev-kb/model/${encodeURIComponent(make)}/${encodeURIComponent(model)}?year=${year}`)
      .then(res => {
        if (!res.ok) throw new Error('not found');
        return res.json();
      })
      .then(d => { if (!cancelled) setData(d); })
      .catch(() => { if (!cancelled) setData(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [make, model, year]);

  if (loading) return (
    <Card className="border border-border bg-card mt-4">
      <CardContent className="pt-4 pb-4 space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-5 w-28 rounded-full" />
      </CardContent>
    </Card>
  );

  if (!data) return null;

  const confPct = Math.round((data.data_confidence ?? 0) * 100);
  const confColor = confPct >= 70 ? 'text-green-600' : 'text-orange-500';
  const faults = (data.fault_codes || []).slice(0, 3);

  return (
    <>
      <Card className="border border-border bg-card mt-4">
        <CardContent className="pt-4 pb-4 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Badge className="bg-primary/10 text-primary border-primary/20 text-xs font-bold">
              ⚡ EV Tudásbázis
            </Badge>
            <span className={`text-xs font-semibold ${confColor}`}>
              {confPct}% megbízhatóság
            </span>
          </div>

          {/* Row 1 — Battery */}
          <div className="text-sm text-foreground">
            🔋 {data.battery_kwh} kWh · {data.range_km_wltp} km WLTP · {data.real_range_80pct_km} km reális
          </div>

          {/* Row 2 — Warranty */}
          <div className="text-sm text-foreground">
            🛡 Garancia: {data.warranty_battery_years} év / {data.warranty_battery_km?.toLocaleString('hu-HU')} km
          </div>

          {/* Row 3 — Connector / OTA / ADAS */}
          <div className="text-sm text-foreground">
            🔌 {data.connector_type} · OTA: {data.ota_updates} · ADAS: {data.adas_level}
          </div>

          {/* Degradation badge — clickable */}
          {data.degradation_risk && (
            <Badge
              className={`text-xs border cursor-pointer hover:opacity-80 transition-opacity ${degradationColor(data.degradation_risk)}`}
              onClick={() => setDegModalOpen(true)}
            >
              Degradáció: {data.degradation_risk}
            </Badge>
          )}

          {/* Rental battery warning */}
          {data.rental_battery === true && (
            <Alert variant="destructive" className="py-2 px-3">
              <AlertDescription className="text-xs font-semibold">
                ⚠ Bérletes akksi opció létezett!
              </AlertDescription>
            </Alert>
          )}

          {/* Fault codes */}
          {faults.length > 0 && (
            <div className="space-y-1">
              <div className="text-xs font-semibold text-muted-foreground">Ismert hibakódok:</div>
              <div className="flex flex-wrap gap-1.5">
                {faults.map((fc, i) => (
                  <Badge key={i} className={`text-[10px] ${severityColor(fc.severity)}`} title={`${fc.component}: ${fc.dtc_description}`}>
                    {fc.dtc_code} — {fc.severity}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* EV Database link button */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-primary hover:text-primary/80 text-xs font-semibold mt-1"
            onClick={() => navigate(`/ev-database?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&autoopen=true`)}
          >
            {l('ev_kb_btn')}
          </Button>
        </CardContent>
      </Card>

      {/* Degradation Detail Modal */}
      {data.degradation_risk && (
        <DegradationDetailModal
          open={degModalOpen}
          onOpenChange={setDegModalOpen}
          data={{
            degradation_risk: data.degradation_risk,
            battery_kwh: data.battery_kwh,
            range_km_wltp: data.range_km_wltp,
            cell_chemistry: data.cell_chemistry,
            fault_codes: data.fault_codes,
            rental_battery: data.rental_battery,
            known_issues: data.known_issues,
            warranty_battery_years: data.warranty_battery_years,
            model_type: data.model_type,
            make,
            model,
          }}
        />
      )}
    </>
  );
}
