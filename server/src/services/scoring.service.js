const { weights, thresholds } = require('./scoring.config');

function computeLeadScore(lead) {
  let score = 0;

  // Website presence
  score += weights[lead.websiteStatus] ?? 0;

  // If site exists, bad site = more opportunity (inverted site quality → lead bonus)
  if (lead.websiteStatus === 'HAS_WEBSITE' && lead.analysis?.overallScore != null) {
    score += Math.round((1 - lead.analysis.overallScore / 100) * 20);
  }

  // Established business bonus
  if ((lead.rating ?? 0) >= 4.0 && (lead.reviewCount ?? 0) >= 20) {
    score += weights.highRating;
  }

  if (lead.phone) score += weights.hasPhone;

  // Category bonus (first match wins)
  const catLower = (lead.category ?? '').toLowerCase();
  for (const [cat, bonus] of Object.entries(weights.categoryBonus)) {
    if (catLower.includes(cat)) { score += bonus; break; }
  }

  score = Math.min(100, Math.max(0, score));
  const scoreLabel = score >= thresholds.HOT ? 'HOT'
                   : score >= thresholds.WARM ? 'WARM'
                   : 'COLD';

  return { leadScore: score, scoreLabel };
}

module.exports = { computeLeadScore };
