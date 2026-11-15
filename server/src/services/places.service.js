const axios = require('axios');
const crypto = require('crypto');
const Lead = require('../models/Lead');
const SeenPlace = require('../models/SeenPlace');
const SearchCache = require('../models/SearchCache');
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

function makeCacheKey(params) {
  return crypto.createHash('md5').update(JSON.stringify(params)).digest('hex');
}

async function searchPlaces({ query, location, lat, lng, radius = 5000, category, userId, limit = 20 }) {
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

  const isNearby = lat != null && lng != null;
  let places = [];
  let pageToken = null;
  let iteration = 0;
  const maxIterations = 5;

  do {
    iteration++;
    const googleType = toGoogleType(category);
    // If user wants more than 20 leads, or category is not in Table A, use searchText with locationBias.
    const useNearby = isNearby && targetLimit <= 20 && googleType && googleType !== 'establishment' && iteration === 1;

    const remaining = targetLimit - places.length;
    const maxResultCount = Math.max(1, Math.min(remaining, 20));

    const endpoint = useNearby
      ? `${PLACES_BASE}/places:searchNearby`
      : `${PLACES_BASE}/places:searchText`;

    const body = useNearby
      ? {
          locationRestriction: {
            circle: { center: { latitude: lat, longitude: lng }, radius: parseFloat(radius) },
          },
          includedTypes: [googleType],
          maxResultCount,
        }
      : isNearby
      ? {
          textQuery: category || query,
          locationBias: {
            circle: { center: { latitude: lat, longitude: lng }, radius: parseFloat(radius) },
          },
          maxResultCount,
          ...(pageToken ? { pageToken } : {}),
        }
      : {
          textQuery: `${category || query} in ${location}`,
          maxResultCount,
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

    for (const p of freshBatch) {
      if (places.length < targetLimit) {
        places.push(p);
        seenSet.add(p.id);
      }
    }

    pageToken = data.nextPageToken || null;

    if (places.length >= targetLimit) {
      break;
    }

    if (pageToken && places.length < targetLimit) {
      await new Promise(r => setTimeout(r, 2000));
    }
  } while (pageToken && places.length < targetLimit && iteration < maxIterations);

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

    // Process all discovered places concurrently (website probe + scoring)
    const placeDocs = await Promise.all(
      places.map(async p => {
        const placeId = p.id;
        const websiteUrl = p.websiteUri || null;
        const websiteStatus = await detectWebsiteStatus(websiteUrl);

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
          searchQuery: query || category,
          userId,
        };

        const scores = computeLeadScore(doc);
        doc.leadScore  = scores.leadScore;
        doc.scoreLabel = scores.scoreLabel;
        return doc;
      })
    );

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

  return Lead.find({ userId }).sort({ leadScore: -1 }).lean();
}

module.exports = { searchPlaces };
