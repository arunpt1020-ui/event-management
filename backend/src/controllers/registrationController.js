const { getRegistrationService, getEventService, getUserService } = require('../utils/dataService');
const { validationResult } = require('express-validator');
const emailService = require('../utils/emailService');

// @desc    Register for event
// @route   POST /api/registrations
// @access  Private (User only)
exports.createRegistration = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { eventId } = req.body;
    const Event = getEventService();
    const Registration = getRegistrationService();

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    // Check if event is active
    if (event.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Event is not available for registration',
      });
    }

    // Check if already registered
    const existingRegistration = await Registration.findOne({
      userId: req.user._id,
      eventId: eventId,
    });

    if (existingRegistration) {
      return res.status(400).json({
        success: false,
        message: 'You are already registered for this event',
      });
    }

    // Check capacity
    const registrationCount = await Registration.countDocuments({
      eventId: eventId,
      status: 'confirmed',
    });

    if (registrationCount >= event.capacity) {
      return res.status(400).json({
        success: false,
        message: 'Event is full',
      });
    }

    // Create registration
    const registration = await Registration.create({
      userId: req.user._id,
      eventId: eventId,
    });

    if (registration && registration.populate) {
      await registration.populate('userId');
      await registration.populate('eventId');
    }

    // Send confirmation email
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        await emailService.sendRegistrationConfirmationEmail(
          req.user.email,
          event.title,
          event.date
        );
      } catch (emailError) {
        console.error('Email notification failed:', emailError);
      }
    }

    res.status(201).json({
      success: true,
      data: {
        registration,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get user's registrations
// @route   GET /api/registrations
// @access  Private
exports.getMyRegistrations = async (req, res) => {
  try {
    const Registration = getRegistrationService();
    const registrations = await Registration.find(
      { userId: req.user._id },
      { populate: 'eventId', sort: { registrationDate: -1 } }
    );

    res.status(200).json({
      success: true,
      data: {
        registrations,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get registrations for an event
// @route   GET /api/registrations/event/:eventId
// @access  Private (Artist/Site Admin)
exports.getEventRegistrations = async (req, res) => {
  try {
    const { eventId } = req.params;
    const Event = getEventService();
    const Registration = getRegistrationService();

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    // Check if user is owner or site admin
    if (
      req.user.role !== 'siteAdmin' &&
      event.createdBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view registrations for this event',
      });
    }

    const registrations = await Registration.find(
      { eventId: eventId, status: 'confirmed' },
      { populate: 'userId', sort: { registrationDate: -1 } }
    );

    res.status(200).json({
      success: true,
      data: {
        registrations,
        total: registrations.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Cancel registration
// @route   DELETE /api/registrations/:id
// @access  Private
exports.cancelRegistration = async (req, res) => {
  try {
    const Registration = getRegistrationService();
    const Event = getEventService();
    const User = getUserService();
    
    const registration = await Registration.findById(req.params.id);

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found',
      });
    }

    // Check if user owns this registration or is site admin
    if (
      req.user.role !== 'siteAdmin' &&
      registration.userId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this registration',
      });
    }

    // Get event info for email
    const event = await Event.findById(registration.eventId);

    // Update status to cancelled
    await Registration.findByIdAndUpdate(req.params.id, { status: 'cancelled' });

    // Send cancellation email
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS && event) {
      try {
        const user = await User.findById(registration.userId);
        if (user) {
          await emailService.sendCancellationEmail(user.email, event.title || event.toObject().title);
        }
      } catch (emailError) {
        console.error('Email notification failed:', emailError);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Registration cancelled successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

