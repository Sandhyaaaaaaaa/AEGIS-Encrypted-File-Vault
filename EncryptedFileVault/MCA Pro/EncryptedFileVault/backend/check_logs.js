import mongoose from 'mongoose';
import dotenv from 'dotenv';
import AuditLog from './models/AuditLog.js';

dotenv.config();

const checkLogs = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(10);
    console.log('Latest Logs:');
    logs.forEach(log => {
      console.log(`[${log.createdAt.toISOString()}] ${log.action} - ${log.status} - ${log.details}`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

checkLogs();
