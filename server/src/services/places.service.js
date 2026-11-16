const axios = require('axios');
const crypto = require('crypto');
const Lead = require('../models/Lead');
const SeenPlace = require('../models/SeenPlace');
const { detectWebsiteStatus } = require('./websiteDetect.service');
const { computeLeadScore } = require('./scoring.service');
const { externalApiQueue } = require('../middleware/rateLimit');

const PLACES_BASE = 'https://places.googleapis.com/v1';

// Map friendly category names → Google Places types
const CATEGORY_TYPE_MAP = {
  salon:        'hair_salon',
  'hair salon': 'hair_salon',
  clinic:       'doctor',
  hospital:     'hospital',
  restaurant:   'restaurant',
  gym:          'gym',
  hotel:        'hotel',
  school:       'school',
  college:      'university',
  dentist:      'dentist',
  dental:       'dentist',
  pharmacy:     'pharmacy',
  bakery:       'bakery',
  cafe:         'cafe',
  bar:          'bar',
  spa:          'spa',
  lawyer:       'lawyer',
  bank:         'bank',
  supermarket:  'supermarket',
};

function toGoogleType(category) {
  if (!category) return 'establishment';
  const key = category.toLowerCase().trim();
  return CATEGORY_TYPE_MAP[key] || 'establishment';
}

async function searchPlaces({
  query,
  location,
  state,
  lat,
  lng,
  radius = 50000,
  category,
  userId,
  limit = 20,
  onlyNeedWebsite = true,
}) {
  const targetLimit = Math.max(1, Math.min(parseInt(limit, 10) || 20, 60));

  // 1. Fetch all place_ids this user has EVER seen (to ensure zero duplicate businesses)
  const seenRecords = await SeenPlace.find({ userId }).select('place_id').lean();
  const seenSet = new Set(seenRecords.map(s => s.place_id));

  // Also include currently existing leads in memory
  const existingLeads = await Lead.find({ userId }).select('place_id name').lean();
  for (const el of existingLeads) {
    seenSet.add(el.place_id);
  }

  const headers = {
    'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY,
    'Content-Type': 'application/json',
  };

  const BASE_FIELDS = [
    'places.id',
    'places.displayName',
    'places.formattedAddress',
    'places.nationalPhoneNumber',
    'places.rating',
    'places.userRatingCount',
    'places.websiteUri',
    'places.location',
    'places.googleMapsUri',
    'places.types',
    'places.regularOpeningHours',
  ];

  // Build full geographic search location string (combining City and State if provided)
  let fullLocation = '';
  if (location && state) {
    fullLocation = `${location}, ${state}`;
  } else if (state) {
    fullLocation = `${state}, India`;
  } else if (location) {
    fullLocation = location;
  }

  const isNearby = lat != null && lng != null;
  const places = [];
  const fallbackCandidates = [];
  let pageToken = null;
  let iteration = 0;
  const maxIterations = 5;

  do {
    iteration++;
    const googleType = toGoogleType(category);
    const useNearby = isNearby && targetLimit <= 20 && googleType && googleType !== 'establishment' && iteration === 1;

    const endpoint = useNearby
      ? `${PLACES_BASE}/places:searchNearby`
      : `${PLACES_BASE}/places:searchText`;

    const body = useNearby
      ? {
          locationRestriction: {
            circle: { center: { latitude: lat, longitude: lng }, radius: parseFloat(radius || 50000) },
          },
          includedTypes: [googleType],
          maxResultCount: 20,
        }
      : isNearby
      ? {
          textQuery: category || query,
          locationBias: {
            circle: { center: { latitude: lat, longitude: lng }, radius: parseFloat(radius || 50000) },
          },
          maxResultCount: 20,
          ...(pageToken ? { pageToken } : {}),
        }
      : {
          textQuery: fullLocation ? `${category || query} in ${fullLocation}` : (category || query),
          maxResultCount: 20,
          ...(pageToken ? { pageToken } : {}),
        };

    const fieldMask = useNearby
      ? BASE_FIELDS.join(',')
      : [...BASE_FIELDS, 'nextPageToken'].join(',');

    let res;
    try {
      res = await externalApiQueue(() =>
        axios.post(endpoint, body, {
          headers: { ...headers, 'X-Goog-FieldMask': fieldMask },
          timeout: 15000,
        })
      );
    } catch (apiErr) {
      const details = apiErr.response?.data?.error?.details;
      const detailMsg = details?.[0]?.fieldViolations?.[0]?.description || apiErr.response?.data?.error?.message || apiErr.message;
      console.error('[places API error]:', detailMsg);
      throw new Error(`Google Places search failed: ${detailMsg}`);
    }

    const data = res.data;
    const rawPlaces = data.places || [];

    // Filter out ANY business that this user has already seen before
    const freshBatch = rawPlaces.filter(p => !seenSet.has(p.id));

    // Mark as seen immediately so pagination never duplicates
    for (const p of freshBatch) {
      seenSet.add(p.id);
    }

    // Probe website status concurrently for this batch (3s fast probe)
    const probedBatch = await Promise.all(
      freshBatch.map(async p => {
        const websiteUrl = p.websiteUri || null;
        const websiteStatus = await detectWebsiteStatus(websiteUrl);
        return { ...p, websiteStatus, probedWebsiteUrl: websiteUrl };
      })
    );

    // Segregate candidates: businesses that NEED a website vs already have one
    for (const item of probedBatch) {
      const needsWebsite = ['NO_WEBSITE', 'BROKEN', 'SOCIAL_ONLY'].includes(item.websiteStatus);

      if (onlyNeedWebsite) {
        if (needsWebsite && places.length < targetLimit) {
          places.push(item);
        } else if (!needsWebsite) {
          fallbackCandidates.push(item);
        }
      } else {
        if (places.length < targetLimit) {
          places.push(item);
        }
      }
    }

    pageToken = data.nextPageToken || null;

    if (places.length >= targetLimit) {
      break;
    }

    if (pageToken && places.length < targetLimit) {
      await new Promise(r => setTimeout(r, 1500));
    }
  } while (pageToken && places.length < targetLimit && iteration < maxIterations);

  // If strict filtering was requested but not enough leads without sites were found,
  // top-up with fallback candidates sorted by quality so user never gets an empty screen
  if (places.length < targetLimit && fallbackCandidates.length > 0) {
    const needed = targetLimit - places.length;
    places.push(...fallbackCandidates.slice(0, needed));
  }

  // 2. Archive all existing leads into SeenPlace so they are permanently remembered
  if (existingLeads.length > 0) {
    const archiveOps = existingLeads.map(l => ({
      updateOne: {
        filter: { userId, place_id: l.place_id },
        update: { $setOnInsert: { userId, place_id: l.place_id, name: l.name } },
        upsert: true,
      },
    }));
    await SeenPlace.bulkWrite(archiveOps);
  }

  // 3. Delete previous leads from the active Lead table (fresh search replace)
  await Lead.deleteMany({ userId });

  // 4. If new unique places were discovered, register & save them
  if (places.length > 0) {
    // Record new places in SeenPlace
    const newSeenOps = places.map(p => ({
      updateOne: {
        filter: { userId, place_id: p.id },
        update: { $setOnInsert: { userId, place_id: p.id, name: p.displayName?.text } },
        upsert: true,
      },
    }));
    await SeenPlace.bulkWrite(newSeenOps);

    // Process all discovered places (scoring & metadata)
    const placeDocs = places.map(p => {
      const placeId = p.id;
      const websiteUrl = p.probedWebsiteUrl ?? (p.websiteUri || null);
      const websiteStatus = p.websiteStatus;

      const doc = {
        place_id:    placeId,
        name:        p.displayName?.text || 'Unknown',
        category:    category || query,
        address:     p.formattedAddress,
        phone:       p.nationalPhoneNumber,
        rating:      p.rating,
        reviewCount: p.userRatingCount,
        mapsUrl:     p.googleMapsUri,
        websiteUrl,
        websiteStatus,
        lat:         p.location?.latitude,
        lng:         p.location?.longitude,
        openingHours: p.regularOpeningHours?.weekdayDescriptions || [],
        searchQuery: fullLocation ? `${category || query} in ${fullLocation}` : (category || query),
        userId,
      };

      const scores = computeLeadScore(doc);
      doc.leadScore  = scores.leadScore;
      doc.scoreLabel = scores.scoreLabel;
      return doc;
    });

    // Bulk insert new leads
    const bulkOps = placeDocs.map(doc => ({
      updateOne: {
        filter: { place_id: doc.place_id, userId },
        update: { $set: doc },
        upsert: true,
      },
    }));
    await Lead.bulkWrite(bulkOps);
  }

  // Return leads with the HOTTEST leads first (highest leadScore, reviewCount, and rating)
  return Lead.find({ userId })
    .sort({ leadScore: -1, reviewCount: -1, rating: -1 })
    .lean();
}

module.exports = { searchPlaces };
