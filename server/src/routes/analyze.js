const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { analyze } = require('../controllers/analyze.controller');

router.post('/:id', authenticate, analyze);

module.exports = router;
