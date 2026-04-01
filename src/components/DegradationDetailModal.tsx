import { useEffect } from 'react';

interface DegradationDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: {
    degradation_risk: string;
    battery_kwh: number;
    range_km_wltp: number;
    cell_chemistry?: string;
    degradation_pct?: number;
    degradation_rate_per_year?: number;
    fault_codes?: { dtc_code: string; severity: string; component: string; dtc_description?: string; known_fix?: string }[];
    rental_battery?: boolean;
    known_issues?: string[];
    warranty_battery_years?: number;
    warranty_battery_km?: number;
    model_type?: string;
    make?: string;
    model?: string;
    real_range_80pct_km?: number;
    data_confidence?: number;
    median_price_eur?: number;
    data_points?: number;
    soh_estimated_pct?: number;
    soh_confidence?: number;
    soh_uncertainty_pct?: number;
    data_source_type?: string;
    data_completeness_pct?: number;
    bayesian_drivers?: { factor: string; contribution_pct: number }[];
    battery_risk_class?: string;
    risk_class_description?: string;
    price_impact_detailed?: { conservative_pct: number; expected_pct: number; optimistic_pct: number; liquidity_time_to_sell_impact_pct: number };
    dtc_risk_contributions?: { dtc_code: string; degradation_risk_contribution_pct: number; confidence_impact: number }[];
    dealer_recommendation?: { label: string; target_discount_pct_min: number; target_discount_pct_max: number; risk_buffer_eur_min: number; risk_buffer_eur_max: number };
  };
  onOpenWizard?: () => void;
}

export default function DegradationDetailModal({ open, onOpenChange, data }: DegradationDetailModalProps) {
  useEffect(() => {
    if (!open) return;

    const newWindow = window.open('', '_blank');
    if (newWindow) {
      const modelName = `${data.make ?? ''} ${data.model ?? 'EV'}`.trim();
      const degradation = data.degradation_pct ?? 18;
      const riskClass = data.degradation_risk || 'MEDIUM';
      const batteryKwh = data.battery_kwh ?? '—';
      const wltpKm = data.range_km_wltp ?? '—';
      const realKm = data.real_range_80pct_km ?? '—';
      const chemistry = data.cell_chemistry || '—';
      const chemDescMap: Record<string, string> = {
        LFP: 'Lítium-vasfoszfát — alacsony degradáció, hosszú élettartam',
        NMC: 'Nikkel-mangán-kobalt — kiegyensúlyozott teljesítmény',
        NCA: 'Nikkel-kobalt-alumínium — magas energiasűrűség',
      };
      const chemDesc = chemDescMap[data.cell_chemistry ?? ''] ?? '';
      const annualDeg = data.degradation_rate_per_year ?? '—';
      const remainingPct = data.soh_estimated_pct ?? (100 - degradation);
      const remainingKwh = typeof data.battery_kwh === 'number' ? (data.battery_kwh * (remainingPct as number) / 100).toFixed(1) : '—';
      const connector = '—';
      const warranty = data.warranty_battery_years ? `${data.warranty_battery_years} év / ${(data.warranty_battery_km ?? 0).toLocaleString('hu-HU')} km` : '—';
      const dtcCodes = data.fault_codes || [];
      const riskColor = riskClass === 'LOW' ? '#22c55e' : riskClass === 'HIGH' || riskClass === 'CRITICAL' ? '#ef4444' : '#f97316';
      const degradColor = degradation < 10 ? '#22c55e' : degradation < 20 ? '#f97316' : '#ef4444';

      const dtcRows = dtcCodes.map((dtc) => `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;font-family:monospace">${dtc.dtc_code || '—'}</td>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;color:${dtc.severity === 'CRITICAL' || dtc.severity === 'HIGH' ? '#ef4444' : '#6b7280'};font-weight:600">${dtc.severity || '—'}</td>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb">${dtc.component || '—'}</td>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb">${dtc.dtc_description || dtc.known_fix || '—'}</td>
        </tr>
      `).join('');

      newWindow.document.write(`<!DOCTYPE html>
<html lang="hu">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EV DIAG — Degradációs Analízis: ${modelName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f3f4f6; color: #111827; }
    .header { background: linear-gradient(135deg, #1e3a6e 0%, #1e40af 100%); color: white; padding: 32px 40px; display: flex; justify-content: space-between; align-items: center; }
    .header-left h1 { font-size: 1.8rem; font-weight: 700; margin-bottom: 4px; }
    .header-left p { opacity: 0.8; font-size: 0.9rem; }
    .deg-circle { text-align: center; background: rgba(255,255,255,0.15); border-radius: 16px; padding: 20px 28px; }
    .deg-number { font-size: 3rem; font-weight: 800; color: ${degradColor}; }
    .deg-label { font-size: 0.85rem; opacity: 0.8; margin-bottom: 8px; }
    .risk-badge { display: inline-block; background: ${riskColor}; color: white; padding: 4px 16px; border-radius: 20px; font-weight: 700; font-size: 0.85rem; }
    .container { max-width: 960px; margin: 32px auto; padding: 0 20px 60px; }
    .card { background: white; border-radius: 12px; padding: 28px; margin-bottom: 24px; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
    .card h2 { font-size: 1.1rem; font-weight: 700; margin-bottom: 20px; color: #1e40af; display: flex; align-items: center; gap: 8px; }
    .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
    .stat { background: #f8fafc; border-radius: 8px; padding: 16px; }
    .stat-label { font-size: 0.78rem; color: #6b7280; margin-bottom: 6px; }
    .stat-value { font-size: 1.15rem; font-weight: 700; color: #111827; }
    .stat-desc { font-size: 0.75rem; color: #6b7280; margin-top: 4px; font-style: italic; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #1e40af; color: white; padding: 10px 8px; text-align: left; font-size: 0.85rem; }
    tr:hover td { background: #f0f4ff; }
    .footer { text-align: center; color: #9ca3af; font-size: 0.8rem; padding: 24px; border-top: 1px solid #e5e7eb; margin-top: 40px; }
    .btn { display: inline-block; padding: 10px 24px; border-radius: 8px; font-weight: 600; cursor: pointer; border: none; font-size: 0.9rem; margin: 0 8px; }
    .btn-print { background: #1e40af; color: white; }
    .btn-print:hover { background: #1e3a8a; }
    .btn-close { background: #e5e7eb; color: #374151; }
    .btn-close:hover { background: #d1d5db; }
    @media print { body { background: white; } .header { print-color-adjust: exact; -webkit-print-color-adjust: exact; } .footer .btn { display: none; } }
    @media (max-width: 600px) { .grid-3 { grid-template-columns: 1fr; } .grid-2 { grid-template-columns: 1fr; } .header { flex-direction: column; gap: 16px; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <h1>🔋 Akkumulátor Degradációs Analízis</h1>
      <p>Bayesian Core v2 · EV DIAG Platform</p>
      <p style="margin-top:8px;font-size:1.1rem;font-weight:600">${modelName}</p>
    </div>
    <div class="deg-circle">
      <div class="deg-label">degradáció</div>
      <div class="deg-number">${degradation}%</div>
      <span class="risk-badge">${riskClass}</span>
    </div>
  </div>

  <div class="container">
    <div class="card">
      <h2>📊 Számítás bemeneti adatai</h2>
      <div class="grid-3">
        <div class="stat">
          <div class="stat-label">Akkumulátor (névleges)</div>
          <div class="stat-value">${batteryKwh} kWh</div>
        </div>
        <div class="stat">
          <div class="stat-label">WLTP hatótáv</div>
          <div class="stat-value">${wltpKm} km</div>
        </div>
        <div class="stat">
          <div class="stat-label">Reális hatótáv (80%)</div>
          <div class="stat-value">${realKm} km</div>
        </div>
        <div class="stat">
          <div class="stat-label">Cellakémia</div>
          <div class="stat-value">${chemistry}</div>
          ${chemDesc ? `<div class="stat-desc">${chemDesc}</div>` : ''}
        </div>
        <div class="stat">
          <div class="stat-label">Csatlakozó</div>
          <div class="stat-value">${connector}</div>
        </div>
        <div class="stat">
          <div class="stat-label">Garancia</div>
          <div class="stat-value">${warranty}</div>
        </div>
      </div>
    </div>

    <div class="card">
      <h2>⚡ Bayesian Számítási Paraméterek</h2>
      <div class="grid-3">
        <div class="stat">
          <div class="stat-label">Névleges kapacitás</div>
          <div class="stat-value">${batteryKwh} kWh</div>
        </div>
        <div class="stat">
          <div class="stat-label">Becsült maradék kapacitás</div>
          <div class="stat-value">${remainingKwh} kWh | ${remainingPct}%</div>
        </div>
        <div class="stat">
          <div class="stat-label">Éves degradációs ráta</div>
          <div class="stat-value">${annualDeg}% / év</div>
        </div>
      </div>
    </div>

    ${dtcCodes.length > 0 ? `
    <div class="card">
      <h2>🛡 Ismert Hibakódok és Kockázatok</h2>
      <table>
        <thead><tr><th>DTC kód</th><th>Súlyosság</th><th>Komponens</th><th>Leírás / Javítás</th></tr></thead>
        <tbody>${dtcRows}</tbody>
      </table>
    </div>
    ` : ''}

    <div class="footer">
      EV DIAG Bayesian Core v2 · Adatforrás: AS24 piac + EV Tudásbázis · ${new Date().toLocaleDateString('hu-HU')}
      <br><br>
      <button class="btn btn-print" onclick="window.print()">🖨 Nyomtatás / PDF mentés</button>
      <button class="btn btn-close" onclick="window.close()">✕ Bezárás</button>
    </div>
  </div>
</body>
</html>`);
      newWindow.document.close();
    }

    onOpenChange(false);
  }, [open]);

  return null;
}
