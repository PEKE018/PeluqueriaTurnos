require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
let serviceAccount;

// Try to use environment variable first (for production/Render)
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } catch (e) {
        console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT:', e.message);
        process.exit(1);
    }
} else {
    // Fall back to local file (for development)
    try {
        serviceAccount = require('./mostaza-peluqueria-firebase-adminsdk-fbsvc-91f50e545f.json');
    } catch (e) {
        console.error('Firebase service account file not found and FIREBASE_SERVICE_ACCOUNT not set:', e.message);
        process.exit(1);
    }
}

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id
});

// Export Firestore instance for use in other modules
global.db = admin.firestore();

// Routes
const authRoutes = require('./routes/auth');
const appointmentRoutes = require('./routes/appointments');
const calendarRoutes = require('./routes/calendar');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware - CORS Configuration (Permissive for debugging)
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/calendar', calendarRoutes);

// Health check endpoints
app.get('/', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'Mostaza Backend API running',
        version: '1.0.0'
    });
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'Backend is healthy',
        timestamp: new Date().toISOString()
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        message: err.message 
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📅 Google Calendar API integration enabled`);
    console.log(`🌐 Frontend: ${process.env.FRONTEND_URL}`);

    // Keep-alive: ping propio cada 14 min para evitar que Render duerma el servicio
    if (process.env.NODE_ENV === 'production') {
        const https = require('https');
        const selfUrl = process.env.RENDER_EXTERNAL_URL || `https://peluqueriaturnos.onrender.com`;
        setInterval(() => {
            https.get(`${selfUrl}/health`, (res) => {
                console.log(`🏓 Keep-alive ping: ${res.statusCode}`);
            }).on('error', (e) => {
                console.warn('Keep-alive ping failed:', e.message);
            });
        }, 14 * 60 * 1000); // cada 14 minutos
    }
});
