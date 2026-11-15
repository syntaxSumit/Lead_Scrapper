const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { analyze, pitch } = require('../controllers/analyze.controller');

router.post('/:id', authenticate, analyze);
router.post('/:id/pitch', authenticate, pitch);

module.exports = router;
