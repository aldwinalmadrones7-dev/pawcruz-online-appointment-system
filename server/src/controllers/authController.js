/**
 * authController.js — Register, log in, read/update the current user and change password.
 * Login and register return { token, user }; the React app stores the token and sends it
 * back as "Authorization: Bearer <token>". A new account is a pet owner or a veterinarian;
 * a veterinarian also gets a public vet profile (linked by userId) and must enter the
 * clinic's sign-up code.
 */
import { createHash, timingSafeEqual } from 'node:crypto';
import env from '../config/env.js';
import User from '../models/User.js';
import Vet from '../models/Vet.js';
import { ROLES } from '../shared/constants.js';
import { validateLogin, validatePasswordChange, validateProfile, validateRegister } from '../shared/validators.js';
import ApiError, { assertValid } from '../utils/ApiError.js';
import { signToken } from '../utils/token.js';

const normalizeEmail = (email) => String(email ?? '').trim().toLowerCase();
const text = (value) => String(value ?? '').trim();
const vetName = (firstName, lastName) => `${firstName} ${lastName}`.slice(0, 60);

/** Compares two strings in constant time, so response timing can't reveal the sign-up code. */
function sameSecret(a, b) {
  const digest = (value) => createHash('sha256').update(String(value)).digest();
  return timingSafeEqual(digest(a), digest(b));
}

/** The account as the React app sees it; a vet also gets the id of their public vet profile. */
async function accountJSON(user) {
  const account = user.toJSON();
  if (user.role === ROLES.VET) {
    const vet = await Vet.findOne({ userId: user._id }, '_id');
    account.vetId = vet ? String(vet._id) : null;
  }
  return account;
}

const session = async (user) => ({ token: signToken(user), user: await accountJSON(user) });

/**
 * POST /api/auth/register — a pet-owner or veterinarian account (role "owner" | "vet").
 * Vets also send licenseNo, specialty and the clinic's sign-up code; their vet profile starts
 * without duty days, so they appear for booking once they set their schedule.
 */
export async function register(req, res) {
  assertValid(validateRegister(req.body));
  const isVet = req.body.role === ROLES.VET;
  const email = normalizeEmail(req.body.email);
  const firstName = text(req.body.firstName);
  const lastName = text(req.body.lastName);
  const phone = text(req.body.phone);
  if (await User.exists({ email })) {
    throw new ApiError('An account with this email already exists. Try logging in instead.', 409, 'email');
  }

  const licenseNo = text(req.body.licenseNo).toUpperCase();
  if (isVet) {
    if (!env.vetSignupCode) throw new ApiError('Veterinarian sign-up is closed on this server. Please contact the clinic.', 403, 'clinicCode');
    if (!sameSecret(text(req.body.clinicCode), env.vetSignupCode)) {
      throw new ApiError('That sign-up code is not correct. Ask the clinic for the veterinarian code.', 400, 'clinicCode');
    }
    if (await Vet.exists({ licenseNo })) throw new ApiError('This PRC license number is already registered.', 409, 'licenseNo');
    if (await Vet.exists({ email })) throw new ApiError('A veterinarian profile already uses this email.', 409, 'email');
  }

  const user = await User.create({
    role: isVet ? ROLES.VET : ROLES.OWNER, // only these two roles can ever be created
    firstName,
    lastName,
    email,
    phone,
    password: String(req.body.password),
  });
  if (isVet) {
    try {
      await Vet.create({
        userId: user._id,
        name: vetName(firstName, lastName),
        specialty: text(req.body.specialty).slice(0, 60),
        licenseNo,
        email,
        phone,
        availableDays: [],
        shiftStart: '09:00',
        shiftEnd: '17:00',
      });
    } catch (err) {
      await user.deleteOne(); // never leave a vet account without its vet profile
      throw err;
    }
  }
  res.status(201).json(await session(user));
}

/** POST /api/auth/login */
export async function login(req, res) {
  assertValid(validateLogin(req.body));
  const user = await User.findOne({ email: normalizeEmail(req.body.email) }).select('+password');
  // Same message for an unknown email or a wrong password, so nobody can tell which accounts exist.
  if (!user || !(await user.comparePassword(req.body.password))) throw new ApiError('Invalid email or password.', 401);
  res.json(await session(user));
}

/** GET /api/auth/me */
export async function getMe(req, res) {
  res.json(await accountJSON(req.user));
}

/** PUT /api/auth/me — a vet's name, email and mobile also update their public vet profile. */
export async function updateMe(req, res) {
  assertValid(validateProfile(req.body));
  const email = normalizeEmail(req.body.email);
  const isVet = req.user.role === ROLES.VET;
  if (await User.exists({ email, _id: { $ne: req.user._id } })) {
    throw new ApiError('That email is already used by another account.', 409, 'email');
  }
  if (isVet && (await Vet.exists({ email, userId: { $ne: req.user._id } }))) {
    throw new ApiError('A veterinarian profile already uses this email.', 409, 'email');
  }
  Object.assign(req.user, {
    firstName: text(req.body.firstName),
    lastName: text(req.body.lastName),
    email,
    phone: text(req.body.phone),
    address: text(req.body.address),
  });
  await req.user.save();
  if (isVet) {
    await Vet.updateOne({ userId: req.user._id }, { name: vetName(req.user.firstName, req.user.lastName), email, phone: req.user.phone });
  }
  res.json(await accountJSON(req.user));
}

/** PUT /api/auth/password */
export async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;
  assertValid(validatePasswordChange({ ...req.body, confirmPassword: req.body.confirmPassword ?? newPassword }));
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(currentPassword))) {
    throw new ApiError('Your current password is incorrect.', 400, 'currentPassword');
  }
  user.password = String(newPassword); // hashed by the pre-save hook
  await user.save();
  res.json({ message: 'Password updated successfully.' });
}
