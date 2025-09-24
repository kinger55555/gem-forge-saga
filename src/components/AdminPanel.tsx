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
import { validateAdminPassword, createPickaxeLink, getActivationUrl } from '@/utils/linkUtils';
import { PickaxeLink } from '@/types/admin';
import { 
  Settings, 
  Link,
  Copy,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'sonner';

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
  const [pickaxeLinks, setPickaxeLinks] = useState<PickaxeLink[]>([]);
  const [customName, setCustomName] = useState('');

  const handleAdminLogin = () => {
    if (validateAdminPassword(adminPassword)) {
      onToggleAdmin(true);
      toast.success('Добро пожаловать в админ-панель!');
      setAdminPassword('');
    } else {
      toast.error('Неверный пароль администратора!');
    }
  };

  const handleCreateLink = (type: 'normal' | 'legendary') => {
    const link = createPickaxeLink(type, customName);
    setPickaxeLinks(prev => [...prev, link]);
    setCustomName('');
    toast.success(`Создана ссылка для ${type === 'legendary' ? 'легендарной' : 'обычной'} кирки!`);
  };

  const handleCopyLink = (code: string) => {
    const url = getActivationUrl(code);
    navigator.clipboard.writeText(url);
    toast.success('Ссылка скопирована в буфер обмена!');
  };

  const handleDeleteLink = (id: string) => {
    setPickaxeLinks(prev => prev.filter(link => link.id !== id));
    toast.success('Ссылка удалена!');
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
        {/* Create Pickaxe Link */}
        <div className="space-y-3">
          <h3 className="font-medium">Создать ссылку на кирку</h3>
          
          <div>
            <Label htmlFor="customName">Название (необязательно)</Label>
            <Input
              id="customName"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Кастомное название кирки..."
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

        {pickaxeLinks.length > 0 && (
          <>
            <Separator />

            {/* Generated Links */}
            <div className="space-y-3">
              <h3 className="font-medium">Созданные ссылки</h3>
              
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {pickaxeLinks.map((link) => (
                  <div key={link.id} className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-sm">{link.name}</div>
                      <Badge variant={link.type === 'legendary' ? 'default' : 'secondary'}>
                        {link.type === 'legendary' ? 'Легендарная' : 'Обычная'}
                      </Badge>
                    </div>
                    
                    <div className="text-xs text-muted-foreground mb-2">
                      Код: {link.code}
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