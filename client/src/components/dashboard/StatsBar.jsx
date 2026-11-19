import Card from '../ui/Card.jsx';
import {
  IconBuilding,
  IconBan,
  IconFlame,
  IconSend,
  IconMessageSquare,
  IconTrophy,
} from '../ui/Icons.jsx';

const statDefs = [
  { key: 'total',     label: 'Total Leads',    Icon: IconBuilding, color: 'text-slate-100',   bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' },
  { key: 'noWebsite', label: 'No Website',     Icon: IconBan,      color: 'text-rose-400',    bg: 'bg-rose-500/10 border-rose-500/20 text-rose-400' },
  { key: 'hot',       label: 'Hot Leads',      Icon: IconFlame,    color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' },
  { key: 'contacted', label: 'Contacted',      Icon: IconSend,     color: 'text-teal-400',    bg: 'bg-teal-500/10 border-teal-500/20 text-teal-400' },
  { key: 'replied',   label: 'Replied',        Icon: IconMessageSquare, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' },
  { key: 'won',       label: 'Won Deals',      Icon: IconTrophy,   color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20 text-amber-400' },
];

export default function StatsBar({ stats }) {
  if (!stats) return null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
      {statDefs.map(({ key, label, Icon, color, bg }) => (
        <Card key={key} hover className="p-4 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">{label}</span>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center border ${bg}`}>
              <Icon className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className={`text-2xl font-bold font-mono tracking-tight ${color}`}>
            {stats[key] ?? 0}
          </div>
        </Card>
      ))}
    </div>
  );
}
