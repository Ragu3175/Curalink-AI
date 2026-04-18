const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const chatRoutes = require('./src/routes/chatRoutes');
const authRoutes = require('./src/routes/authRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// Middleware
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('CORS Policy Violation: Origin not allowed.'));
        }
    },
    credentials: true
}));
app.use(express.json());

// Global Request Logger
app.use((req, res, next) => {
    console.log(`>>> [INCOMING] ${req.method} ${req.url}`);
    next();
});

// Routes
app.get('/ping', (req, res) => res.send('pong'));
app.use('/api', chatRoutes);
app.use('/api/auth', authRoutes);

// Health Check
app.get('/', (req, res) => res.send('Curalink Backend Running'));

// Database Connection
mongoose.connect(process.env.MONGODB_URI, {
    family: 4, // Force IPv4
    serverSelectionTimeoutMS: 5000, // Fail fast if connection cannot be established
})
    .then(() => {
        console.log('Connected to MongoDB Atlas');
    })
    .catch((error) => {
        console.error('MongoDB Connection Error:', error.message);
        console.warn('Proceeding without persistent database (Local fallback)...');
    });

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});
