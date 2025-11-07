const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
require('dotenv').config(); // Load environment variables

const app = express();
// Use PORT from environment or 8080 for Azure compatibility
const PORT = process.env.PORT || 8090;

// Database connection - NOW ENABLED
console.log('🔗 Initializing database connection...');
const { poolPromise } = require('./db');

// Print environment info for debugging
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Current directory:', __dirname);
console.log('Parent directory:', path.join(__dirname, '../'));

// Production environment validation
if (process.env.NODE_ENV === 'production') {
  console.log('🚀 Production mode detected');
  console.log('🔍 Environment variables check:');
  console.log('  - AZURE_STORAGE_ACCOUNT:', !!process.env.AZURE_STORAGE_ACCOUNT ? '✅' : '❌');
  console.log('  - AZURE_STORAGE_CONTAINER:', !!process.env.AZURE_STORAGE_CONTAINER ? '✅' : '❌');
  console.log('  - AZURE_STORAGE_CONNECTION_STRING:', !!process.env.AZURE_STORAGE_CONNECTION_STRING ? '✅' : '❌');
  console.log('  - AZURE_CLIENT_ID:', !!process.env.AZURE_CLIENT_ID ? '✅' : '❌');
  console.log('  - JWT_SECRET:', !!process.env.JWT_SECRET ? '✅' : '❌');
}

// Middleware - CORS configuration for both development and production
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      // Development origins
      'http://localhost:3000',
      'http://localhost:3001', 
      'http://localhost:3002',
      'http://localhost:8090', 
      'http://localhost:8080',
      'http://localhost:5173', // Vite default
      'http://localhost:4173', // Vite preview
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:8090',
      'http://127.0.0.1:8080',
      
      // Production origins
      'https://nitor-smartdocs.azurewebsites.net',
      'https://your-domain.com',
      
      // Add any other domains you need
      process.env.FRONTEND_URL,
      process.env.ALLOWED_ORIGIN
    ].filter(Boolean); // Remove undefined values
    
    // Check if the origin is allowed
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('🚫 CORS blocked origin:', origin);
      console.log('✅ Allowed origins:', allowedOrigins);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-App-Version',
    'X-Requested-With',
    'Accept',
    'Origin',
    'X-HTTP-Method-Override',
    'Cache-Control',
    'Pragma',
    'X-API-Key',
    'X-Client-Version'
  ],
  exposedHeaders: [
    'Content-Length',
    'X-Total-Count',
    'X-Page-Count',
    'X-Cache-Buster',
    'X-Timestamp'
  ],
  maxAge: 86400 // Cache preflight requests for 24 hours
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS debugging middleware (only in development)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log('🌐 CORS Debug:', {
      method: req.method,
      origin: req.headers.origin,
      host: req.headers.host,
      url: req.url,
      userAgent: req.headers['user-agent']
    });
    next();
  });
}

// Handle CORS preflight requests explicitly
app.options('*', cors());

// Add CORS headers to all responses
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma');
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

// Test endpoint to verify backend is working
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Backend is working in STATIC MODE!',
    env: process.env.NODE_ENV,
    currentDir: __dirname,
    parentDir: path.join(__dirname, '../'),
    mode: 'STATIC_MODE - DB disabled'
  });
});

// CORS test endpoint
app.get('/api/cors-test', (req, res) => {
  res.json({
    message: 'CORS test successful!',
    timestamp: new Date().toISOString(),
    origin: req.headers.origin,
    method: req.method,
    headers: req.headers,
    cors: {
      allowedOrigins: [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:8090',
        'https://nitor-smartdocs.azurewebsites.net'
      ],
      currentOrigin: req.headers.origin
    }
  });
});

// CORS preflight test
app.options('/api/cors-test', cors());

// Add debug endpoint to list files in various directories
app.get('/api/debug', (req, res) => {
  const debugInfo = {};

  try {
    // Try to list files in various directories to help debug
    const dirs = [
      { name: 'Current directory', path: __dirname },
      { name: 'Parent directory', path: path.join(__dirname, '../') },
      { name: 'assets directory', path: path.join(__dirname, '../assets') },
      { name: 'assets/samplejson', path: path.join(__dirname, '../assets/samplejson') },
      { name: 'public/assets', path: path.join(__dirname, '../public/assets') },
      { name: 'samplejson', path: path.join(__dirname, '../public/assets/samplejson') }
    ];

    dirs.forEach(dir => {
      try {
        if (fs.existsSync(dir.path)) {
          debugInfo[dir.name] = fs.readdirSync(dir.path);
        } else {
          debugInfo[dir.name] = 'Directory does not exist';
        }
      } catch (err) {
        debugInfo[dir.name] = `Error: ${err.message}`;
      }
    });

    res.json({ debug: debugInfo });
  } catch (error) {
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

// Register API routes
app.use('/api', require('./routes/api'));

// Register Auth routes
app.use('/auth', require('./routes/auth'));

// Register User Tracking routes
app.use('/api/user-tracking', require('./routes/userTracking'));

// Register Upload routes
app.use('/api/upload', require('./routes/upload'));

// Register Document routes
app.use('/api/documents', require('./routes/documents'));
// Register SharePoint routes
app.use('/api/sharepoint', require('./routes/sharepoint-upload'));

// Register Document Categories routes
app.use('/api/document-categories', require('./routes/documentCategories'));

// Register Enhanced Document Analysis routes
app.use('/api/enhanced-analysis', require('./routes/enhancedDocumentAnalysis'));

// Register Notification routes
app.use('/api/notifications', require('./routes/notifications'));

// Register Test Enhanced Analysis routes (NO AUTH - FOR TESTING ONLY)
app.use('/api/test-enhanced-analysis', require('./routes/testEnhancedAnalysis'));

// Register AI Workflow routes
app.use('/api/ai-workflow', require('./routes/aiWorkflow'));

// Register Chatbot routes
app.use('/api/chatbot', require('./routes/chatbot'));

// Register N8N RAG routes (for Pinecone Vector Store integration)
app.use('/api/n8n-rag', require('./routes/n8nRag'));

// In production, serve the frontend files
// React will be built into the build directory
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../')));

  // For any request that doesn't match an API or static file, send the React app
  app.get('*', (req, res) => {
    const indexPath = path.join(__dirname, '../index.html');
    console.log('Trying to serve index.html from:', indexPath);
    res.sendFile(indexPath);
  });
} else {
  // In development mode, just show a message for non-API routes
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/auth')) {
      res.send('Backend server is running. Please access the frontend at http://localhost:3000');
    }
  });
}

// Database connection test
poolPromise
  .then(() => {
    console.log("✅ Successfully connected to Azure SQL Database");
    console.log("🚀 User tracking system is ready");
  })
  .catch(err => {
    console.error("❌ Database connection error:", err);
    console.error("⚠️  User tracking features will not be available");
  });

// Initialize Event Subscribers for Azure Service Bus Queue notifications
const eventSubscribers = require('./eventSubscribers');
const serviceBusService = require('./services/serviceBusService');

eventSubscribers.start()
  .then(() => {
    console.log("🎧 Event subscribers initialized successfully");

    // Log Service Bus status
    const status = serviceBusService.getStatus();
    console.log(`📊 Service Bus Status: ${status.provider}`);
    if (status.isConnected) {
      console.log(`📥 Connected to Azure Service Bus Queue`);
      console.log(`🎯 Queue: ${status.queueName}`);
      console.log(`📤 Sender Active: ${status.queueSenderActive}`);
      console.log(`📥 Receiver Active: ${status.queueReceiverActive}`);
    } else {
      console.log(`💾 Running in memory mode (fallback)`);
    }
  })
  .catch(err => {
    console.error("❌ Event subscribers initialization error:", err);
    console.error("⚠️  Azure Service Bus Queue notifications will not work");
  });

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  console.log('📡 SIGTERM received, shutting down gracefully...');
  await serviceBusService.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('📡 SIGINT received, shutting down gracefully...');
  await serviceBusService.shutdown();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT} with Azure SQL Database`);
  console.log(`📊 User tracking enabled at http://localhost:${PORT}/api/user-tracking`);
  console.log(`🔧 API available at http://localhost:${PORT}/api/test`);
  console.log(`🏥 Health check at http://localhost:${PORT}/api/user-tracking/health`);
  console.log(`🚌 Azure Service Bus Queue notification system active`);
}); 