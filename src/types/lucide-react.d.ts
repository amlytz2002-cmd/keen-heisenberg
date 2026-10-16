import type { FC, SVGProps } from 'react';

declare module 'lucide-react' {
  export interface LucideProps extends SVGProps<SVGSVGElement> {
    size?: string | number;
    color?: string;
    strokeWidth?: string | number;
    absoluteStrokeWidth?: boolean;
    className?: string;
  }
  export type LucideIcon = FC<LucideProps>;

  export const Activity: LucideIcon;
  export const AlertCircle: LucideIcon;
  export const ArrowRight: LucideIcon;
  export const Atom: LucideIcon;
  export const BarChart3: LucideIcon;
  export const BookOpen: LucideIcon;
  export const Brain: LucideIcon;
  export const Calendar: LucideIcon;
  export const CheckCircle2: LucideIcon;
  export const ChevronDown: LucideIcon;
  export const ChevronUp: LucideIcon;
  export const Clock: LucideIcon;
  export const Database: LucideIcon;
  export const FileText: LucideIcon;
  export const Flame: LucideIcon;
  export const FlaskConical: LucideIcon;
  export const FolderOpen: LucideIcon;
  export const GraduationCap: LucideIcon;
  export const Heart: LucideIcon;
  export const HeartPulse: LucideIcon;
  export const HelpCircle: LucideIcon;
  export const History: LucideIcon;
  export const Layers: LucideIcon;
  export const Lightbulb: LucideIcon;
  export const Lock: LucideIcon;
  export const LogOut: LucideIcon;
  export const Mail: LucideIcon;
  export const Menu: LucideIcon;
  export const RefreshCw: LucideIcon;
  export const RotateCcw: LucideIcon;
  export const ShieldCheck: LucideIcon;
  export const Sparkles: LucideIcon;
  export const Star: LucideIcon;
  export const TrendingUp: LucideIcon;
  export const User: LucideIcon;
  export const Users: LucideIcon;
  export const X: LucideIcon;
  export const Zap: LucideIcon;

  const icons: Record<string, LucideIcon>;
  export default icons;
}
