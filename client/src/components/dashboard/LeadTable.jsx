import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Badge from '../ui/Badge.jsx';
import Button from '../ui/Button.jsx';
import Spinner from '../ui/Spinner.jsx';
import {
  IconMapPin,
  IconSparkles,
  IconWhatsApp,
  IconSend,
  IconTrash,
  IconDownload,
  IconTarget,
} from '../ui/Icons.jsx';
import { scoreBg, statusBg, pipelineBg, waLink } from '../../utils/format.js';
import { exportCSV } from '../../utils/csv.js';
import { analyzeLead } from '../../api/analyze.js';
import toast from 'react-hot-toast';

const PIPELINE_OPTIONS = ['NEW','CONTACTED','REPLIED','MEETING','WON','LOST'];

export default function LeadTable({
  leads,
  loading,
  onLeadUpdate,
  onOpenOutreach,
  onDeleteAll,
  onDeleteSelected,
}) {
  const navigate = useNavigate();
  const [selected, setSelected]       = useState(new Set());
  const [analyzing, setAnalyzing]     = useState(null);
  const [isDeleting, setIsDeleting]   = useState(false);
  const [sortKey, setSortKey]         = useState('leadScore');
  const [sortDir, setSortDir]         = useState('desc');

  const toggle = id => setSelected(s => {
    const n = new Set(s);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  const toggleAll = () =>
    setSelected(selected.size === leads.length ? new Set() : new Set(leads.map(l => l._id)));

  const sort = key => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const sorted = [...leads].sort((a, b) => {
    const av = a[sortKey] ?? 0, bv = b[sortKey] ?? 0;
    return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
  });

  async function handleDeleteAll() {
    if (!onDeleteAll || leads.length === 0) return;
    const confirmed = window.confirm(
      `Are you sure you want to delete ALL ${leads.length} lead${leads.length > 1 ? 's' : ''}? This cannot be undone.`
    );
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await onDeleteAll();
      setSelected(new Set());
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleDeleteSelected() {
    if (!onDeleteSelected || selected.size === 0) return;
    const count = selected.size;
    const confirmed = window.confirm(
      `Are you sure you want to delete ${count} selected lead${count > 1 ? 's' : ''}?`
    );
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await onDeleteSelected(Array.from(selected));
      setSelected(new Set());
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleAnalyze(e, id) {
    e.stopPropagation();
    setAnalyzing(id);
    try {
      const { data } = await analyzeLead(id);
      onLeadUpdate?.(data);
      toast.success('Analysis complete');
    } catch {
      toast.error('Analysis failed');
    } finally {
      setAnalyzing(null);
    }
  }

  const Th = ({ k, children }) => (
    <th
      className="px-3 py-2 text-left text-xs font-medium text-slate-400 cursor-pointer hover:text-slate-200 select-none whitespace-nowrap"
      onClick={() => sort(k)}
    >
      {children} {sortKey === k ? (sortDir === 'asc' ? '↑' : '↓') : ''}
    </th>
  );

  if (loading) return (
    <div className="flex justify-center py-16"><Spinner size={8} /></div>
  );

  return (
    <div>
      {/* Action / Bulk toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 px-1">
        <div className="flex items-center gap-3">
          {selected.size > 0 ? (
            <>
              <span className="text-xs text-slate-300 font-medium px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/[0.08]">{selected.size} selected</span>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => exportCSV(leads.filter(l => selected.has(l._id)))}
                className="gap-1.5"
              >
                <IconDownload className="w-3.5 h-3.5" /> Export CSV
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={handleDeleteSelected}
                disabled={isDeleting}
                className="gap-1.5"
              >
                <IconTrash className="w-3.5 h-3.5" /> Delete Selected ({selected.size})
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelected(new Set())}
              >
                Clear
              </Button>
            </>
          ) : (
            <span className="text-xs text-slate-400 font-mono">
              {leads.length} lead{leads.length !== 1 ? 's' : ''} available
            </span>
          )}
        </div>

        {leads.length > 0 && onDeleteAll && (
          <Button
            size="sm"
            variant="danger"
            onClick={handleDeleteAll}
            disabled={isDeleting}
            title="Delete all leads"
            className="gap-1.5"
          >
            <IconTrash className="w-3.5 h-3.5" /> Delete All Leads
          </Button>
        )}
      </div>

      <div className="overflow-x-auto card-aesthetic rounded-2xl border border-white/[0.08] shadow-xl">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.04] border-b border-white/[0.08] sticky top-0 z-10 backdrop-blur-md">
            <tr>
              <th className="px-3.5 py-3 w-8">
                <input
                  type="checkbox"
                  checked={selected.size === leads.length && leads.length > 0}
                  onChange={toggleAll}
                  className="accent-indigo-500 w-3.5 h-3.5 cursor-pointer rounded"
                  aria-label="Select all"
                />
              </th>
              <Th k="name">Business</Th>
              <Th k="category">Category</Th>
              <Th k="websiteStatus">Website</Th>
              <Th k="leadScore">Score</Th>
              <Th k="rating">Rating</Th>
              <Th k="pipelineStatus">Pipeline</Th>
              <th className="px-3.5 py-3 text-xs font-semibold text-slate-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {sorted.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-20 text-slate-400 text-sm">
                  <div className="flex flex-col items-center justify-center gap-2.5">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                      <IconTarget className="w-6 h-6" />
                    </div>
                    <span className="font-medium text-slate-200">No leads discovered yet</span>
                    <span className="text-xs text-slate-500 max-w-sm">Use the search form above to find high-value local businesses in your target area.</span>
                  </div>
                </td>
              </tr>
            )}
            {sorted.map(lead => (
              <tr
                key={lead._id}
                className="hover:bg-indigo-500/[0.04] cursor-pointer transition-colors group"
                onClick={() => navigate(`/leads/${lead._id}`)}
              >
                <td className="px-3.5 py-3" onClick={e => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selected.has(lead._id)}
                    onChange={() => toggle(lead._id)}
                    className="accent-indigo-500 w-3.5 h-3.5 cursor-pointer rounded"
                    aria-label={`Select ${lead.name}`}
                  />
                </td>
                <td className="px-3.5 py-3">
                  <div className="font-semibold text-slate-100 truncate max-w-[200px] group-hover:text-indigo-300 transition-colors">
                    {lead.name}
                  </div>
                  {lead.phone && (
                    <a
                      href={`tel:${lead.phone}`}
                      className="text-xs text-slate-400 hover:text-indigo-400 transition-colors font-mono"
                      onClick={e => e.stopPropagation()}
                    >
                      {lead.phone}
                    </a>
                  )}
                </td>
                <td className="px-3.5 py-3 text-slate-400 text-xs capitalize">{lead.category || '—'}</td>
                <td className="px-3.5 py-3">
                  <Badge className={statusBg(lead.websiteStatus)}>
                    {lead.websiteStatus?.replace('_', ' ')}
                  </Badge>
                </td>
                <td className="px-3.5 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm tracking-tight">{lead.leadScore}</span>
                    <Badge className={scoreBg(lead.scoreLabel)}>{lead.scoreLabel}</Badge>
                  </div>
                </td>
                <td className="px-3.5 py-3 text-slate-300 text-xs font-medium">
                  {lead.rating ? (
                    <span className="inline-flex items-center gap-1">
                      <span className="text-amber-400">★</span> {lead.rating}
                      <span className="text-slate-500 font-mono">({lead.reviewCount})</span>
                    </span>
                  ) : '—'}
                </td>
                <td className="px-3.5 py-3">
                  <Badge className={pipelineBg(lead.pipelineStatus)}>
                    {lead.pipelineStatus}
                  </Badge>
                </td>
                <td className="px-3.5 py-3" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center gap-1.5">
                    <a
                      href={
                        lead.mapsUrl ||
                        (lead.lat && lead.lng
                          ? `https://www.google.com/maps/search/?api=1&query=${lead.lat},${lead.lng}`
                          : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                              lead.name + ' ' + (lead.address || '')
                            )}`)
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs px-2.5 py-1.5 rounded-lg border border-white/[0.08] hover:border-indigo-400/50 hover:bg-indigo-500/10 text-slate-300 hover:text-white transition-all inline-flex items-center gap-1.5 font-medium"
                      title="View business on Google Maps"
                      onClick={e => e.stopPropagation()}
                    >
                      <IconMapPin className="w-3.5 h-3.5 text-indigo-400" /> Maps
                    </a>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={e => handleAnalyze(e, lead._id)}
                      disabled={analyzing === lead._id}
                      aria-label="Analyze website"
                      title="Run AI Website Analysis"
                      className="!px-2.5 !py-1.5 hover:border-indigo-500/40 hover:text-indigo-300 gap-1.5"
                    >
                      {analyzing === lead._id ? <Spinner size={3} /> : <><IconSparkles className="w-3.5 h-3.5 text-indigo-400" /> Audit</>}
                    </Button>
                    {lead.phone && (
                      <a
                        href={waLink(lead.phone, lead.outreach?.whatsapp || '')}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs p-2 rounded-lg border border-emerald-500/25 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-all inline-flex items-center justify-center"
                        title="Open WhatsApp Outreach"
                        onClick={e => e.stopPropagation()}
                      >
                        <IconWhatsApp className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={e => { e.stopPropagation(); onOpenOutreach?.(lead); }}
                      aria-label="Outreach"
                      title="View Outreach Pitch"
                      className="!p-2 text-slate-400 hover:text-slate-200"
                    >
                      <IconSend className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
