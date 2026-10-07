/**
 * Service — A clinic service with a starting price. Also the "reason for visit" list when booking.
 */
import mongoose from 'mongoose';
import { SERVICE_CATEGORIES } from '../shared/constants.js';
import toJSONPlugin from './plugins/toJSON.js';

const serviceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true, maxlength: 60 },
    category: { type: String, enum: SERVICE_CATEGORIES, required: true },
    price: { type: Number, required: true, min: 1, max: 500000 },
    duration: { type: Number, required: true }, // minutes, shown to owners as a guide
    description: { type: String, required: true, trim: true, maxlength: 300 },
    image: { type: String, default: '' },
    featured: { type: Boolean, default: false },
  },
  { timestamps: true },
);

serviceSchema.plugin(toJSONPlugin);

export default mongoose.model('Service', serviceSchema);
