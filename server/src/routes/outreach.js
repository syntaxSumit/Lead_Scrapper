const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { generate } = require('../controllers/outreach.controller');

router.post('/:id/generate', authenticate, generate);

module.exports = router;
