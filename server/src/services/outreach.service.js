const { generateJSON } = require('./ai.service');

const LANG_INSTRUCTION = {
  hinglish: 'Write in Hinglish (mix of Hindi & English, casual, friendly, Roman script). Keep it short and genuine.',
  hindi:    'Hindi mein likhein (Devanagari script). Vinayee aur professional tone rakhein.',
  english:  'Write in simple, polite English. Conversational, NOT corporate jargon.',
};

async function generateOutreach({ lead, language = 'hinglish' }) {
  const weaknesses = (lead.analysis?.weaknesses ?? []).slice(0, 3).join(', ') || 'no website';
  const pitchAngle = lead.analysis?.suggestedPitchAngle || `help ${lead.name} grow online`;
  const websiteStatus = lead.websiteStatus || 'NO_WEBSITE';
  const websiteUrl = lead.websiteUrl || '';

  let scenarioContext = '';
  if (websiteStatus === 'NO_WEBSITE') {
    scenarioContext = `SCENARIO: This business has NO WEBSITE listed on Google Places. Pitch them politely that having strong reviews (Rating: ${lead.rating || 'N/A'}) without an official website means local customers cannot view full services, direct pricing, or book online. Propose a quick demo website to turn map searchers into paying clients.`;
  } else if (websiteStatus === 'BROKEN') {
    scenarioContext = `SCENARIO: This business has a BROKEN WEBSITE (${websiteUrl}). When customers click it from Google Maps, the page fails to open or throws an error. Tell them politely that their site link is down, customers may be bouncing, and offer a quick fix.`;
  } else if (websiteStatus === 'SOCIAL_ONLY') {
    scenarioContext = `SCENARIO: This business only links to social media (${websiteUrl}) instead of an official website. Highlight how having their own branded website builds more trust and automated booking.`;
  } else {
    scenarioContext = `SCENARIO: They have an existing website (${websiteUrl}), but it has issues: ${weaknesses}. Propose modern improvements to increase conversion.`;
  }

  const prompt = `You are a web agency outreach specialist. Generate personalized, polite, NON-SPAMMY outreach for a local business.

Business: ${lead.name}
Category: ${lead.category || 'local business'}
Location: ${lead.address || 'local area'}
Website Status: ${websiteStatus}
${scenarioContext}
Pitch angle: ${pitchAngle}

Language instruction: ${LANG_INSTRUCTION[language]}

Important:
1. Mention their specific scenario (${websiteStatus === 'BROKEN' ? 'broken website error' : websiteStatus === 'NO_WEBSITE' ? 'no website on Google Maps profile' : 'site improvements'}).
2. Keep the WhatsApp message under 80 words, natural, polite, and end with an easy question (e.g., "Kya hum 5 min ispar baat kar sakte hain?").
3. Avoid generic buzzwords or aggressive sales tone.

Return ONLY valid JSON:
{
  "whatsapp": "WhatsApp message, under 80 words, ends with a friendly question",
  "emailSubject": "concise email subject line",
  "emailBody": "email body, 2-3 short paragraphs",
  "callScript": "30-second cold call script starting after greeting"
}`;

  const parsed = await generateJSON({
    systemPrompt: 'You are an agency outreach copywriter. You produce engaging, high-conversion messages in strict JSON format.',
    prompt,
  });

  return { ...parsed, language, generatedAt: new Date() };
}

module.exports = { generateOutreach };
