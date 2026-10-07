/**
 * User — Pet-owner and admin accounts. Passwords are hashed with bcrypt before saving
 * and are never returned (select: false + the toJSON plugin).
 */
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { ROLES } from '../shared/constants.js';
import toJSONPlugin from './plugins/toJSON.js';

export const BCRYPT_ROUNDS = 10;

const userSchema = new mongoose.Schema(
  {
    role: { type: String, enum: Object.values(ROLES), default: ROLES.OWNER, index: true },
    firstName: { type: String, required: true, trim: true, maxlength: 60 },
    lastName: { type: String, required: true, trim: true, maxlength: 60 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 120 },
    phone: { type: String, required: true, match: /^09\d{9}$/ },
    password: { type: String, required: true, select: false },
    address: { type: String, default: '', trim: true, maxlength: 200 },
    avatar: { type: String, default: null },
  },
  { timestamps: true },
);

// Hash the password whenever it is new or changed.
userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, BCRYPT_ROUNDS);
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(String(candidate ?? ''), this.password);
};

userSchema.plugin(toJSONPlugin);

export default mongoose.model('User', userSchema);
