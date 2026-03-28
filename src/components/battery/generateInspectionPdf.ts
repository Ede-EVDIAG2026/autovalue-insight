import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { InspectionResult } from '@/components/battery/BatteryInspectionResults';
import { montserratRegular } from '@/components/battery/fonts/montserratRegular';
import { montserratBold } from '@/components/battery/fonts/montserratBold';
import { logoBase64 } from '@/components/battery/fonts/logoBase64';

interface PdfParams {
  result: InspectionResult;
  modelInfo: { make: string; model: string; variant?: string; model_type: string };
}

export function generateInspectionPdf({ result, modelInfo }: PdfParams) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Register Liberation Sans font for Hungarian character support
  doc.addFileToVFS('Montserrat-Regular.ttf', montserratRegular);
  doc.addFont('Montserrat-Regular.ttf', 'Montserrat', 'normal');
  doc.addFileToVFS('Montserrat-Bold.ttf', montserratBold);
  doc.addFont('Montserrat-Bold.ttf', 'Montserrat', 'bold');
  doc.setFont('Montserrat', 'normal');

  const W = doc.internal.pageSize.getWidth();
  const M = 15; // margin
  const CW = W - 2 * M; // content width
  let y = M;

  const brand = { primary: [22, 78, 159] as [number, number, number], dark: [15, 23, 42] as [number, number, number], green: [22, 163, 74] as [number, number, number], red: [220, 38, 38] as [number, number, number], orange: [234, 88, 12] as [number, number, number], yellow: [202, 138, 4] as [number, number, number], gray: [100, 116, 139] as [number, number, number], lightGray: [241, 245, 249] as [number, number, number] };

  // ─── Helper Functions ───
  const setColor = (c: [number, number, number]) => { doc.setTextColor(...c); doc.setDrawColor(...c); };
  const addPage = () => { doc.addPage(); y = M; drawFooter(); };
  const checkPage = (needed: number) => { if (y + needed > 275) addPage(); };

  const drawFooter = () => {
    const py = doc.internal.pageSize.getHeight() - 8;
    doc.setFontSize(7);
    setColor(brand.gray);
    doc.text('EV DIAG — Bayesian Core v2 Előellenőrzési Riport', M, py);
    doc.text(`${new Date().toLocaleDateString('hu-HU')}`, W - M, py, { align: 'right' });
  };

  const drawGauge = (cx: number, cy: number, r: number, score: number, label: string) => {
    // Background circle
    doc.setDrawColor(...brand.lightGray);
    doc.setLineWidth(2.5);
    doc.circle(cx, cy, r, 'S');
    
    // Score color
    const col = score >= 80 ? brand.green : score >= 60 ? brand.yellow : score >= 40 ? brand.orange : brand.red;
    doc.setDrawColor(...col);
    doc.setLineWidth(2.5);
    // Draw arc approximation (filled arc via multiple small segments)
    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + (score / 100) * 2 * Math.PI;
    const steps = Math.max(20, Math.round(score));
    for (let i = 0; i < steps; i++) {
      const a1 = startAngle + (i / steps) * (endAngle - startAngle);
      const a2 = startAngle + ((i + 1) / steps) * (endAngle - startAngle);
      doc.line(cx + r * Math.cos(a1), cy + r * Math.sin(a1), cx + r * Math.cos(a2), cy + r * Math.sin(a2));
    }

    // Score text
    doc.setFontSize(18);
    doc.setFont('Montserrat', 'bold');
    setColor(brand.dark);
    doc.text(`${score}`, cx, cy + 1, { align: 'center' });
    
    // Label
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

  const severityLabel = (s: string) => {
    const map: Record<string, string> = { LOW: 'Alacsony', MEDIUM: 'Közepes', HIGH: 'Magas', CRITICAL: 'Kritikus' };
    return map[s] || s;
  };

  // ═══════════════════════════════════════════
  // PAGE 1 — Header & Main Results
  // ═══════════════════════════════════════════

  // Header bar
  doc.setFillColor(...brand.primary);
  doc.rect(0, 0, W, 32, 'F');

  // Brand logo in header (left side)
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
  doc.text('Bayesian Core v2 — Akkumulátor / Hajtáslánc Előellenőrzési Riport', textStartX, 20);
  doc.setFontSize(8);
  doc.text(`${modelInfo.make} ${modelInfo.model}${modelInfo.variant ? ' ' + modelInfo.variant : ''} (${modelInfo.model_type})`, textStartX, 27);
  doc.text(new Date().toLocaleDateString('hu-HU'), W - M, 27, { align: 'right' });

  y = 40;

  // Main gauges row
  const gaugeY = y + 16;
  drawGauge(M + 25, gaugeY, 14, result.battery_health_score, 'Akkumulátor');
  if (result.ice_health_score != null) {
    drawGauge(M + 70, gaugeY, 14, result.ice_health_score, 'ICE Motor');
  }

  // Recommendation badge
  const recX = result.ice_health_score != null ? M + 105 : M + 70;
  doc.setFontSize(8);
  doc.setFont('Montserrat', 'bold');
  setColor(brand.gray);
  doc.text('Vásárlási ajánlás:', recX, gaugeY - 10);
  
  const recColor = result.buy_recommendation.includes('NEM') || result.buy_recommendation.includes('ELLEN') ? brand.red : result.buy_recommendation.includes('FELTÉT') ? brand.orange : brand.green;
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
  doc.text(`Állapot: ${result.battery_health_label}`, recX, gaugeY + 6);
  setColor(brand.gray);
  doc.setFontSize(8);
  doc.setFont('Montserrat', 'normal');
  doc.text(`Bayes konfidencia: ${Math.round(result.bayesian_confidence * 100)}%`, recX, gaugeY + 12);

  y = gaugeY + 24;

  // ─── Key Metrics Table ───
  drawSectionTitle('Főbb mutatók');

  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    theme: 'grid',
    headStyles: { fillColor: brand.primary, fontSize: 8, font: 'Montserrat', fontStyle: 'bold' },
    bodyStyles: { fontSize: 8, font: 'Montserrat', textColor: brand.dark },
    alternateRowStyles: { fillColor: brand.lightGray },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 65 }, 1: { cellWidth: 55 } },
    head: [['Mutató', 'Érték']],
    body: [
      ['Becsült maradék kapacitás', `${result.estimated_remaining_capacity_kwh} kWh (${result.estimated_remaining_capacity_pct}%)`],
      ['Éves degradációs ráta', `${result.degradation_rate_per_year_pct}% / év`],
      ['Várható akksi élettartam', `${result.expected_battery_life_years} év`],
      ['Hajtáslánc kockázat', `${result.powertrain_risk_score}/100`],
      ['Becsült csereköltség', `€${result.estimated_replacement_cost_eur.min.toLocaleString()} – €${result.estimated_replacement_cost_eur.max.toLocaleString()}`],
      ['Árkihatás', `${result.price_impact_pct > 0 ? '+' : ''}${result.price_impact_pct}%`],
      ...(result.ice_health_score != null ? [['ICE motor egészség', `${result.ice_health_score}/100`]] : []),
    ],
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // ─── Risk Factors ───
  if (result.risk_factors.length > 0) {
    drawSectionTitle('Kockázati tényezők', '⚠');

    autoTable(doc, {
      startY: y,
      margin: { left: M, right: M },
      theme: 'grid',
      headStyles: { fillColor: brand.red, fontSize: 8, font: 'Montserrat', fontStyle: 'bold', textColor: [255, 255, 255] },
      bodyStyles: { fontSize: 7.5, font: 'Montserrat', textColor: brand.dark },
      columnStyles: { 0: { cellWidth: 35, fontStyle: 'bold' }, 1: { cellWidth: 20 }, 2: { cellWidth: 'auto' } },
      head: [['Tényező', 'Súlyosság', 'Leírás']],
      body: result.risk_factors.map(rf => [rf.factor, severityLabel(rf.severity), rf.description]),
    });

    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // ─── Positive Factors ───
  if (result.positive_factors.length > 0) {
    checkPage(20);
    drawSectionTitle('Pozitív tényezők', '✓');

    autoTable(doc, {
      startY: y,
      margin: { left: M, right: M },
      theme: 'grid',
      headStyles: { fillColor: brand.green, fontSize: 8, font: 'Montserrat', fontStyle: 'bold', textColor: [255, 255, 255] },
      bodyStyles: { fontSize: 7.5, font: 'Montserrat', textColor: brand.dark },
      columnStyles: { 0: { cellWidth: 45, fontStyle: 'bold' } },
      head: [['Tényező', 'Leírás']],
      body: result.positive_factors.map(pf => [pf.factor, pf.description]),
    });

    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // ─── Inspection Checklist ───
  if (result.inspection_checklist.length > 0) {
    checkPage(20);
    drawSectionTitle('Ellenőrzési checklist', '☑');

    const priorityOrder: Record<string, number> = { 'KÖTELEZŐ': 0, 'JAVASOLT': 1, 'OPCIONÁLIS': 2 };
    const sorted = [...result.inspection_checklist].sort((a, b) => (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9));

    autoTable(doc, {
      startY: y,
      margin: { left: M, right: M },
      theme: 'grid',
      headStyles: { fillColor: brand.primary, fontSize: 8, font: 'Montserrat', fontStyle: 'bold', textColor: [255, 255, 255] },
      bodyStyles: { fontSize: 7.5, font: 'Montserrat', textColor: brand.dark },
      columnStyles: { 0: { cellWidth: 22, fontStyle: 'bold' }, 1: { cellWidth: 50 } },
      head: [['Prioritás', 'Ellenőrzési pont', 'Indoklás']],
      body: sorted.map(ci => [ci.priority, ci.item, ci.reason]),
      didParseCell: (data: any) => {
        if (data.section === 'body' && data.column.index === 0) {
          const val = data.cell.raw as string;
          if (val === 'KÖTELEZŐ') data.cell.styles.textColor = brand.red;
          else if (val === 'JAVASOLT') data.cell.styles.textColor = brand.orange;
          else data.cell.styles.textColor = brand.gray;
        }
      },
    });

    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // ─── AI Summary ───
  checkPage(30);
  drawSectionTitle('AI Összefoglaló');
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
  const reasonLines = doc.splitTextToSize(`Indoklás: ${result.buy_recommendation_reasoning}`, CW);
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
  doc.text('Ez a riport AI-alapú becslés, nem helyettesíti a szakszervizi diagnosztikát. Az EV DIAG nem vállal felelősséget a becslések pontosságáért.', M, dY);

  // Save
  const filename = `EV_DIAG_Ellenorzes_${modelInfo.make}_${modelInfo.model}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
