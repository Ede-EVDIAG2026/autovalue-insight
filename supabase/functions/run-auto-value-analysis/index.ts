import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const FAST_MODEL = "google/gemini-2.5-flash";

async function callAI(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  tools?: any[],
  toolChoice?: any,
  retries = 2
): Promise<any> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const body: any = {
        model: FAST_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      };
      if (tools) {
        body.tools = tools;
        body.tool_choice = toolChoice;
      }

      const resp = await fetch(AI_GATEWAY, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!resp.ok) {
        if ((resp.status === 429 || resp.status === 503) && attempt < retries) {
          await new Promise((r) => setTimeout(r, (attempt + 1) * 2000));
          continue;
        }
        const errText = await resp.text();
        console.error(`AI error ${resp.status}:`, errText);
        return null;
      }

      const data = await resp.json();
      const msg = data.choices?.[0]?.message;

      if (msg?.tool_calls?.[0]?.function?.arguments) {
        return JSON.parse(msg.tool_calls[0].function.arguments);
      }
      if (msg?.content) {
        try {
          return JSON.parse(msg.content);
        } catch {
          return { raw: msg.content };
        }
      }
      return null;
    } catch (e) {
      console.error("callAI error:", e);
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, (attempt + 1) * 2000));
        continue;
      }
      return null;
    }
  }
  return null;
}

function makeTool(name: string, description: string, properties: any, required: string[]) {
  return [
    {
      type: "function",
      function: {
        name,
        description,
        parameters: { type: "object", properties, required, additionalProperties: false },
      },
    },
  ];
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { autoValueSessionId } = await req.json();
    if (!autoValueSessionId) throw new Error("Missing autoValueSessionId");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Load session
    const { data: session, error: sessionErr } = await supabase
      .from("auto_value_sessions")
      .select("*")
      .eq("id", autoValueSessionId)
      .single();

    if (sessionErr || !session) {
      throw new Error(`Session not found: ${sessionErr?.message}`);
    }

    // Load linked damage data if available
    let linkedData: any = null;
    if (session.linked_result_id) {
      const { data } = await supabase
        .from("analysis_results")
        .select("payload")
        .eq("id", session.linked_result_id)
        .single();
      if (data) linkedData = data.payload;
    }

    const vehicleInfo = `
Vehicle: ${session.vehicle_make} ${session.vehicle_model} ${session.vehicle_year}
Mileage: ${session.vehicle_mileage_km} km
Color: ${session.vehicle_color || "unknown"}
Fuel type: ${session.vehicle_fuel_type}
Service book: ${session.service_book ? "yes" : "no"}
Owners: ${session.owners_count}
Accident free: ${session.accident_free ? "yes" : "no"}
Target country: ${session.target_country}
${linkedData ? `\nLinked condition data:\nCondition score: ${session.linked_condition_score}/10\nRepair cost EUR: ${session.linked_repair_cost_eur}\nRepair cost HUF: ${session.linked_repair_cost_huf}\nPDR count: ${session.linked_pdr_count}\nValue reduction: ${session.linked_value_reduction_pct}%\nNegotiation summary: ${session.linked_negotiation_summary}` : "No linked damage analysis (standalone mode)"}`;

    // ── AS24 real market data lookup ──
    let as24: any = null;
    try {
      const as24Params = new URLSearchParams({
        brand: session.vehicle_make,
        model: session.vehicle_model,
      });
      if (session.vehicle_year) as24Params.set("year", String(session.vehicle_year));
      if (session.target_country) as24Params.set("country", session.target_country);
      const as24Res = await fetch(
        `https://api.evdiag.hu/market/as24/lookup?${as24Params}`,
        { signal: AbortSignal.timeout(8000) }
      );
      if (as24Res.ok) as24 = await as24Res.json();
    } catch (e) {
      console.warn("AS24 lookup failed:", e);
    }

    const as24Context = as24?.found
      ? `REAL AUTOSCOUT24 MARKET DATA — use as primary reference:
     Listings: ${as24.data_points} | Confidence: ${Math.round(as24.confidence * 100)}%
     Snapshot: ${as24.snapshot_date}
     P-low  (min): €${as24.market.low_eur}
     P50 (median): €${as24.market.median_eur}  ← anchor your estimate here
     P-high (max): €${as24.market.high_eur}
     Avg mileage:  ${as24.usage?.avg_mileage_km} km
     Liquidity:    ${as24.liquidity.score}/100 (~${as24.liquidity.days_to_sell} days to sell)
     DO NOT fabricate market prices. Use the above as ground truth.
     Your P50 estimate must be within 15% of the AS24 median unless
     condition/equipment adjustments justify the deviation.`
      : `WARNING: No real AS24 market data found for this vehicle.
     Provide conservative AI estimate. Mark as LOW_CONFIDENCE.`;

    // AGENT 1 – MarketPriceAggregator
    const agent1Tools = makeTool("market_price", "Return market price distribution", {
      p10_eur: { type: "number" }, p25_eur: { type: "number" },
      p50_eur: { type: "number" }, p75_eur: { type: "number" }, p90_eur: { type: "number" },
      price_trend_3m: { type: "string", enum: ["rising", "stable", "falling"] },
      price_trend_pct: { type: "number" },
      market_depth: { type: "string", enum: ["thin", "normal", "liquid"] },
      comparable_listings: {
        type: "array", items: {
          type: "object",
          properties: { description: { type: "string" }, price_eur: { type: "number" }, mileage_km: { type: "number" }, country: { type: "string" } },
          required: ["description", "price_eur", "mileage_km", "country"]
        }
      },
      methodology_note_hu: { type: "string" }
    }, ["p10_eur", "p25_eur", "p50_eur", "p75_eur", "p90_eur", "price_trend_3m", "market_depth"]);

    const agent1 = await callAI(
      LOVABLE_API_KEY,
      `You are MARKET_PRICE_AGGREGATOR for EU AutoValue Intelligence. ${as24Context}\nEstimate current used EV market price distribution for the given vehicle in the target country. Use realistic EUR values based on actual 2024-2025 EU used EV market data. Never output placeholder zeros. For mileage adjustment: average annual km 15,000-20,000. Below average: +3-5% premium. Above average: -5-10% discount.`,
      vehicleInfo,
      agent1Tools,
      { type: "function", function: { name: "market_price" } }
    );

    // AGENT 2 – ConditionAdjustmentEngine
    const agent2 = await callAI(
      LOVABLE_API_KEY,
      `You are CONDITION_ADJUSTMENT_ENGINE for EU AutoValue. Apply value adjustments based on vehicle condition. If NO condition score (standalone mode): Use accident_free + service_book + owners_count. Base the adjustments on Agent 1 market data: p50_eur = ${agent1?.p50_eur || 0}.`,
      vehicleInfo + (agent1 ? `\n\nAgent1 market data: ${JSON.stringify(agent1)}` : ""),
      makeTool("condition_adjust", "Return condition adjustments", {
        base_value_eur: { type: "number" }, condition_multiplier: { type: "number" },
        repair_cost_deduction_eur: { type: "number" }, damage_type_adjustment_eur: { type: "number" },
        previous_repair_suspected: { type: "boolean" }, adjusted_value_eur: { type: "number" },
        standalone_mode: { type: "boolean" },
        adjustment_breakdown: { type: "array", items: { type: "object", properties: { factor_hu: { type: "string" }, adjustment_eur: { type: "number" }, rationale_hu: { type: "string" } }, required: ["factor_hu", "adjustment_eur", "rationale_hu"] } }
      }, ["base_value_eur", "condition_multiplier", "adjusted_value_eur", "standalone_mode"]),
      { type: "function", function: { name: "condition_adjust" } }
    );

    // AGENT 3 + 4 parallel
    const [agent3, agent4] = await Promise.all([
      callAI(
        LOVABLE_API_KEY,
        `You are REGIONAL_DEMAND_SCORER for EU AutoValue. Score local market demand in the target country/region. Output demand_score 0-100.`,
        vehicleInfo,
        makeTool("regional_demand", "Return regional demand score", {
          demand_score: { type: "number" }, demand_label_hu: { type: "string" },
          demand_label_en: { type: "string" }, demand_label_de: { type: "string" },
          regional_adjustment_pct: { type: "number" }, color_adjustment_pct: { type: "number" },
          seasonality_note_hu: { type: "string" }, infrastructure_score: { type: "number" },
          key_demand_drivers_hu: { type: "array", items: { type: "string" } }
        }, ["demand_score", "regional_adjustment_pct"]),
        { type: "function", function: { name: "regional_demand" } }
      ),
      callAI(
        LOVABLE_API_KEY,
        `You are SALES_VELOCITY_PREDICTOR for EU AutoValue. Predict days-to-sell at different price points. Always output realistic integers, never 0.`,
        vehicleInfo + `\n\nMarket p50_eur: ${agent1?.p50_eur || 0}`,
        makeTool("sales_velocity", "Return sales velocity prediction", {
          velocity_at_p50_days: { type: "integer" },
          velocity_at_recommended_ask_days: { type: "integer" },
          velocity_at_aggressive_price_days: { type: "integer" },
          aggressive_price_eur: { type: "number" },
          staleness_risk: { type: "string", enum: ["low", "medium", "high"] },
          price_drop_prediction: { type: "array", items: { type: "object", properties: { days_on_market: { type: "integer" }, expected_price_drop_pct: { type: "number" } }, required: ["days_on_market", "expected_price_drop_pct"] } },
          velocity_summary_hu: { type: "string" }
        }, ["velocity_at_p50_days", "velocity_at_recommended_ask_days", "staleness_risk"]),
        { type: "function", function: { name: "sales_velocity" } }
      ),
    ]);

    // AGENT 5 – NegotiationStrategyAgent
    const allPrior = JSON.stringify({ market: agent1, condition: agent2, regional: agent3, velocity: agent4 });
    const agent5 = await callAI(
      LOVABLE_API_KEY,
      `You are NEGOTIATION_STRATEGY_AGENT for EU AutoValue. Generate specific negotiation strategy for both buyer and dealer. Use HUF values (1 EUR ≈ 395 HUF). All arguments must have concrete forint values.`,
      vehicleInfo + `\n\nAll prior agent data:\n${allPrior}`,
      makeTool("negotiation", "Return negotiation strategy", {
        buyer_strategy: {
          type: "object", properties: {
            opening_offer_eur: { type: "number" }, opening_offer_huf: { type: "number" },
            target_price_eur: { type: "number" }, target_price_huf: { type: "number" },
            walk_away_above_eur: { type: "number" }, walk_away_above_huf: { type: "number" },
            negotiation_arguments: { type: "array", items: { type: "object", properties: { argument_hu: { type: "string" }, value_impact_eur: { type: "number" }, value_impact_huf: { type: "number" } }, required: ["argument_hu", "value_impact_huf"] } },
            red_flags_hu: { type: "array", items: { type: "string" } }
          }, required: ["opening_offer_huf", "target_price_huf", "walk_away_above_huf"]
        },
        dealer_strategy: {
          type: "object", properties: {
            optimal_ask_eur: { type: "number" }, optimal_ask_huf: { type: "number" },
            repairs_recommended: { type: "array", items: { type: "object", properties: { repair_hu: { type: "string" }, cost_eur: { type: "number" }, value_gain_eur: { type: "number" }, roi: { type: "number" } }, required: ["repair_hu", "cost_eur", "value_gain_eur", "roi"] } },
            repairs_to_skip: { type: "array", items: { type: "object", properties: { repair_hu: { type: "string" }, reason_hu: { type: "string" } }, required: ["repair_hu", "reason_hu"] } },
            disclosure_required_hu: { type: "array", items: { type: "string" } }
          }, required: ["optimal_ask_huf"]
        },
        negotiation_summary_hu: { type: "string" }
      }, ["buyer_strategy", "dealer_strategy"]),
      { type: "function", function: { name: "negotiation" } }
    );

    // AGENT 6 – BayesianValueDistribution
    const agent6 = await callAI(
      LOVABLE_API_KEY,
      `You are BAYESIAN_VALUE_DISTRIBUTION_AGENT for EU AutoValue. Synthesize all previous agent outputs into final value distribution. Prior = market p50_eur. Update with condition_multiplier, regional_adjustment_pct, velocity urgency. Calculate HUF at 395 HUF/EUR. Confidence: high (>0.8) if liquid market + condition data, medium (0.5-0.8) normal, low (<0.5) thin market or missing data.`,
      `All agent results:\n${JSON.stringify({ market: agent1, condition: agent2, regional: agent3, velocity: agent4, negotiation: agent5 })}`,
      makeTool("bayesian_value", "Return final value distribution", {
        final_p10_eur: { type: "number" }, final_p25_eur: { type: "number" }, final_p50_eur: { type: "number" },
        final_p75_eur: { type: "number" }, final_p90_eur: { type: "number" },
        final_p10_huf: { type: "number" }, final_p25_huf: { type: "number" }, final_p50_huf: { type: "number" },
        final_p75_huf: { type: "number" }, final_p90_huf: { type: "number" },
        recommended_ask_eur: { type: "number" }, recommended_ask_huf: { type: "number" },
        negotiation_floor_eur: { type: "number" }, negotiation_floor_huf: { type: "number" },
        negotiation_ceiling_eur: { type: "number" }, negotiation_ceiling_huf: { type: "number" },
        confidence_score: { type: "number" }, market_risk_score: { type: "number" },
        value_summary_hu: { type: "string" }
      }, ["final_p50_eur", "final_p50_huf", "recommended_ask_eur", "recommended_ask_huf", "confidence_score"]),
      { type: "function", function: { name: "bayesian_value" } }
    );

    // AGENT 7 – DealerPricingAdvisor
    const agent7 = await callAI(
      LOVABLE_API_KEY,
      `You are DEALER_PRICING_ADVISOR for EU AutoValue. Generate a final dealer-ready report in Hungarian. A dealer reads this in 30 seconds. Be specific, use numbers, avoid fluff. Write listing_description_hu: professional ad text, 120-180 words, copy-paste ready. Highlight strengths, be transparent about known issues. No false claims.`,
      `Vehicle: ${session.vehicle_make} ${session.vehicle_model} ${session.vehicle_year}, ${session.vehicle_mileage_km}km\nAll agent results:\n${JSON.stringify({ market: agent1, condition: agent2, regional: agent3, velocity: agent4, negotiation: agent5, bayesian: agent6 })}`,
      makeTool("dealer_report", "Return dealer report", {
        executive_summary_hu: { type: "string" },
        recommended_listing_price_eur: { type: "number" }, recommended_listing_price_huf: { type: "number" },
        price_band_label_hu: { type: "string" },
        quick_actions: { type: "array", items: { type: "object", properties: { priority: { type: "string", enum: ["azonnali", "1_heten_belul", "opcionalis"] }, action_hu: { type: "string" }, expected_impact_hu: { type: "string" } }, required: ["priority", "action_hu", "expected_impact_hu"] } },
        listing_description_hu: { type: "string" },
        market_position_hu: { type: "string" },
        risk_warnings_hu: { type: "array", items: { type: "string" } }
      }, ["executive_summary_hu", "recommended_listing_price_huf", "listing_description_hu"]),
      { type: "function", function: { name: "dealer_report" } }
    );

    // Combine results
    const fullResult = {
      market: agent1, condition: agent2, regional: agent3,
      velocity: agent4, negotiation: agent5, bayesian: agent6, dealer: agent7,
      as24_market_data: as24,
      market_data_source: as24?.found ? "autoscout24" : "ai_estimate",
    };

    // Save to DB
    await supabase.from("auto_value_results").insert({
      session_id: autoValueSessionId,
      user_id: session.user_id,
      payload: fullResult,
      p10_eur: agent6?.final_p10_eur, p25_eur: agent6?.final_p25_eur,
      p50_eur: agent6?.final_p50_eur, p75_eur: agent6?.final_p75_eur, p90_eur: agent6?.final_p90_eur,
      p10_huf: agent6?.final_p10_huf, p25_huf: agent6?.final_p25_huf,
      p50_huf: agent6?.final_p50_huf, p75_huf: agent6?.final_p75_huf, p90_huf: agent6?.final_p90_huf,
      recommended_ask_eur: agent6?.recommended_ask_eur,
      recommended_ask_huf: agent6?.recommended_ask_huf,
      negotiation_floor_eur: agent6?.negotiation_floor_eur,
      negotiation_floor_huf: agent6?.negotiation_floor_huf,
      sales_velocity_days: agent4?.velocity_at_recommended_ask_days,
      confidence_score: agent6?.confidence_score,
      market_risk_score: agent6?.market_risk_score,
      status: "completed",
    });

    // Update session status
    await supabase.from("auto_value_sessions").update({ status: "completed" }).eq("id", autoValueSessionId);

    return new Response(JSON.stringify(fullResult), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("run-auto-value-analysis error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
