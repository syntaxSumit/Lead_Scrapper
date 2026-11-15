require('dotenv').config();

// MED-05: Fail fast if JWT_SECRET is too short
const JWT_SECRET = process.env.JWT_SECRET || '';
if (JWT_SECRET.length < 32) {
  console.error('[FATAL] JWT_SECRET must be at least 32 characters long. Set it in .env');
  process.exit(1);
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const { connectDB } = require('./config/db');
const { apiLimiter, authLimiter } = require('./middleware/rateLimit');

const authRoutes = require('./routes/auth');
const placesRoutes = require('./routes/places');
const leadsRoutes = require('./routes/leads');
const analyzeRoutes = require('./routes/analyze');
const outreachRoutes = require('./routes/outreach');
const whatsappRoutes = require('./routes/whatsapp');

const app = express();

// HIGH-03: Trust reverse-proxy (needed for rate-limiter IP detection)
app.set('trust proxy', 1);

// HIGH-03: Security headers via Helmet
app.use(helmet());

// HIGH-03: Tighter CORS — allow configured CLIENT_URL, localhost, and Vercel domains
const configuredOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim().replace(/\/+$/, ''))
  .filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    // Allow non-browser requests or same-origin
    if (!origin) return cb(null, true);
    const cleanOrigin = origin.replace(/\/+$/, '');
    const isAllowed =
      configuredOrigins.includes(cleanOrigin) ||
      cleanOrigin.endsWith('.vercel.app') ||
      cleanOrigin.includes('localhost');

    if (isAllowed) return cb(null, true);
    console.warn(`[CORS blocked] Origin: ${origin}`);
    cb(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '2mb' }));

// HIGH-01: Sanitize request data to prevent NoSQL injection
app.use(mongoSanitize());

app.use('/api/', apiLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/places', placesRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/analyze', analyzeRoutes);
app.use('/api/outreach', outreachRoutes);
app.use('/api/whatsapp', whatsappRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok', ts: new Date() }));

// MED-01: Global error handler — hide stack traces in production
app.use((err, req, res, _next) => {
  console.error('[error]', err.message, err.stack);
  const isProduction = process.env.NODE_ENV === 'production';
  res.status(err.status || 500).json({
    error: isProduction && (!err.status || err.status >= 500)
      ? 'Internal server error'
      : err.message || 'Internal server error',
  });
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`LeadScout API → http://localhost:${PORT}`));
}).catch(err => {
  console.error('DB connection failed:', err.message);
  process.exit(1);
});
