const { getEventService, getRegistrationService } = require('../utils/dataService');
const { validationResult } = require('express-validator');

// @desc    Get all events with search and filter
// @route   GET /api/events
// @access  Public
exports.getEvents = async (req, res) => {
  try {
    const {
      search,
      category,
      minPrice,
      maxPrice,
      startDate,
      endDate,
      status,
      page = 1,
      limit = 10,
    } = req.query;

    // Build query
    const query = {};

    // Search by title or description
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Filter by price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Filter by date range
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Get events
    const Event = getEventService();
    const events = await Event.find(query, {
      populate: 'createdBy',
      sort: { createdAt: -1 },
      skip,
      limit: Number(limit),
    });

    // Get total count
    const total = await Event.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        events,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
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

// @desc    Get single event
// @route   GET /api/events/:id
// @access  Public
exports.getEvent = async (req, res) => {
  try {
    const Event = getEventService();
    const Registration = getRegistrationService();
    
    const event = await Event.findById(req.params.id);
    if (event && event.populate) {
      await event.populate('createdBy');
    }

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    // Get registration count
    const registrationCount = await Registration.countDocuments({
      eventId: event._id,
      status: 'confirmed',
    });

    const eventObj = event.toObject ? event.toObject() : event;
    res.status(200).json({
      success: true,
      data: {
        event: {
          ...eventObj,
          registrationCount,
          availableSpots: eventObj.capacity - registrationCount,
        },
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

// @desc    Create event
// @route   POST /api/events
// @access  Private (Artist/Site Admin)
exports.createEvent = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const Event = getEventService();
    
    const eventData = {
      ...req.body,
      createdBy: req.user._id,
    };

    // Add image path if uploaded
    if (req.file) {
      eventData.image = `/uploads/${req.file.filename}`;
    }

    const event = await Event.create(eventData);

    // Populate createdBy
    if (event && event.populate) {
      await event.populate('createdBy');
    }

    // Send email notification (optional, can be async)
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        const emailService = require('../utils/emailService');
        await emailService.sendEventCreationEmail(
          req.user.email,
          event.title
        );
      } catch (emailError) {
        console.error('Email notification failed:', emailError);
      }
    }

    res.status(201).json({
      success: true,
      data: {
        event,
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

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private (Owner/Site Admin)
exports.updateEvent = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const Event = getEventService();
    let event = req.resource;

    // Update fields
    const updateData = { ...req.body };
    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`;
    }

    event = await Event.findByIdAndUpdate(event._id, updateData);
    if (event && event.populate) {
      await event.populate('createdBy');
    }

    res.status(200).json({
      success: true,
      data: {
        event,
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

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private (Owner/Site Admin)
exports.deleteEvent = async (req, res) => {
  try {
    const Event = getEventService();
    const Registration = getRegistrationService();
    const event = req.resource;

    // Delete all registrations for this event
    await Registration.deleteMany({ eventId: event._id });

    // Delete event
    await Event.findByIdAndDelete(event._id);

    res.status(200).json({
      success: true,
      message: 'Event deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

