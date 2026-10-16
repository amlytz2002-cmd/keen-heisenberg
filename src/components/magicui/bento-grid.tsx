import * as React from 'react';
import { ArrowRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';

export function BentoGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'grid w-full auto-rows-[22rem] grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5',
        className
      )}
    >
      {children}
    </div>
  );
}

export interface BentoCardProps {
  name: string;
  className?: string;
  background?: React.ReactNode;
  Icon?: React.ElementType;
  description: string;
  href?: string;
  cta?: string;
  badge?: string;
}

export function BentoCard({
  name,
  className,
  background,
  Icon,
  description,
  href,
  cta = 'Keşfet',
  badge,
}: BentoCardProps) {
  return (
    <div
      className={cn(
        'group relative col-span-1 flex flex-col justify-between overflow-hidden rounded-2xl',
        'bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md',
        'hover:border-slate-700 transition-all duration-300 hover:shadow-2xl hover:shadow-sky-500/10',
        className
      )}
    >
      <div className="absolute inset-0 z-0">{background}</div>

      {badge && (
        <div className="absolute top-4 right-4 z-10">
          <span className="rounded-full bg-sky-500/15 border border-sky-500/30 px-2.5 py-0.5 text-xs font-semibold text-sky-300">
            {badge}
          </span>
        </div>
      )}

      <div className="pointer-events-none z-10 flex transform-gpu flex-col gap-1 p-6 transition-all duration-300 group-hover:-translate-y-1">
        {Icon && (
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800/80 border border-slate-700/60 text-sky-400">
            <Icon className="h-6 w-6" />
          </div>
        )}
        <h3 className="text-xl font-bold text-white tracking-tight">{name}</h3>
        <p className="max-w-lg text-sm text-slate-400 leading-relaxed">{description}</p>
      </div>

      <div className="pointer-events-auto z-10 p-6 pt-0">
        {href ? (
          <a href={href} className="inline-flex">
            <Button
              variant="secondary"
              size="sm"
              className="group/btn gap-2 text-xs border border-slate-700 hover:border-sky-500/50 hover:text-sky-300"
            >
              {cta}
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-1" />
            </Button>
          </a>
        ) : null}
      </div>

      <div className="pointer-events-none absolute inset-0 transform-gpu transition-all duration-300 group-hover:bg-sky-500/[0.03]" />
    </div>
  );
}
