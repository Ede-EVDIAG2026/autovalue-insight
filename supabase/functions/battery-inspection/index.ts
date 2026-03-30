import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const EXTENDED_SCHEMA_INSTRUCTIONS = `
Az SOH becslést a következő Bayesian faktorok súlyozásával számold:
- Életkor (regisztrációtól eltelt évek): max 15% hatás
- Futásteljesítmény az átlaghoz képest: max 12% hatás
- DC töltési frekvencia és teljesítmény: max 10% hatás
- Hőstressz (éghajlat + tárolás): max 8% hatás
- DTC anomáliák: kódonként max 5-8% hatás
- Szervizhistória: max 5% hatás

Az uncertainty a rendelkezésre álló adatok teljességétől függ (data_completeness_pct).
A battery_risk_class: A1=kiváló/biztos, A2=jó, B1=közepes/alacsony kockázat, B2=közepes/mérsékelt bizonytalanság, C1=magas kockázat, C2=kritikus.
`;

const NEW_FIELDS_SCHEMA = `
  "soh_estimated_pct": number (State of Health %, e.g. 82),
  "soh_confidence": number (0-1, e.g. 0.64),
  "soh_uncertainty_pct": number (± value, e.g. 7),
  "data_source_type": "Model-based" | "BMS-read" | "OBD-validated",
  "data_completeness_pct": number (0-100, e.g. 58),
  "bayesian_drivers": [
    { "factor": string, "contribution_pct": number }
  ],
  "battery_risk_class": string (A1/A2/B1/B2/C1/C2 scale),
  "risk_class_description": string,
  "cycle_proxy": {
    "estimated_cycles": number | null,
    "ac_dc_ratio_pct": number | null,
    "fast_charge_stress": "LOW" | "MEDIUM" | "HIGH"
  },
  "thermal_exposure": {
    "heat_stress_index": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
    "degradation_accelerator": number
  },
  "cell_imbalance_risk": "LOW" | "MEDIUM" | "HIGH",
  "usage_profile": {
    "pattern": "Urban-heavy" | "Mixed" | "Highway-heavy",
    "daily_km_estimated": number | null,
    "low_dc_usage": boolean
  },
  "price_impact_detailed": {
    "conservative_pct": number,
    "expected_pct": number,
    "optimistic_pct": number,
    "liquidity_time_to_sell_impact_pct": number
  },
  "dtc_risk_contributions": [
    {
      "dtc_code": string,
      "degradation_risk_contribution_pct": number,
      "confidence_impact": number
    }
  ],
  "dealer_recommendation": {
    "label": "STRONG BUY" | "BUY" | "CONDITIONAL BUY" | "AVOID" | "REJECT",
    "target_discount_pct_min": number,
    "target_discount_pct_max": number,
    "risk_buffer_eur_min": number,
    "risk_buffer_eur_max": number
  },
  "soc_context": {
    "measurement_context": string | null,
    "cell_imbalance_validated": boolean
  }`;

const SYSTEM_PROMPTS: Record<string, string> = {
  HU: `Te az EV DIAG Bayesian Core v2 akkumulátor és hajtáslánc előellenőrzési rendszere vagy. Elemezd a felhasználó által megadott adatokat és adj strukturált JSON választ a következő mezőkkel:

{
  "battery_health_score": number (0-100),
  "battery_health_label": "KIVÁLÓ" | "JÓ" | "KÖZEPES" | "GYENGE" | "KRITIKUS",
  "estimated_remaining_capacity_pct": number,
  "estimated_remaining_capacity_kwh": number,
  "degradation_rate_per_year_pct": number,
  "powertrain_risk_score": number (0-100, alacsonyabb = jobb),
  "ice_health_score": number | null (PHEV/HEV/MHEV esetén 0-100, BEV-nél null),
  "risk_factors": [
    { "factor": string, "severity": "LOW"|"MEDIUM"|"HIGH"|"CRITICAL", "description": string, "impact_score": number }
  ],
  "positive_factors": [
    { "factor": string, "description": string }
  ],
  "inspection_checklist": [
    { "item": string, "priority": "KÖTELEZŐ"|"JAVASOLT"|"OPCIONÁLIS", "reason": string }
  ],
  "buy_recommendation": "ERŐSEN AJÁNLOTT" | "AJÁNLOTT" | "FELTÉTELESEN AJÁNLOTT" | "NEM AJÁNLOTT" | "HATÁROZOTTAN ELLENJAVALLOTT",
  "buy_recommendation_reasoning": string,
  "expected_battery_life_years": number,
  "estimated_replacement_cost_eur": { "min": number, "max": number },
  "price_impact_pct": number (negatív = értékcsökkentő, pozitív = értéknövelő),
  "summary_hu": string (2-3 mondatos magyar összefoglalás),
  "bayesian_confidence": number (0-1),
${NEW_FIELDS_SCHEMA}
}

${EXTENDED_SCHEMA_INSTRUCTIONS}

Legyél precíz, konzervatív becslésekkel dolgozz. A powertrain_type alapján differenciálj: BEV-nél csak az akkumulátor számít, PHEV/HEV/MHEV esetén mindkét hajtáslánc elemzendő. Adj konkrét, actionable tanácsokat. MINDEN szöveges mező MAGYARUL legyen. CSAK a JSON objektumot add vissza, semmi mást.

FONTOS: Használd a KB (Knowledge Base) adatokat a cellakémia, degradációs kockázat, ismert hibák, garancia és termikus kezelés figyelembevételéhez. Használd a piaci kontextust az árbecsléshez és értékeléshez.`,

  EN: `You are the EV DIAG Bayesian Core v2 battery and powertrain pre-inspection system. Analyze the user-provided data and return a structured JSON response with the following fields:

{
  "battery_health_score": number (0-100),
  "battery_health_label": "EXCELLENT" | "GOOD" | "FAIR" | "POOR" | "CRITICAL",
  "estimated_remaining_capacity_pct": number,
  "estimated_remaining_capacity_kwh": number,
  "degradation_rate_per_year_pct": number,
  "powertrain_risk_score": number (0-100, lower = better),
  "ice_health_score": number | null (0-100 for PHEV/HEV/MHEV, null for BEV),
  "risk_factors": [
    { "factor": string, "severity": "LOW"|"MEDIUM"|"HIGH"|"CRITICAL", "description": string, "impact_score": number }
  ],
  "positive_factors": [
    { "factor": string, "description": string }
  ],
  "inspection_checklist": [
    { "item": string, "priority": "MANDATORY"|"RECOMMENDED"|"OPTIONAL", "reason": string }
  ],
  "buy_recommendation": "HIGHLY RECOMMENDED" | "RECOMMENDED" | "CONDITIONALLY RECOMMENDED" | "NOT RECOMMENDED" | "STRONGLY ADVISED AGAINST",
  "buy_recommendation_reasoning": string,
  "expected_battery_life_years": number,
  "estimated_replacement_cost_eur": { "min": number, "max": number },
  "price_impact_pct": number (negative = value-decreasing, positive = value-increasing),
  "summary_hu": string (2-3 sentence English summary),
  "bayesian_confidence": number (0-1),
${NEW_FIELDS_SCHEMA}
}

${EXTENDED_SCHEMA_INSTRUCTIONS}

Be precise, work with conservative estimates. Differentiate by powertrain_type: for BEV only battery matters, for PHEV/HEV/MHEV both powertrains must be analyzed. Give concrete, actionable advice. ALL text fields MUST be in ENGLISH. Return ONLY the JSON object, nothing else.

IMPORTANT: Use the KB (Knowledge Base) data for cell chemistry, degradation risk, known issues, warranty and thermal management considerations. Use the market context for price estimation and valuation.`,

  DE: `Du bist das EV DIAG Bayesian Core v2 Batterie- und Antriebsstrang-Vorabprüfungssystem. Analysiere die vom Benutzer bereitgestellten Daten und gib eine strukturierte JSON-Antwort mit folgenden Feldern zurück:

{
  "battery_health_score": number (0-100),
  "battery_health_label": "AUSGEZEICHNET" | "GUT" | "MITTEL" | "SCHWACH" | "KRITISCH",
  "estimated_remaining_capacity_pct": number,
  "estimated_remaining_capacity_kwh": number,
  "degradation_rate_per_year_pct": number,
  "powertrain_risk_score": number (0-100, niedriger = besser),
  "ice_health_score": number | null (0-100 für PHEV/HEV/MHEV, null für BEV),
  "risk_factors": [
    { "factor": string, "severity": "LOW"|"MEDIUM"|"HIGH"|"CRITICAL", "description": string, "impact_score": number }
  ],
  "positive_factors": [
    { "factor": string, "description": string }
  ],
  "inspection_checklist": [
    { "item": string, "priority": "PFLICHT"|"EMPFOHLEN"|"OPTIONAL", "reason": string }
  ],
  "buy_recommendation": "SEHR EMPFOHLEN" | "EMPFOHLEN" | "BEDINGT EMPFOHLEN" | "NICHT EMPFOHLEN" | "DRINGEND ABGERATEN",
  "buy_recommendation_reasoning": string,
  "expected_battery_life_years": number,
  "estimated_replacement_cost_eur": { "min": number, "max": number },
  "price_impact_pct": number (negativ = wertmindernd, positiv = wertsteigernd),
  "summary_hu": string (2-3 Sätze deutsche Zusammenfassung),
  "bayesian_confidence": number (0-1),
${NEW_FIELDS_SCHEMA}
}

${EXTENDED_SCHEMA_INSTRUCTIONS}

Sei präzise, arbeite mit konservativen Schätzungen. Differenziere nach powertrain_type: Bei BEV zählt nur die Batterie, bei PHEV/HEV/MHEV müssen beide Antriebsstränge analysiert werden. Gib konkrete, umsetzbare Ratschläge. ALLE Textfelder MÜSSEN auf DEUTSCH sein. Gib NUR das JSON-Objekt zurück, nichts anderes.

WICHTIG: Verwende die KB-Daten (Knowledge Base) für Zellchemie, Degradationsrisiko, bekannte Probleme, Garantie und Thermomanagement. Verwende den Marktkontext für Preisschätzung und Bewertung.`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { wizardData, modelData, kbData, marketData, lang = "HU" } = body;
    const safeLang = (["HU", "EN", "DE"].includes(lang) ? lang : "HU") as string;

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not configured");

    const systemPrompt = SYSTEM_PROMPTS[safeLang];

    const kb = kbData ?? {};
    const market = marketData ?? {};

    const userPrompt = `Jármű: ${modelData?.make ?? "N/A"} ${modelData?.model ?? "N/A"}
Hajtáslánc: ${modelData?.powertrain_type ?? "N/A"}
Akkumulátor (névleges): ${modelData?.battery_kwh ?? "N/A"} kWh
WLTP hatótáv: ${modelData?.wltp_range_km ?? "N/A"} km

KB ADATOK (gyári műszaki adatbázis):
- Cellakémia: ${kb.cell_chemistry ?? "N/A"}
- Degradációs kockázat (gyári): ${kb.degradation_risk ?? "MEDIUM"}
- BMS gyártó: ${kb.bms_vendor ?? "N/A"}
- Termikus kezelés: ${kb.thermal_management ?? "N/A"}
- Garancia: ${kb.warranty_battery_years ?? "N/A"} év / ${kb.warranty_battery_km ?? "N/A"} km
- Bérelt akksi figyelmeztetés: ${kb.rental_battery ? "IGEN — ELLENŐRIZD!" : "nem"}
- Ismert hibák: ${JSON.stringify(kb.known_issues ?? [])}
- Adatbiztonság: ${kb.data_confidence ?? "N/A"}
- Csatlakozó típus: ${kb.connector_type ?? "CCS2"}
- Valós hatótáv 80%-on: ${kb.real_range_80pct_km ?? "N/A"} km

PIACI KONTEXTUS:
- Medián piaci ár: ${market.median_price_eur ?? "N/A"} EUR
- P25 ár: ${market.p25_eur ?? "N/A"} EUR
- P75 ár: ${market.p75_eur ?? "N/A"} EUR
- Átlag futásteljesítmény (piac): ${market.avg_mileage_km ?? "N/A"} km
- Adatpontok száma: ${market.data_points ?? "N/A"}

FELHASZNÁLÓ ÁLTAL MEGADOTT ADATOK:
${JSON.stringify(wizardData, null, 2)}
`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("Anthropic API error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI API error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.content?.[0]?.text ?? "";

    let parsed;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[1].trim() : content.trim());
    } catch {
      console.error("Failed to parse AI response:", content);
      return new Response(JSON.stringify({ error: "Failed to parse analysis result" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("battery-inspection error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
