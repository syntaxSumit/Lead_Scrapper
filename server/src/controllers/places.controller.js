const { searchPlaces } = require('../services/places.service');
const SavedSearch = require('../models/SavedSearch');

async function search(req, res, next) {
  try {
    const { query, location, state, lat, lng, radius, category, limit = 20, onlyNeedWebsite = true } = req.body;
    if (!category && !query)
      return res.status(400).json({ error: 'query or category is required' });
    if (!location && !state && (lat == null || lng == null))
      return res.status(400).json({ error: 'Please enter a location, select a state, or use GPS' });

    const leads = await searchPlaces({
      query,
      location,
      state,
      lat:    lat != null ? parseFloat(lat) : undefined,
      lng:    lng != null ? parseFloat(lng) : undefined,
      radius: radius ? parseInt(radius, 10) : undefined,
      category,
      limit:  parseInt(limit, 10) || 20,
      onlyNeedWebsite: onlyNeedWebsite !== false,
      userId: req.user._id,
    });

    res.json({ count: leads.length, leads });
  } catch (e) { next(e); }
}

async function saveSearch(req, res, next) {
  try {
    const { name, query, location, state, radius, limit, category, onlyNeedWebsite, filters } = req.body;
    if (!name) return res.status(400).json({ error: 'Search name is required' });
    const doc = await SavedSearch.create({
      name, query, location, state, radius, limit, category, onlyNeedWebsite, filters,
      userId: req.user._id,
    });
    res.status(201).json(doc);
  } catch (e) { next(e); }
}

async function getSavedSearches(req, res, next) {
  try {
    const searches = await SavedSearch.find({ userId: req.user._id }).sort('-createdAt').lean();
    res.json(searches);
  } catch (e) { next(e); }
}

async function deleteSavedSearch(req, res, next) {
  try {
    await SavedSearch.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    res.json({ ok: true });
  } catch (e) { next(e); }
}

module.exports = { search, saveSearch, getSavedSearches, deleteSavedSearch };
