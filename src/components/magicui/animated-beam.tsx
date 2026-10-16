import * as React from 'react';
import { cn } from '../../lib/utils';

export interface AnimatedBeamProps {
  className?: string;
  containerRef: React.RefObject<HTMLElement | null>;
  fromRef: React.RefObject<HTMLElement | null>;
  toRef: React.RefObject<HTMLElement | null>;
  curvature?: number;
  reverse?: boolean;
  pathColor?: string;
  pathWidth?: number;
  pathOpacity?: number;
  gradientStartColor?: string;
  gradientStopColor?: string;
  delay?: number;
  duration?: number;
}

export function AnimatedBeam({
  className,
  containerRef,
  fromRef,
  toRef,
  curvature = 0,
  reverse = false,
  duration = Math.random() * 3 + 4,
  delay = 0,
  pathColor = '#334155',
  pathWidth = 2,
  pathOpacity = 0.4,
  gradientStartColor = '#0EA5E9',
  gradientStopColor = '#10B981',
}: AnimatedBeamProps) {
  const id = React.useId();
  const [pathD, setPathD] = React.useState('');
  const [svgDimensions, setSvgDimensions] = React.useState({ width: 0, height: 0 });

  const updatePath = React.useCallback(() => {
    if (!containerRef.current || !fromRef.current || !toRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const rectA = fromRef.current.getBoundingClientRect();
    const rectB = toRef.current.getBoundingClientRect();

    const svgWidth = containerRect.width;
    const svgHeight = containerRect.height;
    setSvgDimensions({ width: svgWidth, height: svgHeight });

    const startX = rectA.left - containerRect.left + rectA.width / 2;
    const startY = rectA.top - containerRect.top + rectA.height / 2;
    const endX = rectB.left - containerRect.left + rectB.width / 2;
    const endY = rectB.top - containerRect.top + rectB.height / 2;

    const controlY = startY - curvature;
    const d = `M ${startX},${startY} Q ${(startX + endX) / 2},${controlY} ${endX},${endY}`;
    setPathD(d);
  }, [containerRef, fromRef, toRef, curvature]);

  React.useEffect(() => {
    updatePath();
    window.addEventListener('resize', updatePath);
    return () => window.removeEventListener('resize', updatePath);
  }, [updatePath]);

  return (
    <svg
      fill="none"
      width={svgDimensions.width}
      height={svgDimensions.height}
      xmlns="http://www.w3.org/2000/svg"
      className={cn(
        'pointer-events-none absolute left-0 top-0 transform-gpu stroke-2',
        className
      )}
      viewBox={`0 0 ${svgDimensions.width} ${svgDimensions.height}`}
    >
      <path
        d={pathD}
        stroke={pathColor}
        strokeWidth={pathWidth}
        strokeOpacity={pathOpacity}
        strokeLinecap="round"
      />
      <path
        d={pathD}
        stroke={`url(#${id})`}
        strokeWidth={pathWidth}
        strokeLinecap="round"
      />
      <defs>
        <linearGradient
          id={id}
          gradientUnits="userSpaceOnUse"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="0%"
        >
          <stop stopColor={gradientStartColor} stopOpacity="0" />
          <stop stopColor={gradientStartColor} />
          <stop offset="32.5%" stopColor={gradientStopColor} />
          <stop offset="100%" stopColor={gradientStopColor} stopOpacity="0" />
          <animate
            attributeName={reverse ? 'x2' : 'x1'}
            from={reverse ? '100%' : '-100%'}
            to={reverse ? '0%' : '100%'}
            dur={`${duration}s`}
            begin={`${delay}s`}
            repeatCount="indefinite"
          />
          <animate
            attributeName={reverse ? 'x1' : 'x2'}
            from={reverse ? '200%' : '0%'}
            to={reverse ? '100%' : '200%'}
            dur={`${duration}s`}
            begin={`${delay}s`}
            repeatCount="indefinite"
          />
        </linearGradient>
      </defs>
    </svg>
  );
}
