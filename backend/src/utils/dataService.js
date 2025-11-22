const { getConnectionStatus } = require('../config/database');
const { userService, eventService, registrationService } = require('./mockDataService');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Lazy load models only when DB is connected
const getModels = () => {
  if (getConnectionStatus()) {
    return {
      User: require('../models/User'),
      Event: require('../models/Event'),
      Registration: require('../models/Registration'),
    };
  }
  return null;
};

// Check if database is connected
const isDBConnected = () => {
  return getConnectionStatus();
};

// Get user service (DB or Mock)
const getUserService = () => {
  if (isDBConnected()) {
    const models = getModels();
    return models ? models.User : null;
  }
  return {
    findOne: async (query) => {
      const user = await userService.findOne(query);
      if (!user) return null;
      // Create a mock user object with methods
      return {
        ...user,
        async matchPassword(password) {
          // For mock data, check against known passwords
          // These match the seed data passwords
          const mockPasswords = {
            'admin@example.com': 'admin123',
            'artist@example.com': 'artist123',
            'user@example.com': 'user123',
            'john@example.com': 'password123',
            'jane@example.com': 'password123',
          };
          
          // First check if password matches known mock passwords
          if (mockPasswords[user.email] === password) {
            return true;
          }
          
          // Also try bcrypt compare in case password was hashed
          if (user.password && user.password.startsWith('$2a$')) {
            try {
              return await bcrypt.compare(password, user.password);
            } catch (e) {
              // Fall through
            }
          }
          
          return false;
        },
        generateToken() {
          return jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET || 'fallback-secret',
            { expiresIn: process.env.JWT_EXPIRE || '30d' }
          );
        },
        toObject: () => user,
        _id: user._id,
      };
    },
    findById: async (id) => {
      const user = await userService.findById(id);
      if (!user) return null;
      return {
        ...user,
        toObject: () => user,
        _id: user._id,
      };
    },
    create: async (userData) => {
      // Hash password for mock
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const newUser = await userService.create({
        ...userData,
        password: hashedPassword,
      });
      return {
        ...newUser,
        generateToken() {
          return jwt.sign(
            { id: newUser._id, role: newUser.role },
            process.env.JWT_SECRET || 'fallback-secret',
            { expiresIn: process.env.JWT_EXPIRE || '30d' }
          );
        },
        toObject: () => newUser,
        _id: newUser._id,
      };
    },
    find: userService.find,
    findByIdAndUpdate: userService.findByIdAndUpdate,
    findByIdAndDelete: userService.findByIdAndDelete,
    countDocuments: userService.countDocuments,
  };
};

// Get event service (DB or Mock)
const getEventService = () => {
  if (isDBConnected()) {
    const models = getModels();
    return models ? models.Event : null;
  }
  return {
    find: async (query, options = {}) => {
      const events = await eventService.find(query, options);
      return events.map((event) => ({
        ...event,
        toObject: () => event,
        _id: event._id,
        populate: async (field) => {
          // Already populated in mock service
          return {
            ...event,
            toObject: () => event,
          };
        },
      }));
    },
    findById: async (id) => {
      const event = await eventService.findById(id);
      if (!event) return null;
      return {
        ...event,
        toObject: () => event,
        _id: event._id,
        populate: async (field) => {
          return {
            ...event,
            toObject: () => event,
          };
        },
      };
    },
    create: async (eventData) => {
      const newEvent = await eventService.create(eventData);
      return {
        ...newEvent,
        toObject: () => newEvent,
        _id: newEvent._id,
        populate: async (field) => {
          return {
            ...newEvent,
            toObject: () => newEvent,
          };
        },
      };
    },
    findByIdAndUpdate: async (id, update) => {
      const event = await eventService.findByIdAndUpdate(id, update);
      if (!event) return null;
      return {
        ...event,
        toObject: () => event,
        _id: event._id,
        populate: async (field) => {
          return {
            ...event,
            toObject: () => event,
          };
        },
        save: async () => event,
      };
    },
    findByIdAndDelete: async (id) => {
      return await eventService.findByIdAndDelete(id);
    },
    countDocuments: eventService.countDocuments,
  };
};

// Get registration service (DB or Mock)
const getRegistrationService = () => {
  if (isDBConnected()) {
    const models = getModels();
    return models ? models.Registration : null;
  }
  return {
    find: async (query, options = {}) => {
      const registrations = await registrationService.find(query, options);
      return registrations.map((reg) => ({
        ...reg,
        toObject: () => reg,
        _id: reg._id,
        populate: async (field) => {
          return {
            ...reg,
            toObject: () => reg,
          };
        },
      }));
    },
    findOne: async (query) => {
      const reg = await registrationService.findOne(query);
      if (!reg) return null;
      return {
        ...reg,
        toObject: () => reg,
        _id: reg._id,
        populate: async (field) => {
          return {
            ...reg,
            toObject: () => reg,
          };
        },
      };
    },
    findById: async (id) => {
      const reg = await registrationService.findById(id);
      if (!reg) return null;
      return {
        ...reg,
        toObject: () => reg,
        _id: reg._id,
      };
    },
    create: async (regData) => {
      const newReg = await registrationService.create(regData);
      return {
        ...newReg,
        toObject: () => newReg,
        _id: newReg._id,
        populate: async (field) => {
          return {
            ...newReg,
            toObject: () => newReg,
          };
        },
      };
    },
    findByIdAndUpdate: async (id, update) => {
      const reg = await registrationService.findByIdAndUpdate(id, update);
      if (!reg) return null;
      return {
        ...reg,
        toObject: () => reg,
        _id: reg._id,
        save: async () => reg,
      };
    },
    findByIdAndDelete: async (id) => {
      return await registrationService.findByIdAndDelete(id);
    },
    deleteMany: registrationService.deleteMany,
    countDocuments: registrationService.countDocuments,
  };
};

module.exports = {
  isDBConnected,
  getUserService,
  getEventService,
  getRegistrationService,
};

