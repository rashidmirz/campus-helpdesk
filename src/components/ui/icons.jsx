import { Wifi, BedDouble, GraduationCap, Wallet, ClipboardCheck, Library, Bus, Wrench, FileBadge, ShieldAlert, BadgeCheck, ScrollText, Briefcase, IdCard, ReceiptText, KeyRound, CircleHelp } from 'lucide-react';
const map = { Wifi, BedDouble, GraduationCap, Wallet, ClipboardCheck, Library, Bus, Wrench, FileBadge, ShieldAlert, BadgeCheck, ScrollText, Briefcase, IdCard, ReceiptText, KeyRound };
export const NamedIcon = ({ name, ...p }) => { const C = map[name] || CircleHelp; return <C {...p} />; };
