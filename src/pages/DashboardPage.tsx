import EUAutoValueIntelligence from '@/components/EUAutoValueIntelligence';
import AppHeader from '@/components/AppHeader';
import MarketIntelligenceSection from '@/components/market/MarketIntelligenceSection';

const DashboardPage = () => {
  return (
    <div className="min-h-screen bg-muted/30">
      <AppHeader />
      <div className="container mx-auto px-4 py-6 space-y-8">
        <EUAutoValueIntelligence />
        <MarketIntelligenceSection />
      </div>
    </div>
  );
};

export default DashboardPage;
