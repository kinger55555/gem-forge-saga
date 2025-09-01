import { useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gift, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface PickaxeActivationProps {
  onActivate: () => void;
  pickaxeType: 'normal' | 'legendary';
  pickaxeName: string;
}

export function PickaxeActivation({ onActivate, pickaxeType, pickaxeName }: PickaxeActivationProps) {
  useEffect(() => {
    toast.success('🎁 Найдена ссылка на кирку!', { duration: 6000 });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-cave flex items-center justify-center p-4">
      <Card className="p-8 max-w-md w-full text-center bg-card/80 backdrop-blur-sm">
        <div className="space-y-6">
          <div>
            <Gift className="w-16 h-16 mx-auto text-primary mb-4" />
            <h1 className="text-2xl font-bold mb-2">Подарок найден!</h1>
            <p className="text-muted-foreground">
              Вы получили ссылку на {pickaxeType === 'legendary' ? 'легендарную' : 'обычную'} кирку
            </p>
          </div>

          <div className="p-4 rounded-lg bg-gradient-crystal border border-primary/20">
            <h3 className="font-semibold mb-1">{pickaxeName}</h3>
            <p className={`text-sm ${
              pickaxeType === 'legendary' 
                ? 'text-rarity-legendary' 
                : 'text-rarity-common'
            }`}>
              {pickaxeType === 'legendary' ? 'Легендарная кирка' : 'Обычная кирка'}
            </p>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={onActivate}
              size="lg" 
              className="w-full gap-2"
            >
              <Gift className="w-5 h-5" />
              Забрать кирку
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              className="w-full gap-2"
              onClick={() => window.location.href = window.location.pathname}
            >
              <ExternalLink className="w-4 h-4" />
              Перейти к игре
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Кирка будет добавлена в ваш инвентарь
          </p>
        </div>
      </Card>
    </div>
  );
}