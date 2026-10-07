/**
 * Vet — A veterinarian with a PRC license, working days (0 = Sunday … 6 = Saturday)
 * and shift hours. The shift decides which 10-minute slots can be booked.
 */
import mongoose from 'mongoose';
import toJSONPlugin from './plugins/toJSON.js';

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

const vetSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 }, // stored without "Dr."
    title: { type: String, default: 'DVM' },
    specialty: { type: String, required: true, trim: true, maxlength: 60 },
    licenseNo: { type: String, required: true, unique: true, uppercase: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true },
    yearsExperience: { type: Number, default: 0, min: 0, max: 60 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
    availableDays: { type: [{ type: Number, min: 0, max: 6 }], default: [] },
    shiftStart: { type: String, required: true, match: TIME },
    shiftEnd: { type: String, required: true, match: TIME },
    photo: { type: String, default: '' },
    education: { type: String, default: '', trim: true },
    languages: { type: [String], default: ['English', 'Filipino'] },
    bio: { type: String, default: '', trim: true, maxlength: 600 },
  },
  { timestamps: true },
);

vetSchema.plugin(toJSONPlugin);

export default mongoose.model('Vet', vetSchema);
