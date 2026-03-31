import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';
import { evaluationHubI18n, type HubLang } from '@/i18n/evaluationHub.i18n';
import CommercialValuationWizard from './CommercialValuationWizard';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DollarSign, Battery, ClipboardCheck } from 'lucide-react';

interface EvaluationHubProps {
  vinResult: {
    vin: string;
    make: string;
    model: string;
    year: number;
    powertrain_type: string;
    body_type?: string;
    trim?: string;
    isManual?: boolean;
  };
}

type EvalType = 'commercial' | 'degradation' | 'inspection' | null;

export default function EvaluationHub({ vinResult }: EvaluationHubProps) {
  const { lang } = useLanguage();
  const t = evaluationHubI18n[(lang as HubLang) || 'hu'] || evaluationHubI18n.hu;
  const navigate = useNavigate();
  const [selected, setSelected] = useState<EvalType>(null);

  const isManual = !!vinResult.isManual;

  const handleSelect = (type: EvalType) => {
    if (type === 'degradation') {
      navigate(`/ev-database?make=${encodeURIComponent(vinResult.make)}&model=${encodeURIComponent(vinResult.model)}&autoopen=${isManual ? 'false' : 'true'}&action=degradation`);
      return;
    }
    if (type === 'inspection') {
      navigate(`/ev-database?make=${encodeURIComponent(vinResult.make)}&model=${encodeURIComponent(vinResult.model)}&autoopen=${isManual ? 'false' : 'true'}&action=inspection`);
      return;
    }
    setSelected(type);
  };

  if (selected === 'commercial') {
    return (
      <CommercialValuationWizard
        vinResult={vinResult}
        onBack={() => setSelected(null)}
      />
    );
  }

  const inspectionBadge =
    vinResult.powertrain_type === 'BEV' ? t.inspectionBEVBadge :
    vinResult.powertrain_type === 'PHEV' ? t.inspectionPHEVBadge :
    t.inspectionHEVBadge;

  const cards: {
    type: EvalType;
    icon: React.ReactNode;
    title: string;
    desc: string;
    badges: string[];
    btn: string;
    gradient: string;
    btnClass: string;
  }[] = [
    {
      type: 'commercial',
      icon: <DollarSign className="h-8 w-8" />,
      title: t.commercialTitle,
      desc: t.commercialDesc,
      badges: [vinResult.powertrain_type, t.commercialBadge],
      btn: t.commercialBtn,
      gradient: 'from-blue-500 to-blue-700',
      btnClass: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
    {
      type: 'degradation',
      icon: <Battery className="h-8 w-8" />,
      title: t.degradationTitle,
      desc: t.degradationDesc,
      badges: [vinResult.powertrain_type, t.degradationBadge],
      btn: t.degradationBtn,
      gradient: 'from-orange-500 to-orange-700',
      btnClass: 'bg-orange-600 hover:bg-orange-700 text-white',
    },
    {
      type: 'inspection',
      icon: <ClipboardCheck className="h-8 w-8" />,
      title: t.inspectionTitle,
      desc: t.inspectionDesc,
      badges: [vinResult.powertrain_type, inspectionBadge],
      btn: t.inspectionBtn,
      gradient: 'from-green-500 to-green-700',
      btnClass: 'bg-green-600 hover:bg-green-700 text-white',
    },
  ];

  return (
    <div className="space-y-6">
      {isManual && (
        <div className="flex items-center justify-center gap-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-2 text-sm text-blue-700 dark:text-blue-300">
          <span>ℹ</span> {t.manualBadge}
        </div>
      )}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground">{t.hubTitle}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t.hubSubtitle}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map(c => (
          <Card
            key={c.type}
            className="overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-[3px] hover:shadow-lg border border-border"
            onClick={() => handleSelect(c.type)}
          >
            <div className={`h-2 bg-gradient-to-r ${c.gradient}`} />
            <CardContent className="pt-5 pb-5 space-y-3">
              <div className="text-primary">{c.icon}</div>
              <h3 className="text-lg font-bold text-foreground">{c.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{c.desc}</p>
              <div className="flex flex-wrap gap-1.5">
                {c.badges.map((b, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">{b}</Badge>
                ))}
              </div>
              <Button className={`w-full mt-2 ${c.btnClass}`}>
                {c.btn}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
