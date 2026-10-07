/**
 * Pet — An owner's animal (the clinic's patient).
 */
import mongoose from 'mongoose';
import toJSONPlugin from './plugins/toJSON.js';

const petSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 30 },
    species: { type: String, required: true, trim: true, maxlength: 40 },
    breed: { type: String, default: '', trim: true, maxlength: 40 },
    sex: { type: String, enum: ['Male', 'Female', 'Unknown'], required: true },
    birthDate: { type: String, default: '' }, // "YYYY-MM-DD"
    weight: { type: Number, default: null, min: 0, max: 150 },
    color: { type: String, default: '', trim: true, maxlength: 40 },
    microchip: { type: String, default: '', trim: true, maxlength: 20 },
    notes: { type: String, default: '', trim: true, maxlength: 300 },
  },
  { timestamps: true },
);

petSchema.plugin(toJSONPlugin);

export default mongoose.model('Pet', petSchema);
