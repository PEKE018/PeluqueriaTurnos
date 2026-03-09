const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { 
    saveAppointment, 
    getAppointments, 
    getAppointmentById,
    deleteAppointment,
    hasAuthorizedCalendar 
} = require('../utils/db');
const { 
    setCredentials,
    createCalendarEvent,
    deleteCalendarEvent,
    refreshAccessToken
} = require('../utils/googleAuth');
const { getTokens, saveTokens } = require('../utils/db');

/**
 * Validate email format
 */
function isValidEmail(email) {
    if (!email) return true; // Email es opcional
    
    // Regex mejorado para validación de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Helper: Create calendar event for appointment
 */
async function createAppointmentCalendarEvent(appointment) {
    const { stylistId, date, time, duration = 30 } = appointment;
    
    // Check if stylist has authorized calendar
    const hasAuth = await hasAuthorizedCalendar(stylistId);
    if (!hasAuth) {
        console.log(`Stylist ${stylistId} has not authorized calendar - skipping event creation`);
        return null;
    }
    
    try {
        // Get tokens and create auth client
        let tokens = await getTokens(stylistId);
        
        // Refresh token if expired
        if (tokens.expiry_date && tokens.expiry_date < Date.now()) {
            tokens = await refreshAccessToken(tokens.refresh_token);
            await saveTokens(stylistId, tokens);
        }
        
        const auth = setCredentials(tokens);
        
        // Parse date and time
        const [year, month, day] = date.split('-');
        const [hours, minutes] = time.split(':');
        
        // Create datetime string in local format (NOT ISO string)
        // Format: YYYY-MM-DDTHH:mm:ss
        const startDateTime = `${year}-${month}-${day}T${hours}:${minutes}:00`;
        
        // Calculate end time
        const startDate = new Date(year, month - 1, day, parseInt(hours), parseInt(minutes));
        const endDate = new Date(startDate.getTime() + duration * 60000);
        const endHours = String(endDate.getHours()).padStart(2, '0');
        const endMinutes = String(endDate.getMinutes()).padStart(2, '0');
        const endDateTime = `${year}-${month}-${day}T${endHours}:${endMinutes}:00`;
        
        // Prepare event details with timezone
        const eventDetails = {
            summary: `${appointment.serviceName} - ${appointment.clientName}`,
            description: `Cliente: ${appointment.clientName}\nTeléfono: ${appointment.clientPhone}\nEmail: ${appointment.clientEmail || 'No especificado'}\nServicio: ${appointment.serviceName}\nPrecio: $${appointment.price}`,
            start: {
                dateTime: startDateTime,
                timeZone: 'America/Argentina/Buenos_Aires'
            },
            end: {
                dateTime: endDateTime,
                timeZone: 'America/Argentina/Buenos_Aires'
            },
            attendees: appointment.clientEmail ? [{ email: appointment.clientEmail }] : []
        };
        
        // Create calendar event
        const event = await createCalendarEvent(auth, eventDetails);
        
        console.log(`✅ Calendar event created: ${event.id}`);
        return event.id;
        
    } catch (error) {
        console.error('Error creating calendar event:', error);
        return null;
    }
}

/**
 * POST /api/appointments
 * Create a new appointment and add to Google Calendar
 */
router.post('/', async (req, res) => {
    const appointmentData = req.body;
    
    // Validate required fields
    const required = ['clientName', 'clientPhone', 'serviceId', 'serviceName', 'stylistId', 'stylistName', 'date', 'time', 'price'];
    const missing = required.filter(field => !appointmentData[field]);
    
    if (missing.length > 0) {
        return res.status(400).json({ 
            error: `Missing required fields: ${missing.join(', ')}` 
        });
    }
    
    // Validate email format if provided
    if (appointmentData.clientEmail && !isValidEmail(appointmentData.clientEmail)) {
        return res.status(400).json({ 
            error: 'Invalid email format',
            email: appointmentData.clientEmail
        });
    }
    
    try {
        // Generate appointment ID
        const appointment = {
            id: appointmentData.id || uuidv4(),
            ...appointmentData,
            status: 'confirmed',
            calendarEventId: null,
            createdAt: new Date().toISOString()
        };
        
        // Try to create calendar event
        const eventId = await createAppointmentCalendarEvent(appointment);
        
        if (eventId) {
            appointment.calendarEventId = eventId;
        }
        
        // Save appointment (now async)
        await saveAppointment(appointment);
        
        res.json({ 
            success: true,
            appointment,
            calendarCreated: !!eventId,
            message: eventId 
                ? 'Appointment created and added to calendar' 
                : 'Appointment created (calendar not connected)'
        });
        
    } catch (error) {
        console.error('Error creating appointment:', error);
        res.status(500).json({ 
            error: 'Failed to create appointment',
            message: error.message 
        });
    }
});

/**
 * GET /api/appointments
 * Get all appointments
 */
router.get('/', async (req, res) => {
    try {
        const appointments = await getAppointments();
        res.json(appointments);
    } catch (error) {
        console.error('Error getting appointments:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/appointments/:id
 * Get appointment by ID
 */
router.get('/:id', async (req, res) => {
    try {
        const appointment = await getAppointmentById(req.params.id);
        
        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }
        
        res.json(appointment);
    } catch (error) {
        console.error('Error getting appointment:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * DELETE /api/appointments/:id
 * Cancel appointment and delete from calendar
 */
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        const appointment = await getAppointmentById(id);
        
        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }
        
        // Delete from calendar if event exists
        if (appointment.calendarEventId && await hasAuthorizedCalendar(appointment.stylistId)) {
            try {
                let tokens = await getTokens(appointment.stylistId);
                
                if (tokens && tokens.expiry_date && tokens.expiry_date < Date.now()) {
                    tokens = await refreshAccessToken(tokens.refresh_token);
                    await saveTokens(appointment.stylistId, tokens);
                }
                
                if (tokens) {
                    const auth = setCredentials(tokens);
                    await deleteCalendarEvent(auth, appointment.calendarEventId);
                    console.log(`✅ Calendar event deleted: ${appointment.calendarEventId}`);
                }
            } catch (calendarError) {
                console.error('Error deleting calendar event:', calendarError);
                // Continue with database deletion even if calendar fails
            }
        }
        
        // Delete from database
        const deleted = await deleteAppointment(id);
        
        if (deleted) {
            return res.json({ 
                success: true,
                message: 'Appointment cancelled and removed'
            });
        } else {
            return res.status(500).json({
                error: 'Failed to delete appointment'
            });
        }
        
    } catch (error) {
        console.error('Error cancelling appointment:', error);
        return res.status(500).json({ 
            error: 'Internal server error',
            message: error.message
        });
    }
});

module.exports = router;
