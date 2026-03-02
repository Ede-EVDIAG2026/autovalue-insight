import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import AppHeader from '@/components/AppHeader';
import { Lang } from '@/i18n/translations';

const AccountPage = () => {
  const { user, signOut } = useAuth();
  const { tr, lang, setLang } = useLanguage();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [language, setLanguage] = useState<string>(lang);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      (supabase as any).from('profiles').select('full_name, language').eq('id', user.id).single()
        .then(({ data }: any) => {
          if (data) {
            setFullName(data.full_name || '');
            if (data.language) setLanguage(data.language);
          }
        });
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    await (supabase as any).from('profiles').update({
      full_name: fullName,
      language,
    }).eq('id', user.id);
    setLang(language as Lang);
    setLoading(false);
    toast({ title: '✓', description: tr('saved_success') });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="container mx-auto px-4 py-12 max-w-lg">
        <Card>
          <CardHeader>
            <CardTitle>{tr('profile')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>{tr('full_name')}</Label>
              <Input value={fullName} onChange={e => setFullName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{tr('email')}</Label>
              <Input value={user?.email || ''} disabled />
            </div>
            <div className="space-y-2">
              <Label>{tr('language_setting')}</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="HU">🇭🇺 Magyar</SelectItem>
                  <SelectItem value="EN">🇬🇧 English</SelectItem>
                  <SelectItem value="DE">🇩🇪 Deutsch</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSave} className="w-full" disabled={loading}>{tr('save')}</Button>
            <Button variant="outline" onClick={handleSignOut} className="w-full">{tr('sign_out')}</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AccountPage;
