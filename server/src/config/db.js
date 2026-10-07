/**
 * db.js — Connects Mongoose to MongoDB (Atlas or a local server) using MONGODB_URI.
 */
import dns from 'node:dns';
import mongoose from 'mongoose';
import env from './env.js';

// Ignore filter fields that aren't in the schema. (User input is also cleaned by middleware/sanitize.js.)
mongoose.set('strictQuery', true);

const LOOPBACK = new Set(['127.0.0.1', '::1']);

/**
 * Atlas "mongodb+srv://" addresses need a DNS SRV lookup. On some Windows PCs Node can't read
 * the Wi-Fi's DNS settings and falls back to 127.0.0.1, which refuses the lookup
 * ("querySrv ECONNREFUSED"). In that case, use public DNS servers (or DNS_SERVERS from .env).
 */
function ensureWorkingDns(uri) {
  if (!uri.startsWith('mongodb+srv://')) return;
  if (env.dnsServers.length) {
    dns.setServers(env.dnsServers);
  } else if (dns.getServers().every((server) => LOOPBACK.has(server))) {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  }
}

export async function connectDB(uri = env.mongoUri) {
  ensureWorkingDns(uri);
  const connection = await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  console.log(`MongoDB connected: ${connection.connection.host}/${connection.connection.name}`);
  return connection;
}

export async function disconnectDB() {
  await mongoose.disconnect();
}
