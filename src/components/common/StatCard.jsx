import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function StatCard({ title, value, icon: Icon, description, trend, color = 'navy', className }) {
  const colors = {
    navy: 'bg-navy-800 text-white',
    maroon: 'bg-maroon-500 text-white',
    green: 'bg-green-600 text-white',
    orange: 'bg-orange-500 text-white',
    steel: 'bg-steel-400 text-white',
  };

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <p className="text-2xl font-bold text-navy-800 mt-1">{value}</p>
            {description && (
              <div className="text-xs text-muted-foreground mt-1">{description}</div>
            )}
            {trend !== undefined && (
              <p className={cn('text-xs font-medium mt-1', trend >= 0 ? 'text-green-600' : 'text-red-500')}>
                {trend >= 0 ? '↗' : '↘'} {Math.abs(trend)}% vs mois dernier
              </p>
            )}
          </div>
          {Icon && (
            <div className={cn('p-3 rounded-lg', colors[color])}>
              <Icon className="h-5 w-5" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
