const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const TOKENS_FILE = path.join(DATA_DIR, 'tokens.json');
const APPOINTMENTS_FILE = path.join(DATA_DIR, 'appointments.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * Read JSON file
 */
function readJSON(filePath, defaultValue = {}) {
    try {
        if (!fs.existsSync(filePath)) {
            writeJSON(filePath, defaultValue);
            return defaultValue;
        }
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading ${filePath}:`, error);
        return defaultValue;
    }
}

/**
 * Write JSON file
 */
function writeJSON(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error(`Error writing ${filePath}:`, error);
        return false;
    }
}

// ============================================================
//  TOKENS MANAGEMENT (OAuth tokens for stylists)
// ============================================================

/**
 * Save stylist's Google Calendar tokens
 */
function saveTokens(stylistId, tokens) {
    const allTokens = readJSON(TOKENS_FILE, {});
    allTokens[stylistId] = {
        ...tokens,
        updatedAt: new Date().toISOString()
    };
    return writeJSON(TOKENS_FILE, allTokens);
}

/**
 * Get stylist's tokens
 */
function getTokens(stylistId) {
    const allTokens = readJSON(TOKENS_FILE, {});
    return allTokens[stylistId] || null;
}

/**
 * Check if stylist has authorized calendar
 */
function hasAuthorizedCalendar(stylistId) {
    const tokens = getTokens(stylistId);
    return tokens && tokens.refresh_token ? true : false;
}

/**
 * Remove stylist's tokens
 */
function removeTokens(stylistId) {
    const allTokens = readJSON(TOKENS_FILE, {});
    delete allTokens[stylistId];
    return writeJSON(TOKENS_FILE, allTokens);
}

// ============================================================
//  APPOINTMENTS MANAGEMENT (Sync with calendar events)
// ============================================================

/**
 * Save appointment with calendar event ID
 */
function saveAppointment(appointment) {
    const appointments = readJSON(APPOINTMENTS_FILE, []);
    
    // Check if appointment already exists (update)
    const index = appointments.findIndex(a => a.id === appointment.id);
    
    if (index >= 0) {
        appointments[index] = {
            ...appointments[index],
            ...appointment,
            updatedAt: new Date().toISOString()
        };
    } else {
        appointments.push({
            ...appointment,
            createdAt: new Date().toISOString()
        });
    }
    
    writeJSON(APPOINTMENTS_FILE, appointments);
    return appointment;
}

/**
 * Get all appointments
 */
function getAppointments() {
    return readJSON(APPOINTMENTS_FILE, []);
}

/**
 * Get appointment by ID
 */
function getAppointmentById(id) {
    const appointments = getAppointments();
    return appointments.find(a => a.id === id);
}

/**
 * Get appointments by stylist
 */
function getAppointmentsByStylist(stylistId) {
    const appointments = getAppointments();
    return appointments.filter(a => a.stylistId === stylistId);
}

/**
 * Delete appointment
 */
function deleteAppointment(id) {
    const appointments = getAppointments();
    const filtered = appointments.filter(a => a.id !== id);
    return writeJSON(APPOINTMENTS_FILE, filtered);
}

module.exports = {
    // Tokens
    saveTokens,
    getTokens,
    hasAuthorizedCalendar,
    removeTokens,
    
    // Appointments
    saveAppointment,
    getAppointments,
    getAppointmentById,
    getAppointmentsByStylist,
    deleteAppointment
};
