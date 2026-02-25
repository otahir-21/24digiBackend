const mongoose = require('mongoose');
const env = require('./env');

async function connectDb() {
  try {
    await mongoose.connect(env.mongoUri);
    if (env.nodeEnv !== 'test') {
      console.log('MongoDB connected');
    }
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
}

function disconnectDb() {
  return mongoose.disconnect();
}

module.exports = { connectDb, disconnectDb };
