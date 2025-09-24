import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { validateAdminPassword } from '@/utils/linkUtils';
import { 
  Settings, 
  DollarSign,
  Package,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface AdminPanelProps {
  isAdminMode: boolean;
  onToggleAdmin: (isAdmin: boolean) => void;
  language?: 'en' | 'ru';
  coins: number;
  onAddCoins: (amount: number) => Promise<void>;
  onAddCase: () => Promise<void>;
}

export function AdminPanel({ 
  isAdminMode, 
  onToggleAdmin,
  language = 'ru',
  coins,
  onAddCoins,
  onAddCase
}: AdminPanelProps) {
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [coinsToAdd, setCoinsToAdd] = useState('1000');

  const handleAdminLogin = () => {
    if (validateAdminPassword(adminPassword)) {
      onToggleAdmin(true);
      toast.success('Добро пожаловать в админ-панель!');
      setAdminPassword('');
    } else {
      toast.error('Неверный пароль администратора!');
    }
  };

  const handleAddCoins = async () => {
    const amount = parseInt(coinsToAdd);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Введите корректное количество монет');
      return;
    }

    try {
      await onAddCoins(amount);
      toast.success(`Добавлено ${amount} монет!`);
    } catch (error) {
      toast.error('Ошибка при добавлении монет');
    }
  };

  const handleAddCase = async () => {
    try {
      await onAddCase();
      toast.success('Добавлен кейс!');
    } catch (error) {
      toast.error('Ошибка при добавлении кейса');
    }
  };

  if (!isAdminMode) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2">
            <Settings className="w-4 h-4" />
            Админ
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Админ-панель</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="password">Пароль администратора</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Введите пароль..."
                    onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 h-7 w-7 p-0"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                <Button onClick={handleAdminLogin}>Вход</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Card className="p-6 border-primary/20 bg-gradient-crystal">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Админ-панель
        </h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onToggleAdmin(false)}
        >
          Выйти
        </Button>
      </div>

      <div className="space-y-6">
        {/* Current Stats */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4" />
            <span className="font-medium">Текущий баланс</span>
          </div>
          <p className="text-2xl font-bold">{coins.toLocaleString()} монет</p>
        </div>

        <Separator />

        {/* Add Coins */}
        <div className="space-y-3">
          <h3 className="font-medium">Добавить монеты</h3>
          
          <div>
            <Label htmlFor="coinsAmount">Количество монет</Label>
            <Input
              id="coinsAmount"
              type="number"
              value={coinsToAdd}
              onChange={(e) => setCoinsToAdd(e.target.value)}
              placeholder="1000"
              className="mt-1"
            />
          </div>
          
          <Button 
            onClick={handleAddCoins}
            className="w-full gap-2"
          >
            <DollarSign className="w-4 h-4" />
            Добавить монеты
          </Button>
        </div>

        <Separator />

        {/* Add Case */}
        <div className="space-y-3">
          <h3 className="font-medium">Добавить кейс</h3>
          <p className="text-sm text-muted-foreground">
            Добавляет 500 монет (стоимость открытия кейса)
          </p>
          
          <Button 
            onClick={handleAddCase}
            variant="outline"
            className="w-full gap-2"
          >
            <Package className="w-4 h-4" />
            Добавить кейс (500 монет)
          </Button>
        </div>
      </div>
    </Card>
  );
}