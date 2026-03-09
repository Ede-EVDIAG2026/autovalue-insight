import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Droplets, Gauge, Clock, CalendarClock, Percent } from 'lucide-react';

const formatHuf = (v: number) => v ? `${Math.round(v).toLocaleString('hu-HU')} Ft` : '–';

interface Props {
  liquidityLevel: string;
  velocityDays: number;
  resale3y: number;
  depreciation3y: number;
  labels: {
    liquidity: string;
    liquidityLevel: string;
    estSellingTime: string;
    days: string;
    resale: string;
    depreciation: string;
  };
}

const MarketInsightRow = ({ liquidityLevel, velocityDays, resale3y, depreciation3y, labels }: Props) => (
  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
    {/* Liquidity */}
    <Card className="glass-card">
      <CardContent className="pt-5 pb-4 space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Droplets className="h-4 w-4 text-primary" />
          {labels.liquidityLevel}
        </div>
        <Badge variant={liquidityLevel === 'high' ? 'default' : liquidityLevel === 'normal' ? 'secondary' : 'outline'} className="text-sm">
          {liquidityLevel}
        </Badge>
      </CardContent>
    </Card>

    {/* Selling time */}
    <Card className="glass-card">
      <CardContent className="pt-5 pb-4 space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-4 w-4 text-primary" />
          {labels.estSellingTime}
        </div>
        <p className="text-2xl font-display font-bold text-foreground">{velocityDays} <span className="text-sm font-normal text-muted-foreground">{labels.days}</span></p>
      </CardContent>
    </Card>

    {/* Resale 3y */}
    <Card className="glass-card">
      <CardContent className="pt-5 pb-4 space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CalendarClock className="h-4 w-4 text-primary" />
          {labels.resale}
        </div>
        <p className="text-xl font-display font-bold text-foreground">{formatHuf(resale3y)}</p>
      </CardContent>
    </Card>

    {/* Depreciation */}
    <Card className="glass-card">
      <CardContent className="pt-5 pb-4 space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Percent className="h-4 w-4 text-destructive" />
          {labels.depreciation}
        </div>
        <p className="text-xl font-display font-bold text-destructive">-{depreciation3y}%</p>
      </CardContent>
    </Card>
  </div>
);

export default MarketInsightRow;
