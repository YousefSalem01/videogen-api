import mongoose from 'mongoose';

const connectDatabase = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-video-generator';

    const conn = await mongoose.connect(mongoURI);

    console.log(`📊 MongoDB Connected: ${conn.connection.name}`);

    mongoose.connection.on('error', (error) => {
      console.error('❌ MongoDB connection error:', error);
    });


    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        process.exit(0);
      } catch (error) {
        console.error('❌ Error during MongoDB connection closure:', error);
        process.exit(1);
      }
    });

  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

export const isDatabaseConnected = (): boolean => {
  return mongoose.connection.readyState === 1;
};

export const getDatabaseInfo = () => {
  const connection = mongoose.connection;
  return {
    readyState: connection.readyState,
    name: connection.name,
    host: connection.host,
    port: connection.port,
  };
};

export default connectDatabase;
