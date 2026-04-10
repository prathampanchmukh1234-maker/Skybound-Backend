import { Router } from 'express';
import * as paymentController from '../controllers/paymentController.js';
import * as lifeCalendarController from '../controllers/lifeCalendarController.js';
import * as bookingController from '../controllers/bookingController.js';
import * as tripPlanController from '../controllers/tripPlanController.js';
import * as userController from '../controllers/userController.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

// Payment Routes
router.post('/payment/create-order', requireAuth, paymentController.createOrder);
router.post('/payment/verify', requireAuth, paymentController.verifyPayment);

// User Routes
router.get('/users/:userId', requireAuth, userController.getUserProfile);
router.post('/users', requireAuth, userController.createUserProfile);
router.patch('/users/:userId', requireAuth, userController.updateUserProfile);
router.delete('/users/:userId/delete', requireAuth, userController.deleteUserAccount);

// Trip Plan Routes
router.get('/trip-plans/:userId', requireAuth, tripPlanController.getTripPlans);
router.post('/trip-plans', requireAuth, tripPlanController.createTripPlan);
router.delete('/trip-plans/:id', requireAuth, tripPlanController.deleteTripPlan);

// Life Calendar Routes
router.get('/life-calendar/profile/:userId', requireAuth, lifeCalendarController.getProfile);
router.post('/life-calendar/profile', requireAuth, lifeCalendarController.upsertProfile);

router.get('/life-calendar/destinations/:userId', requireAuth, lifeCalendarController.getDestinations);
router.post('/life-calendar/destinations', requireAuth, lifeCalendarController.createDestination);
router.patch('/life-calendar/destinations/:id', requireAuth, lifeCalendarController.updateDestination);
router.delete('/life-calendar/destinations/:id', requireAuth, lifeCalendarController.deleteDestination);

router.get('/life-calendar/trips/:userId', requireAuth, lifeCalendarController.getTrips);
router.post('/life-calendar/trips', requireAuth, lifeCalendarController.createTrip);
router.patch('/life-calendar/trips/:id', requireAuth, lifeCalendarController.updateTrip);
router.delete('/life-calendar/trips/:id', requireAuth, lifeCalendarController.deleteTrip);

// Booking Routes
router.get('/bookings/:userId', requireAuth, bookingController.getBookings);
router.post('/bookings', requireAuth, bookingController.createBooking);
router.post('/bookings/cancel/:id', requireAuth, bookingController.cancelBooking);

export default router;
