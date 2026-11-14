import Card from '../ui/Card.jsx';
import Button from '../ui/Button.jsx';
import Badge from '../ui/Badge.jsx';
import ScoreGauge from './ScoreGauge.jsx';
import ChecklistCard from './ChecklistCard.jsx';
import { IconMapPin, IconFileText, IconSparkles, IconExternalLink } from '../ui/Icons.jsx';
import { scoreBg, statusBg } from '../../utils/format.js';

export default function AnalyzerPanel({ lead, onAnalyze, analyzing }) {
  if (!lead) return null;

  const analysis = lead.analysis;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Header card */}
      <Card className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-lg font-bold text-slate-100">{lead.name}</h2>
            <Badge className={statusBg(lead.websiteStatus)}>
              {lead.websiteStatus?.replace('_', ' ')}
            </Badge>
            <Badge className={scoreBg(lead.scoreLabel)}>
              Lead Score: {lead.leadScore} ({lead.scoreLabel})
            </Badge>
          </div>
          <p className="text-xs text-slate-400">
            {lead.category || 'Local Business'} • {lead.address || 'Address unavailable'}
          </p>
          {lead.websiteUrl && /^https?:\/\//i.test(lead.websiteUrl) && (
            <a
              href={lead.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-indigo-400 hover:underline mt-1 inline-block"
            >
              {lead.websiteUrl} ↗
            </a>
          )}
        </div>

        <div className="flex items-center gap-2 no-print">
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
            className="inline-flex items-center justify-center gap-1.5 font-medium rounded-xl text-xs px-3.5 py-2 bg-white/[0.05] hover:bg-white/[0.09] text-slate-200 border border-white/[0.09] hover:border-white/[0.18] transition-all"
            title="Open in Google Maps"
          >
            <IconMapPin className="w-3.5 h-3.5 text-indigo-400" /> Maps <IconExternalLink className="w-3 h-3 text-slate-400" />
          </a>
          <Button
            onClick={() => onAnalyze(lead._id)}
            disabled={analyzing}
            variant="primary"
            className="gap-1.5"
          >
            <IconSparkles className="w-3.5 h-3.5" />
            {analyzing ? 'Analyzing with AI…' : 'Re-Run Audit'}
          </Button>
          <Button onClick={handlePrint} variant="secondary" className="gap-1.5">
            <IconFileText className="w-3.5 h-3.5" /> Export PDF
          </Button>
        </div>
      </Card>

      {!analysis ? (
        <Card className="p-12 text-center">
          <p className="text-sm text-slate-400 mb-4">
            No analysis report generated yet for this business.
          </p>
          <Button onClick={() => onAnalyze(lead._id)} disabled={analyzing}>
            {analyzing ? 'Analyzing with AI…' : 'Run Full AI Analysis'}
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 flex flex-col items-center justify-center">
              <ScoreGauge
                score={analysis.overallScore ?? 0}
                label="Website Health Score"
              />
            </Card>

            <Card className="p-4 md:col-span-2 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Suggested Pitch Angle
                </h3>
                <blockquote className="text-sm text-indigo-300 font-medium bg-indigo-950/30 border-l-2 border-indigo-500 p-3 rounded-r-lg">
                  "{analysis.suggestedPitchAngle || 'Position modern web design to boost local footfall and credibility.'}"
                </blockquote>
              </div>

              {analysis.pageSpeed && Object.keys(analysis.pageSpeed).length > 0 && (
                <div className="grid grid-cols-4 gap-2 pt-3 border-t border-border mt-3 text-center">
                  <div>
                    <div className="text-xs text-slate-400">Performance</div>
                    <div className="text-sm font-bold font-mono text-slate-200">
                      {analysis.pageSpeed.performance ?? '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">SEO</div>
                    <div className="text-sm font-bold font-mono text-slate-200">
                      {analysis.pageSpeed.seo ?? '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Accessibility</div>
                    <div className="text-sm font-bold font-mono text-slate-200">
                      {analysis.pageSpeed.accessibility ?? '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Best Practices</div>
                    <div className="text-sm font-bold font-mono text-slate-200">
                      {analysis.pageSpeed.bestPractices ?? '—'}
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Programmatic Checks */}
          {analysis.checks && <ChecklistCard checks={analysis.checks} />}

          {/* Insights Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4">
              <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
                ✓ Strengths
              </h3>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {(analysis.strengths || []).map((s, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="p-4">
              <h3 className="text-xs font-semibold text-rose-400 uppercase tracking-wider mb-2">
                ✗ Key Weaknesses
              </h3>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {(analysis.weaknesses || []).map((w, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-rose-400 font-bold">•</span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="p-4">
              <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
                ⚡ Conversion & Lead-Gen Issues
              </h3>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {(analysis.conversionIssues || []).map((c, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-amber-400 font-bold">•</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="p-4">
              <h3 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-2">
                🚀 Quick Wins to Pitch
              </h3>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {(analysis.quickWins || []).map((q, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-cyan-400 font-bold">•</span>
                    <span>{q}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
