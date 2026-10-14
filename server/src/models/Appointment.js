/**
 * Appointment — One pet's 10-minute slot with one vet. A multi-pet visit is several
 * appointments that share a `visitId`, booking `reference` and `queueNumber`.
 * On the visit day it moves through the live queue: checkedInAt (arrived, waiting) →
 * servedAt (with the vet) → completedAt (status Completed).
 * Two partial unique indexes stop double-booking inside the database itself: a vet (or a
 * pet) can never have two Confirmed appointments starting at the same date and time.
 */
import mongoose from 'mongoose';
import { APPOINTMENT_SOURCES, APPOINTMENT_STATUS, APPOINTMENT_STATUSES, CONSULTATION_TYPE } from '../shared/constants.js';
import toJSONPlugin from './plugins/toJSON.js';

const { ObjectId } = mongoose.Schema.Types;

const appointmentSchema = new mongoose.Schema(
  {
    reference: { type: String, required: true, index: true }, // "PWC-24X7Q", shared by the pets in one visit
    visitId: { type: String, required: true, index: true },
    queueNumber: { type: String, required: true }, // online "E-001", walk-in "#901"
    ownerId: { type: ObjectId, ref: 'User', required: true, index: true },
    petId: { type: ObjectId, ref: 'Pet', required: true, index: true },
    vetId: { type: ObjectId, ref: 'Vet', required: true },
    serviceId: { type: ObjectId, ref: 'Service', required: true },
    date: { type: String, required: true, index: true }, // "YYYY-MM-DD" in Asia/Manila
    startTime: { type: String, required: true }, // "HH:mm"
    endTime: { type: String, required: true },
    source: { type: String, enum: APPOINTMENT_SOURCES, default: 'Online' },
    status: { type: String, enum: APPOINTMENT_STATUSES, default: APPOINTMENT_STATUS.CONFIRMED },
    notes: { type: String, default: '', trim: true, maxlength: 500 },
    price: { type: Number, default: 0 }, // the service's price at booking time
    cancelReason: { type: String, default: '', maxlength: 200 },
    cancelledBy: { type: String, enum: ['', 'owner', 'clinic'], default: '' },
    checkedInAt: { type: Date, default: null }, // arrived and checked in → waiting in the live queue
    servedAt: { type: Date, default: null }, // called in by the vet → being served
    completedAt: { type: Date, default: null }, // consultation finished
  },
  { timestamps: true },
);

const confirmedOnly = { unique: true, partialFilterExpression: { status: APPOINTMENT_STATUS.CONFIRMED } };
appointmentSchema.index({ vetId: 1, date: 1, startTime: 1 }, { ...confirmedOnly, name: 'vet_slot_unique' });
appointmentSchema.index({ petId: 1, date: 1, startTime: 1 }, { ...confirmedOnly, name: 'pet_slot_unique' });

// Related records, loaded with .populate(APPOINTMENT_POPULATE) so the app can show appointment.pet.name etc.
const related = (ref, localField) => ({ ref, localField, foreignField: '_id', justOne: true });
appointmentSchema.virtual('owner', related('User', 'ownerId'));
appointmentSchema.virtual('pet', related('Pet', 'petId'));
appointmentSchema.virtual('vet', related('Vet', 'vetId'));
appointmentSchema.virtual('service', related('Service', 'serviceId'));

export const APPOINTMENT_POPULATE = ['owner', 'pet', 'vet', 'service'];

// If a related record was deleted later, show a readable placeholder instead of breaking the page.
appointmentSchema.set('toJSON', {
  transform(doc, ret) {
    if (ret.owner === null) ret.owner = { id: String(ret.ownerId), firstName: 'Unknown', lastName: 'owner', email: '', phone: '' };
    if (ret.pet === null) ret.pet = { id: String(ret.petId), name: 'Removed pet', species: 'Other', breed: '' };
    if (ret.vet === null) ret.vet = { id: String(ret.vetId), name: '', specialty: 'No longer with the clinic', photo: '', availableDays: [] };
    if (ret.service === null) ret.service = { id: String(ret.serviceId), name: CONSULTATION_TYPE, category: '', price: ret.price, image: '' };
    return ret;
  },
});
appointmentSchema.plugin(toJSONPlugin);

export default mongoose.model('Appointment', appointmentSchema);
