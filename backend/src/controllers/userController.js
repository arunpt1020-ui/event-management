const { getUserService } = require('../utils/dataService');
const { validationResult } = require('express-validator');

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Site Admin only)
exports.getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search } = req.query;

    // Build query
    const query = {};
    if (role) {
      query.role = role;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);
    const User = getUserService();

    let users = await User.find(query);

    // If using real Mongoose models, convert documents to plain objects
    users = users.map((u) => (u && typeof u.toObject === 'function' ? u.toObject() : u));
    // Filter by search if provided
    if (search) {
      const searchLower = search.toLowerCase();
      users = users.filter(
        (u) =>
          u.name.toLowerCase().includes(searchLower) ||
          u.email.toLowerCase().includes(searchLower)
      );
    }
    
    // Sort and paginate
    users = users
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(skip, skip + Number(limit))
      .map((u) => {
        const { password, __v, ...userWithoutPassword } = u;
        return userWithoutPassword;
      });

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        users,
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

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private (Site Admin only)
exports.getUser = async (req, res) => {
  try {
    const User = getUserService();
    let user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    // Convert to plain object if it's a Mongoose document
    user = user && typeof user.toObject === 'function' ? user.toObject() : user;

    const { password, __v, ...userWithoutPassword } = user;
    res.status(200).json({
      success: true,
      data: {
        user: userWithoutPassword,
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

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Site Admin only)
exports.updateUser = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const User = getUserService();
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Update fields
    const updateData = {};
    if (req.body.name) updateData.name = req.body.name;
    if (req.body.email) updateData.email = req.body.email;
    if (req.body.role) updateData.role = req.body.role;

    const updatedUser = await User.findByIdAndUpdate(req.params.id, updateData);

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
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

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Site Admin only)
exports.deleteUser = async (req, res) => {
  try {
    const User = getUserService();
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Prevent deleting yourself
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account',
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

