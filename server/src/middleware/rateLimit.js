const rateLimit = require('express-rate-limit');
const pLimit = require('p-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 150,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down.' },
});

// HIGH-04: Strict limiter for auth endpoints — 5 req / 15 min
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please wait 15 minutes.' },
  skipSuccessfulRequests: false,
});

// shortcut: in-process concurrency cap; upgrade to BullMQ+Redis if jobs need persistence across restarts
const externalApiQueue = pLimit(3); // max 3 concurrent outbound API calls

module.exports = { apiLimiter, authLimiter, externalApiQueue };
