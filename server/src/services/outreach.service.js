const { generateJSON } = require('./ai.service');

const LANG_INSTRUCTION = {
  hinglish: 'Write in natural Hinglish (mix of casual Hindi & English in Roman script, the way professional Indian agencies chat on WhatsApp). Friendly, respectful, not robotic.',
  hindi:    'Hindi mein likhein (Devanagari script). Vinamra aur aadarpoorvak professional tone rakhein.',
  english:  'Write in warm, polished, modern Indian English. Conversational, concise, not corporate jargon.',
};

async function generateOutreach({ lead, language = 'hinglish' }) {
  const weaknesses = (lead.analysis?.weaknesses ?? []).slice(0, 3).join(', ') || 'no website';
  const pitchAngle = lead.analysis?.suggestedPitchAngle || `help ${lead.name} grow online`;
  const websiteStatus = lead.websiteStatus || 'NO_WEBSITE';
  const websiteUrl = lead.websiteUrl || '';

  const agency = process.env.AGENCY_NAME || 'make4yu';
  const agencyUrl = process.env.AGENCY_URL || 'https://make4yu.com';
  const agencyOffer = process.env.AGENCY_OFFER || '2 free sample designs before you pay, live in about 7 days, client edits their own site, live dashboard included.';

  let scenarioContext = '';
  if (websiteStatus === 'NO_WEBSITE') {
    scenarioContext = `SCENARIO: This business has NO WEBSITE listed on Google Maps. Having strong reviews (Rating: ${lead.rating || 'N/A'} stars) without an official website means local customers cannot view full services, pricing, or book directly online.`;
  } else if (websiteStatus === 'BROKEN') {
    scenarioContext = `SCENARIO: This business has a BROKEN WEBSITE link (${websiteUrl}) on Google Maps. When interested customers tap it, the page fails to open or throws an error, causing lost daily bookings.`;
  } else if (websiteStatus === 'SOCIAL_ONLY') {
    scenarioContext = `SCENARIO: This business only links to social media (${websiteUrl}) instead of an official website. A dedicated website builds higher trust, instant bookings, and direct Google Search presence.`;
  } else {
    scenarioContext = `SCENARIO: They have an existing website (${websiteUrl}), but it has issues: ${weaknesses}. Offer a modern mobile upgrade to increase customer conversion.`;
  }

  const prompt = `You are the lead client outreach manager at ${agency} (${agencyUrl}), a top-tier Indian web design & tech agency.
Our core risk-free offer: ${agencyOffer}

Write a personalized, perfectly structured, highly readable outreach message for this business.

Business: ${lead.name}
Category: ${lead.category || 'local business'}
Location: ${lead.address || 'local area'}
Google Rating: ${lead.rating ?? 'N/A'} (${lead.reviewCount ?? 0} reviews)
Website Status: ${websiteStatus}
${scenarioContext}
Pitch Angle: ${pitchAngle}

Language: ${LANG_INSTRUCTION[language] || LANG_INSTRUCTION.hinglish}

CRITICAL WHATSAPP FORMATTING RULES:
1. NEVER write a single continuous block/wall of text. Always use clean double line breaks (\\n\\n) between paragraphs.
2. Use WhatsApp bold formatting (*text*) on the business name, key problem, our brand *${agency}*, and key bullet points.
3. Structure the WhatsApp message EXACTLY in this 5-part layout:

Part 1: Polite Greeting & Context (1-2 lines)
e.g. "Hi team *${lead.name}*! 👋\\n\\nI came across your Google Maps listing..." (compliment their reviews/location)

Part 2: The Specific Observation (1-2 lines)
Explain the specific issue (${websiteStatus === 'BROKEN' ? 'noticed your website link on Google is currently showing an error and not opening, which may be leaking daily customer bookings' : websiteStatus === 'NO_WEBSITE' ? 'noticed you have great reviews but no official website linked for map viewers to check services or book online' : 'noticed your site could convert many more daily visitors with a modern mobile upgrade'}).

Part 3: The *${agency}* Value Offer (formatted with bullet points):
Introduce *${agency}* with 3 clean bullet points:
• ✨ *2 Free Custom Sample Mockups* created upfront before any payment
• ⚡ *Live in ~7 Days* with WhatsApp direct booking
• 📱 Easy for you to edit anytime + Live Dashboard included

Part 4: Low-Friction Closing Question (1 line)
e.g. "Would you like me to share 2 free sample mockup designs for *${lead.name}* over WhatsApp to review?"

Part 5: Professional Sign-Off
Best regards,\\n*Team ${agency}*\\n🌐 ${agencyUrl}

Return ONLY valid JSON:
{
  "whatsapp": "The formatted WhatsApp message with clean line breaks (\\n\\n), bold text (*word*), bullet points, and ${agencyUrl}",
  "emailSubject": "concise email subject line mentioning ${lead.name} and ${agency}",
  "emailBody": "email body, 2-3 short structured paragraphs with bullet points and ${agencyUrl}",
  "callScript": "30-second cold call script starting after greeting, mentioning ${agency} and the 2 free sample designs"
}`;

  const parsed = await generateJSON({
    systemPrompt: 'You are an elite B2B copywriter for Indian web design agency make4yu. You output clean, properly formatted, high-conversion JSON messages with line breaks and markdown.',
    prompt,
  });

  return { ...parsed, language, generatedAt: new Date() };
}

module.exports = { generateOutreach };
