/**
 * seedData.js — Demo data for the PawCruz database: 8 veterinary services, 2 vets
 * (Dr. Neil Norman A. Cruz 11 AM–7 PM and Dr. Redmond Lopez 9 AM–5 PM, daily),
 * pet-owner accounts, their pets and 30 appointments.
 * Appointment dates are generated relative to today (Asia/Manila), placed on free
 * 10-minute slots inside each vet's shift, and numbered like final-vet's queue
 * (online "E-001", walk-in "#901"). Ids here are short labels ("v1", "pt01");
 * seed.js swaps them for real MongoDB ObjectIds and hashes the passwords.
 */
import { ACTIVE_STATUSES, APPOINTMENT_STATUS } from '../shared/constants.js';
import { addDaysToKey, getManilaToday, toManilaDateTime } from '../shared/dateUtils.js';
import { addMinutesToTime, getVetWindow, minutesToTime, rangesOverlap, SLOT_MINUTES, timeToMinutes } from '../shared/schedule.js';

const { CONFIRMED, COMPLETED, CANCELLED } = APPOINTMENT_STATUS;

export const services = [
  {
    id: 's1',
    name: 'General Check-up & Consultation',
    category: 'Wellness',
    price: 500,
    duration: 30,
    image: '/images/service-checkup.jpg',
    featured: true,
    description: 'A nose-to-tail physical exam, weight and temperature check, and honest advice on diet and care.',
  },
  {
    id: 's2',
    name: 'Vaccination',
    category: 'Preventive',
    price: 850,
    duration: 30,
    image: '/images/service-vaccination.jpg',
    featured: true,
    description: '5-in-1, 4-in-1 and anti-rabies shots with a vaccine card update, plus reminders for the next dose.',
  },
  {
    id: 's3',
    name: 'Deworming & Tick/Flea Control',
    category: 'Preventive',
    price: 450,
    duration: 30,
    image: '/images/service-deworming.jpg',
    featured: false,
    description: 'Dewormers and tick and flea prevention dosed to your pet’s weight, for dogs, cats and small pets.',
  },
  {
    id: 's4',
    name: 'Skin & Allergy Care',
    category: 'Dermatology',
    price: 900,
    duration: 60,
    image: '/images/service-skin.jpg',
    featured: false,
    description: 'Itching, hair loss, hot spots or ear infections? We find the cause with skin scrapes and cytology.',
  },
  {
    id: 's5',
    name: 'Pet Dental Cleaning',
    category: 'Dental',
    price: 3500,
    duration: 90,
    image: '/images/service-dental.jpg',
    featured: true,
    description: 'Scaling and polishing under safe anesthesia to fight bad breath, tartar and painful gum disease.',
  },
  {
    id: 's6',
    name: 'Spay & Neuter Surgery',
    category: 'Surgery',
    price: 6500,
    duration: 120,
    image: '/images/service-surgery.jpg',
    featured: true,
    description: 'Routine kapon with pre-surgery blood work, pain relief and a clear aftercare plan for a quick recovery.',
  },
  {
    id: 's7',
    name: 'Laboratory & Blood Tests',
    category: 'Diagnostics',
    price: 1800,
    duration: 60,
    image: '/images/service-laboratory.jpg',
    featured: false,
    description: 'CBC, blood chemistry, urinalysis and fecal tests with same-day results for most panels.',
  },
  {
    id: 's8',
    name: 'Exotic Pet Care',
    category: 'Exotic',
    price: 700,
    duration: 30,
    image: '/images/service-exotic.jpg',
    featured: false,
    description: 'Check-ups and husbandry advice for rabbits, birds, hamsters, turtles and other small companions.',
  },
];

export const vets = [
  {
    id: 'v1',
    name: 'Neil Norman A. Cruz',
    title: 'DVM',
    specialty: 'General Practice & Surgery',
    licenseNo: 'VET-04821',
    email: 'neil.cruz@pawcruz.ph',
    phone: '09171110001',
    yearsExperience: 10,
    rating: 4.9,
    reviewCount: 312,
    availableDays: [0, 1, 2, 3, 4, 5, 6],
    shiftStart: '11:00',
    shiftEnd: '19:00',
    photo: '/images/vet-1.jpg',
    education: 'Doctor of Veterinary Medicine',
    languages: ['English', 'Filipino'],
    bio: 'Dr. Neil runs our late lane every day, from 11:00 AM to closing. He handles check-ups, vaccinations and minor procedures, and takes time to explain each step to pet owners.',
  },
  {
    id: 'v2',
    name: 'Redmond Lopez',
    title: 'DVM',
    specialty: 'General Practice & Internal Medicine',
    licenseNo: 'VET-03377',
    email: 'redmond.lopez@pawcruz.ph',
    phone: '09171110002',
    yearsExperience: 8,
    rating: 4.8,
    reviewCount: 268,
    availableDays: [0, 1, 2, 3, 4, 5, 6],
    shiftStart: '09:00',
    shiftEnd: '17:00',
    photo: '/images/vet-2.jpg',
    education: 'Doctor of Veterinary Medicine',
    languages: ['English', 'Filipino'],
    bio: 'Dr. Redmond opens the clinic every morning at 9:00 AM. He sees dogs, cats and small pets for consultations, deworming, skin problems and lab work, with calm, gentle handling.',
  },
];

// Plain-text demo passwords: seed.js hashes them with bcrypt before saving.
const userSeeds = [
  { id: 'u_owner', role: 'owner', firstName: 'Juan', lastName: 'Dela Cruz', email: 'owner@pawcruz.ph', password: 'Owner123!', phone: '09171234567', address: 'Unit 5C Mabuhay Residences, Malate, Manila', joinedDaysAgo: 120 },
  { id: 'u_admin', role: 'admin', firstName: 'Liza', lastName: 'Manalo', email: 'admin@pawcruz.ph', password: 'Admin123!', phone: '09181234567', address: 'PawCruz Veterinary Clinic, Pasay City', joinedDaysAgo: 400 },
  // Extra pet owners so the admin lists, search and pagination have realistic data.
  { id: 'u_o01', firstName: 'Paolo', lastName: 'Garcia', email: 'paolo.garcia@example.com', phone: '09175550101', address: 'Malibay, Pasay City', joinedDaysAgo: 210 },
  { id: 'u_o02', firstName: 'Kristine Mae', lastName: 'Flores', email: 'kristine.flores@example.com', phone: '09175550102', address: 'Baclaran, Parañaque City', joinedDaysAgo: 185 },
  { id: 'u_o03', firstName: 'Mark Anthony', lastName: 'Castillo', email: 'mark.castillo@example.com', phone: '09175550103', address: 'San Isidro, Makati City', joinedDaysAgo: 160 },
  { id: 'u_o04', firstName: 'Angelica', lastName: 'Ramos', email: 'angelica.ramos@example.com', phone: '09175550104', address: 'Maricaban, Pasay City', joinedDaysAgo: 140 },
  { id: 'u_o05', firstName: 'Jerome', lastName: 'Villareal', email: 'jerome.villareal@example.com', phone: '09175550105', address: 'BF Homes, Parañaque City', joinedDaysAgo: 300 },
  { id: 'u_o06', firstName: 'Sofia', lastName: 'Ocampo', email: 'sofia.ocampo@example.com', phone: '09175550106', address: 'Malate, Manila', joinedDaysAgo: 95 },
  { id: 'u_o07', firstName: 'Enrique', lastName: 'Salazar', email: 'enrique.salazar@example.com', phone: '09175550107', address: 'Don Galo, Parañaque City', joinedDaysAgo: 260 },
  { id: 'u_o08', firstName: 'Hannah', lastName: 'Gonzales', email: 'hannah.gonzales@example.com', phone: '09175550108', address: 'San Rafael, Pasay City', joinedDaysAgo: 45 },
  { id: 'u_o09', firstName: 'Gabriel', lastName: 'Torres', email: 'gabriel.torres@example.com', phone: '09175550109', address: 'Pio del Pilar, Makati City', joinedDaysAgo: 75 },
  { id: 'u_o10', firstName: 'Nicole', lastName: 'Fernandez', email: 'nicole.fernandez@example.com', phone: '09175550110', address: 'Tambo, Parañaque City', joinedDaysAgo: 20 },
];

const petSeeds = [
  { id: 'pt01', ownerId: 'u_owner', name: 'Mochi', species: 'Dog', breed: 'Shih Tzu', sex: 'Female', birthDate: '2021-03-14', weight: 6.2, color: 'White & gold', notes: 'Allergic to chicken-based food.' },
  { id: 'pt02', ownerId: 'u_owner', name: 'Kape', species: 'Cat', breed: 'Puspin (Domestic Shorthair)', sex: 'Male', birthDate: '2022-08-01', weight: 4.1, color: 'Brown tabby', notes: '' },
  { id: 'pt03', ownerId: 'u_owner', name: 'Bantay', species: 'Dog', breed: 'Aspin (Askal)', sex: 'Male', birthDate: '2019-11-20', weight: 14, color: 'Black', notes: 'Gets anxious around other dogs.' },
  { id: 'pt04', ownerId: 'u_o01', name: 'Choco', species: 'Dog', breed: 'Labrador Retriever', sex: 'Male', birthDate: '2020-05-09', weight: 29, color: 'Chocolate', notes: '' },
  { id: 'pt05', ownerId: 'u_o02', name: 'Ming-ming', species: 'Cat', breed: 'Persian', sex: 'Female', birthDate: '2020-01-22', weight: 3.8, color: 'White', notes: '' },
  { id: 'pt06', ownerId: 'u_o02', name: 'Luna', species: 'Cat', breed: 'Siamese', sex: 'Female', birthDate: '2023-02-10', weight: 3.1, color: 'Seal point', notes: '' },
  { id: 'pt07', ownerId: 'u_o03', name: 'Max', species: 'Dog', breed: 'Golden Retriever', sex: 'Male', birthDate: '2018-09-30', weight: 32, color: 'Golden', notes: 'Senior — on joint supplements.' },
  { id: 'pt08', ownerId: 'u_o04', name: 'Coco', species: 'Dog', breed: 'Pomeranian', sex: 'Female', birthDate: '2022-12-03', weight: 2.9, color: 'Orange', notes: '' },
  { id: 'pt09', ownerId: 'u_o04', name: 'Peanut', species: 'Rabbit', breed: 'Holland Lop', sex: 'Male', birthDate: '2023-06-18', weight: 1.7, color: 'Broken (spotted)', notes: '' },
  { id: 'pt10', ownerId: 'u_o05', name: 'Rocky', species: 'Dog', breed: 'Siberian Husky', sex: 'Male', birthDate: '2019-04-25', weight: 24, color: 'Gray & white', notes: '' },
  { id: 'pt11', ownerId: 'u_o06', name: 'Tofu', species: 'Cat', breed: 'Ragdoll', sex: 'Male', birthDate: '2021-10-11', weight: 5.6, color: 'Blue bicolor', notes: '' },
  { id: 'pt12', ownerId: 'u_o07', name: 'Kiwi', species: 'Cockatiel', breed: '', sex: 'Unknown', birthDate: '2022-04-04', weight: 0.1, color: 'Gray & yellow', notes: '' },
  { id: 'pt13', ownerId: 'u_o07', name: 'Bella', species: 'Dog', breed: 'Beagle', sex: 'Female', birthDate: '2021-07-07', weight: 11, color: 'Tricolor', notes: '' },
  { id: 'pt14', ownerId: 'u_o08', name: 'Siomai', species: 'Hamster', breed: 'Syrian', sex: 'Female', birthDate: '2025-02-14', weight: 0.15, color: 'Golden', notes: '' },
  { id: 'pt15', ownerId: 'u_o08', name: 'Biscuit', species: 'Dog', breed: 'Corgi', sex: 'Male', birthDate: '2023-09-01', weight: 12, color: 'Red & white', notes: '' },
  { id: 'pt16', ownerId: 'u_o09', name: 'Ube', species: 'Cat', breed: 'British Shorthair', sex: 'Female', birthDate: '2024-01-20', weight: 3.4, color: 'Gray', notes: '' },
  { id: 'pt17', ownerId: 'u_o10', name: 'Pepper', species: 'Dog', breed: 'French Bulldog', sex: 'Male', birthDate: '2022-03-03', weight: 10.5, color: 'Brindle', notes: 'Snores — brachycephalic breed.' },
];

/**
 * The seeded visits (30 appointments; one visit has two pets). `day` is an offset from
 * today: past offsets stay in the past and future ones in the future. `flex` lets the
 * seed pick another on-duty vet when the preferred one is off today.
 */
const visitPlan = [
  // Juan Dela Cruz (owner@pawcruz.ph): Mochi, Kape, Bantay
  { ref: 'PWC-8KD3M', pets: ['pt01'], service: 's1', vet: 'v2', day: -80, time: '10:00', status: COMPLETED, notes: 'First visit — general check-up please.' },
  { ref: 'PWC-Q7Z2P', pets: ['pt02'], service: 's2', vet: 'v2', day: -52, time: '14:00', status: COMPLETED, notes: 'Anti-rabies booster.' },
  { ref: 'PWC-5HJ8R', pets: ['pt03'], service: 's7', vet: 'v1', day: -40, time: '15:00', status: CANCELLED, cancelReason: 'Schedule conflict at work', cancelledBy: 'owner' },
  { ref: 'PWC-M3T9W', pets: ['pt01'], service: 's5', vet: 'v1', day: -30, time: '13:00', status: COMPLETED, notes: 'Bad breath and tartar build-up.' },
  { ref: 'PWC-C6V4N', pets: ['pt03'], service: 's4', vet: 'v2', day: -15, time: '10:00', status: CANCELLED, cancelReason: 'Vet on emergency leave — please rebook', cancelledBy: 'clinic' },
  { ref: 'PWC-7RB2K', pets: ['pt02'], service: 's3', vet: 'v2', day: -9, time: '10:00', status: COMPLETED, source: 'Walk-In' },
  { ref: 'PWC-24X7Q', pets: ['pt01'], service: 's1', vet: 'v1', day: 2, time: '14:00', status: CONFIRMED, notes: 'Follow-up after her dental cleaning.' },
  { ref: 'PWC-X9P5D', pets: ['pt03'], service: 's4', vet: 'v2', day: 5, time: '10:30', status: CONFIRMED, notes: 'Itchy skin and hair loss on his back.' },
  { ref: 'PWC-3LW8F', pets: ['pt02'], service: 's2', vet: 'v2', day: 8, time: '09:30', status: CANCELLED, cancelReason: 'Found a better time', cancelledBy: 'owner' },
  { ref: 'PWC-K4N6S', pets: ['pt03'], service: 's6', vet: 'v1', day: 12, time: '14:00', status: CONFIRMED, notes: 'Neuter (kapon) — fasting from midnight.' },
  { ref: 'PWC-H2Q9V', pets: ['pt02'], service: 's7', vet: 'v2', day: 20, time: '11:00', status: CONFIRMED, notes: 'Annual blood work.' },
  { ref: 'PWC-9DM3T', pets: ['pt01'], service: 's2', vet: 'v2', day: 30, time: '11:00', status: CONFIRMED, notes: '5-in-1 booster.' },
  // Other pet owners
  { ref: 'PWC-P5C7J', pets: ['pt04'], service: 's2', vet: 'v2', day: 0, time: '10:00', status: CONFIRMED, flex: true },
  { ref: 'PWC-6YF2L', pets: ['pt05', 'pt06'], service: 's1', vet: 'v2', day: 0, time: '11:00', status: CONFIRMED, flex: true, notes: 'Both cats sneezing since last week.' },
  { ref: 'PWC-T8G4H', pets: ['pt07'], service: 's7', vet: 'v1', day: 0, time: '15:00', status: CONFIRMED, flex: true, source: 'Walk-In' },
  { ref: 'PWC-2ZK9B', pets: ['pt09'], service: 's8', vet: 'v2', day: -2, time: '10:00', status: COMPLETED },
  { ref: 'PWC-W7S3C', pets: ['pt10'], service: 's1', vet: 'v2', day: -1, time: '09:00', status: COMPLETED, source: 'Walk-In' },
  { ref: 'PWC-4EJ6X', pets: ['pt11'], service: 's5', vet: 'v1', day: -1, time: '14:00', status: COMPLETED },
  { ref: 'PWC-B9R2Y', pets: ['pt13'], service: 's3', vet: 'v2', day: 1, time: '09:00', status: CONFIRMED },
  { ref: 'PWC-F3U8M', pets: ['pt14'], service: 's8', vet: 'v2', day: 1, time: '10:30', status: CONFIRMED, notes: 'Not eating much for two days.' },
  { ref: 'PWC-N6A4Q', pets: ['pt16'], service: 's6', vet: 'v1', day: 1, time: '15:00', status: CONFIRMED },
  { ref: 'PWC-J8V5E', pets: ['pt17'], service: 's4', vet: 'v2', day: 3, time: '10:00', status: CONFIRMED },
  { ref: 'PWC-R2H7U', pets: ['pt04'], service: 's1', vet: 'v1', day: 3, time: '16:00', status: CONFIRMED },
  { ref: 'PWC-V4W2G', pets: ['pt07'], service: 's3', vet: 'v2', day: -20, time: '11:00', status: COMPLETED },
  { ref: 'PWC-S7X3Z', pets: ['pt08'], service: 's1', vet: 'v2', day: -35, time: '10:00', status: CANCELLED, cancelReason: 'Feeling better', cancelledBy: 'owner' },
  { ref: 'PWC-G9B6P', pets: ['pt10'], service: 's7', vet: 'v2', day: -60, time: '09:30', status: COMPLETED },
  { ref: 'PWC-L3E8K', pets: ['pt11'], service: 's2', vet: 'v2', day: 10, time: '14:00', status: CONFIRMED },
  { ref: 'PWC-Y6T5R', pets: ['pt12'], service: 's8', vet: 'v2', day: 14, time: '09:00', status: CONFIRMED },
  { ref: 'PWC-U2M4W', pets: ['pt15'], service: 's6', vet: 'v1', day: 25, time: '15:00', status: CONFIRMED },
];

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

/** Finds a start time in the vet's shift where every pet gets a free back-to-back slot. */
function findFreeTime({ date, vet, petIds, preferredTime, placed }) {
  const window = getVetWindow(vet, date);
  if (!window) return null;
  const length = petIds.length * SLOT_MINUTES;
  const busy = placed.filter((a) => a.date === date && ACTIVE_STATUSES.includes(a.status) && (a.vetId === vet.id || petIds.includes(a.petId)));
  const preferred = timeToMinutes(preferredTime);
  const candidates = [];
  for (let start = window.start; start + length <= window.end; start += SLOT_MINUTES) candidates.push(start);
  candidates.sort((a, b) => (a >= preferred ? a - preferred : 10000 + a) - (b >= preferred ? b - preferred : 10000 + b));
  const free = candidates.find((start) => !busy.some((a) => rangesOverlap(start, start + length, timeToMinutes(a.startTime), timeToMinutes(a.endTime))));
  return free === undefined ? null : minutesToTime(free);
}

/** Places one planned visit on the nearest valid day (and vet, when flexible). */
function placeVisit(item, placed, today) {
  const step = item.day < 0 ? -1 : 1;
  const pool = item.flex ? [item.vet, ...vets.map((v) => v.id).filter((id) => id !== item.vet)] : [item.vet];
  for (let offset = item.day, tries = 0; tries < 30; offset += step, tries += 1) {
    const date = addDaysToKey(today, offset);
    for (const vetId of pool) {
      const vet = vets.find((v) => v.id === vetId);
      const startTime = findFreeTime({ date, vet, petIds: item.pets, preferredTime: item.time, placed });
      if (startTime) return { date, vetId, startTime };
    }
  }
  throw new Error(`Could not place seed visit ${item.ref}`);
}

/** final-vet queue numbers: online visits "E-001" per day; walk-ins "#901" (hour + order in that hour). */
function assignQueueNumbers(appointments) {
  const visits = new Map();
  appointments.forEach((a) => {
    if (!visits.has(a.visitId)) visits.set(a.visitId, a);
  });
  const ordered = [...visits.values()].sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`));
  const counters = {};
  const numbers = {};
  ordered.forEach((a) => {
    const hour = Number(a.startTime.slice(0, 2));
    const key = a.source === 'Online' ? `E|${a.date}` : `W|${a.date}|${hour}`;
    counters[key] = (counters[key] ?? 0) + 1;
    numbers[a.visitId] = a.source === 'Online' ? `E-${String(counters[key]).padStart(3, '0')}` : `#${hour % 12 || 12}${String(counters[key]).padStart(2, '0')}`;
  });
  appointments.forEach((a) => {
    a.queueNumber = numbers[a.visitId];
  });
}

function buildAppointments(today) {
  const placed = [];
  visitPlan.forEach((item, index) => {
    const { date, vetId, startTime } = placeVisit(item, placed, today);
    const service = services.find((s) => s.id === item.service);
    const now = Date.now();
    const created = Math.min(toManilaDateTime(addDaysToKey(date, -(4 + (index % 6))), '10:15').getTime(), now - (index + 1) * HOUR);
    item.pets.forEach((petId, petIndex) => {
      const pet = petSeeds.find((p) => p.id === petId);
      const petStart = addMinutesToTime(startTime, petIndex * SLOT_MINUTES);
      const petEnd = addMinutesToTime(petStart, SLOT_MINUTES);
      const updatedByStatus = {
        [COMPLETED]: toManilaDateTime(date, petEnd).getTime(),
        [CANCELLED]: created + DAY,
        [CONFIRMED]: created,
      };
      placed.push({
        id: `apt_${String(placed.length + 1).padStart(3, '0')}`,
        reference: item.ref,
        visitId: `visit_${String(index + 1).padStart(3, '0')}`,
        ownerId: pet.ownerId,
        petId,
        vetId,
        serviceId: item.service,
        date,
        startTime: petStart,
        endTime: petEnd,
        source: item.source ?? 'Online',
        status: item.status,
        notes: item.notes ?? '',
        price: service.price,
        cancelReason: item.cancelReason ?? '',
        cancelledBy: item.cancelledBy ?? '',
        createdAt: new Date(created).toISOString(),
        updatedAt: new Date(Math.min(updatedByStatus[item.status], now)).toISOString(),
      });
    });
  });
  assignQueueNumbers(placed);
  return placed;
}

function buildUsers() {
  return userSeeds.map(({ joinedDaysAgo, ...user }) => {
    const joined = new Date(Date.now() - joinedDaysAgo * DAY).toISOString();
    return { role: 'owner', avatar: null, password: 'Owner123!', ...user, createdAt: joined, updatedAt: joined };
  });
}

function buildPets() {
  return petSeeds.map((pet, index) => {
    const added = new Date(Date.now() - (100 - index) * DAY).toISOString();
    return { microchip: '', ...pet, createdAt: added, updatedAt: added };
  });
}

/** Builds a fresh copy of every collection (with label ids) for the seeder. */
export function buildSeedData() {
  return {
    services: structuredClone(services),
    vets: structuredClone(vets),
    users: buildUsers(),
    pets: buildPets(),
    appointments: buildAppointments(getManilaToday()),
  };
}
