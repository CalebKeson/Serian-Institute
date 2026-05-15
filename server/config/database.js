// config/database.js
import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    // console.log('🔄 Attempting to connect to MongoDB...');
    
    // Mask password for safe logging
    const maskedUri = process.env.MONGO_URI.replace(
      /:([^:@]{8})[^@]*@/, 
      ':****@'
    );
    // console.log('Using URI:', maskedUri);
    
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      family: 4, // Force IPv4
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
      socketTimeoutMS: 45000,
    });
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Handle connection errors after initial connection
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
    });
    
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    
    // More detailed error information
    if (error.name === 'MongoServerSelectionError') {
      console.log('🔍 This usually means:');
      console.log('   1. Your IP is not whitelisted in Atlas');
      console.log('   2. Network/firewall is blocking port 27017');
      console.log('   3. Connection string is incorrect');
    }
    
    process.exit(1);
  }
};

export default connectDB;