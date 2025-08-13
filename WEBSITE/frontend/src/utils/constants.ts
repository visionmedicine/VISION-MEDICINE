import {
  Home,
  Mic,
  MapPin, 
  Pill,
  History,
  Clock,
  Settings,
} from "lucide-react";

export const MENU_ITEMS = [
  { label: "Home", path: "/", icon: Home },
  { label: "VISMED Talks", path: "/vismed-talks", icon: Mic },
  { label: "Find Your VISMED", path: "/find-your-vismed", icon: MapPin }, 
  { label: "Medicine Information", path: "/medicine-information", icon: Pill },
  { label: "Drug History", path: "/drug-history", icon: History },
  { label: "Reminder", path: "/reminder", icon: Clock },
  { label: "Setting", path: "/setting", icon: Settings },
];
