import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // These options are no longer needed in Mongoose 6+
      // but kept for compatibility if using older versions
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Clean up legacy indexes that no longer match the current user schema.
    // Old databases may still have a unique username index that breaks signup
    // because the app no longer stores a username field.
    try {
      const usersCollection = mongoose.connection.db.collection('users');
      const indexes = await usersCollection.indexes();
      const usernameIndex = indexes.find((index) => index.name === 'username_1');

      if (usernameIndex) {
        await usersCollection.dropIndex('username_1');
        console.log('🧹 Removed stale users.username_1 index');
      }
    } catch (indexError) {
      // Ignore if the index does not exist or cannot be removed yet.
      console.warn('⚠️  Could not clean up legacy username index:', indexError.message);
    }
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error(`❌ MongoDB connection error: ${err}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️  MongoDB disconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed due to app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error(`❌ Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
