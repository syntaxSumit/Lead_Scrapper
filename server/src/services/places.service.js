const axios = require('axios');
const crypto = require('crypto');
const Lead = require('../models/Lead');
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
  const cacheKey = makeCacheKey({ query: query || category, location, lat, lng, radius, category, targetLimit });

  // Return cached results if fresh
  const cached = await SearchCache.findOne({ cacheKey, expiresAt: { $gt: new Date() } });
  if (cached && cached.placeIds.length > 0) {
    console.log('[places] cache hit', cacheKey);
    return Lead.find({ place_id: { $in: cached.placeIds }, userId }).sort({ leadScore: -1 }).lean();
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

  do {
    const googleType = toGoogleType(category);
    // searchNearby only supports Table A types and cannot paginate beyond 20.
    // If user wants more than 20 leads, or category is not in Table A, use searchText with locationBias.
    const useNearby = isNearby && targetLimit <= 20 && googleType && googleType !== 'establishment';

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

    // Important: searchNearby does not support nextPageToken in field mask
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
    places = places.concat(data.places || []);
    pageToken = data.nextPageToken || null;

    if (places.length >= targetLimit) {
      places = places.slice(0, targetLimit);
      break;
    }

    // Google recommends a short wait before paginating
    if (pageToken) await new Promise(r => setTimeout(r, 2000));
  } while (pageToken && places.length < targetLimit);

  // Process all discovered places concurrently (website check + scoring)
  const placeIds = [];
  const placeDocs = await Promise.all(
    places.map(async p => {
      const placeId = p.id;
      placeIds.push(placeId);

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

  // Single bulk write to MongoDB instead of sequential queries
  if (placeDocs.length > 0) {
    const bulkOps = placeDocs.map(doc => ({
      updateOne: {
        filter: { place_id: doc.place_id, userId },
        update: { $set: doc },
        upsert: true,
      },
    }));
    await Lead.bulkWrite(bulkOps);
  }

  // Cache this search result
  await SearchCache.findOneAndUpdate(
    { cacheKey },
    { cacheKey, query: query || category, location, radius, category, placeIds,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) },
    { upsert: true }
  );

  return Lead.find({ place_id: { $in: placeIds }, userId }).sort({ leadScore: -1 }).lean();
}

module.exports = { searchPlaces };
