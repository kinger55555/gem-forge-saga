import { Button } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';

export function PickaxeHelp({ language = 'ru', onShowTutorial }: { language?: 'en' | 'ru'; onShowTutorial: () => void }) {
  return (
    <Button variant="ghost" size="sm" className="gap-2" onClick={onShowTutorial}>
      <HelpCircle className="w-4 h-4" />
      {language === 'ru' ? 'Справка' : 'Help'}
    </Button>
  );
}
