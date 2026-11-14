const router = require('express').Router();
const { register, login, me } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');

// HIGH-04: Strict rate limit on auth endpoints
router.post('/register', authLimiter, register);
router.post('/login',    authLimiter, login);
router.get('/me',        authenticate, me);

module.exports = router;
