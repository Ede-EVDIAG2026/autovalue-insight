import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const [fullName, setFullName] = useState(user?.name || '');
  const [language, setLanguage] = useState<string>(lang);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    // Profile updates will go through api.evdiag.hu in the future
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
