const express = require('express');
const router = express.Router();
const { 
    getAuthUrl, 
    getTokensFromCode, 
    setCredentials 
} = require('../utils/googleAuth');
const { saveTokens } = require('../utils/db');

// Clave fija para el único profesional. Los tokens siempre se guardan bajo
// esta clave, independientemente del ID numérico del frontend, para evitar
// pérdidas cuando el profesional se borra y recrea.
const TOKEN_KEY = process.env.PRIMARY_STYLIST_KEY || 'mostaza-primary';

/**
 * GET /auth/google/callback
 * OAuth callback - receives authorization code and exchanges for tokens
 * IMPORTANT: This route must come BEFORE /google/:stylistId to avoid matching "callback" as stylistId
 */
router.get('/google/callback', async (req, res) => {
    const { code, state } = req.query;
    const stylistId = state; // Retrieve stylistId from state parameter
    
    if (!code) {
        return res.status(400).send('Authorization code not received');
    }
    
    if (!stylistId) {
        return res.status(400).send('Stylist ID not found');
    }
    
    try {
        // Exchange code for tokens
        const tokens = await getTokensFromCode(code);
        
        // Save tokens under fixed key (independent of frontend numeric ID)
        await saveTokens(TOKEN_KEY, tokens);
        
        console.log(`✅ Calendar authorized, stored under key: ${TOKEN_KEY}`);
        
        // Redirect to frontend with success message
        // Support both local development and production
        const referer = req.get('Referer') || '';
        let frontendUrl = process.env.FRONTEND_URL;
        
        // If the request came from localhost, redirect back to localhost
        if (referer.includes('localhost') || referer.includes('127.0.0.1')) {
            frontendUrl = 'http://localhost:5500';
        }
        
        res.redirect(`${frontendUrl}/?calendar_auth=success&stylist=${stylistId}`);
        
    } catch (error) {
        console.error('Error in OAuth callback:', error);
        
        // Support both local development and production
        const referer = req.get('Referer') || '';
        let frontendUrl = process.env.FRONTEND_URL;
        
        if (referer.includes('localhost') || referer.includes('127.0.0.1')) {
            frontendUrl = 'http://localhost:5500';
        }
        
        res.redirect(`${frontendUrl}/?calendar_auth=error&message=${encodeURIComponent(error.message)}`);
    }
});

/**
 * GET /auth/google/:stylistId
 * Generate authorization URL for a stylist to connect their Google Calendar
 */
router.get('/google/:stylistId', (req, res) => {
    const { stylistId } = req.params;
    
    if (!stylistId) {
        return res.status(400).json({ error: 'stylistId is required' });
    }
    
    // Store stylistId in state parameter to retrieve it in callback
    const authUrl = getAuthUrl() + `&state=${stylistId}`;
    
    res.json({ 
        authUrl,
        message: 'Redirect user to this URL to authorize Google Calendar access'
    });
});

/**
 * GET /auth/status/:stylistId
 * Check if a stylist has authorized their calendar
 */
router.get('/status/:stylistId', async (req, res) => {
    const { stylistId } = req.params;
    
    if (!stylistId) {
        return res.status(400).json({ error: 'stylistId is required' });
    }
    
    try {
        const { hasAuthorizedCalendar } = require('../utils/db');
        const isAuthorized = await hasAuthorizedCalendar(TOKEN_KEY);
        
        res.json({ 
            stylistId,
            authorized: isAuthorized,
            message: isAuthorized 
                ? 'Calendar is connected' 
                : 'Calendar not connected yet'
        });
    } catch (error) {
        console.error('Error checking authorization status:', error);
        res.status(500).json({ 
            error: 'Failed to check authorization status',
            message: error.message 
        });
    }
});

/**
 * DELETE /auth/disconnect/:stylistId
 * Disconnect stylist's Google Calendar
 */
router.delete('/disconnect/:stylistId', async (req, res) => {
    const { stylistId } = req.params;
    
    if (!stylistId) {
        return res.status(400).json({ error: 'stylistId is required' });
    }
    
    try {
        const { removeTokens } = require('../utils/db');
        const success = await removeTokens(TOKEN_KEY);
        
        res.json({ 
            success: true,
            message: 'Calendar disconnected successfully',
            stylistId
        });
    } catch (error) {
        console.error('Error disconnecting calendar:', error);
        res.status(500).json({ 
            error: 'Failed to disconnect calendar',
            message: error.message 
        });
    }
});

module.exports = router;
