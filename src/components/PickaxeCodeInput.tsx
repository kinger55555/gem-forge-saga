import { useState, useEffect } from 'react';
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
  coins: number;
  onBuySoda: () => void;
  onBuySodaPlus: () => void;
  onBuySodaMinus: () => void;
  onBuy7up: () => void;
  language?: 'en' | 'ru';
}

export function PickaxeCodeInput({ onRedeemCode, coins, onBuySoda, onBuySodaPlus, onBuySodaMinus, onBuy7up, language = 'ru' }: PickaxeCodeInputProps) {
  const { user } = useAuth();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [unlockedSodas, setUnlockedSodas] = useState<string[]>([]);

  useEffect(() => {
    const checkSodaAccess = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('special_codes')
        .select('code')
        .eq('user_id', user.id)
        .in('code', ['soda', 'soda+', 'soda-', '7up']);
        
      setUnlockedSodas(data?.map(d => d.code) || []);
    };
    
    checkSodaAccess();
  }, [user]);

  const handleSpecialCode = async (codeValue: string) => {
    if (!user) return;

    if (codeValue === 'mod67') {
      try {
        const today = new Date().toISOString().split('T')[0];
        
        // Check if already used today
        const { data: existing } = await supabase
          .from('special_codes')
          .select('*')
          .eq('user_id', user.id)
          .eq('code', 'mod67')
          .eq('used_date', today)
          .maybeSingle();

        if (existing) {
          toast.error(language === 'ru' ? 'Код mod67 уже использован сегодня!' : 'Code mod67 already used today!');
          return;
        }

        // Record usage
        const { error: codeError } = await supabase
          .from('special_codes')
          .insert({
            user_id: user.id,
            code: 'mod67',
            used_date: today
          });

        if (codeError) throw codeError;

        // Give pickaxe
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
        return false;
      }
    }

    const sodaCodes = ['soda', 'soda+', 'soda-', '7up'];
    if (sodaCodes.includes(codeValue)) {
      try {
        // Check if already used
        const { data: existing } = await supabase
          .from('special_codes')
          .select('*')
          .eq('user_id', user.id)
          .eq('code', codeValue)
          .maybeSingle();

        if (existing) {
          toast.error(language === 'ru' ? `Код ${codeValue} уже использован!` : `Code ${codeValue} already used!`);
          return false;
        }

        // Record usage
        const { error } = await supabase
          .from('special_codes')
          .insert({
            user_id: user.id,
            code: codeValue,
            used_date: new Date().toISOString().split('T')[0]
          });

        if (error) throw error;

        setUnlockedSodas(prev => [...prev, codeValue]);
        const sodaNames = {
          soda: '🥤 Soda',
          'soda+': '🥤 Soda+', 
          'soda-': '🥤 Soda-',
          '7up': '🥤 7UP'
        };
        toast.success(language === 'ru' ? `Разблокирована покупка ${sodaNames[codeValue as keyof typeof sodaNames]}!` : `${sodaNames[codeValue as keyof typeof sodaNames]} purchase unlocked!`);
        return true;
      } catch (error: any) {
        console.error('Error with soda code:', error);
        toast.error(language === 'ru' ? 'Ошибка активации кода' : 'Failed to activate code');
        return false;
      }
    }
    
    return false;
  };

  const handleSubmit = async () => {
    if (!code.trim()) return;
    
    setIsLoading(true);
    const codeValue = code.trim().toLowerCase();
    
    // Handle special codes first
    const handled = await handleSpecialCode(codeValue);
    if (!handled) {
      // Handle regular pickaxe codes
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
        
        <p className="text-sm text-muted-foreground">
          {language === 'ru' 
            ? 'Введите код для получения кирки или других предметов' 
            : 'Enter a code to get a pickaxe or other items'
          }
        </p>
        
        {unlockedSodas.length > 0 && (
          <div className="border-t pt-4 space-y-2">
            <h4 className="font-medium text-sm">{language === 'ru' ? 'Доступные напитки:' : 'Available drinks:'}</h4>
            
            {unlockedSodas.includes('soda') && (
              <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                <div>
                  <h4 className="font-medium">🥤 Soda</h4>
                  <p className="text-xs text-muted-foreground">
                    {language === 'ru' ? 'Освежающий напиток (ничего не делает)' : 'Refreshing drink (does nothing)'}
                  </p>
                </div>
                <Button 
                  onClick={onBuySoda}
                  disabled={coins < 200}
                  size="sm"
                  variant="outline"
                >
                  200 coins
                </Button>
              </div>
            )}

            {unlockedSodas.includes('soda+') && (
              <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                <div>
                  <h4 className="font-medium">🥤 Soda+</h4>
                  <p className="text-xs text-muted-foreground">
                    {language === 'ru' ? 'Улучшенная газировка (ничего не делает)' : 'Enhanced soda (does nothing)'}
                  </p>
                </div>
                <Button 
                  onClick={onBuySodaPlus}
                  disabled={coins < 300}
                  size="sm"
                  variant="outline"
                >
                  300 coins
                </Button>
              </div>
            )}

            {unlockedSodas.includes('soda-') && (
              <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                <div>
                  <h4 className="font-medium">🥤 Soda-</h4>
                  <p className="text-xs text-muted-foreground">
                    {language === 'ru' ? 'Диетическая газировка (ничего не делает)' : 'Diet soda (does nothing)'}
                  </p>
                </div>
                <Button 
                  onClick={onBuySodaMinus}
                  disabled={coins < 300}
                  size="sm"
                  variant="outline"
                >
                  300 coins
                </Button>
              </div>
            )}

            {unlockedSodas.includes('7up') && (
              <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                <div>
                  <h4 className="font-medium">🥤 7UP</h4>
                  <p className="text-xs text-muted-foreground">
                    {language === 'ru' ? 'Лимонная газировка (ничего не делает)' : 'Lemon-lime soda (does nothing)'}
                  </p>
                </div>
                <Button 
                  onClick={onBuy7up}
                  disabled={coins < 400}
                  size="sm"
                  variant="outline"
                >
                  400 coins
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}