/**
 * PIR8 Custom Icon Set
 * 
 * Replaces emojis with professional SVG icons for a polished, cartoon-stylized look.
 * Uses lucide-react as base with custom pirate-themed modifications.
 */

'use client';

import { 
  Ship, 
  Anchor, 
  Skull, 
  Coins, 
  Users, 
  Package, 
  MapPin,
  Sword,
  Shield,
  Flag,
  Trophy,
  Crown,
  Gem,
  Zap,
  Target,
  Compass,
  Waves,
  Wind
} from 'lucide-react';

interface IconProps {
  className?: string;
  size?: number | string;
  color?: string;
}

// =============================================================================
// SHIP ICONS (Replace 🚢 ⛵ 🛶 🚤)
// =============================================================================

export function PirateShipIcon({ className = '', size = 24, color }: IconProps) {
  return (
    <Ship 
      className={className} 
      size={typeof size === 'string' ? parseInt(size) : size}
      color={color}
      strokeWidth={1.5}
    />
  );
}

export function WarshipIcon({ className = '', size = 28, color }: IconProps) {
  const numericSize = typeof size === 'string' ? parseInt(size) : size;
  return (
    <div className={`relative ${className}`} style={{ width: numericSize, height: numericSize }}>
      <Ship size={numericSize} color={color} strokeWidth={2} />
      <Sword 
        size={Math.floor(numericSize * 0.6)} 
        className="absolute -top-1 -right-1 text-red-500"
        strokeWidth={2.5}
      />
    </div>
  );
}

export function ScoutShipIcon({ className = '', size = 20, color }: IconProps) {
  const numericSize = typeof size === 'string' ? parseInt(size) : size;
  return (
    <div className={`relative ${className}`} style={{ width: numericSize, height: numericSize }}>
      <Waves size={Math.floor(numericSize * 0.7)} className="absolute bottom-0 opacity-50" />
      <Ship size={numericSize} color={color} strokeWidth={1.5} />
    </div>
  );
}

// =============================================================================
// RESOURCE ICONS (Replace 💰 👥 📦)
// =============================================================================

export function GoldIcon({ className = '', size = 20, color = '#ffd700' }: IconProps) {
  return (
    <Coins 
      className={className}
      size={typeof size === 'string' ? parseInt(size) : size}
      color={color}
      strokeWidth={2}
    />
  );
}

export function CrewIcon({ className = '', size = 20, color = '#00ffff' }: IconProps) {
  return (
    <Users 
      className={className}
      size={typeof size === 'string' ? parseInt(size) : size}
      color={color}
      strokeWidth={2}
    />
  );
}

export function SuppliesIcon({ className = '', size = 20, color = '#ff6b00' }: IconProps) {
  return (
    <Package 
      className={className}
      size={typeof size === 'string' ? parseInt(size) : size}
      color={color}
      strokeWidth={2}
    />
  );
}

// =============================================================================
// TERRITORY ICONS (Replace 🏴‍☠️ ⚓ 🏰 🗺️)
// =============================================================================

export function TerritoryIcon({ className = '', size = 24, color }: IconProps) {
  return (
    <MapPin 
      className={className}
      size={typeof size === 'string' ? parseInt(size) : size}
      color={color}
      strokeWidth={2}
    />
  );
}

export function PortIcon({ className = '', size = 28, color }: IconProps) {
  const numericSize = typeof size === 'string' ? parseInt(size) : size;
  return (
    <div className={`relative ${className}`} style={{ width: numericSize, height: numericSize }}>
      <Anchor size={numericSize} color={color} strokeWidth={2} />
      <Package size={Math.floor(numericSize * 0.5)} className="absolute -bottom-1 -right-1" color="#ffd700" />
    </div>
  );
}

export function FortressIcon({ className = '', size = 28, color }: IconProps) {
  return (
    <Shield 
      className={className}
      size={typeof size === 'string' ? parseInt(size) : size}
      color={color}
      strokeWidth={2.5}
    />
  );
}

export function TreasureIcon({ className = '', size = 24, color = '#ffd700' }: IconProps) {
  return (
    <Gem 
      className={className}
      size={typeof size === 'string' ? parseInt(size) : size}
      color={color}
      strokeWidth={2}
    />
  );
}

// =============================================================================
// ACTION ICONS (Replace ⚔️ 🔨 🔍 🎯)
// =============================================================================

export function AttackIcon({ className = '', size = 24, color = '#ff0000' }: IconProps) {
  return (
    <Sword 
      className={className}
      size={typeof size === 'string' ? parseInt(size) : size}
      color={color}
      strokeWidth={2.5}
    />
  );
}

export function BuildIcon({ className = '', size = 24, color = '#0080ff' }: IconProps) {
  return (
    <HammerIcon className={className} size={size} color={color} />
  );
}

function HammerIcon({ className = '', size = 24, color }: IconProps) {
  // Simple hammer using Shield + rotation
  return (
    <Shield 
      className={className}
      size={typeof size === 'string' ? parseInt(size) : size}
      color={color}
      strokeWidth={2}
      style={{ transform: 'rotate(45deg)' }}
    />
  );
}

export function ScanIcon({ className = '', size = 24, color = '#ff00ff' }: IconProps) {
  return (
    <Target 
      className={className}
      size={typeof size === 'string' ? parseInt(size) : size}
      color={color}
      strokeWidth={2}
    />
  );
}

export function ClaimIcon({ className = '', size = 24, color = '#00ff00' }: IconProps) {
  return (
    <Flag 
      className={className}
      size={typeof size === 'string' ? parseInt(size) : size}
      color={color}
      strokeWidth={2}
    />
  );
}

// =============================================================================
// STATUS ICONS (Replace ⏳ ✅ ❌ ⚡)
// =============================================================================

export function TurnIcon({ className = '', size = 24, color = '#00ffff' }: IconProps) {
  return (
    <Compass 
      className={className}
      size={typeof size === 'string' ? parseInt(size) : size}
      color={color}
      strokeWidth={2}
    />
  );
}

export function VictoryIcon({ className = '', size = 48, color = '#ffd700' }: IconProps) {
  return (
    <Trophy 
      className={className}
      size={typeof size === 'string' ? parseInt(size) : size}
      color={color}
      strokeWidth={2}
    />
  );
}

export function SpeedBonusIcon({ className = '', size = 20, color = '#00ff00' }: IconProps) {
  return (
    <Zap 
      className={className}
      size={typeof size === 'string' ? parseInt(size) : size}
      color={color}
      strokeWidth={2.5}
      fill={color}
      fillOpacity={0.2}
    />
  );
}

export function HealthIcon({ className = '', size = 16, color = '#00ff00' }: IconProps) {
  return (
    <Shield 
      className={className}
      size={typeof size === 'string' ? parseInt(size) : size}
      color={color}
      strokeWidth={2}
    />
  );
}

// =============================================================================
// ENEMY ICONS (Replace 💀 ☠️)
// =============================================================================

export function EnemyIcon({ className = '', size = 24, color = '#ff0000' }: IconProps) {
  return (
    <Skull 
      className={className}
      size={typeof size === 'string' ? parseInt(size) : size}
      color={color}
      strokeWidth={2}
    />
  );
}

export function BossIcon({ className = '', size = 32, color = '#ff0000' }: IconProps) {
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <Skull size={size} color={color} strokeWidth={2.5} />
      <Crown 
        size={typeof size === 'string' ? Math.floor(parseInt(size) * 0.5) : Math.floor(size * 0.5)} 
        className="absolute -top-2 left-1/2 transform -translate-x-1/2"
        color="#ffd700"
        strokeWidth={2}
      />
    </div>
  );
}

// =============================================================================
// ENVIRONMENT ICONS
// =============================================================================

export function StormIcon({ className = '', size = 24, color = '#666' }: IconProps) {
  return (
    <Wind 
      className={className}
      size={typeof size === 'string' ? parseInt(size) : size}
      color={color}
      strokeWidth={2}
    />
  );
}

export function FogIcon({ className = '', size = 24, color = '#999' }: IconProps) {
  return (
    <Waves 
      className={className}
      size={typeof size === 'string' ? parseInt(size) : size}
      color={color}
      strokeWidth={1.5}
    />
  );
}

// =============================================================================
// ICON MAPPER (For easy replacement of emojis)
// =============================================================================

export const ICON_MAP: Record<string, React.FC<IconProps>> = {
  '🚢': PirateShipIcon,
  '⛵': ScoutShipIcon,
  '⚓': Anchor,
  '💀': EnemyIcon,
  '☠️': BossIcon,
  '💰': GoldIcon,
  '👥': CrewIcon,
  '📦': SuppliesIcon,
  '🏴‍☠️': TerritoryIcon,
  '🏰': FortressIcon,
  '⚔️': AttackIcon,
  '🔨': BuildIcon,
  '🔍': ScanIcon,
  '🎯': ClaimIcon,
  '⏳': TurnIcon,
  '✅': VictoryIcon,
  '⚡': SpeedBonusIcon,
  '❤️': HealthIcon,
};

// Helper to render icon by emoji/string
export function getIcon(emojiOrName: string, props: IconProps = {}) {
  const IconComponent = ICON_MAP[emojiOrName] || PirateShipIcon;
  return <IconComponent {...props} />;
}
