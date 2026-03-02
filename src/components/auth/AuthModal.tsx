import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/i18n/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

type AuthModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const AuthModal = ({ open, onOpenChange }: AuthModalProps) => {
  const { tr, lang } = useLanguage();
  const { signIn, signUp, resetPassword } = useAuth();
  const [tab, setTab] = useState<string>('signin');
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Sign in state
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Sign up state
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(signInEmail, signInPassword);
    setLoading(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      onOpenChange(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signUpPassword.length < 8) {
      toast({ title: 'Error', description: 'Min. 8 characters', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const { error } = await signUp(signUpEmail, signUpPassword, signUpName, lang);
    setLoading(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setShowConfirm(true);
    }
  };

  const handleForgotPassword = async () => {
    if (!signInEmail) {
      toast({ title: 'Error', description: 'Enter your email first', variant: 'destructive' });
      return;
    }
    const { error } = await resetPassword(signInEmail);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: '✓', description: tr('reset_pw_sent') });
    }
  };

  if (showConfirm) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>✉️ {tr('confirm_email')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{tr('confirm_email')}</p>
          <Button onClick={() => { setShowConfirm(false); onOpenChange(false); }} className="mt-4 w-full">OK</Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>EU AutoValue</DialogTitle>
        </DialogHeader>
        <Tabs value={tab} onValueChange={setTab}>
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
              <button type="button" onClick={handleForgotPassword} className="text-sm text-primary hover:underline w-full text-center block">
                {tr('forgot_pw')}
              </button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={handleSignUp} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>{tr('full_name')}</Label>
                <Input required value={signUpName} onChange={e => setSignUpName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{tr('email')}</Label>
                <Input type="email" required value={signUpEmail} onChange={e => setSignUpEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{tr('password')}</Label>
                <Input type="password" required minLength={8} value={signUpPassword} onChange={e => setSignUpPassword(e.target.value)} />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>{tr('sign_up')}</Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
