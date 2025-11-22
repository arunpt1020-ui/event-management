// Role-based access control middleware
const { getEventService, getRegistrationService, getUserService } = require('../utils/dataService');

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`,
      });
    }
    next();
  };
};

// Check if user is owner or site admin
exports.checkOwnership = (model, paramName = 'id') => {
  return async (req, res, next) => {
    try {
      // Determine which service to use. Support:
      // - passing a Mongoose model (has modelName)
      // - passing a mock service object (has findById)
      // - passing a getter function (e.g. getEventService) which will be called per-request
      let service;

      // If caller passed a getter function, call it to obtain the current service
      if (typeof model === 'function') {
        try {
          service = model();
        } catch (e) {
          service = null;
        }
      }

      // If that didn't yield a service, check if model itself looks like a Mongoose model or service
      if (!service) {
        if (model && model.modelName) {
          service = model;
        } else if (model && typeof model === 'object' && typeof model.findById === 'function') {
          service = model;
        }
      }

      // As a fallback, attempt to resolve by known getters based on model name string
      if (!service) {
        // try mapping known model names to getters
        if (model && model === 'Event') service = getEventService();
        else if (model && model === 'Registration') service = getRegistrationService();
        else if (model && model === 'User') service = getUserService();
      }

      if (!service) {
        return res.status(500).json({ success: false, message: 'Server error: service unavailable' });
      }

      const resource = await service.findById(req.params[paramName]);

      if (!resource) {
        // Helpful debug logging to understand which service/ID was used
        const serviceType = service && service.modelName ? `model:${service.modelName}` : (service && service.find ? 'mock-service' : 'unknown-service');
        console.warn(`Resource not found — service=${serviceType}, param=${paramName}, id=${req.params[paramName]}`);
        return res.status(404).json({
          success: false,
          message: 'Resource not found',
        });
      }

      // Site admin can access any resource
      if (req.user.role === 'siteAdmin') {
        req.resource = resource;
        return next();
      }

      // Check if user is the owner
      const ownerField = resource.createdBy || resource.userId;
      if (ownerField && ownerField.toString() === req.user._id.toString()) {
        req.resource = resource;
        return next();
      }

      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this resource',
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Server error',
      });
    }
  };
};

