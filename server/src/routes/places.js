const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { search, saveSearch, getSavedSearches, deleteSavedSearch } = require('../controllers/places.controller');

router.post('/search',      authenticate, search);
router.get('/saved',        authenticate, getSavedSearches);
router.post('/saved',       authenticate, saveSearch);
router.delete('/saved/:id', authenticate, deleteSavedSearch);

module.exports = router;
