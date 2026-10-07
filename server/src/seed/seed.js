/**
 * seed.js — Fills MongoDB with the PawCruz demo data (or empties it).
 *   npm run seed           → delete the old data, insert fresh demo data
 *   npm run seed:destroy   → delete all clinic data (users, pets, vets, services, appointments)
 * Also used by POST /api/demo/reset. Contact messages are never deleted.
 */
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { connectDB, disconnectDB } from '../config/db.js';
import { assertEnv } from '../config/env.js';
import Appointment from '../models/Appointment.js';
import Pet from '../models/Pet.js';
import Service from '../models/Service.js';
import User, { BCRYPT_ROUNDS } from '../models/User.js';
import Vet from '../models/Vet.js';
import { buildSeedData } from './seedData.js';

const MODELS = [Appointment, Pet, User, Vet, Service];
const REFERENCE_FIELDS = ['ownerId', 'petId', 'vetId', 'serviceId'];

/** Deletes every clinic document (contact messages are kept). */
export async function clearDatabase() {
  for (const Model of MODELS) await Model.deleteMany({});
}

/**
 * Validates each document with its Mongoose schema, then inserts them as they are, so the
 * seed's realistic createdAt/updatedAt dates are kept (a normal save would reset them to now).
 */
async function insertValidated(Model, docs) {
  await Model.init(); // make sure unique indexes exist before inserting
  const start = Date.now();
  const prepared = [];
  for (const [index, doc] of docs.entries()) {
    const added = new Date(start + index); // keeps the seed's order (services list order) when sorting by createdAt
    const instance = new Model({ createdAt: added, updatedAt: added, ...doc });
    await instance.validate();
    prepared.push(instance.toObject({ virtuals: false, depopulate: true }));
  }
  if (prepared.length) await Model.collection.insertMany(prepared);
  return prepared.length;
}

/**
 * The same label always becomes the same ObjectId, so re-seeding ("Reset demo data") keeps
 * ids stable: logged-in users stay logged in and links like /vets/<id> keep working.
 */
const objectIdFor = (label) => new mongoose.Types.ObjectId(createHash('sha256').update(`pawcruz-seed:${label}`).digest('hex').slice(0, 24));

/** Replaces the seed's label ids ("v1", "pt01"…) with real ObjectIds everywhere they appear. */
function withObjectIds(data) {
  const convert = (doc) => {
    const { id, ...rest } = doc;
    const converted = { _id: objectIdFor(id), ...rest };
    for (const field of REFERENCE_FIELDS) if (doc[field]) converted[field] = objectIdFor(doc[field]);
    return converted;
  };
  return Object.fromEntries(Object.entries(data).map(([name, docs]) => [name, docs.map(convert)]));
}

/** Hashes each distinct demo password once (bcrypt is slow on purpose). */
async function hashPasswords(users) {
  const hashes = new Map();
  for (const user of users) {
    if (!hashes.has(user.password)) hashes.set(user.password, await bcrypt.hash(user.password, BCRYPT_ROUNDS));
    user.password = hashes.get(user.password);
  }
  return users;
}

/** Wipes the clinic data and inserts fresh demo data. Returns how many documents were added. */
export async function seedDatabase() {
  const data = withObjectIds(buildSeedData());
  await hashPasswords(data.users);
  await clearDatabase();
  return {
    services: await insertValidated(Service, data.services),
    vets: await insertValidated(Vet, data.vets),
    users: await insertValidated(User, data.users),
    pets: await insertValidated(Pet, data.pets),
    appointments: await insertValidated(Appointment, data.appointments),
  };
}

// ---- Command line: npm run seed / npm run seed:destroy ------------------------------
const runFromCommandLine = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (runFromCommandLine) {
  try {
    assertEnv();
    await connectDB();
    if (process.argv.includes('--destroy')) {
      await clearDatabase();
      console.log('All clinic data deleted.');
    } else {
      const counts = await seedDatabase();
      console.log('Demo data inserted:', counts);
      console.log('\nTest accounts:\n  Pet owner  owner@pawcruz.ph / Owner123!\n  Admin      admin@pawcruz.ph / Admin123!');
    }
    await disconnectDB();
  } catch (err) {
    console.error(`\nSeeding failed: ${err.message}\n`);
    process.exit(1);
  }
}
