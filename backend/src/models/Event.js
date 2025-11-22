const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide an event title'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Please provide an event description'],
    trim: true,
  },
  date: {
    type: Date,
    required: [true, 'Please provide an event date'],
  },
  venue: {
    type: String,
    required: [true, 'Please provide a venue'],
    trim: true,
  },
  capacity: {
    type: Number,
    required: [true, 'Please provide event capacity'],
    min: [1, 'Capacity must be at least 1'],
  },
  price: {
    type: Number,
    required: [true, 'Please provide event price'],
    min: [0, 'Price cannot be negative'],
    default: 0,
  },
  category: {
    type: String,
    required: [true, 'Please provide a category'],
    trim: true,
  },
  image: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['active', 'cancelled'],
    default: 'active',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update updatedAt before saving
eventSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Event', eventSchema);

