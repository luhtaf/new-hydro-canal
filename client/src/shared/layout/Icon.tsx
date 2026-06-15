/**
 * Icon — render lucide icon by kebab-name (jembatan dari nav-config / demo naming).
 */
import type { LucideProps } from 'lucide-react';
import { getIcon, type IconName } from '../lib/icon.js';

interface Props extends LucideProps {
  name: IconName;
}

export function Icon({ name, ...rest }: Props) {
  const Cmp = getIcon(name);
  return <Cmp {...rest} />;
}
