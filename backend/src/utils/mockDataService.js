const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const DATA_DIR = path.join(__dirname, '../data/mock');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const EVENTS_FILE = path.join(DATA_DIR, 'events.json');
const REGISTRATIONS_FILE = path.join(DATA_DIR, 'registrations.json');

// Helper functions
const readJSON = (filePath) => {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    return [];
  }
};

const writeJSON = (filePath, data) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error.message);
    return false;
  }
};

const generateId = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// User operations
const userService = {
  async findOne(query) {
    const users = readJSON(USERS_FILE);
    const key = Object.keys(query)[0];
    const value = query[key];
    return users.find((user) => user[key] === value) || null;
  },

  async findById(id) {
    const users = readJSON(USERS_FILE);
    return users.find((user) => user._id === id) || null;
  },

  async find(query = {}) {
    let users = readJSON(USERS_FILE);
    
    // Simple query filtering
    if (query.role) {
      users = users.filter((user) => user.role === query.role);
    }
    
    return users;
  },

  async create(userData) {
    const users = readJSON(USERS_FILE);
    const newUser = {
      _id: generateId(),
      ...userData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    users.push(newUser);
    writeJSON(USERS_FILE, users);
    return newUser;
  },

  async findByIdAndUpdate(id, update, options = {}) {
    const users = readJSON(USERS_FILE);
    const index = users.findIndex((user) => user._id === id);
    if (index === -1) return null;
    
    users[index] = {
      ...users[index],
      ...update,
      updatedAt: new Date().toISOString(),
    };
    writeJSON(USERS_FILE, users);
    return users[index];
  },

  async findByIdAndDelete(id) {
    const users = readJSON(USERS_FILE);
    const filtered = users.filter((user) => user._id !== id);
    if (filtered.length === users.length) return null;
    writeJSON(USERS_FILE, filtered);
    return { deleted: true };
  },

  async countDocuments(query = {}) {
    const users = this.find(query);
    return (await users).length;
  },
};

// Event operations
const eventService = {
  async find(query = {}, options = {}) {
    let events = readJSON(EVENTS_FILE);
    
    // Search filter
    if (query.$or) {
      const searchTerm = query.$or[0].title.$regex;
      events = events.filter(
        (event) =>
          event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Category filter
    if (query.category) {
      events = events.filter((event) => event.category === query.category);
    }
    
    // Price range filter
    if (query.price) {
      if (query.price.$gte) {
        events = events.filter((event) => event.price >= query.price.$gte);
      }
      if (query.price.$lte) {
        events = events.filter((event) => event.price <= query.price.$lte);
      }
    }
    
    // Date range filter
    if (query.date) {
      if (query.date.$gte) {
        events = events.filter((event) => new Date(event.date) >= new Date(query.date.$gte));
      }
      if (query.date.$lte) {
        events = events.filter((event) => new Date(event.date) <= new Date(query.date.$lte));
      }
    }
    
    // Status filter
    if (query.status) {
      events = events.filter((event) => event.status === query.status);
    }
    
    // Sort
    if (options.sort) {
      events.sort((a, b) => {
        const field = options.sort.createdAt === -1 ? 'createdAt' : 'date';
        return new Date(b[field]) - new Date(a[field]);
      });
    }
    
    // Pagination
    if (options.skip !== undefined && options.limit !== undefined) {
      events = events.slice(options.skip, options.skip + options.limit);
    }
    
    // Populate createdBy
    if (options.populate) {
      const users = readJSON(USERS_FILE);
      events = events.map((event) => {
        const creator = users.find((u) => u._id === event.createdBy);
        return {
          ...event,
          createdBy: creator ? { _id: creator._id, name: creator.name, email: creator.email } : event.createdBy,
        };
      });
    }
    
    return events;
  },

  async findById(id) {
    const events = readJSON(EVENTS_FILE);
    const event = events.find((e) => e._id === id);
    if (!event) return null;
    
    // Populate createdBy
    const users = readJSON(USERS_FILE);
    const creator = users.find((u) => u._id === event.createdBy);
    return {
      ...event,
      createdBy: creator ? { _id: creator._id, name: creator.name, email: creator.email } : event.createdBy,
    };
  },

  async create(eventData) {
    const events = readJSON(EVENTS_FILE);
    const newEvent = {
      _id: generateId(),
      ...eventData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    events.push(newEvent);
    writeJSON(EVENTS_FILE, events);
    
    // Populate createdBy
    const users = readJSON(USERS_FILE);
    const creator = users.find((u) => u._id === newEvent.createdBy);
    return {
      ...newEvent,
      createdBy: creator ? { _id: creator._id, name: creator.name, email: creator.email } : newEvent.createdBy,
    };
  },

  async findByIdAndUpdate(id, update) {
    const events = readJSON(EVENTS_FILE);
    const index = events.findIndex((event) => event._id === id);
    if (index === -1) return null;
    
    events[index] = {
      ...events[index],
      ...update,
      updatedAt: new Date().toISOString(),
    };
    writeJSON(EVENTS_FILE, events);
    
    // Populate createdBy
    const users = readJSON(USERS_FILE);
    const creator = users.find((u) => u._id === events[index].createdBy);
    return {
      ...events[index],
      createdBy: creator ? { _id: creator._id, name: creator.name, email: creator.email } : events[index].createdBy,
    };
  },

  async findByIdAndDelete(id) {
    const events = readJSON(EVENTS_FILE);
    const filtered = events.filter((event) => event._id !== id);
    if (filtered.length === events.length) return null;
    writeJSON(EVENTS_FILE, filtered);
    return { deleted: true };
  },

  async countDocuments(query = {}) {
    const events = await this.find(query);
    return events.length;
  },
};

// Registration operations
const registrationService = {
  async find(query = {}, options = {}) {
    let registrations = readJSON(REGISTRATIONS_FILE);
    
    if (query.userId) {
      registrations = registrations.filter((r) => r.userId === query.userId);
    }
    
    if (query.eventId) {
      registrations = registrations.filter((r) => r.eventId === query.eventId);
    }
    
    if (query.status) {
      registrations = registrations.filter((r) => r.status === query.status);
    }
    
    // Sort
    if (options.sort) {
      registrations.sort((a, b) => new Date(b.registrationDate) - new Date(a.registrationDate));
    }
    
    // Populate
    if (options.populate) {
      const users = readJSON(USERS_FILE);
      const events = readJSON(EVENTS_FILE);
      
      registrations = registrations.map((reg) => {
        const user = users.find((u) => u._id === reg.userId);
        const event = events.find((e) => e._id === reg.eventId);
        return {
          ...reg,
          userId: user ? { _id: user._id, name: user.name, email: user.email } : reg.userId,
          eventId: event || reg.eventId,
        };
      });
    }
    
    return registrations;
  },

  async findOne(query) {
    const registrations = readJSON(REGISTRATIONS_FILE);
    const key = Object.keys(query)[0];
    const value = query[key];
    return registrations.find((r) => r[key] === value) || null;
  },

  async findById(id) {
    const registrations = readJSON(REGISTRATIONS_FILE);
    return registrations.find((r) => r._id === id) || null;
  },

  async create(registrationData) {
    const registrations = readJSON(REGISTRATIONS_FILE);
    const newRegistration = {
      _id: generateId(),
      ...registrationData,
      registrationDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    registrations.push(newRegistration);
    writeJSON(REGISTRATIONS_FILE, registrations);
    
    // Populate
    const users = readJSON(USERS_FILE);
    const events = readJSON(EVENTS_FILE);
    const user = users.find((u) => u._id === newRegistration.userId);
    const event = events.find((e) => e._id === newRegistration.eventId);
    
    return {
      ...newRegistration,
      userId: user ? { _id: user._id, name: user.name, email: user.email } : newRegistration.userId,
      eventId: event || newRegistration.eventId,
    };
  },

  async findByIdAndUpdate(id, update) {
    const registrations = readJSON(REGISTRATIONS_FILE);
    const index = registrations.findIndex((r) => r._id === id);
    if (index === -1) return null;
    
    registrations[index] = {
      ...registrations[index],
      ...update,
      updatedAt: new Date().toISOString(),
    };
    writeJSON(REGISTRATIONS_FILE, registrations);
    return registrations[index];
  },

  async findByIdAndDelete(id) {
    const registrations = readJSON(REGISTRATIONS_FILE);
    const filtered = registrations.filter((r) => r._id !== id);
    if (filtered.length === registrations.length) return null;
    writeJSON(REGISTRATIONS_FILE, filtered);
    return { deleted: true };
  },

  async deleteMany(query) {
    const registrations = readJSON(REGISTRATIONS_FILE);
    const filtered = registrations.filter((r) => {
      if (query.eventId) return r.eventId !== query.eventId;
      return true;
    });
    writeJSON(REGISTRATIONS_FILE, filtered);
    return { deletedCount: registrations.length - filtered.length };
  },

  async countDocuments(query = {}) {
    const registrations = await this.find(query);
    return registrations.length;
  },
};

module.exports = {
  userService,
  eventService,
  registrationService,
};

