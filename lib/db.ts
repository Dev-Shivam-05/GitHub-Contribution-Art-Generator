import mongoose from 'mongoose';

// Ideally, use process.env.MONGODB_URI, but hardcoding for local dev is fine for now
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/contribution-art-db";

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

// Renamed function to match what your app expects
async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

// Export as NAMED export (to match: import { connectToDatabase } ...)
export { connectToDatabase };

// Export as DEFAULT export (to match: import connectToDatabase ...)
export default connectToDatabase;