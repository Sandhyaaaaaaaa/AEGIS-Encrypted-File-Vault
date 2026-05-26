import mongoose from 'mongoose';
import dotenv from 'dotenv';
import SharedFile from './models/SharedFile.js';
import File from './models/File.js';

dotenv.config();

const diagnose = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    const shared = await SharedFile.find().populate('fileId');
    console.log(`Found ${shared.length} shared records`);
    
    shared.forEach((s, i) => {
      console.log(`\n--- Record ${i+1} ---`);
      console.log(`ID: ${s._id}`);
      console.log(`FileID Reference: ${s.fileId?._id || 'NULL (Orphan)'}`);
      if (s.fileId) {
        console.log(`Filename: ${s.fileId.filename}`);
        console.log(`Owner: ${s.fileId.owner}`);
      }
      console.log(`Recipient: ${s.recipientId}`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

diagnose();
