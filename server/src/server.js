/**
 * server.js — Entry point: checks the settings, connects to MongoDB, then starts the API.
 *   npm run dev   → restarts automatically when a file changes
 *   npm start     → plain start (production)
 */
import app from './app.js';
import { connectDB } from './config/db.js';
import env, { assertEnv } from './config/env.js';
import Appointment from './models/Appointment.js';

try {
  assertEnv();
  await connectDB();
  // Brings the slot locks up to date (e.g. Pending bookings now hold their slot too).
  await Appointment.syncIndexes();
} catch (err) {
  console.error(`\nCould not start the API: ${err.message}\n`);
  process.exit(1);
}

app.listen(env.port, () => {
  console.log(`PawCruz API running on http://localhost:${env.port}/api (${env.nodeEnv})`);
});
