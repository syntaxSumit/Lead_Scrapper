const jwt = require('jsonwebtoken');
const User = require('../models/User');

function signToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;
    // HIGH-01: Reject non-string inputs to prevent NoSQL injection
    if (typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string')
      return res.status(400).json({ error: 'Invalid input types' });
    if (!name || !email || !password)
      return res.status(400).json({ error: 'name, email, and password are required' });
    if (await User.findOne({ email }))
      return res.status(409).json({ error: 'Email already registered' });
    const user = await User.create({ name, email, password });
    res.status(201).json({ token: signToken(user), user });
  } catch (e) { next(e); }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    // HIGH-01: Reject non-string inputs to prevent NoSQL injection
    if (typeof email !== 'string' || typeof password !== 'string')
      return res.status(400).json({ error: 'Invalid input types' });
    if (!email || !password)
      return res.status(400).json({ error: 'email and password required' });
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ error: 'Invalid credentials' });
    res.json({ token: signToken(user), user });
  } catch (e) { next(e); }
}

async function me(req, res) {
  res.json(req.user);
}

module.exports = { register, login, me };
