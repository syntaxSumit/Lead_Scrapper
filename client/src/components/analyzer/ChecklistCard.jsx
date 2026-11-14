import Card from '../ui/Card.jsx';

const CHECK_LABELS = {
  hasHttps: 'HTTPS Security',
  hasViewport: 'Mobile Viewport Tag',
  hasTitle: 'Page Title Tag',
  hasMetaDesc: 'Meta Description',
  hasH1: 'Main Heading (H1)',
  hasContactInfo: 'Visible Contact Info',
  hasClickToCall: 'Click-to-Call (tel:)',
  hasWhatsApp: 'WhatsApp Direct Link',
  hasContactForm: 'Lead Contact Form',
  hasGMapsEmbed: 'Google Maps Embed',
  hasFavicon: 'Browser Favicon',
  imagesHaveAlts: 'Image Alt Tags',
};

export default function ChecklistCard({ checks = {} }) {
  const items = Object.entries(CHECK_LABELS);
  const passedCount = items.filter(([key]) => checks[key] === true).length;

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3 border-b border-border pb-2">
        <h3 className="text-sm font-semibold text-slate-200">On-Page Tech & UX Checklist</h3>
        <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-surface2 text-slate-300 border border-border">
          {passedCount} / {items.length} Passed
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        {items.map(([key, label]) => {
          const passed = checks[key] === true;
          return (
            <div
              key={key}
              className={`flex items-center justify-between p-2 rounded-lg border transition-colors ${
                passed
                  ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-300'
                  : 'bg-red-950/20 border-red-900/40 text-red-300'
              }`}
            >
              <span>{label}</span>
              <span className="font-semibold">{passed ? '✓' : '✗'}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
