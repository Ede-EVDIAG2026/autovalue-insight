import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
  "bayesian_confidence": number (0-1)
}

Legyél precíz, konzervatív becslésekkel dolgozz. A powertrain_type alapján differenciálj: BEV-nél csak az akkumulátor számít, PHEV/HEV/MHEV esetén mindkét hajtáslánc elemzendő. Adj konkrét, actionable tanácsokat. MINDEN szöveges mező MAGYARUL legyen. CSAK a JSON objektumot add vissza, semmi mást.`,

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
  "bayesian_confidence": number (0-1)
}

Be precise, work with conservative estimates. Differentiate by powertrain_type: for BEV only battery matters, for PHEV/HEV/MHEV both powertrains must be analyzed. Give concrete, actionable advice. ALL text fields MUST be in ENGLISH. Return ONLY the JSON object, nothing else.`,

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
  "bayesian_confidence": number (0-1)
}

Sei präzise, arbeite mit konservativen Schätzungen. Differenziere nach powertrain_type: Bei BEV zählt nur die Batterie, bei PHEV/HEV/MHEV müssen beide Antriebsstränge analysiert werden. Gib konkrete, umsetzbare Ratschläge. ALLE Textfelder MÜSSEN auf DEUTSCH sein. Gib NUR das JSON-Objekt zurück, nichts anderes.`,
};

const USER_PROMPTS: Record<string, (modelJson: string, wizardJson: string) => string> = {
  HU: (m, w) => `Jármű modell adatai (KB-ból):\n${m}\n\nFelhasználó által megadott wizard adatok:\n${w}\n\nKérlek elemezd az akkumulátor és hajtáslánc állapotát a fenti adatok alapján.`,
  EN: (m, w) => `Vehicle model data (from KB):\n${m}\n\nUser-provided wizard data:\n${w}\n\nPlease analyze the battery and powertrain condition based on the above data.`,
  DE: (m, w) => `Fahrzeugmodelldaten (aus KB):\n${m}\n\nVom Benutzer eingegebene Wizard-Daten:\n${w}\n\nBitte analysieren Sie den Batterie- und Antriebszustand anhand der obigen Daten.`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { wizardData, modelData, lang = "HU" } = await req.json();
    const safeLang = (["HU", "EN", "DE"].includes(lang) ? lang : "HU") as string;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = SYSTEM_PROMPTS[safeLang];
    const userPrompt = USER_PROMPTS[safeLang](
      JSON.stringify(modelData, null, 2),
      JSON.stringify(wizardData, null, 2)
    );

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
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
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
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
