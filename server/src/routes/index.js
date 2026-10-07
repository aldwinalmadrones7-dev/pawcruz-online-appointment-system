/**
 * routes/index.js — Every API route, mounted under /api by app.js.
 * protect = must be logged in (valid JWT); adminOnly = role "admin".
 */
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as appointments from '../controllers/appointmentController.js';
import * as auth from '../controllers/authController.js';
import * as contact from '../controllers/contactController.js';
import * as demo from '../controllers/demoController.js';
import * as patients from '../controllers/patientController.js';
import * as pets from '../controllers/petController.js';
import * as services from '../controllers/serviceController.js';
import * as vets from '../controllers/vetController.js';
import { adminOnly, protect } from '../middleware/auth.js';

const router = Router();

// Slow down password guessing and sign-up spam: 20 failed tries per 15 minutes per IP address
// (successful logins don't count, so a busy front desk is never locked out).
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

router.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// ---- Auth --------------------------------------------------------------------------
router.post('/auth/register', authLimiter, auth.register);
router.post('/auth/login', authLimiter, auth.login);
router.get('/auth/me', protect, auth.getMe);
router.put('/auth/me', protect, auth.updateMe);
router.put('/auth/password', protect, auth.changePassword);

// ---- Pets --------------------------------------------------------------------------
router.get('/pets/mine', protect, pets.getMyPets);
router.get('/pets', protect, adminOnly, pets.getPets);
router.post('/pets', protect, pets.createPet);
router.put('/pets/:id', protect, pets.updatePet);
router.delete('/pets/:id', protect, pets.deletePet);

// ---- Appointments (fixed paths before /:id) -----------------------------------------
router.get('/appointments/availability', protect, appointments.getAvailability);
router.get('/appointments/mine', protect, appointments.getMyAppointments);
router.get('/appointments/stats', protect, adminOnly, appointments.getDashboardStats);
router.get('/appointments/counts', protect, appointments.getAppointmentCounts);
router.get('/appointments', protect, adminOnly, appointments.getAppointments);
router.post('/appointments', protect, appointments.createAppointment);
router.get('/appointments/:id', protect, appointments.getAppointmentById);
router.put('/appointments/:id', protect, adminOnly, appointments.updateAppointment);
router.patch('/appointments/:id/rebook', protect, appointments.rescheduleAppointment);
router.patch('/appointments/:id/cancel', protect, appointments.cancelAppointment);
router.patch('/appointments/:id/status', protect, adminOnly, appointments.updateAppointmentStatus);
router.delete('/appointments/:id', protect, adminOnly, appointments.deleteAppointment);

// ---- Veterinarians -------------------------------------------------------------------
router.get('/vets', vets.getVets);
router.get('/vets/:id', vets.getVetById);
router.post('/vets', protect, adminOnly, vets.createVet);
router.put('/vets/:id', protect, adminOnly, vets.updateVet);
router.delete('/vets/:id', protect, adminOnly, vets.deleteVet);

// ---- Services ------------------------------------------------------------------------
router.get('/services', services.getServices);
router.get('/services/:id', services.getServiceById);
router.post('/services', protect, adminOnly, services.createService);
router.put('/services/:id', protect, adminOnly, services.updateService);
router.delete('/services/:id', protect, adminOnly, services.deleteService);

// ---- Patients, owners, contact, demo -------------------------------------------------
router.get('/patients', protect, adminOnly, patients.getPatients);
router.get('/users', protect, adminOnly, patients.getOwners);
router.post('/contact', contactLimiter, contact.sendContactMessage);
router.get('/contact', protect, adminOnly, contact.getContactMessages);
router.post('/demo/reset', protect, adminOnly, demo.resetDemoData);

export default router;
