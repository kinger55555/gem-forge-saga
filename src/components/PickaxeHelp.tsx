import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  HelpCircle, 
  Link, 
  Gift, 
  Sparkles,
  ExternalLink 
} from 'lucide-react';

export function PickaxeHelp({ language = 'ru' }: { language?: 'en' | 'ru' }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <HelpCircle className="w-4 h-4" />
          Справка
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5" />
            Как получить кирки
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 text-sm">
          <div className="p-3 rounded-lg bg-gradient-crystal">
            <h4 className="font-medium flex items-center gap-2 mb-2">
              <Link className="w-4 h-4" />
              Специальные ссылки
            </h4>
            <p className="text-muted-foreground">
              Администратор может создавать уникальные ссылки для получения новых кирок. 
              Каждая ссылка работает только один раз!
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Типы кирок:</h4>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">Обычная</Badge>
                <span className="text-xs text-muted-foreground">
                  Может найти кристаллы любой редкости
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge 
                  variant="outline" 
                  className="text-xs border-rarity-legendary text-rarity-legendary"
                >
                  Легендарная
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Гарантированно находит редкие кристаллы
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg border border-primary/20">
            <h4 className="font-medium flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4" />
              Как использовать
            </h4>
            <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Получите ссылку от администратора</li>
              <li>Перейдите по ссылке в браузере</li>
              <li>Кирка автоматически добавится в инвентарь</li>
              <li>Начните добычу кристаллов!</li>
            </ol>
          </div>

          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground text-center">
              Каждая кирка одноразовая и исчезает после использования
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}