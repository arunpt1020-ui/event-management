const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    isConnected = true;
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    isConnected = false;
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.log('📝 Using mock JSON data instead of database');
    console.log('💡 To use MongoDB, ensure it is running and MONGODB_URI is correct.');
  }
};

// Check connection status
const getConnectionStatus = () => {
  return isConnected && mongoose.connection.readyState === 1;
};

module.exports = { connectDB, getConnectionStatus };

