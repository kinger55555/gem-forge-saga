import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MousePointer2, DollarSign } from 'lucide-react';

interface ClickerProps {
  clickerEarnings: number;
  onClick: () => void;
}

export function Clicker({ clickerEarnings, onClick }: ClickerProps) {
  const [isClicking, setIsClicking] = useState(false);

  const handleClick = () => {
    setIsClicking(true);
    onClick();
    setTimeout(() => setIsClicking(false), 100);
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <MousePointer2 className="w-5 h-5" />
        Clicker
      </h2>
      
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <DollarSign className="w-5 h-5 text-green-500" />
          <span className="text-2xl font-bold">${clickerEarnings.toFixed(1)}</span>
        </div>
        
        <Button
          onClick={handleClick}
          className={`w-full h-16 text-lg transition-all ${
            isClicking ? 'scale-95' : 'scale-100'
          }`}
          variant="outline"
        >
          Click for $0.1
        </Button>
        
        <Badge variant="secondary" className="text-sm">
          Each click = $0.1
        </Badge>
      </div>
    </Card>
  );
}