import { useState } from 'react';
import Card from '../ui/Card.jsx';
import Button from '../ui/Button.jsx';
import Spinner from '../ui/Spinner.jsx';
import { IconSparkles, IconTarget, IconMessageSquare, IconWhatsApp } from '../ui/Icons.jsx';
import { generatePitch } from '../../api/analyze.js';
import { waLink } from '../../utils/format.js';
import toast from 'react-hot-toast';

const LANGS = [
  { value: 'hinglish', label: 'Hinglish' },
  { value: 'hindi', label: 'Hindi' },
  { value: 'english', label: 'English' },
];

function copy(text) {
  if (!text) return;
  navigator.clipboard.writeText(text);
  toast.success('Copied');
}

function CopyBtn({ text }) {
  return (
    <button
      type="button"
      onClick={() => copy(text)}
      className="no-print shrink-0 text-[11px] font-medium text-indigo-300 hover:text-indigo-200 px-2 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20"
    >
      Copy
    </button>
  );
}

function Label({ children, className = 'text-slate-400' }) {
  return <h4 className={`text-[11px] font-semibold uppercase tracking-wider mb-1.5 ${className}`}>{children}</h4>;
}

export default function PitchPlaybook({ lead, onLeadUpdate }) {
  const p = lead.pitchPlaybook;
  const [lang, setLang] = useState(p?.language || 'hinglish');
  const [loading, setLoading] = useState(false);
  const [openObj, setOpenObj] = useState(0);

  async function regenerate(language = lang) {
    setLoading(true);
    try {
      const { data } = await generatePitch(lead._id, language);
      onLeadUpdate?.(data);
      toast.success('Pitch playbook ready');
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Could not build the pitch');
    } finally {
      setLoading(false);
    }
  }

  const header = (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
      <div className="flex items-center gap-2">
        <span className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/30 grid place-items-center text-indigo-300">
          <IconTarget className="w-4 h-4" />
        </span>
        <div>
          <h3 className="text-sm font-bold text-slate-100">How to Pitch This Business</h3>
          <p className="text-[11px] text-slate-400">Built from this audit — talking points, objections, close and follow-ups</p>
        </div>
      </div>
      <div className="flex items-center gap-2 no-print">
        <div className="flex rounded-xl bg-white/[0.04] border border-white/[0.08] p-0.5">
          {LANGS.map(l => (
            <button
              key={l.value}
              type="button"
              onClick={() => setLang(l.value)}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-colors ${lang === l.value ? 'bg-indigo-500/80 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              {l.label}
            </button>
          ))}
        </div>
        <Button size="sm" variant="secondary" onClick={() => regenerate()} disabled={loading}>
          {loading ? <><Spinner size={4} /> Building…</> : <><IconSparkles className="w-3.5 h-3.5" /> {p ? 'Regenerate' : 'Build pitch'}</>}
        </Button>
      </div>
    </div>
  );

  if (!p) {
    return (
      <Card className="p-5">
        {header}
        <p className="text-xs text-slate-400">
          No pitch playbook yet. It's built automatically after every new audit — or build one now from the existing audit.
        </p>
      </Card>
    );
  }

  const digits = (lead.phone || '').replace(/\D/g, '').replace(/^0+/, '');
  const wa = digits.length >= 10 ? waLink(digits.length === 10 ? '91' + digits : digits, p.firstMessage || '') : null;

  return (
    <Card className="p-5 print-break">
      {header}

      {/* Strategy strip */}
      <div className="rounded-xl bg-gradient-to-r from-indigo-950/60 to-violet-950/40 border border-indigo-500/25 p-4 mb-4">
        <div className="flex flex-wrap items-center gap-2 mb-1.5">
          {p.temperature && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-200 border border-indigo-400/30">
              {p.temperature}
            </span>
          )}
          <span className="text-[11px] text-slate-400">Strategy</span>
        </div>
        <p className="text-sm text-slate-100 font-medium">{p.summary}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        {[['Who to talk to', p.decisionMaker], ['Best channel', p.bestChannel], ['Best time', p.bestTime]].map(([k, v]) => (
          <div key={k} className="rounded-xl bg-white/[0.03] border border-white/[0.07] p-3">
            <Label>{k}</Label>
            <p className="text-xs text-slate-200 leading-relaxed">{v || '—'}</p>
          </div>
        ))}
      </div>

      {/* Opener */}
      <div className="mb-4">
        <Label className="text-emerald-400">1 · Open with</Label>
        <div className="flex items-start gap-2 rounded-xl bg-emerald-950/25 border border-emerald-500/20 p-3">
          <p className="flex-1 text-sm text-slate-100 leading-relaxed">“{p.openingHook}”</p>
          <CopyBtn text={p.openingHook} />
        </div>
      </div>

      {/* Talking points */}
      {p.talkingPoints?.length > 0 && (
        <div className="mb-4">
          <Label className="text-amber-400">2 · Talking points from the audit</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {p.talkingPoints.map((t, i) => (
              <div key={i} className="rounded-xl bg-white/[0.03] border border-white/[0.07] p-3 text-xs space-y-1.5">
                <p className="font-semibold text-slate-100">{i + 1}. {t.issue}</p>
                <p className="text-rose-300/90"><span className="text-slate-500">Costs them: </span>{t.impact}</p>
                <p className="text-emerald-300/90"><span className="text-slate-500">We fix: </span>{t.solution}</p>
                {t.proofLine && (
                  <div className="flex items-start gap-2 pt-1.5 border-t border-white/[0.06]">
                    <p className="flex-1 italic text-slate-300">“{t.proofLine}”</p>
                    <CopyBtn text={t.proofLine} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Value */}
      {p.valueProposition && (
        <div className="mb-4">
          <Label className="text-cyan-400">3 · Why us — for them</Label>
          <p className="text-xs text-slate-200 leading-relaxed rounded-xl bg-white/[0.03] border border-white/[0.07] p-3">{p.valueProposition}</p>
        </div>
      )}

      {/* Objections */}
      {p.objections?.length > 0 && (
        <div className="mb-4">
          <Label className="text-rose-400">4 · If they say…</Label>
          <div className="space-y-1.5">
            {p.objections.map((o, i) => (
              <div key={i} className="rounded-xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenObj(openObj === i ? -1 : i)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-xs font-semibold text-slate-200 hover:bg-white/[0.03]"
                >
                  <span>“{o.objection}”</span>
                  <span className="no-print text-slate-500">{openObj === i ? '−' : '+'}</span>
                </button>
                <div className={`${openObj === i ? 'flex' : 'hidden print-show'} items-start gap-2 px-3 pb-3`}>
                  <p className="flex-1 text-xs text-slate-300 leading-relaxed">{o.response}</p>
                  <CopyBtn text={o.response} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Close */}
      {p.closingAsk && (
        <div className="mb-4">
          <Label className="text-indigo-300">5 · Close with</Label>
          <div className="flex items-start gap-2 rounded-xl bg-indigo-950/30 border border-indigo-500/25 p-3">
            <p className="flex-1 text-sm text-slate-100">{p.closingAsk}</p>
            <CopyBtn text={p.closingAsk} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        {/* Follow-ups */}
        <div className="md:col-span-2">
          <Label>Follow-up plan</Label>
          <div className="space-y-2">
            {(p.followUps || []).map((f, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl bg-white/[0.03] border border-white/[0.07] p-3">
                <span className="shrink-0 text-[11px] font-bold font-mono px-2 py-1 rounded-lg bg-white/[0.06] text-slate-200">Day {f.day}</span>
                <div className="flex-1 text-xs">
                  <p className="text-slate-400 mb-0.5">{f.channel}</p>
                  <p className="text-slate-200 leading-relaxed">{f.message}</p>
                </div>
                <CopyBtn text={f.message} />
              </div>
            ))}
          </div>
        </div>
        {/* Avoid */}
        <div>
          <Label className="text-rose-400">Don't say</Label>
          <ul className="space-y-1.5 text-xs text-slate-300 rounded-xl bg-rose-950/15 border border-rose-500/15 p-3">
            {(p.avoid || []).map((a, i) => (
              <li key={i} className="flex gap-1.5"><span className="text-rose-400 font-bold">✕</span><span>{a}</span></li>
            ))}
          </ul>
        </div>
      </div>

      {/* Ready message */}
      {p.firstMessage && (
        <div>
          <Label className="text-emerald-400">Ready-to-send first message</Label>
          <div className="rounded-xl bg-emerald-950/25 border border-emerald-500/25 p-3">
            <p className="text-sm text-slate-100 whitespace-pre-line leading-relaxed">{p.firstMessage}</p>
            <div className="flex flex-wrap gap-2 mt-3 no-print">
              <Button size="sm" variant="secondary" onClick={() => copy(p.firstMessage)}>
                <IconMessageSquare className="w-3.5 h-3.5" /> Copy message
              </Button>
              {wa && (
                <a href={wa} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-medium rounded-xl text-xs px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-200 border border-emerald-500/30">
                  <IconWhatsApp className="w-3.5 h-3.5" /> Send on WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
