const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  createRegistration,
  getMyRegistrations,
  getEventRegistrations,
  cancelRegistration,
} = require('../controllers/registrationController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

// Validation rules
const registrationValidation = [
  body('eventId')
    .notEmpty()
    .withMessage('Event ID is required')
    .isMongoId()
    .withMessage('Invalid event ID'),
];

// All routes require authentication
router.use(protect);

// User routes
router.post('/', authorize('user'), registrationValidation, createRegistration);
router.get('/', getMyRegistrations);

// Artist/Site Admin routes
router.get(
  '/event/:eventId',
  authorize('siteAdmin', 'artist'),
  getEventRegistrations
);

// Cancel registration
router.delete('/:id', cancelRegistration);

module.exports = router;

