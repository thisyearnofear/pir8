'use client';

/**
 * The single icon entry point for PIR8. See DESIGN.md §5.
 *
 * Rules:
 *  - Lucide only. No emoji as iconography, ever.
 *  - Semantic names, never glyphs: <Icon name="ship" /> not <Icon name="🚢" />.
 *  - strokeWidth 1.5 at interface scale, 2 at instrument scale.
 *
 * Adding an icon: add the Lucide import, add one registry entry. Do not add a
 * second icon set, and do not add a component-per-icon.
 */

import type { LucideIcon } from 'lucide-react';
import {
  Anchor,
  Anchor as AnchorSolid,
  ArrowRightLeft,
  BarChart3,
  Boxes,
  Brain,
  Check,
  ChevronDown,
  ChevronRight,
  CircleDot,
  Clock,
  CloudFog,
  CloudLightning,
  Coins,
  Compass,
  Crown,
  Eye,
  EyeOff,
  FileText,
  Flag,
  Flame,
  Gauge,
  Gem,
  Hammer,
  Heart,
  Hourglass,
  Landmark,
  Link2,
  Lock,
  Map as MapIcon,
  Menu,
  MessageSquare,
  Moon,
  Navigation,
  Package,
  Palette,
  Radar,
  RotateCcw,
  Sailboat,
  ScanLine,
  ScrollText,
  Settings,
  Shield,
  Ship,
  Skull,
  Sparkles,
  Sun,
  Swords,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
  Users,
  Waves,
  Wind,
  X,
  Zap,
} from 'lucide-react';

export type IconName =
  // fleet
  | 'ship'
  | 'ship-heavy'
  | 'ship-scout'
  | 'fleet'
  | 'anchor'
  | 'compass'
  | 'navigation'
  | 'skull'
  // resources
  | 'gold'
  | 'crew'
  | 'supplies'
  | 'cannons'
  | 'wood'
  | 'rum'
  | 'health'
  | 'treasure'
  | 'crown'
  // terrain
  | 'water'
  | 'island'
  | 'port'
  | 'storm'
  | 'reef'
  | 'whirlpool'
  | 'fortress'
  | 'landmark'
  | 'fog'
  | 'calm'
  | 'trade-winds'
  // intel & privacy
  | 'scan'
  | 'radar'
  | 'eye'
  | 'eye-off'
  | 'lock'
  | 'shield'
  | 'moon'
  | 'gauge'
  | 'leak'
  // actions
  | 'attack'
  | 'build'
  | 'claim'
  | 'collect'
  | 'move'
  | 'undo'
  | 'target'
  // status & ui
  | 'check'
  | 'close'
  | 'menu'
  | 'chevron-down'
  | 'chevron-right'
  | 'clock'
  | 'hourglass'
  | 'flame'
  | 'zap'
  | 'sparkles'
  | 'trophy'
  | 'stats'
  | 'log'
  | 'brain'
  | 'link'
  | 'message'
  | 'settings'
  | 'palette'
  | 'trend-up'
  | 'trend-down'
  | 'circle-dot'
  | 'box';

const registry: Record<IconName, LucideIcon> = {
  ship: Ship,
  'ship-heavy': AnchorSolid,
  'ship-scout': Sailboat,
  fleet: Boxes,
  anchor: Anchor,
  compass: Compass,
  navigation: Navigation,
  skull: Skull,

  gold: Coins,
  crew: Users,
  supplies: Package,
  cannons: Target,
  wood: Boxes,
  rum: Gem,
  health: Heart,
  treasure: Gem,
  crown: Crown,

  water: Waves,
  island: MapIcon,
  port: Anchor,
  storm: CloudLightning,
  fog: CloudFog,
  calm: Sun,
  'trade-winds': Wind,
  reef: Boxes,
  whirlpool: RotateCcw,
  fortress: Shield,
  landmark: Landmark,

  scan: ScanLine,
  radar: Radar,
  eye: Eye,
  'eye-off': EyeOff,
  lock: Lock,
  shield: Shield,
  moon: Moon,
  gauge: Gauge,
  leak: TrendingUp,

  attack: Swords,
  build: Hammer,
  claim: Flag,
  collect: Coins,
  move: ArrowRightLeft,
  undo: RotateCcw,
  target: Target,

  check: Check,
  close: X,
  menu: Menu,
  'chevron-down': ChevronDown,
  'chevron-right': ChevronRight,
  clock: Clock,
  hourglass: Hourglass,
  flame: Flame,
  zap: Zap,
  sparkles: Sparkles,
  trophy: Trophy,
  stats: BarChart3,
  log: ScrollText,
  brain: Brain,
  link: Link2,
  message: MessageSquare,
  settings: Settings,
  palette: Palette,
  'trend-up': TrendingUp,
  'trend-down': TrendingDown,
  'circle-dot': CircleDot,
  box: FileText,
};

export interface IconProps {
  name: IconName;
  /** Pixel size at 1x. Prefer the CSS scale tokens over raw numbers where possible. */
  size?: number | string;
  className?: string;
  color?: string;
  strokeWidth?: number;
  /** Provide when the icon is the only content of a control. */
  label?: string;
  /** Decorative icons are hidden from assistive tech. Defaults to true when no label. */
  decorative?: boolean;
}

export function Icon({
  name,
  size = 16,
  className,
  color,
  strokeWidth = 1.5,
  label,
  decorative,
}: IconProps) {
  const Component = registry[name];
  const isDecorative = decorative ?? !label;

  if (!Component) {
    if (process.env.NODE_ENV !== 'production') {
      // Fail loudly in dev rather than silently rendering nothing.
      console.error(`[Icon] Unknown icon name: "${name}"`);
    }
    return null;
  }

  return (
    <Component
      className={className}
      size={typeof size === 'string' ? Number.parseInt(size, 10) : size}
      color={color}
      strokeWidth={strokeWidth}
      aria-hidden={isDecorative || undefined}
      aria-label={label}
      role={label ? 'img' : undefined}
      focusable={false}
    />
  );
}

export default Icon;
