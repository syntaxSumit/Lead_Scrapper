/** Sanitize a CSV cell value to prevent formula injection */
function sanitizeCell(value) {
  const str = String(value ?? '');
  // Escape double-quotes by doubling them
  const escaped = str.replace(/"/g, '""');
  // Prefix formula triggers with single-quote to neutralize
  const safe = /^[=+\-@\t\r]/.test(escaped) ? `'${escaped}` : escaped;
  // Always quote if contains comma, newline, or double-quote
  return /[,"\n\r]/.test(safe) ? `"${safe}"` : safe;
}

/** Convert leads array to CSV and trigger download */
export function exportCSV(leads) {
  const cols = [
    'name', 'category', 'address', 'phone', 'rating', 'reviewCount',
    'websiteStatus', 'websiteUrl', 'leadScore', 'scoreLabel', 'pipelineStatus', 'mapsUrl',
  ];
  const header = cols.join(',');
  const rows = leads.map(l =>
    cols.map(c => sanitizeCell(l[c])).join(',')
  );
  const csv  = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = `leadscout-${Date.now()}.csv`; a.click();
  URL.revokeObjectURL(url);
}
