import { AS24Market } from "@/hooks/useMarketData";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

interface MarketDataBadgeProps {
  market: AS24Market | null;
  isLoading: boolean;
}

const fmt = (v: number | null) => (v != null ? `€${v.toLocaleString("hu-HU")}` : "–");

export default function MarketDataBadge({ market, isLoading }: MarketDataBadgeProps) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-muted bg-muted/40 px-4 py-2.5 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        AS24 piaci adatok betöltése…
      </div>
    );
  }

  // Endpoint unreachable
  if (market === null) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-muted bg-muted/40 px-4 py-2.5 text-sm text-muted-foreground">
        <XCircle className="h-4 w-4" />
        Piaci adatforrás nem elérhető
      </div>
    );
  }

  // No listings found
  if (!market.found) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-yellow-300/50 bg-yellow-50 dark:bg-yellow-900/20 px-4 py-2.5 text-sm text-yellow-800 dark:text-yellow-300">
        <AlertTriangle className="h-4 w-4" />
        Nincs AS24 piaci adat — AI-becslés alapján
      </div>
    );
  }

  // Low confidence
  if (market.confidence < 0.5) {
    return (
      <div className="space-y-1.5 rounded-lg border border-yellow-300/50 bg-yellow-50 dark:bg-yellow-900/20 px-4 py-2.5 text-sm text-yellow-800 dark:text-yellow-300">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Korlátozott AS24 adat ({market.dataPoints} hirdetés)
        </div>
        <p className="text-xs opacity-80">Az értékbecslés tájékoztató jellegű</p>
      </div>
    );
  }

  // Good data
  const confPct = Math.round(market.confidence * 100);

  return (
    <div className="space-y-2 rounded-lg border border-green-300/50 bg-green-50 dark:bg-green-900/20 px-4 py-3 text-sm text-green-800 dark:text-green-300">
      <div className="flex items-center gap-2 font-medium">
        <CheckCircle2 className="h-4 w-4" />
        AutoScout24 · {market.dataPoints} hirdetés · {market.snapshotDate}
      </div>

      <div className="flex items-center gap-2 text-xs">
        <span>Konfidencia {confPct}%</span>
        <Progress value={confPct} className="h-1.5 flex-1" />
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className="text-xs font-normal">
          Min {fmt(market.low)}
        </Badge>
        <Badge variant="default" className="text-xs font-semibold">
          Medián {fmt(market.median)}
        </Badge>
        <Badge variant="outline" className="text-xs font-normal">
          Max {fmt(market.high)}
        </Badge>
      </div>

      <div className="text-xs opacity-80">
        Likviditás: {market.liquidityScore}/100 · ~{market.daysToSell} nap értékesítés
      </div>
    </div>
  );
}
