import express from "express"
import connectDB from './config/database.js'
import cors from "cors"
import helmet from "helmet"
import rateLimit from 'express-rate-limit';
import path from "path"
import dotenv from "dotenv"
import authRoutes from "./routes/authRouter.js"
import musicRoutes from "./routes/music.js"
import userRoutes from "./routes/user.js"
import errorHandler from "./middleware/errorHandler.js"
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ 
  path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development' 
});

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration for React Native
app.use(cors({
  origin: "*",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-otp-token','token']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min.
  max: 100, // limit ip 100 req on windowMs
  message: 'To many request, please try again after few minutes'
});
app.use('/api/', limiter);

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database connection
connectDB()

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/music', musicRoutes);
app.use('/api/user', userRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ message: 'API działa poprawnie', timestamp: new Date().toLocaleString() });
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