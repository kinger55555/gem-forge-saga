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
import { PickaxeLink } from '@/types/admin';
import { 
  generatePickaxeCode, 
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
  const [newPickaxeName, setNewPickaxeName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pickaxeLinks, setPickaxeLinks] = useState<PickaxeLink[]>([]);
  const [loading, setLoading] = useState(false);

  const handleAdminLogin = () => {
    if (validateAdminPassword(adminPassword)) {
      onToggleAdmin(true);
      toast.success('Добро пожаловать в админ-панель!');
      setAdminPassword('');
    } else {
      toast.error('Неверный пароль администратора!');
    }
  };

  const loadAdminLinks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('admin_links')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedLinks: PickaxeLink[] = data.map(link => ({
        id: link.id,
        code: link.code,
        type: link.type as 'normal' | 'legendary',
        name: link.name,
        used: link.used,
        createdAt: new Date(link.created_at),
        usedAt: link.used_at ? new Date(link.used_at) : undefined
      }));

      setPickaxeLinks(formattedLinks);
    } catch (error) {
      console.error('Error loading admin links:', error);
      toast.error('Ошибка загрузки ссылок');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLink = async (type: 'normal' | 'legendary') => {
    try {
      setLoading(true);
      const code = generatePickaxeCode();
      const defaultName = type === 'legendary' ? 'Легендарная кирка' : 'Обычная кирка';
      const name = newPickaxeName || `${defaultName} (${code})`;

      const { data, error } = await supabase
        .from('admin_links')
        .insert([
          {
            code,
            type,
            name,
            used: false
          }
        ])
        .select()
        .single();

      if (error) throw error;

      await loadAdminLinks(); // Reload the list
      setNewPickaxeName('');
      toast.success(`Ссылка создана: ${code}`);
    } catch (error) {
      console.error('Error creating admin link:', error);
      toast.error('Ошибка создания ссылки');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdminMode) {
      loadAdminLinks();
    }
  }, [isAdminMode]);

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
              disabled={loading}
            >
              <PickaxeIcon className="w-4 h-4" />
              Обычная кирка
            </Button>
            <Button 
              onClick={() => handleCreateLink('legendary')}
              variant="outline"
              className="flex-1 gap-2 border-rarity-legendary text-rarity-legendary hover:bg-rarity-legendary/10"
              disabled={loading}
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