const { generateJSON } = require('./ai.service');

const LANG_INSTRUCTION = {
  hinglish: 'Write in Hinglish (mix of Hindi & English, casual, friendly, Roman script). Keep it short and genuine.',
  hindi:    'Hindi mein likhein (Devanagari script). Vinayee aur professional tone rakhein.',
  english:  'Write in simple, polite English. Conversational, NOT corporate jargon.',
};

async function generateOutreach({ lead, language = 'hinglish' }) {
  const weaknesses = (lead.analysis?.weaknesses ?? []).slice(0, 3).join(', ') || 'no website';
  const pitchAngle = lead.analysis?.suggestedPitchAngle || `help ${lead.name} grow online`;

  const prompt = `You are a web agency outreach specialist. Generate personalized, NON-SPAMMY outreach for a local business.

Business: ${lead.name}
Category: ${lead.category || 'local business'}
Location: ${lead.address || 'local area'}
Issues found: ${weaknesses}
Pitch angle: ${pitchAngle}

Language instruction: ${LANG_INSTRUCTION[language]}

Important: mention their specific situation (not generic). Be genuine, brief, and end with a question.

Return ONLY valid JSON:
{
  "whatsapp": "WhatsApp message, under 100 words, end with a question",
  "emailSubject": "email subject line",
  "emailBody": "email body, 3-4 short paragraphs",
  "callScript": "30-second cold call script starting after they say hello"
}`;

  const parsed = await generateJSON({
    systemPrompt: 'You are an agency outreach copywriter. You produce engaging, high-conversion messages in strict JSON format.',
    prompt,
  });

  return { ...parsed, language, generatedAt: new Date() };
}

module.exports = { generateOutreach };
