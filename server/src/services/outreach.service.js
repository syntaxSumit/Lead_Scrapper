const { generateJSON } = require('./ai.service');

// Map common business categories to realistic customer actions & domain offerings
function getCategoryContext(category = '', name = '') {
  const text = `${category} ${name}`.toLowerCase();

  if (/travel|tour|taxi|cab|car rental|bus|fleet|transport|holiday/.test(text)) {
    return {
      type: 'Travel Agency',
      offerings: 'fleet and tour packages',
      nicheLabel: 'your travel agency',
    };
  }
  if (/salon|parlour|parlor|hair|beauty|barber|spa|grooming/.test(text)) {
    return {
      type: 'Salon',
      offerings: 'services and styling packages',
      nicheLabel: 'your salon',
    };
  }
  if (/dent|clinic|doctor|hospital|physio|health|care|medical|derma/.test(text)) {
    return {
      type: 'Clinic / Healthcare',
      offerings: 'treatments and doctor consultation slots',
      nicheLabel: 'your clinic',
    };
  }
  if (/gym|fitness|crossfit|yoga|pilates|workout|trainer/.test(text)) {
    return {
      type: 'Gym / Fitness',
      offerings: 'membership plans and workout sessions',
      nicheLabel: 'your gym',
    };
  }
  if (/restaurant|cafe|bistro|bakery|diner|pizza|food|lounge|bar/.test(text)) {
    return {
      type: 'Restaurant / Cafe',
      offerings: 'menu items and table bookings',
      nicheLabel: 'your restaurant',
    };
  }
  if (/interior|architect|decor|design|builder|real estate|property/.test(text)) {
    return {
      type: 'Design / Real Estate',
      offerings: 'recent project portfolio and design services',
      nicheLabel: 'your business',
    };
  }
  if (/class|coaching|academy|school|tutor|institute|education/.test(text)) {
    return {
      type: 'Coaching / Institute',
      offerings: 'courses and admission details',
      nicheLabel: 'your institute',
    };
  }
  if (/auto|car|motor|bike|garage|repair|service center/.test(text)) {
    return {
      type: 'Auto Care / Garage',
      offerings: 'repair packages and service slots',
      nicheLabel: 'your workshop',
    };
  }
  if (/hotel|resort|lodge|stay|guest house/.test(text)) {
    return {
      type: 'Hotel / Resort',
      offerings: 'rooms, amenities, and direct stay bookings',
      nicheLabel: 'your hotel',
    };
  }

  return {
    type: 'Local Business',
    offerings: 'services and client offerings',
    nicheLabel: 'your business',
  };
}

async function generateOutreach({ lead, language = 'english' }) {
  const websiteStatus = lead.websiteStatus || 'NO_WEBSITE';
  const agency = process.env.AGENCY_NAME || 'make4yu';
  const agencyUrl = process.env.AGENCY_URL || 'https://make4yu.com';

  const categoryInfo = getCategoryContext(lead.category, lead.name);

  const ratingText = lead.rating
    ? `${lead.rating}-star rating (${lead.reviewCount ? `${lead.reviewCount} reviews` : 'great reviews'})`
    : 'great rating';

  let observation = '';
  if (websiteStatus === 'BROKEN') {
    observation = `We noticed your website link on Google is showing an error and not opening. We want to fix and rebuild it for you!`;
  } else if (websiteStatus === 'SOCIAL_ONLY') {
    observation = `We noticed you only have a social media link instead of an official website to show your ${categoryInfo.offerings}. We want to make one for you!`;
  } else {
    observation = `We noticed you don't have a website to show your ${categoryInfo.offerings}. We want to make one for you!`;
  }

  const prompt = `You are the lead outreach specialist for ${agency} (${agencyUrl}).

Create a personalized cold message for this business following the EXACT format below.

BUSINESS DETAILS:
- Brand Name: ${lead.name}
- Category: ${categoryInfo.type}
- Specific Offerings: ${categoryInfo.offerings}
- Rating Info: ${ratingText}
- Website Status: ${websiteStatus}

MANDATORY WHATSAPP COLD MESSAGE FORMAT:
Hello team ${lead.name}! I'm from ${agencyUrl}

Congrats on your amazing ${ratingText} on Google! 👏

${observation}

Our risk-free offer:
* 2 free sample designs first
* Live in 7 days
* Easy self-editing dashboard

Can I send you 2 free sample designs for ${lead.name}?

Best regards,
Team ${agency}

CRITICAL RULES:
1. Maintain this EXACT message layout with double line breaks (\\n\\n) separating each section.
2. Always mention the business's brand name "${lead.name}" in the greeting and closing question.
3. Keep the 3 bullet points exactly as shown under "Our risk-free offer:".
4. Return ONLY valid JSON:
{
  "whatsapp": "The exact formatted message",
  "emailSubject": "2 free sample designs for ${lead.name} - ${agency}",
  "emailBody": "Professional email body following this format",
  "callScript": "30-second cold call script based on this offer"
}`;

  try {
    const parsed = await generateJSON({
      systemPrompt: `You are an elite B2B sales copywriter for ${agency}. Output clean, perfectly formatted outreach messages in valid JSON only.`,
      prompt,
      temperature: 0.3,
    });

    if (parsed && parsed.whatsapp) {
      return { ...parsed, language, generatedAt: new Date() };
    }
  } catch (err) {
    console.warn(`[Outreach] AI generation failed, using direct template fallback: ${err.message}`);
  }

  return getFallbackOutreach({
    lead,
    categoryInfo,
    websiteStatus,
    ratingText,
    observation,
    agency,
    agencyUrl,
    language,
  });
}

function getFallbackOutreach({
  lead,
  categoryInfo,
  websiteStatus,
  ratingText,
  observation,
  agency,
  agencyUrl,
  language,
}) {
  const whatsapp = `Hello team ${lead.name}! I'm from ${agencyUrl}

Congrats on your amazing ${ratingText} on Google! 👏

${observation}

Our risk-free offer:
* 2 free sample designs first
* Live in 7 days
* Easy self-editing dashboard

Can I send you 2 free sample designs for ${lead.name}?

Best regards,
Team ${agency}`;

  const emailSubject = `2 free sample website designs for ${lead.name} - ${agency}`;
  const emailBody = `Hi team ${lead.name},

Congrats on your amazing ${ratingText} on Google!

${observation}

Our risk-free offer:
* 2 free sample designs first
* Live in 7 days
* Easy self-editing dashboard

Can I send you 2 free sample designs for ${lead.name}?

Best regards,
Team ${agency}
${agencyUrl}`;

  const callScript = `Hi! Am I speaking with the manager at ${lead.name}? I noticed your Google listing has an amazing ${ratingText}, but you don't have a website to show your ${categoryInfo.offerings}. I'm reaching out from ${agencyUrl} — our offer is completely risk-free: we create 2 free sample designs for ${lead.name} before you pay anything. Can I send them to you on WhatsApp to review?`;

  return {
    whatsapp,
    emailSubject,
    emailBody,
    callScript,
    language,
    generatedAt: new Date(),
  };
}

module.exports = { generateOutreach, getCategoryContext };
