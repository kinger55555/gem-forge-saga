import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Gift, KeyRound } from 'lucide-react';
import { toast } from 'sonner';

interface PickaxeCodeInputProps {
  onRedeemCode: (code: string) => void;
  language?: 'en' | 'ru';
}

export function PickaxeCodeInput({ onRedeemCode, language = 'ru' }: PickaxeCodeInputProps) {
  const { user } = useAuth();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSpecialCode = async (codeValue: string) => {
    if (!user) return false;

    if (codeValue === 'mod67') {
      try {
        const today = new Date().toISOString().split('T')[0];
        
        const { data: existing } = await supabase
          .from('special_codes')
          .select('*')
          .eq('user_id', user.id)
          .eq('code', 'mod67')
          .eq('used_date', today)
          .maybeSingle();

        if (existing) {
          toast.error(language === 'ru' ? 'Код mod67 уже использован сегодня!' : 'Code mod67 already used today!');
          return true;
        }

        const { error: codeError } = await supabase
          .from('special_codes')
          .insert({
            user_id: user.id,
            code: 'mod67',
            used_date: today
          });

        if (codeError) throw codeError;

        const { error: pickaxeError } = await supabase
          .from('pickaxes')
          .insert({
            user_id: user.id,
            type: 'normal',
            name: 'Mod67 Pickaxe',
            used: false
          });

        if (pickaxeError) throw pickaxeError;

        toast.success(language === 'ru' ? '🎁 Получена кирка от mod67!' : '🎁 Received pickaxe from mod67!');
        return true;
      } catch (error: any) {
        console.error('Error with mod67 code:', error);
        toast.error(language === 'ru' ? 'Ошибка активации кода' : 'Failed to activate code');
        return true;
      }
    }
    
    return false;
  };

  const handleSubmit = async () => {
    if (!code.trim()) return;
    
    setIsLoading(true);
    const codeValue = code.trim().toLowerCase();
    
    const handled = await handleSpecialCode(codeValue);
    if (!handled) {
      await onRedeemCode(codeValue);
    }
    
    setCode('');
    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <KeyRound className="w-5 h-5" />
        {language === 'ru' ? 'Код кирки' : 'Pickaxe Code'}
      </h2>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="pickaxe-code">
            {language === 'ru' ? 'Введите код' : 'Enter code'}
          </Label>
          <Input
            id="pickaxe-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={language === 'ru' ? 'Например: abc123' : 'e.g., abc123'}
            className="mt-1"
            disabled={isLoading}
          />
        </div>
        
        <Button 
          onClick={handleSubmit}
          disabled={!code.trim() || isLoading}
          className="w-full gap-2"
        >
          <Gift className="w-4 h-4" />
          {isLoading 
            ? (language === 'ru' ? 'Активация...' : 'Activating...') 
            : (language === 'ru' ? 'Активировать код' : 'Activate code')
          }
        </Button>
      </div>
    </Card>
  );
}