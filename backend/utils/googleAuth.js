const { google } = require('googleapis');

// OAuth2 Client Configuration
const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.REDIRECT_URI
);

// Scopes needed for Google Calendar
const SCOPES = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events'
];

/**
 * Generate authentication URL for OAuth flow
 */
function getAuthUrl() {
    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        prompt: 'consent' // Force to get refresh token
    });
}

/**
 * Exchange authorization code for tokens
 */
async function getTokensFromCode(code) {
    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
}

/**
 * Set credentials for OAuth client
 */
function setCredentials(tokens) {
    oauth2Client.setCredentials(tokens);
    return oauth2Client;
}

/**
 * Refresh access token if expired
 */
async function refreshAccessToken(refreshToken) {
    oauth2Client.setCredentials({
        refresh_token: refreshToken
    });
    
    const { credentials } = await oauth2Client.refreshAccessToken();
    return credentials;
}

/**
 * Create calendar event
 */
async function createCalendarEvent(auth, eventDetails) {
    try {
        const calendar = google.calendar({ version: 'v3', auth });
        
        // Support both old format (startDateTime/endDateTime) and new format (start/end objects)
        const start = eventDetails.start || {
            dateTime: eventDetails.startDateTime,
            timeZone: 'America/Argentina/Buenos_Aires'
        };
        
        const end = eventDetails.end || {
            dateTime: eventDetails.endDateTime,
            timeZone: 'America/Argentina/Buenos_Aires'
        };
        
        const event = {
            summary: eventDetails.summary,
            description: eventDetails.description,
            start,
            end,
            attendees: eventDetails.attendees || [],
            reminders: {
                useDefault: false,
                overrides: [
                    { method: 'email', minutes: 24 * 60 },
                    { method: 'popup', minutes: 60 }
                ]
            },
            colorId: '5' // Yellow/Mustard color
        };
        
        console.log('Inserting event into Google Calendar:', JSON.stringify(event, null, 2));
        
        const response = await calendar.events.insert({
            calendarId: 'primary',
            resource: event,
            sendUpdates: 'all' // Send email notifications
        });
        
        console.log('✅ Google Calendar event inserted successfully:', response.data.id);
        return response.data;
        
    } catch (error) {
        console.error('❌ Error inserting Google Calendar event:', {
            message: error.message,
            code: error.code,
            details: error.errors
        });
        throw error;
    }
}

/**
 * Delete calendar event
 */
async function deleteCalendarEvent(auth, eventId) {
    const calendar = google.calendar({ version: 'v3', auth });
    
    await calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId,
        sendUpdates: 'all'
    });
}

/**
 * Update calendar event
 */
async function updateCalendarEvent(auth, eventId, eventDetails) {
    const calendar = google.calendar({ version: 'v3', auth });
    
    const event = {
        summary: eventDetails.summary,
        description: eventDetails.description,
        start: {
            dateTime: eventDetails.startDateTime,
            timeZone: 'America/Argentina/Buenos_Aires'
        },
        end: {
            dateTime: eventDetails.endDateTime,
            timeZone: 'America/Argentina/Buenos_Aires'
        },
        attendees: eventDetails.attendees || []
    };
    
    const response = await calendar.events.update({
        calendarId: 'primary',
        eventId: eventId,
        resource: event,
        sendUpdates: 'all'
    });
    
    return response.data;
}

module.exports = {
    getAuthUrl,
    getTokensFromCode,
    setCredentials,
    refreshAccessToken,
    createCalendarEvent,
    deleteCalendarEvent,
    updateCalendarEvent
};
