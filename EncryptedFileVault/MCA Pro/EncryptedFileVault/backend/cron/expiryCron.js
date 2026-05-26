import cron from 'node-cron';
import fs from 'fs';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import File from '../models/File.js';
import SharedFile from '../models/SharedFile.js';
import AuditLog from '../models/AuditLog.js';

const s3 = new S3Client({
  endpoint: process.env.B2_ENDPOINT,
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.B2_KEY_ID,
    secretAccessKey: process.env.B2_APP_KEY,
  },
});

export const startExpiryCron = () => {
  // Run every hour at minute 0
  cron.schedule('0 * * * *', async () => {
    console.log('⏳ Running expiry cleanup cron job...');
    try {
      const now = new Date();

      // 1. Cleanup expired SharedFiles (Revoke access automatically)
      const expiredShares = await SharedFile.find({ expiresAt: { $lt: now, $ne: null } }).populate('fileId');
      
      for (const share of expiredShares) {
        console.log(`Revoking expired share for file ID ${share.fileId?._id}`);
        await share.deleteOne();
        
        await AuditLog.create({
          action: 'FILE_REVOKE_AUTO',
          details: `Automatically revoked expired share for ${share.fileId?.filename || 'unknown'}`,
          status: 'SUCCESS',
          ipAddress: 'System',
          userAgent: 'Cron Job',
          createdAt: new Date()
        });
      }

      // 2. Cleanup expired actual Files (Permanent Deletion)
      const expiredFiles = await File.find({ expiresAt: { $lt: now, $ne: null } });

      for (const file of expiredFiles) {
        console.log(`Deleting expired file ${file.filename}`);

        // Delete from B2 if applicable
        if (file.b2Key && process.env.B2_BUCKET) {
          try {
            await s3.send(new DeleteObjectCommand({
              Bucket: process.env.B2_BUCKET,
              Key: file.b2Key,
            }));
          } catch (err) {
            console.error(`Failed to delete B2 object ${file.b2Key}:`, err.message);
          }
        } 
        // Delete from local storage if applicable
        else if (file.path && fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }

        await file.deleteOne();

        await AuditLog.create({
          action: 'FILE_DELETE_AUTO',
          details: `Automatically deleted expired file: ${file.filename}`,
          status: 'SUCCESS',
          ipAddress: 'System',
          userAgent: 'Cron Job',
          createdAt: new Date()
        });
      }

      if (expiredShares.length > 0 || expiredFiles.length > 0) {
        console.log(`✅ Cleanup complete. Deleted ${expiredFiles.length} files and revoked ${expiredShares.length} shares.`);
      }

    } catch (error) {
      console.error('❌ Expiry cron job failed:', error);
    }
  });
};
