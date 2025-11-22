const { getUserService } = require('../utils/dataService');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { name, email, password, role } = req.body;
    const User = getUserService();

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email',
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'user',
    });

    // Generate token
    const token = user.generateToken();

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        token,
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

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;
    const User = getUserService();

    // Check if user exists - include password (schema has password select: false)
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Generate token
    const token = user.generateToken();

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        token,
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

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    // If req.user is already set by middleware, use it
    if (req.user && req.user._id) {
      const User = getUserService();
      const user = await User.findById(req.user._id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          user: {
            id: user._id || user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt,
            profileImage: user.profileImage || '',
            coverImage: user.coverImage || '',
          },
        },
      });
    }

    // Fallback: return user from req.user if available
    if (req.user) {
      return res.status(200).json({
        success: true,
        data: {
          user: {
            id: req.user._id || req.user.id,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role,
            createdAt: req.user.createdAt,
            profileImage: req.user.profileImage || '',
            coverImage: req.user.coverImage || '',
          },
        },
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Not authenticated',
    });
  } catch (error) {
    console.error('getMe error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Update current user's profile (including profile/cover images)
// @route   PUT /api/auth/me
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const User = getUserService();

    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const userId = req.user._id;

    // Build update data
    const updateData = {};
    if (req.body.name) updateData.name = req.body.name;
    if (req.body.email) updateData.email = req.body.email;

    // Files (profileImage, coverImage) handled via multer fields
    if (req.files) {
      if (req.files.profileImage && req.files.profileImage[0]) {
        updateData.profileImage = '/uploads/' + req.files.profileImage[0].filename;
      }
      if (req.files.coverImage && req.files.coverImage[0]) {
        updateData.coverImage = '/uploads/' + req.files.coverImage[0].filename;
      }
    }

    // Password handling: need to hash for mock or trigger pre-save for Mongoose
    const newPassword = req.body.password;

    if (newPassword) {
      // Try to load the user doc first
      const userDoc = await User.findById(userId);

      // If the returned object has a save method, assume it's a Mongoose document
      if (userDoc && typeof userDoc.save === 'function') {
        if (updateData.name) userDoc.name = updateData.name;
        if (updateData.email) userDoc.email = updateData.email;
        if (updateData.profileImage) userDoc.profileImage = updateData.profileImage;
        if (updateData.coverImage) userDoc.coverImage = updateData.coverImage;
        userDoc.password = newPassword;
        await userDoc.save();

        const u = userDoc && typeof userDoc.toObject === 'function' ? userDoc.toObject() : userDoc;
        const { password, __v, ...safeUser } = u;
        return res.status(200).json({ success: true, data: { user: safeUser } });
      }

      // Mock path: hash password then update
      const hashed = await bcrypt.hash(newPassword, 10);
      updateData.password = hashed;
      const updated = await User.findByIdAndUpdate(userId, updateData);
      if (!updated) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      const u = updated && typeof updated.toObject === 'function' ? updated.toObject() : updated;
      const { password, __v, ...safeUser } = u;
      return res.status(200).json({ success: true, data: { user: safeUser } });
    }

    // No password change: use findByIdAndUpdate for both DB and mock paths
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { ...updateData, updatedAt: Date.now() },
      { new: true }
    ).catch(async (err) => {
      // Some mock implementations don't accept options; try without options
      return await User.findByIdAndUpdate(userId, { ...updateData, updatedAt: Date.now() });
    });

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const u = updatedUser && typeof updatedUser.toObject === 'function' ? updatedUser.toObject() : updatedUser;
    const { password, __v, ...safeUser } = u;
    res.status(200).json({ success: true, data: { user: safeUser } });
  } catch (error) {
    console.error('updateProfile error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

