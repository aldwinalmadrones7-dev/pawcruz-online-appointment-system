/**
 * env.js — Loads settings from server/.env (if present) and checks the required ones.
 * Every other file reads configuration from here, never from process.env directly.
 */
try {
  process.loadEnvFile(new URL('../../.env', import.meta.url));
} catch {
  // No .env file: rely on real environment variables (e.g. on a hosting service).
}

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGODB_URI || '',
  jwtSecret: process.env.JWT_SECRET || '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrls: (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean),
  allowDemoReset: process.env.ALLOW_DEMO_RESET === 'true',
  // Optional DNS servers for Atlas lookups, e.g. "8.8.8.8,1.1.1.1" (see config/db.js).
  dnsServers: (process.env.DNS_SERVERS || '')
    .split(',')
    .map((server) => server.trim())
    .filter(Boolean),
};

env.isProduction = env.nodeEnv === 'production';

/** Stops the server early with a clear message when a required setting is missing. */
export function assertEnv() {
  const missing = [];
  if (!env.mongoUri) missing.push('MONGODB_URI');
  if (!env.jwtSecret) missing.push('JWT_SECRET');
  if (missing.length) {
    throw new Error(`Missing ${missing.join(' and ')} — copy server/.env.example to server/.env and fill it in.`);
  }
  if (env.jwtSecret.length < 32) {
    throw new Error('JWT_SECRET is too short — use a random string of at least 32 characters.');
  }
}

export default env;
