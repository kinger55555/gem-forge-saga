import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Gift, KeyRound } from 'lucide-react';

interface PickaxeCodeInputProps {
  onRedeemCode: (code: string) => void;
  language?: 'en' | 'ru';
}

export function PickaxeCodeInput({ onRedeemCode, language = 'ru' }: PickaxeCodeInputProps) {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!code.trim()) return;
    
    setIsLoading(true);
    await onRedeemCode(code.trim().toLowerCase());
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
            ? 'Введите 6-значный код для получения кирки' 
            : 'Enter a 6-digit code to get a pickaxe'
          }
        </p>
      </div>
    </Card>
  );
}