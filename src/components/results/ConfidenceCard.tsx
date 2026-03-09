import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Shield, Info } from 'lucide-react';

interface Props {
  confidence: number;
  confidenceLabel: string;
  title: string;
  explanation: string;
}

const ConfidenceCard = ({ confidence, confidenceLabel, title, explanation }: Props) => {
  const variant = confidence >= 85 ? 'default' : confidence >= 70 ? 'secondary' : 'outline';
  const barColor = confidence >= 85 ? 'bg-primary' : confidence >= 70 ? 'bg-secondary' : confidence >= 50 ? 'bg-amber-500' : 'bg-destructive';

  return (
    <Card className="glass-card h-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Shield className="h-5 w-5 text-primary" />
          {title}
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs text-sm">{explanation}</TooltipContent>
          </Tooltip>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-end justify-between">
          <p className="text-4xl font-display font-bold text-foreground">{confidence}%</p>
          <Badge variant={variant} className="mb-1">{confidenceLabel}</Badge>
        </div>
        <div className="relative h-2.5 rounded-full bg-muted overflow-hidden">
          <div className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${confidence}%` }} />
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{explanation}</p>
      </CardContent>
    </Card>
  );
};

export default ConfidenceCard;
