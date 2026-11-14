const jwt = require('jsonwebtoken');
const User = require('../models/User');

// shortcut: Bearer token in Authorization header; upgrade to httpOnly cookie for XSS protection in multi-user scenario
async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const token = header.slice(7);
    const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    const user = await User.findById(payload.id).select('-password').lean();
    if (!user) return res.status(401).json({ error: 'User not found' });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = { authenticate };
