import { useState } from 'react';
import Input from '../ui/Input.jsx';
import Select from '../ui/Select.jsx';
import Button from '../ui/Button.jsx';

const WEBSITE_STATUSES = [
  { value: '', label: 'All Statuses' },
  { value: 'NO_WEBSITE',  label: 'No Website'  },
  { value: 'SOCIAL_ONLY', label: 'Social Only'  },
  { value: 'HAS_WEBSITE', label: 'Has Website'  },
  { value: 'BROKEN',      label: 'Broken'       },
];

const SCORE_LABELS = [
  { value: '', label: 'All Scores' },
  { value: 'HOT',  label: '🔥 Hot'  },
  { value: 'WARM', label: '🌡 Warm' },
  { value: 'COLD', label: '❄️ Cold' },
];

const PIPELINE = [
  { value: '', label: 'All Stages' },
  ...['NEW','CONTACTED','REPLIED','MEETING','WON','LOST'].map(v => ({ value: v, label: v })),
];

export default function LeadFilters({ onFilter }) {
  const [f, setF] = useState({
    search: '', category: '', websiteStatus: '', scoreLabel: '', pipelineStatus: '', minRating: '',
  });

  const set = k => e => setF(prev => ({ ...prev, [k]: e.target.value }));

  function apply() { onFilter(Object.fromEntries(Object.entries(f).filter(([, v]) => v !== ''))); }
  function reset()  { const blank = { search:'', category:'', websiteStatus:'', scoreLabel:'', pipelineStatus:'', minRating:'' }; setF(blank); onFilter({}); }

  return (
    <div className="card-aesthetic rounded-2xl p-5 border border-white/[0.08]">
      <div className="flex items-center justify-between mb-3.5">
        <span className="text-xs font-semibold text-slate-300 tracking-wide flex items-center gap-1.5">
          <span>⚡</span> Filter & Narrow Leads
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Input placeholder="Search name…" value={f.search} onChange={set('search')} />
        <Input placeholder="Category…"    value={f.category} onChange={set('category')} />
        <Select options={WEBSITE_STATUSES} value={f.websiteStatus} onChange={set('websiteStatus')} />
        <Select options={SCORE_LABELS}     value={f.scoreLabel}    onChange={set('scoreLabel')}    />
        <Select options={PIPELINE}         value={f.pipelineStatus} onChange={set('pipelineStatus')} />
        <Input  placeholder="Min rating (e.g. 4)"  value={f.minRating} onChange={set('minRating')} type="number" min="1" max="5" step="0.1" />
      </div>
      <div className="flex gap-2.5 mt-3.5 pt-3 border-t border-white/[0.05]">
        <Button size="sm" onClick={apply}>Apply Filters</Button>
        <Button size="sm" variant="ghost" onClick={reset}>Reset All</Button>
      </div>
    </div>
  );
}
