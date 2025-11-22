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
    // Log full error for easier debugging
    console.error('❌ MongoDB Connection Error:', error && error.stack ? error.stack : error);
    console.log('📝 Using mock JSON data instead of database');
    console.log('💡 To use MongoDB, ensure it is running and MONGODB_URI is correct.');

    // Retry connecting after a short delay so the server can recover when Mongo starts later
    // This keeps retrying indefinitely every 5 seconds; adjust or add a max retry if desired.
    setTimeout(() => {
      console.log('🔁 Retrying MongoDB connection...');
      connectDB();
    }, 5000);
  }
};

// Check connection status
const getConnectionStatus = () => {
  return isConnected && mongoose.connection.readyState === 1;
};

module.exports = { connectDB, getConnectionStatus };

