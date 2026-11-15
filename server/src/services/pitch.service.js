const { generateJSON } = require('./ai.service');

// Pitch playbook: after a full audit, how to approach THIS business — who to talk to, what to open with,
// which findings to lead with, how to answer objections, how to close and follow up.
// Optional .env: AGENCY_NAME (e.g. "make4yu") and AGENCY_OFFER (one or two lines about what you sell).

const LANG_INSTRUCTION = {
  hinglish: 'Write every customer-facing line (openingHook, objection responses, closingAsk, followUps, firstMessage) in Hinglish: casual Hindi + English in Roman script, the way a local shop owner chats on WhatsApp. Coaching notes can stay in simple English.',
  hindi: 'Write every customer-facing line (openingHook, objection responses, closingAsk, followUps, firstMessage) in polite Hindi (Devanagari). Coaching notes can stay in simple English.',
  english: 'Write everything in simple, warm Indian English. No corporate jargon.',
};

const FAILING_LABELS = {
  hasHttps: 'no HTTPS / "Not secure" warning', hasViewport: 'not mobile friendly (no viewport)', hasTitle: 'missing page title',
  hasMetaDesc: 'no Google description', hasH1: 'no main headline', hasContactInfo: 'contact details hard to find',
  hasClickToCall: 'no tap-to-call button', hasWhatsApp: 'no WhatsApp button', hasContactForm: 'no enquiry form',
  hasGMapsEmbed: 'no map / directions', hasFavicon: 'no favicon (looks unfinished in tabs)', imagesHaveAlts: 'images not readable by Google',
};

function auditFacts(lead) {
  const a = lead.analysis || {};
  const failing = Object.entries(a.checks || {})
    .filter(([k, v]) => v === false && FAILING_LABELS[k])
    .map(([k]) => FAILING_LABELS[k]);
  const ps = a.pageSpeed || {};
  const speed = Object.keys(ps).length
    ? `Mobile PageSpeed: performance ${ps.performance}/100, SEO ${ps.seo}/100, accessibility ${ps.accessibility}/100`
    : 'PageSpeed not available';
  return {
    status: lead.websiteStatus,
    health: a.overallScore ?? 'n/a',
    failing,
    speed,
    strengths: (a.strengths || []).slice(0, 5),
    weaknesses: (a.weaknesses || []).slice(0, 6),
    conversion: (a.conversionIssues || []).slice(0, 5),
    seo: (a.seoIssues || []).slice(0, 5),
    quickWins: (a.quickWins || []).slice(0, 5),
    angle: a.suggestedPitchAngle || '',
    impression: a.designImpression || '',
  };
}

async function generatePitchPlaybook({ lead, language = 'hinglish' }) {
  if (!LANG_INSTRUCTION[language]) language = 'hinglish';
  const f = auditFacts(lead);
  const agency = process.env.AGENCY_NAME || 'make4yu';
  const agencyUrl = process.env.AGENCY_URL || 'https://make4yu.com';
  const offer = process.env.AGENCY_OFFER || '2 free sample designs before you pay, live in about 7 days, client edits their own site, live dashboard included.';

  const prompt = `You are a senior sales coach for ${agency} (${agencyUrl}), a web agency in India that pitches local businesses.
Our offer: ${offer}

Build a pitch playbook for approaching THIS business, based strictly on the audit below. Every point must reference a real finding — no generic advice. If the business has no website, build the pitch around what they lose without one (map viewers who can't see services/prices, no WhatsApp enquiry path, competitors with sites).

CRITICAL REQUIREMENTS:
- Clearly establish who you are and where you are speaking from: identify as speaking from "${agency}" web agency (${agencyUrl}).
- The closing ask and value proposition MUST pitch our core risk-free offer: "${offer}".
- Always offer the 2 free sample mockups upfront before asking for any commitment or money.
- firstMessage MUST use clean WhatsApp formatting: double line breaks (\\n\\n) between paragraphs, bold (*word*), bullet points with emojis, and end with the sign-off: Best regards,\\n*Team ${agency}*\\n🌐 ${agencyUrl}

Business: ${lead.name}
Category: ${lead.category || 'local business'}
Location: ${lead.address || 'n/a'}
Google rating: ${lead.rating ?? 'n/a'} from ${lead.reviewCount ?? 0} reviews
Phone listed: ${lead.phone ? 'yes' : 'no'}
Website status: ${f.status}${lead.websiteUrl ? ` (${lead.websiteUrl})` : ''}
Website health score: ${f.health}/100
${f.speed}
Failing checks: ${f.failing.join('; ') || 'none recorded'}
Strengths: ${f.strengths.join('; ') || 'n/a'}
Weaknesses: ${f.weaknesses.join('; ') || 'n/a'}
Conversion issues: ${f.conversion.join('; ') || 'n/a'}
SEO issues: ${f.seo.join('; ') || 'n/a'}
Quick wins: ${f.quickWins.join('; ') || 'n/a'}
Design impression: ${f.impression || 'n/a'}
Auditor's pitch angle: ${f.angle || 'n/a'}

Language: ${LANG_INSTRUCTION[language]}

Rules: be respectful (never insult their current site — frame as "missed customers"), compliment a real strength first, keep customer-facing lines short, quantify impact only with plausible ranges and never invent stats about this business, end messages with an easy question.

Return ONLY valid JSON with exactly these keys:
{
  "callerIntro": "exact 1-line script for who you are and where you are speaking from (e.g. 'Hello, main [Name] baat kar raha hoon ${agency} web agency se...')",
  "summary": "one sentence: the core strategy for this lead",
  "temperature": "hot | warm | cold — how ready they likely are, with a 5-word reason",
  "decisionMaker": "who to ask for and how to reach them (owner/manager, front desk etc.)",
  "bestChannel": "WhatsApp / call / walk-in / Instagram DM — and why, one line",
  "bestTime": "when to contact this kind of business, one line",
  "openingHook": "the first 1–2 lines you say or send — introduction from ${agency} + compliment on ${lead.name} + specific audit observation",
  "talkingPoints": [
    { "issue": "finding from the audit", "impact": "what it costs them in customers, plain words", "solution": "what we'd do", "proofLine": "one line you can say to make it concrete" }
  ],
  "valueProposition": "2–3 lines: why ${agency}, specifically highlighting: 2 free sample designs before payment, ready in 7 days, client self-editing and live dashboard",
  "objections": [
    { "objection": "we already have Instagram / no budget / no time / we already have a website / let me think", "response": "short, calm reply highlighting our free sample without commitment" }
  ],
  "closingAsk": "the low-friction offer: offering 2 free sample mockup designs before they pay a single rupee",
  "followUps": [
    { "day": 0, "channel": "WhatsApp", "message": "..." },
    { "day": 2, "channel": "...", "message": "..." },
    { "day": 5, "channel": "...", "message": "..." }
  ],
  "avoid": ["things NOT to say to this business"],
  "firstMessage": "complete ready-to-send first WhatsApp message introducing who you are from ${agency}, with line breaks (\\n\\n), bullet points for the 2 free sample designs offer, ending with an easy question and sign-off with ${agencyUrl} (under 95 words)"
}
Give 3–4 talkingPoints and 4–5 objections.`;

  const p = await generateJSON({
    systemPrompt: 'You are an expert B2B sales coach for Indian local-business web design. You output strictly valid JSON.',
    prompt,
  });

  const arr = (x) => (Array.isArray(x) ? x : []);
  const str = (x) => (typeof x === 'string' ? x : x == null ? '' : String(x));
  return {
    agencyName: agency,
    agencyOffer: offer,
    callerIntro: str(p.callerIntro),
    summary: str(p.summary),
    temperature: str(p.temperature),
    decisionMaker: str(p.decisionMaker),
    bestChannel: str(p.bestChannel),
    bestTime: str(p.bestTime),
    openingHook: str(p.openingHook),
    talkingPoints: arr(p.talkingPoints).slice(0, 5).map(t => ({ issue: str(t.issue), impact: str(t.impact), solution: str(t.solution), proofLine: str(t.proofLine) })),
    valueProposition: str(p.valueProposition),
    objections: arr(p.objections).slice(0, 6).map(o => ({ objection: str(o.objection), response: str(o.response) })),
    closingAsk: str(p.closingAsk),
    followUps: arr(p.followUps).slice(0, 4).map(x => ({ day: Number(x.day) || 0, channel: str(x.channel), message: str(x.message) })),
    avoid: arr(p.avoid).slice(0, 6).map(str),
    firstMessage: str(p.firstMessage),
    language,
    generatedAt: new Date(),
  };
}

module.exports = { generatePitchPlaybook };
