import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import Select from '../ui/Select.jsx';
import Spinner from '../ui/Spinner.jsx';
import { startCampaign, getCampaignStatus, stopCampaign } from '../../api/whatsapp.js';

const LANGUAGES = [
  { value: 'hinglish', label: 'Hinglish (Casual Mix)' },
  { value: 'hindi', label: 'Hindi (Formal)' },
  { value: 'english', label: 'English' },
];

const TARGET_OPTIONS = [
  { key: 'NO_WEBSITE', label: 'No Website', emoji: '🚫' },
  { key: 'BROKEN', label: 'Broken Website', emoji: '💥' },
  { key: 'SOCIAL_ONLY', label: 'Social Media Only', emoji: '📱' },
];

export default function AutoOutreachModal({ open, onClose, waConnected, leadsCount }) {
  const [language, setLanguage] = useState('hinglish');
  const [delayMin, setDelayMin] = useState(30);
  const [delayMax, setDelayMax] = useState(55);
  const [maxCount, setMaxCount] = useState(30);
  const [targets, setTargets] = useState(['NO_WEBSITE', 'BROKEN']);
  const [status, setStatus] = useState(null);
  const pollRef = useRef(null);

  function toggleTarget(key) {
    setTargets(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  }

  // Poll campaign status while running
  useEffect(() => {
    if (open) pollStatus();
    return () => clearInterval(pollRef.current);
  }, [open]);

  useEffect(() => {
    clearInterval(pollRef.current);
    if (status?.running) {
      pollRef.current = setInterval(pollStatus, 3000);
    }
    return () => clearInterval(pollRef.current);
  }, [status?.running]);

  async function pollStatus() {
    try {
      const { data } = await getCampaignStatus();
      setStatus(data);
    } catch { /* silent */ }
  }

  async function handleStart() {
    if (targets.length === 0) return toast.error('Select at least one target type');
    try {
      const { data } = await startCampaign({ language, delayMin, delayMax, maxCount, targets });
      toast.success(`Campaign started — ${data.total} leads in queue`);
      pollStatus();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to start campaign');
    }
  }

  async function handleStop() {
    try {
      await stopCampaign();
      toast.success('Stopping campaign...');
      pollStatus();
    } catch {
      toast.error('Could not stop campaign');
    }
  }

  const isRunning = status?.running;
  const progress = status?.total > 0 ? Math.round(((status.sent + status.failed + status.skipped) / status.total) * 100) : 0;

  return (
    <Modal open={open} onClose={onClose} title="🚀 Auto WhatsApp Outreach" size="lg">
      <div className="space-y-5">

        {/* Connection check */}
        {!waConnected && (
          <div className="bg-amber-900/30 border border-amber-700/50 rounded-xl p-3 text-xs text-amber-300 flex items-center gap-2">
            ⚠️ WhatsApp not connected — connect first using the header button.
          </div>
        )}

        {/* ── Campaign Settings (show when NOT running) ── */}
        {!isRunning && (
          <div className="space-y-4">
            {/* Target selection */}
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-2">Target leads without:</label>
              <div className="flex flex-wrap gap-2">
                {TARGET_OPTIONS.map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => toggleTarget(opt.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      targets.includes(opt.key)
                        ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300'
                        : 'bg-surface2 border-border text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    {opt.emoji} {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Language & Limits */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end">
              <Select label="Language / Tone" options={LANGUAGES} value={language} onChange={e => setLanguage(e.target.value)} />
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-300 tracking-wide">Min Delay (sec)</label>
                <input
                  type="number"
                  className="input-aesthetic w-full text-xs font-mono"
                  min={15}
                  max={120}
                  value={delayMin}
                  onChange={e => setDelayMin(+e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-300 tracking-wide">Max Delay (sec)</label>
                <input
                  type="number"
                  className="input-aesthetic w-full text-xs font-mono"
                  min={20}
                  max={180}
                  value={delayMax}
                  onChange={e => setDelayMax(+e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-300 tracking-wide">Max Messages</label>
                <input
                  type="number"
                  className="input-aesthetic w-full text-xs font-mono"
                  min={1}
                  max={50}
                  value={maxCount}
                  onChange={e => setMaxCount(+e.target.value)}
                />
              </div>
            </div>

            {/* Safety notice */}
            <div className="bg-surface2 border border-border rounded-xl p-3 text-[11px] text-slate-400 space-y-1">
              <p>🛡️ <strong>Anti-Ban Protections Active:</strong></p>
              <ul className="list-disc list-inside space-y-0.5 ml-2">
                <li>Random jitter delay ({delayMin}-{delayMax}s) between each message</li>
                <li>Each message is uniquely generated by AI (no duplicate text)</li>
                <li>Daily cap: max {maxCount} messages this run</li>
                <li>Only leads with valid phone numbers & NEW status will be contacted</li>
              </ul>
            </div>

            <Button onClick={handleStart} disabled={!waConnected || targets.length === 0} className="w-full">
              🚀 Launch Campaign
            </Button>
          </div>
        )}

        {/* ── Live Progress (show when running) ── */}
        {isRunning && (
          <div className="space-y-4">
            {/* Progress bar */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-300 font-medium">
                  Sending {status.sent + status.failed + status.skipped + 1} of {status.total}...
                </span>
                <span className="text-indigo-400 font-mono">{progress}%</span>
              </div>
              <div className="h-2 bg-surface2 rounded-full overflow-hidden border border-border">
                <div
                  className="h-full bg-gradient-to-r from-indigo-600 to-violet-500 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-surface2 rounded-lg p-2 border border-border">
                <div className="text-lg font-bold font-mono text-emerald-400">{status.sent}</div>
                <div className="text-[10px] text-slate-400">Sent</div>
              </div>
              <div className="bg-surface2 rounded-lg p-2 border border-border">
                <div className="text-lg font-bold font-mono text-red-400">{status.failed}</div>
                <div className="text-[10px] text-slate-400">Failed</div>
              </div>
              <div className="bg-surface2 rounded-lg p-2 border border-border">
                <div className="text-lg font-bold font-mono text-amber-400">{status.skipped}</div>
                <div className="text-[10px] text-slate-400">Skipped</div>
              </div>
              <div className="bg-surface2 rounded-lg p-2 border border-border">
                <div className="text-lg font-bold font-mono text-slate-300">{status.total}</div>
                <div className="text-[10px] text-slate-400">Total</div>
              </div>
            </div>

            {/* Currently processing */}
            {status.current && (
              <div className="flex items-center gap-2 text-xs text-slate-300 bg-surface2 p-2 rounded-lg border border-border">
                <Spinner size={3} />
                <span>Processing: <strong>{status.current}</strong></span>
              </div>
            )}

            {/* Live log */}
            <div className="bg-base border border-border rounded-xl p-3 max-h-48 overflow-y-auto">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 font-semibold">Activity Log</p>
              {(status.logs || []).slice(-15).reverse().map((log, i) => (
                <div key={i} className={`text-[11px] font-mono py-0.5 ${
                  log.type === 'success' ? 'text-emerald-400'
                  : log.type === 'error' ? 'text-red-400'
                  : log.type === 'warn' ? 'text-amber-400'
                  : 'text-slate-400'
                }`}>
                  <span className="text-slate-600 mr-1">{new Date(log.ts).toLocaleTimeString('en-IN')}</span>
                  {log.msg}
                </div>
              ))}
            </div>

            <Button onClick={handleStop} variant="danger" className="w-full">
              ⏹ Stop Campaign
            </Button>
          </div>
        )}

        {/* ── Finished Summary (not running, has logs) ── */}
        {!isRunning && status && status.logs.length > 0 && status.sent > 0 && (
          <div className="bg-emerald-950/20 border border-emerald-700/30 rounded-xl p-4 text-center">
            <p className="text-sm font-semibold text-emerald-300 mb-1">✓ Campaign Complete</p>
            <p className="text-xs text-slate-400">
              {status.sent} sent · {status.failed} failed · {status.skipped} skipped
            </p>
          </div>
        )}

      </div>
    </Modal>
  );
}
