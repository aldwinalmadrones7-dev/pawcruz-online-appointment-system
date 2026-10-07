/**
 * server.js — Entry point: checks the settings, connects to MongoDB, then starts the API.
 *   npm run dev   → restarts automatically when a file changes
 *   npm start     → plain start (production)
 */
import app from './app.js';
import { connectDB } from './config/db.js';
import env, { assertEnv } from './config/env.js';

try {
  assertEnv();
  await connectDB();
} catch (err) {
  console.error(`\nCould not start the API: ${err.message}\n`);
  process.exit(1);
}

app.listen(env.port, () => {
  console.log(`PawCruz API running on http://localhost:${env.port}/api (${env.nodeEnv})`);
});
