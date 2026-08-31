import type { LucideProps } from "lucide-react-native";
import {
  BookOpen,
  ChartNoAxesCombined,
  ChevronRight,
  CircleUserRound,
  Cloud,
  CloudOff,
  Download,
  Droplets,
  Leaf,
  LogOut,
  Plus,
  RefreshCw,
  Scale,
  Search,
  Settings,
  Trash2,
  Utensils,
  WifiOff,
  X,
} from "lucide-react-native";

export const icons = {
  diary: BookOpen,
  trends: ChartNoAxesCombined,
  food: Search,
  search: Search,
  settings: Settings,
  add: Plus,
  cloud: Cloud,
  cloudOff: CloudOff,
  offline: WifiOff,
  refresh: RefreshCw,
  meal: Utensils,
  water: Droplets,
  weight: Scale,
  user: CircleUserRound,
  logout: LogOut,
  next: ChevronRight,
  leaf: Leaf,
  close: X,
  download: Download,
  trash: Trash2,
} as const;

export type IconName = keyof typeof icons;

export function Icon({
  name,
  ...props
}: { name: IconName } & Omit<LucideProps, "ref">) {
  const Component = icons[name];
  return <Component {...props} />;
}
