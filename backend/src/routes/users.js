const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

// Validation rules
const updateUserValidation = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('role')
    .optional()
    .isIn(['siteAdmin', 'artist', 'user'])
    .withMessage('Invalid role'),
];

// All routes require authentication and site admin role
router.use(protect);
router.use(authorize('siteAdmin'));

router.get('/', getUsers);
router.get('/:id', getUser);
router.put('/:id', updateUserValidation, updateUser);
router.delete('/:id', deleteUser);

module.exports = router;

