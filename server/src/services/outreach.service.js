const { generateJSON } = require('./ai.service');

const LANG_INSTRUCTION = {
  hinglish: 'Write in crisp, natural, professional Hinglish (mix of casual Hindi & English in Roman script). Friendly, respectful, high-converting.',
  hindi:    'Hindi mein likhein (Devanagari script). Vinamra aur aadarpoorvak professional tone rakhein.',
  english:  'Write in warm, polished, modern Indian English. Conversational, crisp, zero corporate fluff.',
};

// Map common business categories to realistic customer actions & domain keywords
function getCategoryContext(category = '', name = '') {
  const text = `${category} ${name}`.toLowerCase();

  if (/salon|parlour|parlor|hair|beauty|barber|spa|grooming/.test(text)) {
    return {
      type: 'Salon / Beauty',
      action: 'hair styling & appointment bookings',
      inquiry: 'haircut & service bookings',
      clientNeed: 'book an appointment or check service pricing',
    };
  }
  if (/dent|clinic|doctor|hospital|physio|health|care|medical|derma/.test(text)) {
    return {
      type: 'Healthcare / Clinic',
      action: 'patient consultation slots',
      inquiry: 'doctor consultations & clinic timings',
      clientNeed: 'check clinic timings or book a doctor consultation',
    };
  }
  if (/gym|fitness|crossfit|yoga|pilates|workout|trainer/.test(text)) {
    return {
      type: 'Gym / Fitness',
      action: 'membership passes & trial inquiries',
      inquiry: 'gym memberships & trainer sessions',
      clientNeed: 'check monthly membership plans or free trial slots',
    };
  }
  if (/restaurant|cafe|bistro|bakery|diner|pizza|food|lounge|bar/.test(text)) {
    return {
      type: 'Restaurant / Cafe',
      action: 'table reservations & menu orders',
      inquiry: 'table reservations & party bookings',
      clientNeed: 'view your live menu or reserve a table',
    };
  }
  if (/interior|architect|decor|design|builder|real estate|property/.test(text)) {
    return {
      type: 'Design / Real Estate',
      action: 'project portfolio & consultation visits',
      inquiry: 'site visits & project estimates',
      clientNeed: 'browse your recent project portfolio & book a site visit',
    };
  }
  if (/class|coaching|academy|school|tutor|institute|education/.test(text)) {
    return {
      type: 'Coaching / Education',
      action: 'student admissions & batch inquiries',
      inquiry: 'course brochures & new batch admissions',
      clientNeed: 'check upcoming batch timings & fee structure',
    };
  }
  if (/auto|car|motor|bike|garage|repair|service center/.test(text)) {
    return {
      type: 'Auto / Garage',
      action: 'vehicle service slots & repair quotes',
      inquiry: 'service appointments & spare part inquiries',
      clientNeed: 'book a service slot or get an instant repair quote',
    };
  }

  return {
    type: 'Local Business',
    action: 'direct customer orders & inquiries',
    inquiry: 'direct customer inquiries',
    clientNeed: 'view your verified service list & connect instantly',
  };
}

// 5 Distinct angles to guarantee variation across leads in the same niche
const DYNAMIC_ANGLES = [
  {
    name: 'Direct Courtesy Heads-up',
    angleDesc: 'Direct, friendly notification pointing out the website gap and how it hurts daily customer capture.',
  },
  {
    name: 'Customer Experience Perspective',
    angleDesc: 'Written from the perspective of an interested customer who searched for their service on Google and noticed the missing/broken site.',
  },
  {
    name: 'High Rating Compliment & Revenue Leak',
    angleDesc: 'Compliments their strong Google ratings/reviews first, then highlights how the absence of a quick booking page leaks daily revenue to nearby competitors.',
  },
  {
    name: 'Free Sample First (Zero-Risk)',
    angleDesc: 'Leads with the risk-free offer: our design team made 2 custom sample mockups for them before taking a single rupee.',
  },
  {
    name: 'Local Competition & Modern WhatsApp Booking',
    angleDesc: 'Highlights how modern local businesses are switching to 1-tap WhatsApp booking websites to capture instant client leads.',
  },
];

async function generateOutreach({ lead, language = 'hinglish' }) {
  const weaknesses = (lead.analysis?.weaknesses ?? []).slice(0, 2).join(', ') || 'no dedicated mobile website';
  const websiteStatus = lead.websiteStatus || 'NO_WEBSITE';
  const websiteUrl = lead.websiteUrl || '';

  const agency = process.env.AGENCY_NAME || 'make4yu';
  const agencyUrl = process.env.AGENCY_URL || 'https://make4yu.com';
  const agencyOffer = process.env.AGENCY_OFFER || '2 free sample designs before you pay, live in about 7 days, client edits their own site, live dashboard included.';

  const categoryInfo = getCategoryContext(lead.category, lead.name);

  // Pick a dynamic angle pseudo-randomly to ensure variety even for repeated businesses
  const angleIndex = Math.floor(Math.random() * DYNAMIC_ANGLES.length);
  const chosenAngle = DYNAMIC_ANGLES[angleIndex];

  let issueObservation = '';
  if (websiteStatus === 'BROKEN') {
    issueObservation = `Their website link (${websiteUrl}) on Google Maps is broken/unreachable. Customers clicking it get an error instead of being able to ${categoryInfo.action}.`;
  } else if (websiteStatus === 'SOCIAL_ONLY') {
    issueObservation = `They only link to social media (${websiteUrl}) instead of an official site, making it hard for Google searchers to directly ${categoryInfo.action}.`;
  } else if (websiteStatus === 'NO_WEBSITE') {
    issueObservation = `They have NO website on Google Maps. Despite their ${lead.rating || '4+'}★ rating, local customers cannot ${categoryInfo.clientNeed}.`;
  } else {
    issueObservation = `Their current site (${websiteUrl}) has issues: ${weaknesses}. They are missing out on mobile conversions for ${categoryInfo.action}.`;
  }

  const prompt = `You are an elite B2B sales copywriter for ${agency} (${agencyUrl}).
Core Offer: ${agencyOffer}

Write a SHORT, CRISP, HIGH-CONVERSION WhatsApp outreach message for this business.

BUSINESS DETAILS:
- Name: ${lead.name}
- Niche: ${categoryInfo.type} (relevant to: ${categoryInfo.action})
- City/Area: ${lead.address || 'your area'}
- Rating: ${lead.rating ? `${lead.rating}★` : 'Great rating'} (${lead.reviewCount || 0} reviews)
- Status: ${websiteStatus}
- Core Issue: ${issueObservation}

APPROACH ANGLE TO USE: "${chosenAngle.name}"
${chosenAngle.angleDesc}

Language: ${LANG_INSTRUCTION[language] || LANG_INSTRUCTION.hinglish}

STRICT WHATSAPP FORMAT RULES:
1. WORD COUNT: STRICTLY 45 TO 65 WORDS MAXIMUM! Be punchy and direct. Never write an essay.
2. PARAGRAPH FORMAT: Exactly 4 distinct blocks separated by double line breaks (\\n\\n). Do NOT clump text together.
3. STRUCTURE:
   Block 1: Friendly 1-line greeting mentioning *${lead.name}* + the specific observation tailored to ${categoryInfo.type} (e.g. noticing clients can't easily ${categoryInfo.clientNeed}).
   
   Block 2: Exactly 2 clean bullet points presenting our risk-free offer:
   • ✨ *2 Free Custom Mockups* before any payment
   • ⚡ *Live in ~7 Days* with 1-tap WhatsApp booking

   Block 3: Ultra-short low-pressure closing question (1 line). e.g., "Kya main WhatsApp par 2 free sample designs share karun dekhne ke liye?"
   
   Block 4: Clean brand sign-off:
   Best regards,
   *Team ${agency}* • ${agencyUrl}

4. BOLDING: Use WhatsApp bold (*text*) on *${lead.name}*, *${agency}*, and the bullet headers.

Return ONLY valid JSON:
{
  "whatsapp": "The formatted short WhatsApp message with \\n\\n line breaks, bolding, bullet points, and ${agencyUrl}",
  "emailSubject": "Punchy 6-8 word subject for ${lead.name}",
  "emailBody": "Short 3-paragraph email with bullet points and ${agencyUrl}",
  "callScript": "20-second conversational cold call opener mentioning the 2 free sample designs"
}`;

  try {
    const parsed = await generateJSON({
      systemPrompt: `You are an expert Indian B2B outreach copywriter for ${agency}. You write ultra-short (under 60 words), high-conversion, cleanly formatted WhatsApp messages with line breaks and markdown. Output valid JSON only.`,
      prompt,
      temperature: 0.75, // Elevated temperature ensures varied phrasing every time
    });

    if (parsed && parsed.whatsapp) {
      return { ...parsed, language, generatedAt: new Date() };
    }
  } catch (err) {
    console.warn(`[Outreach] AI generation failed, using dynamic category fallback: ${err.message}`);
  }

  // Robust, dynamic category-specific fallback if AI is unavailable or fails
  return getFallbackOutreach({
    lead,
    categoryInfo,
    chosenAngle,
    websiteStatus,
    agency,
    agencyUrl,
    language,
  });
}

function getFallbackOutreach({ lead, categoryInfo, chosenAngle, websiteStatus, agency, agencyUrl, language }) {
  const isBroken = websiteStatus === 'BROKEN';
  const isHinglish = language === 'hinglish';

  const greetings = [
    `Hi team *${lead.name}*! 👋`,
    `Hello *${lead.name}* team! ✨`,
    `Namaste *${lead.name}* team! 🙏`,
  ];
  const greeting = greetings[Math.floor(Math.random() * greetings.length)];

  let observation = '';
  if (isBroken) {
    observation = isHinglish
      ? `Google Maps par aapka website link open nahi ho raha, jisse daily ${categoryInfo.inquiry} miss ho sakti hain.`
      : `Noticed your website link on Google Maps is showing an error, which might be losing daily ${categoryInfo.action}.`;
  } else {
    observation = isHinglish
      ? `Aapke Google listing par kaafi acche reviews hain, par direct ${categoryInfo.inquiry} ke liye koi dedicated website link nahi hai.`
      : `Loved your reviews on Google Maps, but noticed you don't have an official site linked for customers to ${categoryInfo.clientNeed}.`;
  }

  const cta = isHinglish
    ? `Kya hum 2 min baat kar sakte hain, ya main aapke liye 2 free sample mockups WhatsApp par share karun?`
    : `Would you like me to share 2 free sample mockups for *${lead.name}* over WhatsApp to check out?`;

  const whatsapp = `${greeting}\n\n${observation}\n\nHum *${agency}* se hain aur local businesses ko online grow karne mein help karte hain:\n• ✨ *2 Free Custom Mockups* (no advance payment)\n• ⚡ *Live in ~7 Days* with direct WhatsApp booking\n\n${cta}\n\nBest regards,\n*Team ${agency}* • ${agencyUrl}`;

  return {
    whatsapp,
    emailSubject: `Website idea & 2 free sample mockups for ${lead.name}`,
    emailBody: `Hi team ${lead.name},\n\n${observation}\n\nAt ${agency}, we create fast, modern mobile websites with direct WhatsApp booking:\n• 2 Free Sample Designs before any payment\n• Fully live in about 7 days\n• You can easily update services anytime\n\nWould love to send over 2 free sample designs for your review.\n\nBest regards,\nTeam ${agency}\n${agencyUrl}`,
    callScript: `Hi! Am I speaking with the manager at ${lead.name}? I noticed your Google profile has great reviews but ${isBroken ? 'the website link is down' : 'there is no direct booking website'}. We design websites at ${agency} and would love to send you 2 completely free sample designs to check out—no commitment at all. Can I send them to this number on WhatsApp?`,
    language,
    generatedAt: new Date(),
  };
}

module.exports = { generateOutreach, getCategoryContext };
