import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import fileRoutes from './routes/files.js';
import keyFeedbackRoutes from './routes/keyFeedback.js';
import logRoutes from './routes/logs.js';
import adminRoutes from './routes/admin.js';
import feedbackRoutes from './routes/feedback.js';
import aiRoutes from './routes/ai.js';
import errorHandler from './middleware/errorHandler.js';
import logger from './middleware/logger.js';
import { startExpiryCron } from './cron/expiryCron.js';

dotenv.config();
connectDB();
startExpiryCron();

const app = express();

// Log ALL incoming requests FIRST
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.originalUrl}`);
  next();
});

app.use(cors());
app.use(express.json());

// Request logger middleware
app.use(logger);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/key-feedback', keyFeedbackRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/ai', aiRoutes);

// Error Handler (should come after routes)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));