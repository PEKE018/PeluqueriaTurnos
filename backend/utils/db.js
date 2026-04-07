// ============================================================
//  FIRESTORE DATA LAYER
//  Replaces JSON files with Firestore backend
// ============================================================

const db = global.db; // Initialized in server.js

function toFirestoreId(value) {
    return String(value);
}

// ============================================================
//  TOKENS MANAGEMENT (OAuth tokens for stylists)
// ============================================================

/**
 * Save stylist's Google Calendar tokens
 */
async function saveTokens(stylistId, tokens) {
    try {
        await db.collection('tokens').doc(toFirestoreId(stylistId)).set({
            ...tokens,
            updatedAt: new Date().toISOString()
        });
        return true;
    } catch (error) {
        console.error('Error saving tokens:', error);
        return false;
    }
}

/**
 * Get stylist's tokens
 */
async function getTokens(stylistId) {
    try {
        const doc = await db.collection('tokens').doc(toFirestoreId(stylistId)).get();
        return doc.exists ? doc.data() : null;
    } catch (error) {
        console.error('Error getting tokens:', error);
        return null;
    }
}

/**
 * Check if stylist has authorized calendar
 */
async function hasAuthorizedCalendar(stylistId) {
    try {
        const tokens = await getTokens(stylistId);
        return tokens && tokens.refresh_token ? true : false;
    } catch (error) {
        console.error('Error checking calendar authorization:', error);
        return false;
    }
}

/**
 * Remove stylist's tokens
 */
async function removeTokens(stylistId) {
    try {
        await db.collection('tokens').doc(toFirestoreId(stylistId)).delete();
        return true;
    } catch (error) {
        console.error('Error removing tokens:', error);
        return false;
    }
}

// ============================================================
//  APPOINTMENTS MANAGEMENT (Sync with calendar events)
// ============================================================

/**
 * Save appointment with calendar event ID
 */
async function saveAppointment(appointment) {
    try {
        const docRef = db.collection('appointments').doc(toFirestoreId(appointment.id));
        await docRef.set({
            ...appointment,
            updatedAt: new Date().toISOString()
        }, { merge: true });
        return appointment;
    } catch (error) {
        console.error('Error saving appointment:', error);
        throw error;
    }
}

/**
 * Get all appointments
 */
async function getAppointments() {
    try {
        const snapshot = await db.collection('appointments').get();
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error getting appointments:', error);
        return [];
    }
}

/**
 * Get appointment by ID
 */
async function getAppointmentById(id) {
    try {
        const doc = await db.collection('appointments').doc(toFirestoreId(id)).get();
        return doc.exists ? { id: doc.id, ...doc.data() } : null;
    } catch (error) {
        console.error('Error getting appointment by ID:', error);
        return null;
    }
}

/**
 * Get appointments by stylist
 */
async function getAppointmentsByStylist(stylistId) {
    try {
        const snapshot = await db.collection('appointments')
            .where('stylistId', '==', stylistId)
            .get();
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error getting appointments by stylist:', error);
        return [];
    }
}

/**
 * Get business settings
 */
async function getSettings() {
    try {
        const doc = await db.collection('settings').doc('config').get();
        return doc.exists ? doc.data() : {};
    } catch (error) {
        console.error('Error getting settings:', error);
        return {};
    }
}

/**
 * Delete appointment
 */
async function deleteAppointment(id) {
    try {
        await db.collection('appointments').doc(toFirestoreId(id)).delete();
        return true;
    } catch (error) {
        console.error('Error deleting appointment:', error);
        return false;
    }
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
    deleteAppointment,
    getSettings
};
