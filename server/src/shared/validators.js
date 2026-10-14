// Shared with the React app: same rules as client/src/utils/validators.js — keep the two copies in sync.
/**
 * validators.js — Form validation rules. Every validateX() returns an object of
 * { fieldName: 'error message' }; an empty object means the form is valid.
 * The Express API repeats these checks with the same file (never trust the browser alone).
 */
import { ACCOUNT_ROLES, APPOINTMENT_SOURCES, APPOINTMENT_STATUSES, ROLES, SERVICE_CATEGORIES, SERVICE_DURATIONS } from './constants.js';
import { getManilaToday } from './dateUtils.js';
import { BREEDS_BY_SPECIES, SEX_OPTIONS, SPECIES_OPTIONS } from './petOptions.js';
import { timeToMinutes } from './schedule.js';

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const PH_MOBILE_REGEX = /^09\d{9}$/;
// PRC license: letters, numbers or dashes (same general shape final-vet accepts).
export const PRC_LICENSE_REGEX = /^[A-Za-z0-9-]{4,10}$/;
// Letters (including ñ and accents), spaces, dots, apostrophes and hyphens — e.g. "Ma. Niña O'Neil-Cruz".
const NAME_REGEX = /^[\p{L}][\p{L} .'-]{0,59}$/u;
// Pet names may also contain numbers ("Max 2").
const PET_NAME_REGEX = /^[\p{L}\d][\p{L}\d .'-]{0,29}$/u;

export const isBlank = (value) => !String(value ?? '').trim();
export const isValidEmail = (value) => EMAIL_REGEX.test(String(value ?? '').trim());
export const isValidPhMobile = (value) => PH_MOBILE_REGEX.test(String(value ?? '').trim());

/** Keeps digits only and caps at 11 characters, so typing, pasting or autofill stay clean. */
export const sanitizePhoneInput = (value) => String(value ?? '').replace(/\D/g, '').slice(0, 11);

export const PASSWORD_RULES = [
  { key: 'length', label: 'At least 8 characters', test: (value) => value.length >= 8 },
  { key: 'upper', label: 'One uppercase letter (A–Z)', test: (value) => /[A-Z]/.test(value) },
  { key: 'number', label: 'One number (0–9)', test: (value) => /\d/.test(value) },
];

export const getPasswordRuleStatus = (password = '') =>
  PASSWORD_RULES.map((rule) => ({ key: rule.key, label: rule.label, met: rule.test(String(password)) }));

export const isStrongPassword = (password) => getPasswordRuleStatus(password).every((rule) => rule.met);

export const hasErrors = (errors) => Object.keys(errors).length > 0;

// ---- Field-level helpers (return '' when valid) -------------------------------

function nameError(value, label) {
  if (isBlank(value)) return `${label} is required.`;
  return NAME_REGEX.test(String(value).trim()) ? '' : `${label} can only contain letters, spaces, dots, apostrophes and hyphens.`;
}

function emailError(value) {
  if (isBlank(value)) return 'Email is required.';
  return isValidEmail(value) ? '' : 'Enter a valid email address (e.g. juan@email.com).';
}

function phoneError(value, { required = true } = {}) {
  if (isBlank(value)) return required ? 'Mobile number is required.' : '';
  return isValidPhMobile(value) ? '' : 'Use the PH mobile format 09XXXXXXXXX (11 digits).';
}

function passwordError(value) {
  if (!value) return 'Password is required.';
  return isStrongPassword(value) ? '' : 'Use at least 8 characters with an uppercase letter and a number.';
}

function licenseError(value) {
  return PRC_LICENSE_REGEX.test(String(value ?? '').trim()) ? '' : 'Enter a valid PRC license number (4–10 letters, numbers or dashes).';
}

function specialtyError(value) {
  if (isBlank(value)) return 'Specialty is required.';
  return String(value).trim().length > 60 ? 'Keep the specialty under 60 characters.' : '';
}

function pastDateError(value, label) {
  if (!value) return '';
  if (value > getManilaToday()) return `${label} can't be in the future.`;
  if (value < '1900-01-01') return `Please enter a valid ${label.toLowerCase()}.`;
  return '';
}

/** Copies only the non-empty messages into an errors object. */
function collect(entries) {
  return Object.fromEntries(Object.entries(entries).filter(([, message]) => Boolean(message)));
}

// ---- Account forms ----------------------------------------------------------------

export function validateLogin({ email, password }) {
  return collect({
    email: emailError(email),
    password: password ? '' : 'Password is required.',
  });
}

/** Create account: a pet owner, or a veterinarian (who also gives a PRC license, specialty and the clinic code). */
export function validateRegister(values) {
  const isVet = values.role === ROLES.VET;
  return collect({
    role: ACCOUNT_ROLES.includes(values.role) ? '' : 'Choose the type of account you need.',
    firstName: nameError(values.firstName, 'First name'),
    lastName: nameError(values.lastName, 'Last name'),
    email: emailError(values.email),
    phone: phoneError(values.phone),
    licenseNo: isVet ? licenseError(values.licenseNo) : '',
    specialty: isVet ? specialtyError(values.specialty) : '',
    clinicCode: isVet && isBlank(values.clinicCode) ? 'Enter the veterinarian sign-up code from the clinic.' : '',
    password: passwordError(values.password),
    confirmPassword: !values.confirmPassword
      ? 'Please confirm your password.'
      : values.confirmPassword !== values.password
        ? 'Passwords do not match.'
        : '',
    agree: values.agree ? '' : 'Please accept the Data Privacy Notice to create your account.',
  });
}

export function validateProfile(values) {
  return collect({
    firstName: nameError(values.firstName, 'First name'),
    lastName: nameError(values.lastName, 'Last name'),
    email: emailError(values.email),
    phone: phoneError(values.phone),
    address: String(values.address ?? '').length > 200 ? 'Address must be 200 characters or fewer.' : '',
  });
}

export function validatePasswordChange(values) {
  let newPassword = passwordError(values.newPassword);
  if (!newPassword && values.newPassword === values.currentPassword) {
    newPassword = 'Your new password must be different from the current one.';
  }
  return collect({
    currentPassword: values.currentPassword ? '' : 'Current password is required.',
    newPassword,
    confirmPassword: !values.confirmPassword
      ? 'Please confirm your new password.'
      : values.confirmPassword !== values.newPassword
        ? 'Passwords do not match.'
        : '',
  });
}

export function validateContact(values) {
  return collect({
    name: nameError(values.name, 'Name'),
    email: emailError(values.email),
    phone: phoneError(values.phone, { required: false }),
    subject: isBlank(values.subject) ? 'Please choose a subject.' : '',
    message:
      String(values.message ?? '').trim().length < 10 ? 'Please write at least 10 characters so we can help.' : '',
  });
}

// ---- Pets -------------------------------------------------------------------------

export function validatePet(values) {
  const hasBreedList = Boolean(BREEDS_BY_SPECIES[values.species]);
  const weight = Number(values.weight);
  let name = '';
  if (isBlank(values.name)) name = 'Pet name is required.';
  else if (!PET_NAME_REGEX.test(String(values.name).trim())) name = 'Use letters, numbers, spaces, dots, apostrophes or hyphens (max 30).';

  return collect({
    name,
    species: SPECIES_OPTIONS.includes(values.species) ? '' : "Please select the pet's species.",
    customSpecies: values.species === 'Other' && isBlank(values.customSpecies) ? "Please type the pet's species." : '',
    breed: hasBreedList && isBlank(values.breed) ? "Please select the pet's breed." : String(values.breed ?? '').length > 40 ? 'Keep the breed under 40 characters.' : '',
    customBreed: hasBreedList && values.breed === 'Other' && isBlank(values.customBreed) ? "Please type the pet's breed." : '',
    sex: SEX_OPTIONS.includes(values.sex) ? '' : 'Please choose an option.',
    birthDate: pastDateError(values.birthDate, 'Birth date'),
    weight: values.weight === '' ? '' : !Number.isFinite(weight) || weight <= 0 || weight > 150 ? 'Enter a weight between 0.1 and 150 kg.' : '',
    notes: String(values.notes ?? '').length > 300 ? 'Keep notes under 300 characters.' : '',
  });
}

// ---- Veterinarian forms -----------------------------------------------------------------

/** A vet's own professional profile and schedule (name, email and mobile come from their account). */
export function validateVetProfile(values) {
  const years = Number(values.yearsExperience);
  const bioLength = String(values.bio ?? '').trim().length;
  const shiftOk = values.shiftStart && values.shiftEnd && timeToMinutes(values.shiftEnd) - timeToMinutes(values.shiftStart) >= 60;
  return collect({
    specialty: specialtyError(values.specialty),
    licenseNo: licenseError(values.licenseNo),
    yearsExperience:
      values.yearsExperience === '' || !Number.isInteger(years) || years < 0 || years > 60 ? 'Enter whole years between 0 and 60.' : '',
    availableDays: values.availableDays?.length ? '' : 'Pick at least one working day.',
    shiftEnd: shiftOk ? '' : 'The shift must be at least 1 hour long (between 9:00 AM and 7:00 PM).',
    bio: bioLength < 20 ? 'Write a short bio (at least 20 characters).' : bioLength > 600 ? 'Keep the bio under 600 characters.' : '',
  });
}

export function validateService(values) {
  const price = Number(values.price);
  const descriptionLength = String(values.description ?? '').trim().length;
  return collect({
    name: isBlank(values.name) ? 'Service name is required.' : String(values.name).trim().length > 60 ? 'Keep the name under 60 characters.' : '',
    category: SERVICE_CATEGORIES.includes(values.category) ? '' : 'Choose a category.',
    price: values.price === '' || !Number.isFinite(price) || price <= 0 || price > 500000 ? 'Enter a price between ₱1 and ₱500,000.' : '',
    duration: SERVICE_DURATIONS.includes(Number(values.duration)) ? '' : 'Choose a duration.',
    description:
      descriptionLength < 20 ? 'Describe the service in at least 20 characters.' : descriptionLength > 300 ? 'Keep the description under 300 characters.' : '',
  });
}

/** Clinic "Register a visit / walk-in" and "Edit appointment" form (veterinarian portal). */
export function validateAppointmentForm(values, { isEdit = false, scheduleLocked = false } = {}) {
  return collect({
    ownerId: isEdit || values.ownerId ? '' : 'Choose a pet owner.',
    petIds: isEdit || values.petIds?.length ? '' : 'Choose at least one pet.',
    serviceId: values.serviceId ? '' : 'Choose the reason for the visit.',
    date: scheduleLocked || values.date ? '' : 'Pick a date.',
    startTime: scheduleLocked || values.startTime ? '' : 'Pick an available time.',
    vetId: scheduleLocked || values.vetId ? '' : 'Choose a veterinarian.',
    source: APPOINTMENT_SOURCES.includes(values.source) ? '' : 'Choose a source.',
    status: !isEdit || APPOINTMENT_STATUSES.includes(values.status) ? '' : 'Choose a status.',
    notes: String(values.notes ?? '').length > 500 ? 'Notes must be 500 characters or fewer.' : '',
  });
}

// ---- Medical record ---------------------------------------------------------------------

/** Optional number in a range; '' when blank or valid. */
function rangeError(value, min, max, message) {
  if (value === '' || value === null || value === undefined) return '';
  const number = Number(value);
  return Number.isFinite(number) && number >= min && number <= max ? '' : message;
}

function lengthError(value, max, label) {
  return String(value ?? '').trim().length > max ? `${label} must be ${max} characters or fewer.` : '';
}

/** The medical record a vet writes when completing a visit. */
export function validateMedicalRecord(values) {
  const followUp = String(values.followUpDate ?? '');
  return collect({
    weight: rangeError(values.weight, 0.01, 150, 'Enter a weight between 0.01 and 150 kg.'),
    temperature: rangeError(values.temperature, 30, 45, 'Enter a temperature between 30 and 45 °C.'),
    diagnosis: isBlank(values.diagnosis) ? 'Diagnosis is required.' : lengthError(values.diagnosis, 500, 'Diagnosis'),
    treatment: isBlank(values.treatment) ? 'Describe the treatment or procedure done.' : lengthError(values.treatment, 1000, 'Treatment'),
    prescription: lengthError(values.prescription, 500, 'Prescription'),
    followUpDate: !followUp ? '' : !/^\d{4}-\d{2}-\d{2}$/.test(followUp) || followUp <= getManilaToday() ? 'Pick a follow-up date after today.' : '',
    remarks: lengthError(values.remarks, 500, 'Remarks'),
  });
}
