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
 * Helper: Create calendar event for appointment
 */
async function createAppointmentCalendarEvent(appointment) {
    const { stylistId, date, time, duration = 30 } = appointment;
    
    // Check if stylist has authorized calendar
    if (!hasAuthorizedCalendar(stylistId)) {
        console.log(`Stylist ${stylistId} has not authorized calendar - skipping event creation`);
        return null;
    }
    
    try {
        // Get tokens and create auth client
        let tokens = getTokens(stylistId);
        
        // Refresh token if expired
        if (tokens.expiry_date && tokens.expiry_date < Date.now()) {
            tokens = await refreshAccessToken(tokens.refresh_token);
            saveTokens(stylistId, tokens);
        }
        
        const auth = setCredentials(tokens);
        
        // Parse date and time
        const [year, month, day] = date.split('-');
        const [hours, minutes] = time.split(':');
        
        // Create start datetime
        const startDate = new Date(year, month - 1, day, hours, minutes);
        
        // Calculate end datetime
        const endDate = new Date(startDate.getTime() + duration * 60000);
        
        // Format for Google Calendar (ISO 8601)
        const startDateTime = startDate.toISOString();
        const endDateTime = endDate.toISOString();
        
        // Prepare event details
        const eventDetails = {
            summary: `${appointment.serviceName} - ${appointment.clientName}`,
            description: `Cliente: ${appointment.clientName}\nTeléfono: ${appointment.clientPhone}\nEmail: ${appointment.clientEmail || 'No especificado'}\nServicio: ${appointment.serviceName}\nPrecio: $${appointment.price}`,
            startDateTime,
            endDateTime,
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
        
        // Save appointment
        saveAppointment(appointment);
        
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
router.get('/', (req, res) => {
    const appointments = getAppointments();
    res.json(appointments);
});

/**
 * GET /api/appointments/:id
 * Get appointment by ID
 */
router.get('/:id', (req, res) => {
    const appointment = getAppointmentById(req.params.id);
    
    if (!appointment) {
        return res.status(404).json({ error: 'Appointment not found' });
    }
    
    res.json(appointment);
});

/**
 * DELETE /api/appointments/:id
 * Cancel appointment and delete from calendar
 */
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    const appointment = getAppointmentById(id);
    
    if (!appointment) {
        return res.status(404).json({ error: 'Appointment not found' });
    }
    
    try {
        // Delete from calendar if event exists
        if (appointment.calendarEventId && hasAuthorizedCalendar(appointment.stylistId)) {
            let tokens = getTokens(appointment.stylistId);
            
            if (tokens.expiry_date && tokens.expiry_date < Date.now()) {
                tokens = await refreshAccessToken(tokens.refresh_token);
                saveTokens(appointment.stylistId, tokens);
            }
            
            const auth = setCredentials(tokens);
            await deleteCalendarEvent(auth, appointment.calendarEventId);
            console.log(`✅ Calendar event deleted: ${appointment.calendarEventId}`);
        }
        
        // Delete from database
        deleteAppointment(id);
        
        res.json({ 
            success: true,
            message: 'Appointment cancelled and removed from calendar'
        });
        
    } catch (error) {
        console.error('Error cancelling appointment:', error);
        
        // Still delete from database even if calendar deletion fails
        deleteAppointment(id);
        
        res.json({ 
            success: true,
            warning: 'Appointment cancelled but calendar event may not have been deleted',
            message: error.message
        });
    }
});

module.exports = router;
