import React from 'react';
import { Tooltip } from 'antd';
import { Flame, Zap } from 'lucide-react';
import { cn } from '../../lib/utils';

interface StreakBadgeProps {
  streak?: number;
  xp?: number;
  compact?: boolean;
  className?: string;
}

export const StreakBadge: React.FC<StreakBadgeProps> = ({
  streak = 0,
  xp = 0,
  compact = false,
  className,
}) => {
  return (
    <div className={cn('flex items-center', compact ? 'gap-1.5' : 'gap-2.5', className)}>
      {/* Streak Badge */}
      <Tooltip title={`Günlük Çalışma Serisi: ${streak} Gün! Her gün en az 1 klinik kurtarma görevi tamamlayarak serinizi koruyun.`}>
        <div
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full font-bold transition-all cursor-default select-none',
            'border border-amber-500/30 bg-amber-500/15 text-amber-300 shadow-sm shadow-amber-500/10',
            compact ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-xs'
          )}
        >
          <Flame className={cn('text-amber-400', compact ? 'h-3.5 w-3.5' : 'h-4 w-4')} />
          <span>{streak} Gün</span>
        </div>
      </Tooltip>

      {/* XP Badge */}
      <Tooltip title={`Kazanılan Toplam Klinik Deneyim Puanı: ${xp} XP`}>
        <div
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full font-bold transition-all cursor-default select-none',
            'border border-sky-500/30 bg-sky-500/15 text-sky-300 shadow-sm shadow-sky-500/10',
            compact ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-xs'
          )}
        >
          <Zap className={cn('text-sky-400', compact ? 'h-3.5 w-3.5' : 'h-4 w-4')} />
          <span>{xp} XP</span>
        </div>
      </Tooltip>
    </div>
  );
};
