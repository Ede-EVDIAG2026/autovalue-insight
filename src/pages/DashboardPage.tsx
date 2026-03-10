import EUAutoValueIntelligence from '@/components/EUAutoValueIntelligence';
import AppHeader from '@/components/AppHeader';

const DashboardPage = () => {
  return (
    <div className="min-h-screen bg-muted/30">
      <AppHeader />
      <div className="container mx-auto px-4 py-6">
        <EUAutoValueIntelligence />
      </div>
    </div>
  );
};

export default DashboardPage;
