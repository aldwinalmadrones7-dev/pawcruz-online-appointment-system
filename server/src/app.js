/**
 * app.js — Builds the Express app: security headers, CORS for the React app, JSON parsing,
 * request logging, the /api routes, and JSON error responses. server.js starts it.
 */
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import env from './config/env.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import sanitizeBody from './middleware/sanitize.js';
import routes from './routes/index.js';

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1); // correct client IPs for rate limiting behind a host's proxy
app.use(helmet());
/** True when the page calling the API is served from the API's own address (as on Vercel). */
function isSameSite(req, origin) {
  try {
    return new URL(origin).host === req.headers.host;
  } catch {
    return false;
  }
}

// Browsers may call the API from the React app's address(es) in CLIENT_URL, or from the
// same site that serves the API.
app.use(
  cors((req, callback) => {
    const origin = req.header('Origin');
    callback(null, { origin: !origin || env.clientUrls.includes(origin) || isSameSite(req, origin) });
  }),
);
app.use(express.json({ limit: '100kb' }));
app.use(sanitizeBody);
if (env.nodeEnv !== 'test') app.use(morgan(env.isProduction ? 'combined' : 'dev'));

app.get('/', (req, res) => res.json({ name: 'PawCruz Veterinary Clinic API', docs: 'See server/README.md', health: '/api/health' }));
app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

export default app;
