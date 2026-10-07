/**
 * constants.js — App-wide constants shared by the UI and the service layer:
 * clinic details, roles, appointment statuses/sources, categories and storage keys.
 */

export const APP_NAME = 'PawCruz';
export const APP_TAGLINE = "Book your pet's next visit in under a minute.";

export const CLINIC_INFO = {
  name: 'PawCruz Veterinary Clinic',
  address: '2189 Stall G, Felimarc Pet Center, A. Luna St, Pasay City',
  phones: ['0938537649', '0917165379'],
  email: 'aldwinalmadrones7@gmail.com',
  mapUrl: 'https://www.google.com/maps/search/?api=1&query=Felimarc+Pet+Center+A.+Luna+St+Pasay+City',
};

export const ROLES = {
  OWNER: 'owner', // pet owner (the "patient" account)
  ADMIN: 'admin', // clinic admin / front desk
};

export const APPOINTMENT_STATUS = {
  CONFIRMED: 'Confirmed',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export const APPOINTMENT_STATUSES = Object.values(APPOINTMENT_STATUS);

/** Statuses that still hold a time slot on the schedule. */
export const ACTIVE_STATUSES = [APPOINTMENT_STATUS.CONFIRMED];

export const APPOINTMENT_SOURCES = ['Online', 'Walk-In'];

/** Every booking is a general consultation; the reason for visit is picked from the services list. */
export const CONSULTATION_TYPE = 'General Consultation';

export const SERVICE_CATEGORIES = ['Wellness', 'Preventive', 'Dermatology', 'Dental', 'Surgery', 'Diagnostics', 'Exotic'];

export const SERVICE_DURATIONS = [30, 60, 90, 120];

export const VET_SPECIALTIES = [
  'General Practice',
  'Surgery',
  'Dermatology',
  'Dentistry',
  'Internal Medicine',
  'Feline Medicine',
  'Exotic Animals',
  'Emergency & Critical Care',
];

export const WEEKDAYS = [
  { value: 0, short: 'Sun', long: 'Sunday' },
  { value: 1, short: 'Mon', long: 'Monday' },
  { value: 2, short: 'Tue', long: 'Tuesday' },
  { value: 3, short: 'Wed', long: 'Wednesday' },
  { value: 4, short: 'Thu', long: 'Thursday' },
  { value: 5, short: 'Fri', long: 'Friday' },
  { value: 6, short: 'Sat', long: 'Saturday' },
];

/** Monday first (PawCruz is open every day). */
export const WEEKDAYS_MONDAY_FIRST = [...WEEKDAYS.slice(1), WEEKDAYS[0]];

export const PAGE_SIZE_OPTIONS = [5, 10, 20];

/** How far ahead pet owners may book. */
export const BOOKING_WINDOW_DAYS = 60;

/** Most pets one owner can book into a single visit (each pet gets its own consecutive slot). */
export const MAX_PETS_PER_VISIT = 4;

export const STORAGE_KEYS = {
  TOKEN: 'pawcruz_token',
  USER: 'pawcruz_user',
  THEME: 'pawcruz_theme',
};

/** Fired after any appointment change so badges and counters can refresh. */
export const APPOINTMENTS_CHANGED_EVENT = 'pawcruz:appointments-changed';

/** Fired when the API rejects the saved token, so the app can log the user out. */
export const SESSION_EXPIRED_EVENT = 'pawcruz:session-expired';
