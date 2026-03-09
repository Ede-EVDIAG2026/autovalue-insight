import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingDown, Minus, TrendingUp } from 'lucide-react';

const formatHuf = (v: number) => v ? `${Math.round(v).toLocaleString('hu-HU')} Ft` : '–';

interface Props {
  p10: number;
  p50: number;
  p90: number;
  title: string;
  lowLabel: string;
  marketLabel: string;
  highLabel: string;
}

const PriceRangeCard = ({ p10, p50, p90, title, lowLabel, marketLabel, highLabel }: Props) => {
  // Position of p50 within the range for the indicator
  const range = p90 - p10 || 1;
  const midPct = Math.round(((p50 - p10) / range) * 100);

  return (
    <Card className="glass-card h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Visual range bar */}
        <div className="relative pt-5 pb-1">
          <div className="h-2 rounded-full value-band-gradient opacity-60" />
          <div
            className="absolute top-0 w-3 h-3 rounded-full bg-primary border-2 border-primary-foreground shadow-md"
            style={{ left: `calc(${midPct}% - 6px)` }}
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 rounded-lg bg-destructive/5 border border-destructive/10">
            <TrendingDown className="h-4 w-4 text-destructive mx-auto mb-1" />
            <p className="text-[11px] text-muted-foreground">{lowLabel}</p>
            <p className="font-semibold text-foreground text-sm">{formatHuf(p10)}</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-primary/5 border border-primary/10">
            <Minus className="h-4 w-4 text-primary mx-auto mb-1" />
            <p className="text-[11px] text-muted-foreground">{marketLabel}</p>
            <p className="font-semibold text-foreground text-sm">{formatHuf(p50)}</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-secondary/5 border border-secondary/10">
            <TrendingUp className="h-4 w-4 text-secondary mx-auto mb-1" />
            <p className="text-[11px] text-muted-foreground">{highLabel}</p>
            <p className="font-semibold text-foreground text-sm">{formatHuf(p90)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PriceRangeCard;
