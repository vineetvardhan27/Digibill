import mongoose from 'mongoose';
import redisClient from '../config/redis.js';

beforeAll(async () => {
  // Use a separate test database if testing locally
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/digibill_test';
  await mongoose.connect(uri);
});

afterAll(async () => {
  // Clear all collections
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }

  // Close connections
  await mongoose.disconnect();
  
  // Flush redis and close
  if (redisClient.status === 'ready') {
    await redisClient.flushall();
    await redisClient.quit();
  }
});
