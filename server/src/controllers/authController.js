/**
 * authController.js — Register, log in, read/update the current user and change password.
 * Login and register return { token, user }; the React app stores the token and sends it
 * back as "Authorization: Bearer <token>".
 */
import User from '../models/User.js';
import { ROLES } from '../shared/constants.js';
import { validateLogin, validatePasswordChange, validateProfile, validateRegister } from '../shared/validators.js';
import ApiError, { assertValid } from '../utils/ApiError.js';
import { signToken } from '../utils/token.js';

const normalizeEmail = (email) => String(email ?? '').trim().toLowerCase();
const text = (value) => String(value ?? '').trim();

const session = (user) => ({ token: signToken(user), user: user.toJSON() });

/** POST /api/auth/register — new accounts are always pet owners. */
export async function register(req, res) {
  assertValid(validateRegister(req.body));
  const email = normalizeEmail(req.body.email);
  if (await User.exists({ email })) {
    throw new ApiError('An account with this email already exists. Try logging in instead.', 409, 'email');
  }
  const user = await User.create({
    role: ROLES.OWNER, // never trust a role sent by the browser
    firstName: text(req.body.firstName),
    lastName: text(req.body.lastName),
    email,
    phone: text(req.body.phone),
    password: String(req.body.password),
  });
  res.status(201).json(session(user));
}

/** POST /api/auth/login */
export async function login(req, res) {
  assertValid(validateLogin(req.body));
  const user = await User.findOne({ email: normalizeEmail(req.body.email) }).select('+password');
  // Same message for an unknown email or a wrong password, so nobody can tell which accounts exist.
  if (!user || !(await user.comparePassword(req.body.password))) throw new ApiError('Invalid email or password.', 401);
  res.json(session(user));
}

/** GET /api/auth/me */
export function getMe(req, res) {
  res.json(req.user);
}

/** PUT /api/auth/me — vets' details come from their Vet profile, which the admin manages. */
export async function updateMe(req, res) {
  if (req.user.role === ROLES.VET) throw new ApiError('Please ask the clinic admin to update your veterinarian profile.', 403);
  assertValid(validateProfile(req.body));
  const email = normalizeEmail(req.body.email);
  if (await User.exists({ email, _id: { $ne: req.user._id } })) {
    throw new ApiError('That email is already used by another account.', 409, 'email');
  }
  Object.assign(req.user, {
    firstName: text(req.body.firstName),
    lastName: text(req.body.lastName),
    email,
    phone: text(req.body.phone),
    address: text(req.body.address),
  });
  await req.user.save();
  res.json(req.user);
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
