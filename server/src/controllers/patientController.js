/**
 * patientController.js — Read-only patient records for admins. In a vet clinic the
 * patients are the animals: every pet with its owner and a quick visit summary.
 * Also lists pet-owner accounts (for walk-in bookings).
 */
import Appointment from '../models/Appointment.js';
import Pet from '../models/Pet.js';
import User from '../models/User.js';
import { isUpcoming } from '../shared/appointmentRules.js';
import { APPOINTMENT_STATUS, ROLES } from '../shared/constants.js';

/** GET /api/patients (admin) — animal patients with owner and visit stats. */
export async function getPatients(req, res) {
  const [pets, owners, appointments] = await Promise.all([
    Pet.find().sort({ name: 1 }),
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
        totalVisits: visits.length,
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
