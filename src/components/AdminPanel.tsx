import { useState } from 'react';
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
import { PickaxeLink } from '@/types/admin';
import { 
  createPickaxeLink, 
  getActivationUrl, 
  validateAdminPassword 
} from '@/utils/linkUtils';
import { 
  Settings, 
  Plus, 
  Copy, 
  Eye, 
  EyeOff, 
  Pickaxe as PickaxeIcon,
  Zap,
  Calendar,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface AdminPanelProps {
  pickaxeLinks: PickaxeLink[];
  onCreateLink: (link: PickaxeLink) => void;
  isAdminMode: boolean;
  onToggleAdmin: (isAdmin: boolean) => void;
}

export function AdminPanel({ 
  pickaxeLinks, 
  onCreateLink, 
  isAdminMode, 
  onToggleAdmin 
}: AdminPanelProps) {
  const [adminPassword, setAdminPassword] = useState('');
  const [newPickaxeName, setNewPickaxeName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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
    const link = createPickaxeLink(type, newPickaxeName || undefined);
    onCreateLink(link);
    setNewPickaxeName('');
    toast.success(`Ссылка создана: ${link.code}`);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Ссылка скопирована!');
    } catch (err) {
      toast.error('Не удалось скопировать ссылку');
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
        {/* Create New Link */}
        <div className="space-y-3">
          <h3 className="font-medium">Создать новую ссылку</h3>
          
          <div>
            <Label htmlFor="pickaxeName">Название кирки (опционально)</Label>
            <Input
              id="pickaxeName"
              value={newPickaxeName}
              onChange={(e) => setNewPickaxeName(e.target.value)}
              placeholder="Например: Особенная кирка"
              className="mt-1"
            />
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={() => handleCreateLink('normal')}
              className="flex-1 gap-2"
            >
              <PickaxeIcon className="w-4 h-4" />
              Обычная кирка
            </Button>
            <Button 
              onClick={() => handleCreateLink('legendary')}
              variant="outline"
              className="flex-1 gap-2 border-rarity-legendary text-rarity-legendary hover:bg-rarity-legendary/10"
            >
              <Zap className="w-4 h-4" />
              Легендарная кирка
            </Button>
          </div>
        </div>

        <Separator />

        {/* Links List */}
        <div className="space-y-3">
          <h3 className="font-medium flex items-center gap-2">
            Созданные ссылки ({pickaxeLinks.length})
          </h3>
          
          {pickaxeLinks.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Пока нет созданных ссылок
            </p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {pickaxeLinks.map((link) => (
                <Card key={link.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge 
                          variant={link.type === 'legendary' ? 'default' : 'secondary'}
                          className={link.type === 'legendary' ? 'bg-rarity-legendary/20 text-rarity-legendary border-rarity-legendary/50' : ''}
                        >
                          {link.type === 'legendary' ? 'Легендарная' : 'Обычная'}
                        </Badge>
                        {link.used && (
                          <Badge variant="outline" className="text-green-600 border-green-600/50">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Использована
                          </Badge>
                        )}
                      </div>
                      
                      <p className="font-medium text-sm truncate">{link.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Код: <span className="font-mono">{link.code}</span>
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <Calendar className="w-3 h-3" />
                        {link.createdAt.toLocaleDateString()}
                        {link.usedAt && (
                          <span>• Использована: {link.usedAt.toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(getActivationUrl(link.code))}
                      className="shrink-0"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}