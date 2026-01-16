/**
 * Icon Resolver - Resolves icon names to React components
 * This avoids storing React components in Redux state (which can't be serialized)
 */
import { Circle } from 'lucide-react'
import { iconMap as centralizedIconMap } from '@/lib/icon-map'

const iconMap: Record<string, any> = {
  ...centralizedIconMap
}

/**
 * Resolve icon name to React component
 * @param iconName - Icon component name (e.g. "FiZap", "SiWhatsapp")
 * @returns React icon component or fallback
 */
export function resolveIcon(iconName: string | undefined): any {
  if (!iconName) return Circle

  // Try to find Lucide equivalent for legacy React Icons (e.g. FiZap -> Zap)
  const legacyName = iconName.replace(/^(Fi|Si|Md|Fa|Ai|Bi|Bs|Cg|Di|Gi|Go|Gr|Hi|Im|Io|Ri|Ti|Vsc|Wi)/, '');
  if (iconMap[legacyName]) return iconMap[legacyName];

  const Icon = iconMap[iconName];
  if (Icon) return Icon

  return Circle
}

/**
 * Get icon component from node type
 * Handles both icon component (legacy) and icon name (new)
 */
export function getNodeIcon(nodeType: any): any {
  if (nodeType?.icon && typeof nodeType.icon === 'function') {
    return nodeType.icon
  }

  if (nodeType?.icon && typeof nodeType.icon === 'string') {
    return resolveIcon(nodeType.icon)
  }

  if (nodeType?.iconName) {
    return resolveIcon(nodeType.iconName)
  }

  return Circle
}

