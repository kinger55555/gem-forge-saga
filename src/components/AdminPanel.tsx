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
import { validateAdminPassword, createAdminLink, getActivationUrl } from '@/utils/linkUtils';
import { AdminLink } from '@/types/admin';
import { 
  Settings, 
  Link,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  Coins,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface AdminPanelProps {
  isAdminMode: boolean;
  onToggleAdmin: (isAdmin: boolean) => void;
  language?: 'en' | 'ru';
}

export function AdminPanel({ 
  isAdminMode, 
  onToggleAdmin,
  language = 'ru'
}: AdminPanelProps) {
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [adminLinks, setAdminLinks] = useState<AdminLink[]>([]);
  const [customName, setCustomName] = useState('');
  const [coinAmount, setCoinAmount] = useState('100');
  const [isLoadingLinks, setIsLoadingLinks] = useState(false);

  useEffect(() => {
    if (isAdminMode) {
      loadAdminLinks();
    }
  }, [isAdminMode]);

  const loadAdminLinks = async () => {
    setIsLoadingLinks(true);
    try {
      const { data, error } = await supabase
        .from('admin_links')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setAdminLinks((data || []).map(link => ({
        id: link.id,
        code: link.code,
        type: link.type as AdminLink['type'],
        name: link.name,
        used: link.used,
        createdAt: new Date(link.created_at),
        usedAt: link.used_at ? new Date(link.used_at) : undefined,
        value: link.value ?? undefined,
      })));
    } catch (error) {
      console.error('Error loading admin links:', error);
    } finally {
      setIsLoadingLinks(false);
    }
  };

  const handleAdminLogin = () => {
    if (validateAdminPassword(adminPassword)) {
      onToggleAdmin(true);
      toast.success('Добро пожаловать в админ-панель!');
      setAdminPassword('');
    } else {
      toast.error('Неверный пароль администратора!');
    }
  };

  const handleCreateLink = async (type: 'normal' | 'legendary' | 'coins') => {
    let value: number | undefined;
    
    if (type === 'coins') {
      value = parseInt(coinAmount) || 100;
    }
    
    const link = createAdminLink(type, customName, value);
    
    try {
      const { error } = await supabase
        .from('admin_links')
        .insert({
          code: link.code,
          type: link.type,
          name: link.name,
          used: false,
          value: link.value
        });

      if (error) {
        toast.error('Ошибка при создании ссылки!');
        return;
      }

      setAdminLinks(prev => [...prev, link]);
      setCustomName('');
      
      const messages: Record<string, string> = {
        normal: 'Создана ссылка для обычной кирки!',
        legendary: 'Создана ссылка для легендарной кирки!',
        coins: `Создана ссылка на ${value} монет!`,
      };
      
      toast.success(messages[type]);
    } catch (error) {
      toast.error('Неожиданная ошибка при создании ссылки!');
    }
  };

  const handleCopyLink = (code: string) => {
    const url = getActivationUrl(code);
    navigator.clipboard.writeText(url);
    toast.success('Ссылка скопирована в буфер обмена!');
  };

  const handleDeleteLink = async (id: string) => {
    try {
      const linkToDelete = adminLinks.find(link => link.id === id);
      if (!linkToDelete) return;

      const { error } = await supabase
        .from('admin_links')
        .delete()
        .eq('code', linkToDelete.code);

      if (error) {
        toast.error('Ошибка при удалении ссылки!');
        return;
      }

      setAdminLinks(prev => prev.filter(link => link.id !== id));
      toast.success('Ссылка удалена!');
    } catch (error) {
      toast.error('Неожиданная ошибка при удалении ссылки!');
    }
  };

  const getBadgeVariant = (type: AdminLink['type']) => {
    switch (type) {
      case 'legendary': return 'default';
      case 'coins': return 'outline';
      default: return 'secondary';
    }
  };

  const getTypeLabel = (link: AdminLink) => {
    switch (link.type) {
      case 'normal': return 'Обычная кирка';
      case 'legendary': return 'Легендарная';
      case 'coins': return 'Монеты';
      default: return link.type;
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
        <Button variant="outline" size="sm" onClick={() => onToggleAdmin(false)}>
          Выйти
        </Button>
      </div>

      <div className="space-y-6">
        {/* Create Pickaxe Links */}
        <div className="space-y-3">
          <h3 className="font-medium">Создать ссылку на кирку</h3>
          
          <div>
            <Label htmlFor="customName">Название (необязательно)</Label>
            <Input
              id="customName"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Кастомное название..."
              className="mt-1"
            />
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={() => handleCreateLink('normal')}
              variant="outline"
              className="flex-1 gap-2"
            >
              <Link className="w-4 h-4" />
              Обычная кирка
            </Button>
            <Button 
              onClick={() => handleCreateLink('legendary')}
              className="flex-1 gap-2"
            >
              <Link className="w-4 h-4" />
              Легендарная кирка
            </Button>
          </div>
        </div>

        <Separator />

        {/* Create Coin Links */}
        <div className="space-y-3">
          <h3 className="font-medium">Создать ссылку на монеты</h3>
          
          <div>
            <Label htmlFor="coinAmount">Количество монет</Label>
            <Input
              id="coinAmount"
              type="number"
              value={coinAmount}
              onChange={(e) => setCoinAmount(e.target.value)}
              placeholder="100"
              min="1"
              className="mt-1"
            />
          </div>
          
          <Button 
            onClick={() => handleCreateLink('coins')}
            variant="outline"
            className="w-full gap-2"
          >
            <Coins className="w-4 h-4" />
            Создать ссылку на монеты
          </Button>
        </div>

        {adminLinks.length > 0 && (
          <>
            <Separator />

            <div className="space-y-3">
              <h3 className="font-medium">Созданные ссылки</h3>
              
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {adminLinks.map((link) => (
                  <div key={link.id} className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-sm">{link.name}</div>
                      <Badge variant={getBadgeVariant(link.type)}>
                        {getTypeLabel(link)}
                      </Badge>
                    </div>
                    
                    <div className="text-xs text-muted-foreground mb-2">
                      Код: {link.code}
                      {link.value && ` • Значение: ${link.value}`}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => handleCopyLink(link.code)}
                        size="sm"
                        variant="outline"
                        className="flex-1 gap-1"
                      >
                        <Copy className="w-3 h-3" />
                        Копировать ссылку
                      </Button>
                      <Button 
                        onClick={() => handleDeleteLink(link.id)}
                        size="sm"
                        variant="destructive"
                        className="gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        Удалить
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}