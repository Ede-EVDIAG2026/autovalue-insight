import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { InspectionResult } from '@/components/battery/BatteryInspectionResults';
import type { Lang } from '@/i18n/translations';
import { montserratRegular } from '@/components/battery/fonts/montserratRegular';
import { montserratBold } from '@/components/battery/fonts/montserratBold';
import { logoBase64 } from '@/components/battery/fonts/logoBase64';

// ─── PDF i18n translations ───
const pdfTx: Record<string, Record<Lang, string>> = {
  header_subtitle: {
    HU: 'Bayesian Core v2 — Akkumulátor / Hajtáslánc Előellenőrzési Riport',
    EN: 'Bayesian Core v2 — Battery / Powertrain Pre-Inspection Report',
    DE: 'Bayesian Core v2 — Batterie / Antrieb Vorabprüfungsbericht',
  },
  footer_title: {
    HU: 'EV DIAG — Bayesian Core v2 Előellenőrzési Riport',
    EN: 'EV DIAG — Bayesian Core v2 Pre-Inspection Report',
    DE: 'EV DIAG — Bayesian Core v2 Vorabprüfungsbericht',
  },
  gauge_battery: { HU: 'Akkumulátor', EN: 'Battery', DE: 'Batterie' },
  gauge_ice: { HU: 'ICE Motor', EN: 'ICE Engine', DE: 'Verbrennungsmotor' },
  buy_recommendation_label: { HU: 'Vásárlási ajánlás:', EN: 'Buy recommendation:', DE: 'Kaufempfehlung:' },
  condition_label: { HU: 'Állapot', EN: 'Condition', DE: 'Zustand' },
  bayes_confidence: { HU: 'Bayes konfidencia', EN: 'Bayesian confidence', DE: 'Bayes-Konfidenz' },
  key_metrics: { HU: 'Főbb mutatók', EN: 'Key Metrics', DE: 'Wichtige Kennzahlen' },
  metric: { HU: 'Mutató', EN: 'Metric', DE: 'Kennzahl' },
  value: { HU: 'Érték', EN: 'Value', DE: 'Wert' },
  remaining_capacity: { HU: 'Becsült maradék kapacitás', EN: 'Estimated remaining capacity', DE: 'Geschätzte Restkapazität' },
  degradation_rate: { HU: 'Éves degradációs ráta', EN: 'Annual degradation rate', DE: 'Jährl. Degradationsrate' },
  expected_life: { HU: 'Várható akksi élettartam', EN: 'Expected battery life', DE: 'Erwartete Batterielebensdauer' },
  powertrain_risk: { HU: 'Hajtáslánc kockázat', EN: 'Powertrain risk', DE: 'Antriebsrisiko' },
  replacement_cost: { HU: 'Becsült csereköltség', EN: 'Est. replacement cost', DE: 'Gesch. Austauschkosten' },
  price_impact: { HU: 'Árkihatás', EN: 'Price impact', DE: 'Preisauswirkung' },
  ice_health: { HU: 'ICE motor egészség', EN: 'ICE engine health', DE: 'Verbrennungsmotor Zustand' },
  year_unit: { HU: 'év', EN: 'years', DE: 'Jahre' },
  per_year: { HU: '/ év', EN: '/ year', DE: '/ Jahr' },
  risk_factors: { HU: 'Kockázati tényezők', EN: 'Risk Factors', DE: 'Risikofaktoren' },
  factor: { HU: 'Tényező', EN: 'Factor', DE: 'Faktor' },
  severity: { HU: 'Súlyosság', EN: 'Severity', DE: 'Schweregrad' },
  description: { HU: 'Leírás', EN: 'Description', DE: 'Beschreibung' },
  positive_factors: { HU: 'Pozitív tényezők', EN: 'Positive Factors', DE: 'Positive Faktoren' },
  checklist: { HU: 'Ellenőrzési checklist', EN: 'Inspection Checklist', DE: 'Prüfcheckliste' },
  priority: { HU: 'Prioritás', EN: 'Priority', DE: 'Priorität' },
  check_item: { HU: 'Ellenőrzési pont', EN: 'Inspection Item', DE: 'Prüfpunkt' },
  reason: { HU: 'Indoklás', EN: 'Reason', DE: 'Begründung' },
  ai_summary: { HU: 'AI Összefoglaló', EN: 'AI Summary', DE: 'KI-Zusammenfassung' },
  reasoning_label: { HU: 'Indoklás', EN: 'Reasoning', DE: 'Begründung' },
  disclaimer: {
    HU: 'Ez a riport AI-alapú becslés, nem helyettesíti a szakszervizi diagnosztikát. Az EV DIAG nem vállal felelősséget a becslések pontosságáért.',
    EN: 'This report is an AI-based estimate and does not replace professional diagnostic inspection. EV DIAG assumes no liability for the accuracy of estimates.',
    DE: 'Dieser Bericht ist eine KI-basierte Schätzung und ersetzt keine professionelle Diagnose. EV DIAG übernimmt keine Haftung für die Genauigkeit der Schätzungen.',
  },
  filename_prefix: { HU: 'Ellenorzes', EN: 'Inspection', DE: 'Pruefung' },
};

const severityLabels: Record<string, Record<Lang, string>> = {
  LOW: { HU: 'Alacsony', EN: 'Low', DE: 'Niedrig' },
  MEDIUM: { HU: 'Közepes', EN: 'Medium', DE: 'Mittel' },
  HIGH: { HU: 'Magas', EN: 'High', DE: 'Hoch' },
  CRITICAL: { HU: 'Kritikus', EN: 'Critical', DE: 'Kritisch' },
};

const priorityLabels: Record<string, Record<Lang, string>> = {
  'KÖTELEZŐ': { HU: 'KÖTELEZŐ', EN: 'MANDATORY', DE: 'PFLICHT' },
  'JAVASOLT': { HU: 'JAVASOLT', EN: 'RECOMMENDED', DE: 'EMPFOHLEN' },
  'OPCIONÁLIS': { HU: 'OPCIONÁLIS', EN: 'OPTIONAL', DE: 'OPTIONAL' },
  'MANDATORY': { HU: 'KÖTELEZŐ', EN: 'MANDATORY', DE: 'PFLICHT' },
  'RECOMMENDED': { HU: 'JAVASOLT', EN: 'RECOMMENDED', DE: 'EMPFOHLEN' },
  'OPTIONAL': { HU: 'OPCIONÁLIS', EN: 'OPTIONAL', DE: 'OPTIONAL' },
};

interface PdfParams {
  result: InspectionResult;
  modelInfo: { make: string; model: string; variant?: string; model_type: string };
  lang?: Lang;
}

export function generateInspectionPdf({ result, modelInfo, lang = 'HU' }: PdfParams) {
  const l = (key: string): string => pdfTx[key]?.[lang] ?? pdfTx[key]?.['HU'] ?? key;
  const locale = lang === 'HU' ? 'hu-HU' : lang === 'DE' ? 'de-DE' : 'en-GB';

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  doc.addFileToVFS('Montserrat-Regular.ttf', montserratRegular);
  doc.addFont('Montserrat-Regular.ttf', 'Montserrat', 'normal');
  doc.addFileToVFS('Montserrat-Bold.ttf', montserratBold);
  doc.addFont('Montserrat-Bold.ttf', 'Montserrat', 'bold');
  doc.setFont('Montserrat', 'normal');

  const W = doc.internal.pageSize.getWidth();
  const M = 15;
  const CW = W - 2 * M;
  let y = M;

  const brand = { primary: [22, 78, 159] as [number, number, number], dark: [15, 23, 42] as [number, number, number], green: [22, 163, 74] as [number, number, number], red: [220, 38, 38] as [number, number, number], orange: [234, 88, 12] as [number, number, number], yellow: [202, 138, 4] as [number, number, number], gray: [100, 116, 139] as [number, number, number], lightGray: [241, 245, 249] as [number, number, number] };

  const setColor = (c: [number, number, number]) => { doc.setTextColor(...c); doc.setDrawColor(...c); };
  const addPage = () => { doc.addPage(); y = M; drawFooter(); };
  const checkPage = (needed: number) => { if (y + needed > 275) addPage(); };

  const drawFooter = () => {
    const py = doc.internal.pageSize.getHeight() - 8;
    doc.setFontSize(7);
    setColor(brand.gray);
    doc.text(l('footer_title'), M, py);
    doc.text(`${new Date().toLocaleDateString(locale)}`, W - M, py, { align: 'right' });
  };

  const drawGauge = (cx: number, cy: number, r: number, score: number, label: string) => {
    doc.setDrawColor(...brand.lightGray);
    doc.setLineWidth(2.5);
    doc.circle(cx, cy, r, 'S');
    
    const col = score >= 80 ? brand.green : score >= 60 ? brand.yellow : score >= 40 ? brand.orange : brand.red;
    doc.setDrawColor(...col);
    doc.setLineWidth(2.5);
    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + (score / 100) * 2 * Math.PI;
    const steps = Math.max(20, Math.round(score));
    for (let i = 0; i < steps; i++) {
      const a1 = startAngle + (i / steps) * (endAngle - startAngle);
      const a2 = startAngle + ((i + 1) / steps) * (endAngle - startAngle);
      doc.line(cx + r * Math.cos(a1), cy + r * Math.sin(a1), cx + r * Math.cos(a2), cy + r * Math.sin(a2));
    }

    doc.setFontSize(18);
    doc.setFont('Montserrat', 'bold');
    setColor(brand.dark);
    doc.text(`${score}`, cx, cy + 1, { align: 'center' });
    
    doc.setFontSize(7);
    doc.setFont('Montserrat', 'normal');
    setColor(brand.gray);
    doc.text(label, cx, cy + r + 6, { align: 'center' });
  };

  const drawSectionTitle = (title: string, icon?: string) => {
    checkPage(12);
    doc.setFontSize(11);
    doc.setFont('Montserrat', 'bold');
    setColor(brand.primary);
    doc.text(`${icon ? icon + ' ' : ''}${title}`, M, y);
    y += 2;
    doc.setLineWidth(0.3);
    doc.setDrawColor(...brand.primary);
    doc.line(M, y, M + CW, y);
    y += 6;
  };

  const severityLabel = (s: string) => severityLabels[s]?.[lang] ?? s;

  const translatePriority = (p: string) => priorityLabels[p]?.[lang] ?? p;

  // Determine priority key for sorting (normalize to HU keys)
  const priorityKey = (p: string): string => {
    for (const [key, vals] of Object.entries(priorityLabels)) {
      if (p === key || Object.values(vals).includes(p)) return key;
    }
    return p;
  };

  // ═══════════════════════════════════════════
  // PAGE 1 — Header & Main Results
  // ═══════════════════════════════════════════

  doc.setFillColor(...brand.primary);
  doc.rect(0, 0, W, 32, 'F');

  try {
    doc.addImage(logoBase64, 'PNG', M, 3, 26, 26);
  } catch (e) {
    // fallback: no logo
  }

  const textStartX = M + 30;
  doc.setFontSize(16);
  doc.setFont('Montserrat', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('EV DIAG', textStartX, 13);
  doc.setFontSize(9);
  doc.setFont('Montserrat', 'normal');
  doc.text(l('header_subtitle'), textStartX, 20);
  doc.setFontSize(8);
  doc.text(`${modelInfo.make} ${modelInfo.model}${modelInfo.variant ? ' ' + modelInfo.variant : ''} (${modelInfo.model_type})`, textStartX, 27);
  doc.text(new Date().toLocaleDateString(locale), W - M, 27, { align: 'right' });

  y = 40;

  // Main gauges row
  const gaugeY = y + 16;
  drawGauge(M + 25, gaugeY, 14, result.battery_health_score, l('gauge_battery'));
  if (result.ice_health_score != null) {
    drawGauge(M + 70, gaugeY, 14, result.ice_health_score, l('gauge_ice'));
  }

  // Recommendation badge
  const recX = result.ice_health_score != null ? M + 105 : M + 70;
  doc.setFontSize(8);
  doc.setFont('Montserrat', 'bold');
  setColor(brand.gray);
  doc.text(l('buy_recommendation_label'), recX, gaugeY - 10);
  
  const recColor = result.buy_recommendation.includes('NEM') || result.buy_recommendation.includes('ELLEN') || result.buy_recommendation.includes('NOT') || result.buy_recommendation.includes('NICHT')
    ? brand.red 
    : result.buy_recommendation.includes('FELTÉT') || result.buy_recommendation.includes('CONDITION') || result.buy_recommendation.includes('BEDINGT')
    ? brand.orange 
    : brand.green;
  doc.setFillColor(...recColor);
  const recW = doc.getTextWidth(result.buy_recommendation) + 8;
  doc.roundedRect(recX, gaugeY - 7, recW, 7, 1.5, 1.5, 'F');
  doc.setFontSize(8);
  doc.setFont('Montserrat', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(result.buy_recommendation, recX + 4, gaugeY - 2);

  // Health label & confidence
  setColor(brand.dark);
  doc.setFontSize(9);
  doc.text(`${l('condition_label')}: ${result.battery_health_label}`, recX, gaugeY + 6);
  setColor(brand.gray);
  doc.setFontSize(8);
  doc.setFont('Montserrat', 'normal');
  doc.text(`${l('bayes_confidence')}: ${Math.round(result.bayesian_confidence * 100)}%`, recX, gaugeY + 12);

  y = gaugeY + 24;

  // ─── Key Metrics Table ───
  drawSectionTitle(l('key_metrics'));

  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    theme: 'grid',
    headStyles: { fillColor: brand.primary, fontSize: 8, font: 'Montserrat', fontStyle: 'bold' },
    bodyStyles: { fontSize: 8, font: 'Montserrat', textColor: brand.dark },
    alternateRowStyles: { fillColor: brand.lightGray },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 65 }, 1: { cellWidth: 55 } },
    head: [[l('metric'), l('value')]],
    body: [
      [l('remaining_capacity'), `${result.estimated_remaining_capacity_kwh} kWh (${result.estimated_remaining_capacity_pct}%)`],
      [l('degradation_rate'), `${result.degradation_rate_per_year_pct}% ${l('per_year')}`],
      [l('expected_life'), `${result.expected_battery_life_years} ${l('year_unit')}`],
      [l('powertrain_risk'), `${result.powertrain_risk_score}/100`],
      [l('replacement_cost'), `€${result.estimated_replacement_cost_eur.min.toLocaleString(locale)} – €${result.estimated_replacement_cost_eur.max.toLocaleString(locale)}`],
      [l('price_impact'), `${result.price_impact_pct > 0 ? '+' : ''}${result.price_impact_pct}%`],
      ...(result.ice_health_score != null ? [[l('ice_health'), `${result.ice_health_score}/100`]] : []),
    ],
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // ─── Risk Factors ───
  if (result.risk_factors.length > 0) {
    drawSectionTitle(l('risk_factors'), '⚠');

    autoTable(doc, {
      startY: y,
      margin: { left: M, right: M },
      theme: 'grid',
      headStyles: { fillColor: brand.red, fontSize: 8, font: 'Montserrat', fontStyle: 'bold', textColor: [255, 255, 255] },
      bodyStyles: { fontSize: 7.5, font: 'Montserrat', textColor: brand.dark },
      columnStyles: { 0: { cellWidth: 35, fontStyle: 'bold' }, 1: { cellWidth: 20 }, 2: { cellWidth: 'auto' } },
      head: [[l('factor'), l('severity'), l('description')]],
      body: result.risk_factors.map(rf => [rf.factor, severityLabel(rf.severity), rf.description]),
    });

    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // ─── Positive Factors ───
  if (result.positive_factors.length > 0) {
    checkPage(20);
    drawSectionTitle(l('positive_factors'), '✓');

    autoTable(doc, {
      startY: y,
      margin: { left: M, right: M },
      theme: 'grid',
      headStyles: { fillColor: brand.green, fontSize: 8, font: 'Montserrat', fontStyle: 'bold', textColor: [255, 255, 255] },
      bodyStyles: { fontSize: 7.5, font: 'Montserrat', textColor: brand.dark },
      columnStyles: { 0: { cellWidth: 45, fontStyle: 'bold' } },
      head: [[l('factor'), l('description')]],
      body: result.positive_factors.map(pf => [pf.factor, pf.description]),
    });

    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // ─── Inspection Checklist ───
  if (result.inspection_checklist.length > 0) {
    checkPage(20);
    drawSectionTitle(l('checklist'), '☑');

    const priorityOrder: Record<string, number> = { 'KÖTELEZŐ': 0, 'MANDATORY': 0, 'PFLICHT': 0, 'JAVASOLT': 1, 'RECOMMENDED': 1, 'EMPFOHLEN': 1, 'OPCIONÁLIS': 2, 'OPTIONAL': 2 };
    const sorted = [...result.inspection_checklist].sort((a, b) => (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9));

    autoTable(doc, {
      startY: y,
      margin: { left: M, right: M },
      theme: 'grid',
      headStyles: { fillColor: brand.primary, fontSize: 8, font: 'Montserrat', fontStyle: 'bold', textColor: [255, 255, 255] },
      bodyStyles: { fontSize: 7.5, font: 'Montserrat', textColor: brand.dark },
      columnStyles: { 0: { cellWidth: 22, fontStyle: 'bold' }, 1: { cellWidth: 50 } },
      head: [[l('priority'), l('check_item'), l('reason')]],
      body: sorted.map(ci => [translatePriority(ci.priority), ci.item, ci.reason]),
      didParseCell: (data: any) => {
        if (data.section === 'body' && data.column.index === 0) {
          const raw = data.cell.raw as string;
          const key = priorityKey(raw);
          if (key === 'KÖTELEZŐ' || key === 'MANDATORY') data.cell.styles.textColor = brand.red;
          else if (key === 'JAVASOLT' || key === 'RECOMMENDED') data.cell.styles.textColor = brand.orange;
          else data.cell.styles.textColor = brand.gray;
        }
      },
    });

    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // ─── AI Summary ───
  checkPage(30);
  drawSectionTitle(l('ai_summary'));
  doc.setFontSize(9);
  doc.setFont('Montserrat', 'normal');
  setColor(brand.dark);
  const summaryLines = doc.splitTextToSize(result.summary_hu, CW);
  doc.text(summaryLines, M, y);
  y += summaryLines.length * 4.5 + 6;

  // Buy recommendation reasoning
  checkPage(20);
  doc.setFontSize(8);
  doc.setFont('Montserrat', 'normal');
  setColor(brand.gray);
  const reasonLines = doc.splitTextToSize(`${l('reasoning_label')}: ${result.buy_recommendation_reasoning}`, CW);
  doc.text(reasonLines, M, y);
  y += reasonLines.length * 4 + 10;

  // ─── Footer on all pages ───
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawFooter();
    doc.setFontSize(7);
    setColor(brand.gray);
    doc.text(`${i} / ${totalPages}`, W / 2, doc.internal.pageSize.getHeight() - 8, { align: 'center' });
  }

  // ─── Disclaimer ───
  doc.setPage(totalPages);
  const dY = doc.internal.pageSize.getHeight() - 16;
  doc.setFontSize(6);
  setColor(brand.gray);
  doc.text(l('disclaimer'), M, dY);

  // Save
  const filename = `EV_DIAG_${l('filename_prefix')}_${modelInfo.make}_${modelInfo.model}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
