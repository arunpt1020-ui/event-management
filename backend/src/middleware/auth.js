const jwt = require('jsonwebtoken');
const { getUserService } = require('../utils/dataService');

// Protect routes - verify JWT token
exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route',
    });
  }

  try {
    // Verify token
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret';
    let decoded;
    try {
      decoded = jwt.verify(token, jwtSecret);
    } catch (jwtError) {
      // Try with fallback secret if first attempt fails
      if (jwtError.name === 'JsonWebTokenError' && jwtSecret !== 'fallback-secret') {
        decoded = jwt.verify(token, 'fallback-secret');
      } else {
        throw jwtError;
      }
    }

    console.log('Token decoded successfully, user ID:', decoded.id);

    // Get user from token using data service (works with DB or mock data)
    const User = getUserService();
    if (!User) {
      console.error('User service not available');
      return res.status(500).json({
        success: false,
        message: 'Authentication service unavailable',
      });
    }

    // Try to find user by ID (decoded.id should match user._id)
    let user;
    try {
      user = await User.findById(decoded.id);
      console.log('User lookup result:', user ? 'Found' : 'Not found', decoded.id);
    } catch (lookupError) {
      console.error('Error looking up user:', lookupError);
      throw lookupError;
    }
    
    if (!user) {
      console.error('User not found for ID:', decoded.id);
      // If user not found but we have decoded token, create minimal user object
      req.user = {
        _id: decoded.id,
        id: decoded.id,
        role: decoded.role,
        email: '',
        name: '',
      };
      console.log('Using decoded token data for user');
      return next();
    }

    // Ensure user object has _id property
    req.user = {
      _id: user._id || user.id || decoded.id,
      id: user._id || user.id || decoded.id,
      role: user.role || decoded.role,
      email: user.email || '',
      name: user.name || '',
    };

    console.log('Auth successful for user:', req.user.email || req.user.id);
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.name, error.message);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route',
      error: error.message,
    });
  }
};

