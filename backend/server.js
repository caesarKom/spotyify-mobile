import express from "express"
import connectDB from './config/database.js'
import cors from "cors"
import helmet from "helmet"
import { rateLimit } from 'express-rate-limit';
import path from "path"
import dotenv from "dotenv"
import authRoutes from "./routes/authRouter.js"
import musicRoutes from "./routes/music.js"
import userRoutes from "./routes/user.js"
import playlistRoutes from "./routes/playlistRouter.js"
import errorHandler from "./middleware/errorHandler.js"
import { fileURLToPath } from 'url';
import mediaTokenRoutes from './routes/mediaTokenRouter.js';
import { protect } from "./middleware/auth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
app.set('trust proxy', 1 /* number of proxies between user and server */)

// Security middleware
app.use(helmet());

// CORS configuration for React Native
app.use(cors({
  origin: function(origin, callback) {
    // Mobile apps not send origin
    if (!origin) return callback(null, true);
    
    // Wildcard for *.iscode.eu
    if (origin.match(/https?:\/\/([\w-]+\.)?iscode\.eu(:\d+)?$/)) {
      return callback(null, true);
    }
    
    // Localhost/IP for development
    if (origin.startsWith('http://localhost') || 
        origin.startsWith('http://127.0.0.1') ||
        origin.startsWith('http://173.249.31.149')) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-otp-token', 'x-media-token', 'token']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min.
  max: 300, // limit ip 100 req on windowMs
  message: 'To many request, please try again after few minutes',
  keyGenerator: (req, res) => req.ip
});
app.use('/v1/', limiter);

// Body parser middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files
app.use('/uploads', protect, express.static(path.join(__dirname, 'uploads')));

// Database connection
connectDB()

// Routes
app.use('/v1/auth', authRoutes);
app.use('/v1/music', musicRoutes);
app.use('/v1/user', userRoutes);
app.use('/v1/playlist', playlistRoutes);
app.use('/v1/media-token', mediaTokenRoutes);

// Health check endpoint
app.get('/v1/health', (req, res) => {
  res.json({ message: 'API is running corected', timestamp: new Date().toLocaleString() });
});


// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Endpoint not found' });
});

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\nServer running on ${process.env.BASE_URL}`);
  console.log(`Mode: ${process.env.NODE_ENV}`);
});