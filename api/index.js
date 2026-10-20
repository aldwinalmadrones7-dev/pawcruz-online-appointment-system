/**
 * api/index.js — Runs the Express API as a Vercel serverless function, so one Vercel project
 * serves both the React app and the API from the same address. vercel.json sends every
 * /api/... request here; the app's own routes (mounted at /api) take it from there.
 * The MongoDB connection is opened on the first request and reused while the function stays warm.
 */
import app from '../server/src/app.js';
import { connectDB } from '../server/src/config/db.js';
import { assertEnv } from '../server/src/config/env.js';

let connecting = null;

export default async function handler(req, res) {
  try {
    assertEnv();
    connecting ??= connectDB();
    await connecting;
  } catch (err) {
    connecting = null; // try again on the next request
    console.error(`API not ready: ${err.message}`);
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ message: 'The PawCruz server is starting up or its database is unreachable. Please try again.', field: null }));
    return;
  }
  return app(req, res);
}
