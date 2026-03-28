import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Te az EV DIAG Bayesian Core v2 akkumulátor és hajtáslánc előellenőrzési rendszere vagy. Elemezd a felhasználó által megadott adatokat és adj strukturált JSON választ a következő mezőkkel:

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

Legyél precíz, konzervatív becslésekkel dolgozz. A powertrain_type alapján differenciálj: BEV-nél csak az akkumulátor számít, PHEV/HEV/MHEV esetén mindkét hajtáslánc elemzendő. Adj konkrét, actionable tanácsokat. CSAK a JSON objektumot add vissza, semmi mást.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { wizardData, modelData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const userPrompt = `Jármű modell adatai (KB-ból):
${JSON.stringify(modelData, null, 2)}

Felhasználó által megadott wizard adatok:
${JSON.stringify(wizardData, null, 2)}

Kérlek elemezd az akkumulátor és hajtáslánc állapotát a fenti adatok alapján.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
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
    
    // Parse JSON from response - handle markdown code blocks
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
