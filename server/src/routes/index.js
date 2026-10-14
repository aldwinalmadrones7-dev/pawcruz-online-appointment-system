/**
 * routes/index.js — Every API route, mounted under /api by app.js.
 * protect = must be logged in (valid JWT); vetOnly = role "vet"; ownerOnly = role "owner".
 */
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as appointments from '../controllers/appointmentController.js';
import * as auth from '../controllers/authController.js';
import * as contact from '../controllers/contactController.js';
import * as demo from '../controllers/demoController.js';
import * as patients from '../controllers/patientController.js';
import * as pets from '../controllers/petController.js';
import * as queue from '../controllers/queueController.js';
import * as services from '../controllers/serviceController.js';
import * as vets from '../controllers/vetController.js';
import { ownerOnly, protect, vetOnly } from '../middleware/auth.js';

const router = Router();

// Slow down password guessing and sign-up spam: 20 failed tries per 15 minutes per IP address
// (successful logins don't count, so a busy front desk is never locked out). Wrong veterinarian
// sign-up codes count as failed tries too.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many attempts. Please wait a few minutes and try again.', field: null },
});
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many messages. Please try again later.', field: null },
});
// The public queue board refreshes every 15 seconds (4 times a minute per open page); this only
// stops a runaway script, even when a whole classroom shares one IP address.
const queueLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'The queue board is refreshing too often. Please wait a moment.', field: null },
});

router.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// ---- Auth --------------------------------------------------------------------------
router.post('/auth/register', authLimiter, auth.register);
router.post('/auth/login', authLimiter, auth.login);
router.get('/auth/me', protect, auth.getMe);
router.put('/auth/me', protect, auth.updateMe);
router.put('/auth/password', protect, auth.changePassword);

// ---- Pets --------------------------------------------------------------------------
router.get('/pets/mine', protect, pets.getMyPets);
router.get('/pets', protect, vetOnly, pets.getPets);
router.post('/pets', protect, pets.createPet);
router.put('/pets/:id', protect, pets.updatePet);
router.delete('/pets/:id', protect, pets.deletePet);
router.get('/pets/:id/history', protect, appointments.getPetHistory); // completed visits + medical records

// ---- Appointments (fixed paths before /:id) -----------------------------------------
router.get('/appointments/availability', protect, appointments.getAvailability);
router.get('/appointments/mine', protect, appointments.getMyAppointments);
router.get('/appointments/stats', protect, vetOnly, appointments.getDashboardStats);
router.get('/appointments/counts', protect, appointments.getAppointmentCounts);
router.get('/appointments', protect, vetOnly, appointments.getAppointments);
router.post('/appointments', protect, appointments.createAppointment);
router.get('/appointments/:id', protect, appointments.getAppointmentById);
router.put('/appointments/:id', protect, vetOnly, appointments.updateAppointment);
router.patch('/appointments/:id/rebook', protect, appointments.rescheduleAppointment);
router.patch('/appointments/:id/cancel', protect, appointments.cancelAppointment);
router.patch('/appointments/:id/status', protect, vetOnly, appointments.updateAppointmentStatus);
router.patch('/appointments/:id/complete', protect, vetOnly, appointments.completeAppointment); // with the medical record
router.delete('/appointments/:id', protect, vetOnly, appointments.deleteAppointment);

// ---- Live queue (check-in → with the vet; completing = PATCH /appointments/:id/complete) ---
router.get('/queue', queueLimiter, queue.getPublicQueue);
router.get('/queue/mine', protect, ownerOnly, queue.getMyQueue);
router.get('/queue/manage', protect, vetOnly, queue.getManageQueue);
router.patch('/queue/:visitId/check-in', protect, vetOnly, queue.checkIn);
router.patch('/queue/:visitId/call', protect, vetOnly, queue.callIn);
router.patch('/queue/:visitId/undo', protect, vetOnly, queue.undoStep);

// ---- Veterinarians (/vets/me before /vets/:id) -----------------------------------------
router.get('/vets', vets.getVets);
router.get('/vets/me', protect, vetOnly, vets.getMyVet);
router.put('/vets/me', protect, vetOnly, vets.updateMyVet);
router.get('/vets/:id', vets.getVetById);

// ---- Services ------------------------------------------------------------------------
router.get('/services', services.getServices);
router.get('/services/:id', services.getServiceById);
router.post('/services', protect, vetOnly, services.createService);
router.put('/services/:id', protect, vetOnly, services.updateService);
router.delete('/services/:id', protect, vetOnly, services.deleteService);

// ---- Patients, owners, contact, demo -------------------------------------------------
router.get('/patients', protect, vetOnly, patients.getPatients);
router.get('/users', protect, vetOnly, patients.getOwners);
router.post('/contact', contactLimiter, contact.sendContactMessage);
router.get('/contact', protect, vetOnly, contact.getContactMessages);
router.post('/demo/reset', protect, vetOnly, demo.resetDemoData);

export default router;
