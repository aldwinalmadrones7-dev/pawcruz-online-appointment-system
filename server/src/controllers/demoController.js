/**
 * demoController.js — "Reset demo data" for presentations: wipes the database and
 * re-runs the seed. Admin-only, and only when ALLOW_DEMO_RESET=true in server/.env.
 */
import env from '../config/env.js';
import { seedDatabase } from '../seed/seed.js';
import ApiError from '../utils/ApiError.js';

/** POST /api/demo/reset (admin) */
export async function resetDemoData(req, res) {
  if (!env.allowDemoReset) throw new ApiError('Resetting demo data is turned off on this server.', 403);
  const counts = await seedDatabase();
  res.json({ message: 'Demo data restored.', counts });
}
