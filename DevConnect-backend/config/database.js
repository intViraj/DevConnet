const mongoose = require('mongoose');

const connectDB = async () => {
  const connectionString = process.env.DB_CONNECTION_SECRET || 'mongodb://127.0.0.1:27017/DevConnect';
  try {
    await mongoose.connect(connectionString);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    throw error;
  }
};

module.exports = connectDB;
