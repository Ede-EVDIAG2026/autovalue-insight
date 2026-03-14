export interface MarketOverview {
  active_listings?: number | null;
  total_listings?: number | null;
  unique_dealers?: number | null;
  unique_sources?: number | null;
  avg_price_eur?: number | null;
  median_price_eur?: number | null;
  avg_mileage_km?: number | null;
  price_drop_events_last_7d?: number | null;
  price_drop_events_last_30d?: number | null;
  avg_drop_pct_last_30d?: number | null;
}

export interface FrontendSummary {
  overview?: MarketOverview;
}

export interface AutoValueContext {
  market_summary?: string | null;
  price_positioning_hint?: string | null;
  negotiation_room_hint?: string | null;
  updated_at?: string | null;
}

export interface MarketSignal {
  title?: string | null;
  score?: number | null;
  level?: string | null;
  interpretation?: string | null;
  confidence?: number | null;
  updated_at?: string | null;
}
