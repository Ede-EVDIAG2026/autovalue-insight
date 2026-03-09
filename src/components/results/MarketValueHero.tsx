import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3 } from 'lucide-react';

const formatHuf = (v: number) => v ? `${Math.round(v).toLocaleString('hu-HU')} Ft` : '–';
const formatEur = (v: number) => v ? `€${Math.round(v).toLocaleString('de-DE')}` : '–';

interface Props {
  p50: number;
  p50Eur: number;
  confidence: number;
  confidenceLabel: string;
  title: string;
}

const MarketValueHero = ({ p50, p50Eur, confidence, confidenceLabel, title }: Props) => (
  <Card className="glass-card overflow-hidden relative">
    {/* Subtle gradient accent strip */}
    <div className="absolute top-0 inset-x-0 h-1 hero-gradient" />
    <CardHeader className="pt-8 pb-3">
      <CardTitle className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-lg">
          <BarChart3 className="h-5 w-5 text-primary" />
          {title}
        </span>
        <Badge variant={confidence >= 75 ? 'default' : confidence >= 50 ? 'secondary' : 'outline'} className="text-xs">
          {confidenceLabel}
        </Badge>
      </CardTitle>
    </CardHeader>
    <CardContent className="pb-8">
      <div className="text-center">
        <p className="text-5xl sm:text-6xl font-display font-bold text-foreground tracking-tight">
          {formatHuf(p50)}
        </p>
        <p className="text-muted-foreground text-base mt-2">{formatEur(p50Eur)}</p>
      </div>
    </CardContent>
  </Card>
);

export default MarketValueHero;
