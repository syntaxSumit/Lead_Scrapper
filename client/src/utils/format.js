export function fmt(n, fallback = '—') {
  return n != null ? n : fallback;
}

export function scoreColor(label) {
  return label === 'HOT' ? 'text-emerald-400'
       : label === 'WARM' ? 'text-amber-400'
       : 'text-slate-400';
}

export function scoreBg(label) {
  return label === 'HOT' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 shadow-sm shadow-emerald-950/20'
       : label === 'WARM' ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 shadow-sm shadow-amber-950/20'
       : 'bg-white/[0.04] text-slate-400 border-white/[0.08]';
}

export function statusBg(status) {
  const map = {
    NO_WEBSITE:  'bg-rose-500/10 text-rose-300 border-rose-500/30 shadow-sm shadow-rose-950/20',
    SOCIAL_ONLY: 'bg-purple-500/10 text-purple-300 border-purple-500/30 shadow-sm shadow-purple-950/20',
    HAS_WEBSITE: 'bg-sky-500/10 text-sky-300 border-sky-500/30 shadow-sm shadow-sky-950/20',
    BROKEN:      'bg-amber-500/10 text-amber-300 border-amber-500/30 shadow-sm shadow-amber-950/20',
    UNCHECKED:   'bg-white/[0.04] text-slate-400 border-white/[0.08]',
  };
  return map[status] || map.UNCHECKED;
}

export function pipelineBg(status) {
  const map = {
    NEW:       'bg-white/[0.05] text-slate-300 border-white/[0.08]',
    CONTACTED: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
    REPLIED:   'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    MEETING:   'bg-amber-500/15 text-amber-300 border-amber-500/30',
    WON:       'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    LOST:      'bg-rose-500/15 text-rose-300 border-rose-500/30',
  };
  return map[status] || map.NEW;
}

export function waLink(phone, message) {
  const num = (phone || '').replace(/\D/g, '');
  return `https://wa.me/${num}?text=${encodeURIComponent(message || '')}`;
}
