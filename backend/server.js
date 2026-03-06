require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// Routes
const authRoutes = require('./routes/auth');
const appointmentRoutes = require('./routes/appointments');
const calendarRoutes = require('./routes/calendar');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: [
        process.env.FRONTEND_URL,
        'http://localhost:5500',
        'http://127.0.0.1:5500',
        'https://mostaza-peluqueria.web.app'
    ],
    credentials: true
}));

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

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📅 Google Calendar API integration enabled`);
    console.log(`🌐 Frontend: ${process.env.FRONTEND_URL}`);
});
