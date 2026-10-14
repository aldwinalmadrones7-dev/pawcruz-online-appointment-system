/**
 * patientController.js — Read-only patient records for admins and vets. In a vet clinic the
 * patients are the animals: every pet with its owner and a quick visit summary (a vet sees
 * the pets the clinic has assigned to them).
 * Only completed visits count as history (cancelled ones are left out).
 * Also lists pet-owner accounts (for walk-in bookings).
 */
import Appointment from '../models/Appointment.js';
import Pet from '../models/Pet.js';
import User from '../models/User.js';
import { isUpcoming } from '../shared/appointmentRules.js';
import { isVet } from '../middleware/auth.js';
import { APPOINTMENT_STATUS, ROLES } from '../shared/constants.js';

/**
 * GET /api/patients (admin, vet) — animal patients with owner and visit stats.
 * Vets get only the pets with an accepted or completed visit assigned to them.
 */
export async function getPatients(req, res) {
  const petFilter = {};
  if (isVet(req.user)) {
    const accepted = [APPOINTMENT_STATUS.CONFIRMED, APPOINTMENT_STATUS.COMPLETED];
    petFilter._id = { $in: await Appointment.distinct('petId', { vetId: req.user.vetId, status: { $in: accepted } }) };
  }
  const [pets, owners, appointments] = await Promise.all([
    Pet.find(petFilter).sort({ name: 1 }),
    User.find({ role: ROLES.OWNER }),
    Appointment.find({}, 'petId status date startTime').lean(),
  ]);
  const ownersById = new Map(owners.map((owner) => [String(owner._id), owner.toJSON()]));

  res.json(
    pets.map((pet) => {
      const visits = appointments.filter((a) => String(a.petId) === String(pet._id));
      const completedDates = visits.filter((a) => a.status === APPOINTMENT_STATUS.COMPLETED).map((a) => a.date).sort();
      return {
        ...pet.toJSON(),
        owner: ownersById.get(String(pet.ownerId)) ?? null,
        totalVisits: completedDates.length,
        upcomingVisits: visits.filter(isUpcoming).length,
        lastVisit: completedDates.at(-1) ?? null,
      };
    }),
  );
}

/** GET /api/users?role=owner (admin) — pet-owner accounts with how many pets each has. */
export async function getOwners(req, res) {
  const [owners, petCounts] = await Promise.all([
    User.find({ role: ROLES.OWNER }).sort({ lastName: 1, firstName: 1 }),
    Pet.aggregate([{ $group: { _id: '$ownerId', count: { $sum: 1 } } }]),
  ]);
  const countFor = (id) => petCounts.find((row) => String(row._id) === String(id))?.count ?? 0;
  res.json(owners.map((owner) => ({ ...owner.toJSON(), petCount: countFor(owner._id) })));
}
