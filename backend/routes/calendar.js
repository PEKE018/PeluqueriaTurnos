const express = require('express');
const router = express.Router();
const { 
    setCredentials,
    createCalendarEvent,
    deleteCalendarEvent,
    updateCalendarEvent,
    refreshAccessToken
} = require('../utils/googleAuth');
const { getTokens, saveTokens } = require('../utils/db');

/**
 * Helper: Get authenticated client for stylist
 */
async function getAuthClientForStylist(stylistId) {
    let tokens = await getTokens(stylistId);
    
    if (!tokens) {
        throw new Error('Stylist has not authorized calendar access');
    }
    
    // Check if token is expired and refresh if needed
    if (tokens.expiry_date && tokens.expiry_date < Date.now()) {
        console.log('Token expired, refreshing...');
        tokens = await refreshAccessToken(tokens.refresh_token);
        await saveTokens(stylistId, tokens);
    }
    
    return setCredentials(tokens);
}

/**
 * POST /api/calendar/create-event
 * Create a calendar event for a stylist
 */
router.post('/create-event', async (req, res) => {
    const { 
        stylistId, 
        summary, 
        description, 
        startDateTime, 
        endDateTime,
        attendees 
    } = req.body;
    
    if (!stylistId || !summary || !startDateTime || !endDateTime) {
        return res.status(400).json({ 
            error: 'Missing required fields: stylistId, summary, startDateTime, endDateTime' 
        });
    }
    
    try {
        const auth = await getAuthClientForStylist(stylistId);
        
        const eventDetails = {
            summary,
            description: description || '',
            startDateTime,
            endDateTime,
            attendees: attendees || []
        };
        
        const event = await createCalendarEvent(auth, eventDetails);
        
        res.json({ 
            success: true,
            eventId: event.id,
            htmlLink: event.htmlLink,
            message: 'Calendar event created successfully'
        });
        
    } catch (error) {
        console.error('Error creating calendar event:', error);
        res.status(500).json({ 
            error: 'Failed to create calendar event',
            message: error.message 
        });
    }
});

/**
 * DELETE /api/calendar/delete-event
 * Delete a calendar event
 */
router.delete('/delete-event', async (req, res) => {
    const { stylistId, eventId } = req.body;
    
    if (!stylistId || !eventId) {
        return res.status(400).json({ 
            error: 'Missing required fields: stylistId, eventId' 
        });
    }
    
    try {
        const auth = await getAuthClientForStylist(stylistId);
        await deleteCalendarEvent(auth, eventId);
        
        res.json({ 
            success: true,
            message: 'Calendar event deleted successfully'
        });
        
    } catch (error) {
        console.error('Error deleting calendar event:', error);
        res.status(500).json({ 
            error: 'Failed to delete calendar event',
            message: error.message 
        });
    }
});

/**
 * PUT /api/calendar/update-event
 * Update a calendar event
 */
router.put('/update-event', async (req, res) => {
    const { 
        stylistId, 
        eventId, 
        summary, 
        description, 
        startDateTime, 
        endDateTime,
        attendees 
    } = req.body;
    
    if (!stylistId || !eventId) {
        return res.status(400).json({ 
            error: 'Missing required fields: stylistId, eventId' 
        });
    }
    
    try {
        const auth = await getAuthClientForStylist(stylistId);
        
        const eventDetails = {
            summary,
            description,
            startDateTime,
            endDateTime,
            attendees
        };
        
        const event = await updateCalendarEvent(auth, eventId, eventDetails);
        
        res.json({ 
            success: true,
            eventId: event.id,
            message: 'Calendar event updated successfully'
        });
        
    } catch (error) {
        console.error('Error updating calendar event:', error);
        res.status(500).json({ 
            error: 'Failed to update calendar event',
            message: error.message 
        });
    }
});

module.exports = router;
