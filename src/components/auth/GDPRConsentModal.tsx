import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

type GDPRConsentModalProps = {
  open: boolean;
  onAccept: () => void;
};

const GDPRConsentModal = ({ open, onAccept }: GDPRConsentModalProps) => {
  const [gdprAccepted, setGdprAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onAccept();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={e => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Adatkezelési hozzájárulás szükséges</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Az EU AutoValue Intelligence™ használatához kérjük erősítse meg adatkezelési hozzájárulását.
        </p>
        <div className="space-y-4 pt-4">
          <div className="flex items-start gap-3">
            <Checkbox
              id="gdpr-consent"
              checked={gdprAccepted}
              onCheckedChange={(v) => setGdprAccepted(v === true)}
            />
            <Label htmlFor="gdpr-consent" className="text-sm leading-relaxed cursor-pointer">
              Elfogadom az Adatkezelési tájékoztatót
            </Label>
          </div>
          <div className="flex items-start gap-3">
            <Checkbox id="marketing-consent" />
            <Label htmlFor="marketing-consent" className="text-sm leading-relaxed cursor-pointer text-muted-foreground">
              Hozzájárulok marketing célú kapcsolatfelvételhez (opcionális)
            </Label>
          </div>
          <p className="text-xs text-muted-foreground">
            Adatait piackutatási és platformfejlesztési célra kezeljük.
          </p>
          <Button
            onClick={handleConfirm}
            className="w-full"
            disabled={!gdprAccepted || loading}
          >
            Megerősítem
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GDPRConsentModal;
