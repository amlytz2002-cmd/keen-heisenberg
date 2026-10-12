import React from 'react';
import { Tooltip } from 'antd';
import { FireFilled, ThunderboltFilled } from '@ant-design/icons';

interface StreakBadgeProps {
  streak?: number;
  xp?: number;
  compact?: boolean;
}

export const StreakBadge: React.FC<StreakBadgeProps> = ({
  streak = 1,
  xp = 120,
  compact = false,
}) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: compact ? 6 : 10 }}>
      {/* Streak Badge */}
      <Tooltip title={`Günlük Çalışma Serisi: ${streak} Gün! Her gün en az 1 mikro-ders tamamlayarak serinizi koruyun.`}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: compact ? '2px 8px' : '4px 10px',
            borderRadius: 20,
            background: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)',
            border: '1px solid #FDBA74',
            color: '#C2410C',
            fontWeight: 700,
            fontSize: compact ? 12 : 13,
            cursor: 'default',
            userSelect: 'none',
            boxShadow: '0 1px 2px rgba(234, 88, 12, 0.08)',
          }}
        >
          <FireFilled style={{ color: '#EA580C', fontSize: compact ? 13 : 15 }} />
          <span>{streak}</span>
        </div>
      </Tooltip>

      {/* XP Badge */}
      <Tooltip title={`Kazanılan Toplam Deneyim Puanı: ${xp} XP`}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: compact ? '2px 8px' : '4px 10px',
            borderRadius: 20,
            background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)',
            border: '1px solid #C7D2FE',
            color: '#4338CA',
            fontWeight: 700,
            fontSize: compact ? 12 : 13,
            cursor: 'default',
            userSelect: 'none',
            boxShadow: '0 1px 2px rgba(79, 70, 229, 0.08)',
          }}
        >
          <ThunderboltFilled style={{ color: '#6366F1', fontSize: compact ? 13 : 15 }} />
          <span>{xp} XP</span>
        </div>
      </Tooltip>
    </div>
  );
};
