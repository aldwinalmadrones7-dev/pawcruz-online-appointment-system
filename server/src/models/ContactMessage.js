/**
 * ContactMessage — Messages sent from the public Contact page.
 */
import mongoose from 'mongoose';
import toJSONPlugin from './plugins/toJSON.js';

const contactMessageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, default: '' },
    subject: { type: String, required: true, trim: true, maxlength: 80 },
    message: { type: String, required: true, trim: true, maxlength: 1000 },
    handled: { type: Boolean, default: false },
  },
  { timestamps: true },
);

contactMessageSchema.plugin(toJSONPlugin);

export default mongoose.model('ContactMessage', contactMessageSchema);
