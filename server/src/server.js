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
  if (/bad auth|authentication failed/i.test(err.message)) {
    console.error(
      'MongoDB rejected the username/password in MONGODB_URI (server/.env).\n' +
        'In Atlas: Security > Database Access > Edit your user > Edit Password, then paste the new\n' +
        'password into MONGODB_URI (URL-encode special characters like @ : / ? #).\n',
    );
  }
  process.exit(1);
}

app.listen(env.port, () => {
  console.log(`PawCruz API running on http://localhost:${env.port}/api (${env.nodeEnv})`);
});
