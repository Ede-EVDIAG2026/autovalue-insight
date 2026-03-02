import { useLanguage } from '@/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';

const ListingTextCard = ({ text }: { text: string }) => {
  const { tr } = useLanguage();

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    toast.success(tr('copied'));
  };

  if (!text) return null;

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold text-foreground text-lg">
          📝 {tr('listing_text')}
        </h3>
        <Button variant="outline" size="sm" onClick={handleCopy}>
          <Copy className="h-4 w-4 mr-2" />
          {tr('copy_listing')}
        </Button>
      </div>
      <Textarea
        readOnly
        value={text}
        className="min-h-[160px] bg-muted/30 text-foreground resize-none"
      />
    </div>
  );
};

export default ListingTextCard;
