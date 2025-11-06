import express from "express"
import connectDB from './config/database.js'
import cors from "cors"
import helmet from "helmet"
import { rateLimit, ipKeyGenerator } from 'express-rate-limit';
import path from "path"
import dotenv from "dotenv"
import authRoutes from "./routes/authRouter.js"
import musicRoutes from "./routes/music.js"
import userRoutes from "./routes/user.js"
import errorHandler from "./middleware/errorHandler.js"
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
app.set('trust proxy', 1 /* number of proxies between user and server */)

// Security middleware
app.use(helmet());

// CORS configuration for React Native
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-otp-token','token']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min.
  max: 100, // limit ip 100 req on windowMs
  message: 'To many request, please try again after few minutes',
  keyGenerator: (req, res) => req.ip
});
app.use('/v1/', limiter);

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database connection
connectDB()

// Routes
app.use('/v1/auth', authRoutes);
app.use('/v1/music', musicRoutes);
app.use('/v1/user', userRoutes);

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