import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/i18n/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

type AuthModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const AuthModal = ({ open, onOpenChange }: AuthModalProps) => {
  const { tr } = useLanguage();
  const { signIn, signUp } = useAuth();
  const [tab, setTab] = useState<string>('signin');
  const [loading, setLoading] = useState(false);

  // Sign in state
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Sign up state - Step 1
  const [regStep, setRegStep] = useState(1);
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regCountry, setRegCountry] = useState('HU');
  const [regCity, setRegCity] = useState('');

  // Sign up state - Step 2 (GDPR)
  const [gdprAccepted, setGdprAccepted] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(signInEmail, signInPassword);
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: 'Hiba', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleRegStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (regPassword.length < 8) {
      toast({ title: 'Hiba', description: 'Minimum 8 karakter', variant: 'destructive' });
      return;
    }
    setRegStep(2);
  };

  const handleSignUp = async () => {
    setLoading(true);
    try {
      await signUp({
        name: regName,
        contact_name: regName,
        email: regEmail,
        password: regPassword,
        dealer_type: 'B2C',
        country: regCountry,
        address_city: regCity,
        phone: '',
        gdpr_accepted: gdprAccepted,
        marketing_consent: marketingConsent,
      });
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: 'Hiba', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const resetRegForm = () => {
    setRegStep(1);
    setRegName('');
    setRegEmail('');
    setRegPassword('');
    setRegCountry('HU');
    setRegCity('');
    setGdprAccepted(false);
    setMarketingConsent(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetRegForm(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>EU AutoValue</DialogTitle>
        </DialogHeader>
        <Tabs value={tab} onValueChange={(v) => { setTab(v); resetRegForm(); }}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">{tr('sign_in')}</TabsTrigger>
            <TabsTrigger value="signup">{tr('sign_up')}</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <form onSubmit={handleSignIn} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>{tr('email')}</Label>
                <Input type="email" required value={signInEmail} onChange={e => setSignInEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{tr('password')}</Label>
                <Input type="password" required value={signInPassword} onChange={e => setSignInPassword(e.target.value)} />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>{tr('sign_in')}</Button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            {regStep === 1 ? (
              <form onSubmit={handleRegStep1} className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>{tr('full_name')}</Label>
                  <Input required value={regName} onChange={e => setRegName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{tr('email')}</Label>
                  <Input type="email" required value={regEmail} onChange={e => setRegEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{tr('password')}</Label>
                  <Input type="password" required minLength={8} value={regPassword} onChange={e => setRegPassword(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Ország</Label>
                  <Select value={regCountry} onValueChange={setRegCountry}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HU">🇭🇺 Magyarország</SelectItem>
                      <SelectItem value="DE">🇩🇪 Németország</SelectItem>
                      <SelectItem value="AT">🇦🇹 Ausztria</SelectItem>
                      <SelectItem value="PL">🇵🇱 Lengyelország</SelectItem>
                      <SelectItem value="CZ">🇨🇿 Csehország</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Város</Label>
                  <Input value={regCity} onChange={e => setRegCity(e.target.value)} />
                </div>
                <Button type="submit" className="w-full">Tovább →</Button>
              </form>
            ) : (
              <div className="space-y-4 pt-2">
                <h3 className="font-medium text-sm text-foreground">Hozzájárulás</h3>
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="reg-gdpr"
                    checked={gdprAccepted}
                    onCheckedChange={(v) => setGdprAccepted(v === true)}
                  />
                  <Label htmlFor="reg-gdpr" className="text-sm leading-relaxed cursor-pointer">
                    Elfogadom az Adatkezelési tájékoztatót
                  </Label>
                </div>
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="reg-marketing"
                    checked={marketingConsent}
                    onCheckedChange={(v) => setMarketingConsent(v === true)}
                  />
                  <Label htmlFor="reg-marketing" className="text-sm leading-relaxed cursor-pointer text-muted-foreground">
                    Hozzájárulok marketing célú kapcsolatfelvételhez (opcionális)
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Adatait piackutatási és platformfejlesztési célra kezeljük.
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setRegStep(1)} className="flex-1">← Vissza</Button>
                  <Button
                    onClick={handleSignUp}
                    className="flex-1"
                    disabled={!gdprAccepted || loading}
                  >
                    Regisztráció
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
