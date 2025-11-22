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
      // Determine which service to use based on model name
      let service;
      if (model.modelName === 'Event' || (typeof model === 'function' && model.name === 'Event')) {
        service = getEventService();
      } else if (model.modelName === 'Registration' || (typeof model === 'function' && model.name === 'Registration')) {
        service = getRegistrationService();
      } else if (model.modelName === 'User' || (typeof model === 'function' && model.name === 'User')) {
        service = getUserService();
      } else {
        service = model; // Fallback to original model
      }
      
      const resource = await service.findById(req.params[paramName]);

      if (!resource) {
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

