import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import connectDatabase from './config/database';
import authRoutes from './routes/authRoutes';
import { globalErrorHandler, notFound } from './middleware/errorHandler';

// Load environment variables
dotenv.config();

// Create Express application
const app: Application = express();

// Get port from environment or default to 5000
const PORT = process.env.PORT || 5000;

/**
 * Security Middleware
 */

// Set security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Configure CORS
const corsOptions = {
  origin: function (origin: any, callback: any) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173'
    ];
    
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token'],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

app.use(limiter);

/**
 * Body Parsing Middleware
 */
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf.toString());
    } catch (e) {
      const response = res as express.Response;
      response.status(400).json({
        success: false,
        message: 'Invalid JSON format',
      });
      return;
    }
  }
}));

app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * Request Logging Middleware (Development)
 */
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    if (req.body && Object.keys(req.body).length > 0) {
      console.log('Request body:', JSON.stringify(req.body, null, 2));
    }
    next();
  });
}

/**
 * Health Check Route
 */
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'AI VideoGen API is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
  });
});

/**
 * API Routes
 */
app.use('/api/auth', authRoutes);

/**
 * Welcome Route
 */
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to AI VideoGen API! 🎬',
    version: '1.0.0',
    documentation: '/api/docs', // Future API documentation
    endpoints: {
      health: '/health',
      auth: '/api/auth',
    },
  });
});

/**
 * 404 Handler for undefined routes
 */
app.use(notFound);

/**
 * Global Error Handler
 */
app.use(globalErrorHandler);

/**
 * Start Server
 */
const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase();
    
    // Start listening
    const server = app.listen(PORT, () => {
      console.log('\n🚀 ================================');
      console.log(`🎬 AI VideoGen API Server Started`);
      console.log('🚀 ================================');
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 Server: http://localhost:${PORT}`);
      console.log(`🔗 Health Check: http://localhost:${PORT}/health`);
      console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth`);
      console.log(`🎯 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
      console.log('🚀 ================================\n');
    });

    // Graceful shutdown handlers
    const gracefulShutdown = (signal: string) => {
      console.log(`\n⚠️  Received ${signal}. Starting graceful shutdown...`);
      
      server.close(() => {
        console.log('🔒 HTTP server closed.');
        
        // Close database connection
        require('mongoose').connection.close(() => {
          console.log('🔒 Database connection closed.');
          console.log('✅ Graceful shutdown completed.');
          process.exit(0);
        });
      });

      // Force close after 10 seconds
      setTimeout(() => {
        console.error('❌ Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    // Listen for termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err: Error) => {
      console.error('💥 Unhandled Promise Rejection:', err.message);
      console.error('Stack:', err.stack);
      
      // Close server & exit process
      server.close(() => {
        process.exit(1);
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (err: Error) => {
      console.error('💥 Uncaught Exception:', err.message);
      console.error('Stack:', err.stack);
      console.log('🔒 Shutting down...');
      process.exit(1);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

export default app;
