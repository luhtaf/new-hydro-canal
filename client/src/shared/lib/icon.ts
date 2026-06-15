/**
 * icon — barrel terbatas lucide-react.
 *
 * Demo pakai nama kebab-case (`data-lucide="layout-dashboard"`). lucide-react
 * mengekspor komponen PascalCase. Kita pilih hanya icon yang dipakai shell supaya
 * tree-shaking efektif (jangan import * dari lucide-react). Tambah icon di sini
 * saat fitur butuh, jangan import langsung dari paket di luar barrel ini.
 */
import {
  LayoutDashboard, CalendarDays, Calendar, Mail, PlusCircle, ClipboardList,
  Bell, FormInput, Ruler, Map, LineChart, GitMerge, MapPinned, Settings,
  CircleHelp, Users, BarChart3, ScrollText, Home, User, Droplets, Search,
  Wifi, WifiOff, Moon, Sun, RefreshCw, Presentation, ChevronsUpDown, ShieldCheck,
  Menu, X, CloudOff, CloudUpload, HardDrive, ArrowRight, Check, AlertTriangle,
  Info, Printer, Zap, SunMoon, Clock, CircleCheckBig, type LucideIcon,
} from 'lucide-react';

/** Registry kebab-case → komponen. */
export const ICONS = {
  'layout-dashboard': LayoutDashboard,
  'calendar-days': CalendarDays,
  calendar: Calendar,
  mail: Mail,
  'plus-circle': PlusCircle,
  'clipboard-list': ClipboardList,
  bell: Bell,
  'form-input': FormInput,
  ruler: Ruler,
  map: Map,
  'line-chart': LineChart,
  'git-merge': GitMerge,
  'map-pinned': MapPinned,
  settings: Settings,
  'circle-help': CircleHelp,
  users: Users,
  'bar-chart-3': BarChart3,
  'scroll-text': ScrollText,
  home: Home,
  user: User,
  droplets: Droplets,
  search: Search,
  wifi: Wifi,
  'wifi-off': WifiOff,
  moon: Moon,
  sun: Sun,
  'refresh-cw': RefreshCw,
  presentation: Presentation,
  'chevrons-up-down': ChevronsUpDown,
  'shield-check': ShieldCheck,
  menu: Menu,
  x: X,
  'cloud-off': CloudOff,
  'cloud-upload': CloudUpload,
  'hard-drive': HardDrive,
  'arrow-right': ArrowRight,
  check: Check,
  'alert-triangle': AlertTriangle,
  info: Info,
  printer: Printer,
  zap: Zap,
  'sun-moon': SunMoon,
  clock: Clock,
  'cloud-check': CircleCheckBig,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ICONS;

export function getIcon(name: IconName): LucideIcon {
  return ICONS[name];
}
