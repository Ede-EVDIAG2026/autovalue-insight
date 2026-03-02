import { useLanguage } from '@/i18n/LanguageContext';
import { VehicleData } from '@/pages/AutoValuePage';
import { Button } from '@/components/ui/button';
import ValueBandChart from '@/components/results/ValueBandChart';
import NegotiationCard from '@/components/results/NegotiationCard';
import DealerStrategyCard from '@/components/results/DealerStrategyCard';
import VelocityCard from '@/components/results/VelocityCard';
import ListingTextCard from '@/components/results/ListingTextCard';
import { useNavigate } from 'react-router-dom';
import { FileText, RefreshCw, ArrowRight, AlertTriangle } from 'lucide-react';

const Step3Results = ({ 
  result, 
  vehicleData,
  onNewValuation 
}: { 
  result: any; 
  vehicleData: VehicleData;
  onNewValuation: () => void;
}) => {
  const { tr } = useLanguage();
  const navigate = useNavigate();

  // Extract from result payload - handle both flat and nested structures
  const bayesian = result?.bayesian || result || {};
  const negotiation = result?.negotiation || {};
  const dealer = result?.dealer || {};
  const velocity = result?.velocity || {};
  const market = result?.market || {};
  const riskWarnings = dealer?.risk_warnings_hu || result?.risk_warnings_hu || [];

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Value Band */}
      <ValueBandChart
        p10={bayesian.final_p10_huf || 0}
        p25={bayesian.final_p25_huf || 0}
        p50={bayesian.final_p50_huf || 0}
        p75={bayesian.final_p75_huf || 0}
        p90={bayesian.final_p90_huf || 0}
        recommendedAsk={bayesian.recommended_ask_huf || 0}
        negotiationFloor={bayesian.negotiation_floor_huf || 0}
        recommendedAskEur={bayesian.recommended_ask_eur || 0}
        negotiationFloorEur={bayesian.negotiation_floor_eur || 0}
        confidence={bayesian.confidence_score || 0}
      />

      {/* Dealer Summary */}
      <DealerStrategyCard
        summary={dealer.executive_summary_hu || ''}
        recommendedPrice={dealer.recommended_listing_price_huf || bayesian.recommended_ask_huf || 0}
        recommendedPriceEur={dealer.recommended_listing_price_eur || bayesian.recommended_ask_eur || 0}
        bandLabel={dealer.price_band_label_hu || ''}
        quickActions={dealer.quick_actions || []}
      />

      {/* Negotiation */}
      <NegotiationCard
        buyerStrategy={negotiation.buyer_strategy || {}}
        dealerStrategy={negotiation.dealer_strategy || {}}
      />

      {/* Velocity */}
      <VelocityCard
        velocityAtRecommended={velocity.velocity_at_recommended_ask_days || 0}
        velocityAtAggressive={velocity.velocity_at_aggressive_price_days || 0}
        stalenessRisk={velocity.staleness_risk || 'medium'}
        priceTrend={market.price_trend_3m || 'stable'}
        priceTrendPct={market.price_trend_pct || 0}
        marketDepth={market.market_depth || 'normal'}
      />

      {/* Listing Text */}
      <ListingTextCard text={dealer.listing_description_hu || ''} />

      {/* Risk Warnings */}
      {riskWarnings.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="font-display font-bold text-foreground flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            {tr('risk_warnings')}
          </h3>
          <ul className="space-y-2">
            {riskWarnings.map((w: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <span className="text-foreground">{w}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button variant="outline" className="flex-1" disabled>
          <FileText className="mr-2 h-4 w-4" />
          {tr('download_pdf')}
        </Button>
        <Button variant="outline" className="flex-1" onClick={onNewValuation}>
          <RefreshCw className="mr-2 h-4 w-4" />
          {tr('new_valuation')}
        </Button>
        <Button className="flex-1 hero-gradient" onClick={() => navigate('/portal')}>
          {tr('past_valuations')}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default Step3Results;
