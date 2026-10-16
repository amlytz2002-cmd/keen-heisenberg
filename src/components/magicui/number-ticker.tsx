import * as React from 'react';
import { useInView, useMotionValue, useSpring } from 'framer-motion';
import { cn } from '../../lib/utils';

export function NumberTicker({
  value,
  direction = 'up',
  delay = 0,
  className,
}: {
  value: number;
  direction?: 'up' | 'down';
  className?: string;
  delay?: number;
}) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(direction === 'down' ? value : 0);
  const springValue = useSpring(motionValue, {
    damping: 30,
    stiffness: 100,
  });
  const isInView = useInView(ref, { once: true, margin: '0px' });

  React.useEffect(() => {
    if (isInView) {
      setTimeout(() => {
        motionValue.set(direction === 'down' ? 0 : value);
      }, delay * 1000);
    }
  }, [motionValue, isInView, delay, value, direction]);

  React.useEffect(() => {
    return springValue.on('change', (latest) => {
      if (ref.current) {
        ref.current.textContent = Intl.NumberFormat('tr-TR').format(
          Math.floor(latest)
        );
      }
    });
  }, [springValue]);

  return (
    <span
      className={cn(
        'inline-block tabular-nums font-mono font-bold tracking-tight',
        className
      )}
      ref={ref}
    >
      0
    </span>
  );
}
