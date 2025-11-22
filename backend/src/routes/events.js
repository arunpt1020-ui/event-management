const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
} = require('../controllers/eventController');
const { protect } = require('../middleware/auth');
const { authorize, checkOwnership } = require('../middleware/roleCheck');
const upload = require('../utils/upload');
const { getEventService } = require('../utils/dataService');

// Validation rules
const eventValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('date').isISO8601().withMessage('Please provide a valid date'),
  body('venue').trim().notEmpty().withMessage('Venue is required'),
  body('capacity')
    .isInt({ min: 1 })
    .withMessage('Capacity must be a positive integer'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a non-negative number'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('status')
    .optional()
    .isIn(['active', 'cancelled'])
    .withMessage('Invalid status'),
];

// Public routes
router.get('/', getEvents);
router.get('/:id', getEvent);

// Protected routes
router.post(
  '/',
  protect,
  authorize('siteAdmin', 'artist'),
  upload.single('image'),
  eventValidation,
  createEvent
);

router.put(
  '/:id',
  protect,
  // Pass the getter so ownership check uses the current service (mock or DB) at request time
  checkOwnership(getEventService),
  upload.single('image'),
  eventValidation,
  updateEvent
);

router.delete('/:id', protect, checkOwnership(getEventService), deleteEvent);

module.exports = router;

