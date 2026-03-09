# 🔧 RECOMENDACIONES DE FIX — Sistema Turnos Peluquería

**Prioridad:** 🔴 CRÍTICO — Hacer AHORA (máximo 4 horas)  
**Impacto:** Sistema no funciona en producción sin estos fixes

---

## FIX #1: Agregar ruta `/auth/disconnect` [20 min]

**Archivo:** `backend/routes/auth.js`  
**Línea:** Al final del archivo (antes de `module.exports`)  
**Acción:** Agregar nueva ruta

```javascript
/**
 * DELETE /auth/disconnect/:stylistId
 * Disconnect stylist's Google Calendar access
 * Remove their saved tokens
 */
router.delete('/disconnect/:stylistId', async (req, res) => {
    const { stylistId } = req.params;
    const { removeTokens } = require('../utils/db');
    
    if (!stylistId) {
        return res.status(400).json({ error: 'stylistId is required' });
    }
    
    try {
        const success = await removeTokens(stylistId);
        
        if (success) {
            res.json({ 
                success: true,
                stylistId,
                message: 'Calendar disconnected successfully'
            });
        } else {
            res.status(500).json({ 
                error: 'Failed to disconnect calendar'
            });
        }
    } catch (error) {
        console.error('Error disconnecting calendar:', error);
        res.status(500).json({ 
            error: 'Failed to disconnect calendar',
            message: error.message
        });
    }
});

module.exports = router;
```

**Verificación:** Después de agregar, el botón "Desconectar" debería funcionar en admin panel.

---

## FIX #2: Arreglar async/await en `routes/auth.js` [15 min]

**Archivo:** `backend/routes/auth.js`  
**Línea:** ~95-108 (la función GET /auth/status/:stylistId)  
**Acción:** Cambiar función a async y agregar await

### ANTES:
```javascript
router.get('/auth/status/:stylistId', (req, res) => {
    const { stylistId } = req.params;
    const { hasAuthorizedCalendar } = require('../utils/db');
    
    const isAuthorized = hasAuthorizedCalendar(stylistId);  // ❌ SIN AWAIT
    
    res.json({ 
        stylistId,
        authorized: isAuthorized,  // Siempre una Promise, nunca boolean
        message: isAuthorized ? 'Calendar is connected' : 'Calendar not connected yet'
    });
});
```

### DESPUÉS:
```javascript
router.get('/auth/status/:stylistId', async (req, res) => {  // ✅ ASYNC
    const { stylistId } = req.params;
    const { hasAuthorizedCalendar } = require('../utils/db');
    
    if (!stylistId) {
        return res.status(400).json({ error: 'stylistId is required' });
    }
    
    try {
        const isAuthorized = await hasAuthorizedCalendar(stylistId);  // ✅ AWAIT
        
        res.json({ 
            stylistId,
            authorized: isAuthorized,  // Ahora es boolean correcto
            message: isAuthorized ? 'Calendar is connected' : 'Calendar not connected yet'
        });
    } catch (error) {
        console.error('Error checking authorization status:', error);
        res.status(500).json({ 
            error: 'Failed to check authorization status',
            message: error.message
        });
    }
});
```

**Verificación:** El estado "✓ Google Calendar conectado" debería funcionar correctamente en la tabla de profesionales.

---

## FIX #3: Arreglar async/await en `routes/calendar.js` [15 min]

**Archivo:** `backend/routes/calendar.js`  
**Línea:** ~9-20 (la función `getAuthClientForStylist`)  
**Acción:** Agregar await a getTokens

### ANTES:
```javascript
async function getAuthClientForStylist(stylistId) {
    let tokens = getTokens(stylistId);  // ❌ SIN AWAIT - Returns Promise
    
    if (!tokens) {
        throw new Error('Stylist has not authorized calendar access');
    }
    
    // Check if token is expired and refresh if needed
    if (tokens.expiry_date && tokens.expiry_date < Date.now()) {
        console.log('Token expired, refreshing...');
        tokens = await refreshAccessToken(tokens.refresh_token);
        saveTokens(stylistId, tokens);
    }
    
    return setCredentials(tokens);
}
```

### DESPUÉS:
```javascript
async function getAuthClientForStylist(stylistId) {
    let tokens = await getTokens(stylistId);  // ✅ AWAIT
    
    if (!tokens) {
        throw new Error('Stylist has not authorized calendar access');
    }
    
    // Check if token is expired and refresh if needed
    if (tokens.expiry_date && tokens.expiry_date < Date.now()) {
        console.log('Token expired, refreshing...');
        tokens = await refreshAccessToken(tokens.refresh_token);
        await saveTokens(stylistId, tokens);  // ✅ También saveTokens es async
    }
    
    return setCredentials(tokens);
}
```

**Verificación:** Los eventos de Google Calendar deberían crearse correctamente cuando se confirma un turno.

---

## FIX #4: Mejorar error handling en `app.js` [20 min]

**Archivo:** `app.js`  
**Línea:** ~520-540 (función `confirmBooking`, en la parte de send to backend)  
**Acción:** Reemplazar warning silencioso con notificación visual

### ANTES:
```javascript
// Send to backend (Google Calendar integration)
try {
    const response = await fetch(`${BACKEND_URL}/api/appointments`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(appointment)
    });

    if (response.ok) {
        const result = await response.json();
        console.log('✅ Turno creado en Google Calendar:', result);
        
        // Update appointment with calendar event ID
        if (result.appointment && result.appointment.calendarEventId) {
            const index = appointments.findIndex(a => a.id === appointment.id);
            if (index >= 0) {
                appointments[index].calendarEventId = result.appointment.calendarEventId;
                saveAppointments(appointments);
            }
        }
    } else {
        console.warn('Backend no disponible, turno guardado solo localmente');  // ❌ Solo console.warn
    }
} catch (error) {
    console.warn('No se pudo conectar con el backend:', error);  // ❌ Solo console.warn
    // Continue anyway - appointment is saved locally
}
```

### DESPUÉS:
```javascript
// Send to backend (Google Calendar integration)
let calendarSyncSuccessful = false;
try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);  // 5 segundo timeout
    
    const response = await fetch(`${BACKEND_URL}/api/appointments`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(appointment),
        signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (response.ok) {
        const result = await response.json();
        console.log('✅ Turno creado en Google Calendar:', result);
        calendarSyncSuccessful = true;
        
        // Update appointment with calendar event ID
        if (result.appointment && result.appointment.calendarEventId) {
            const index = appointments.findIndex(a => a.id === appointment.id);
            if (index >= 0) {
                appointments[index].calendarEventId = result.appointment.calendarEventId;
                saveAppointments(appointments);
            }
        }
    } else {
        const errorData = await response.json();
        console.warn('⚠️ Backend error:', errorData);
        console.log('📝 Turno guardado localmente pero SIN sincronización con Google Calendar');
        calendarSyncSuccessful = false;
    }
} catch (error) {
    if (error.name === 'AbortError') {
        console.error('❌ Backend no responde (timeout)');
    } else {
        console.error('❌ Error de conexión con backend:', error.message);
    }
    console.log('⚠️ Turno guardado localmente pero SIN sincronización con Google Calendar');
    calendarSyncSuccessful = false;
}

// Mostrar confirmación con estado de sincronización
$('confirmation-details').innerHTML = `
    <p><strong>Servicio:</strong> ${sanitize(appointment.serviceName)}</p>
    <p><strong>Profesional:</strong> ${sanitize(appointment.stylistName)}</p>
    <p><strong>Fecha:</strong> ${formatDate(appointment.date)}</p>
    <p><strong>Hora:</strong> ${appointment.time} hs</p>
    <p><strong>Precio:</strong> ${formatPrice(appointment.price)}</p>
    <p><strong>Cliente:</strong> ${sanitize(appointment.clientName)}</p>
    <p><strong>Email:</strong> ${sanitize(appointment.clientEmail)}</p>
    <p><strong>Teléfono:</strong> ${sanitize(appointment.clientPhone)}</p>
    ${calendarSyncSuccessful 
        ? '<p style="margin-top:1rem;padding:1rem;background:rgba(76,175,80,0.1);border-radius:8px;font-size:0.9rem;">✅ Turno confirmado y agregado automáticamente al Google Calendar del profesional.</p>'
        : '<p style="margin-top:1rem;padding:1rem;background:rgba(255,152,0,0.1);border-radius:8px;font-size:0.9rem;border-left:4px solid #FF9800;">⚠️ Turno confirmado localmente pero NO disponible en Google Calendar aún. El profesional verá el turno cuando abra la app nuevamente.</p>'
    }
`;
```

**Verificación:** Se verá un mensaje claro sobre si la sincronización funcionó o no.

---

## FIX #5: Validación de variables de entorno en backend [15 min]

**Archivo:** `backend/server.js`  
**Línea:** Después de `require('dotenv').config();` (línea ~1)  
**Acción:** Agregar validación antes de usar las variables

### ANTES:
```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');
// ... resto del código
```

### DESPUÉS:
```javascript
require('dotenv').config();

// Validar que todas las variables de entorno requeridas existan
const requiredEnvVars = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'REDIRECT_URI',
    'FRONTEND_URL'
];

const missing = requiredEnvVars.filter(varName => !process.env[varName]);

if (missing.length > 0) {
    console.error('');
    console.error('❌ FATAL: Variables de entorno requeridas NO están configuradas:');
    missing.forEach(varName => {
        console.error(`   - ${varName}`);
    });
    console.error('');
    console.error('Por favor, configura las variables en .env o en tu proveedor de hosting');
    console.error('Ver: ENV-VARIABLES.md para instrucciones');
    console.error('');
    process.exit(1);
}

console.log('✅ Variables de entorno validadas');

const express = require('express');
const cors = require('cors');
// ... resto del código
```

**Verificación:** Si falta alguna variable, el servidor no iniciará con un mensaje claro.

---

## FIX #6: Mover validación de cancelación al backend [30 min]

**Archivo:** `backend/routes/appointments.js`  
**Línea:** En la función DELETE /api/appointments/:id  
**Acción:** Agregar validación de 48 horas en el servidor

Actualmente existe una validación incompleta. Necesita ser mejorada:

### ANTES:
```javascript
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        const appointment = await getAppointmentById(id);
        
        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }
        
        // Delete from calendar if event exists
        // ... resto ...
    }
});
```

### DESPUÉS:
```javascript
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        const appointment = await getAppointmentById(id);
        
        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }
        
        // ✅ VALIDACIÓN EN SERVIDOR: Verificar 48 horas
        const appointmentTime = new Date(appointment.date + 'T' + appointment.time);
        const now = new Date();
        const millisUntil = appointmentTime - now;
        const hoursUntil = millisUntil / (1000 * 60 * 60);
        
        if (hoursUntil < 48) {
            return res.status(400).json({
                error: 'Cannot cancel appointment within 48 hours',
                hoursRemaining: Math.round(hoursUntil * 10) / 10,
                message: `El turno no se puede cancelar. Faltan ${Math.round(hoursUntil)} horas para el turno.`
            });
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
```

**También modificar en `app.js` para mostrar el error del servidor:**

```javascript
window.cancelMyBooking = async function (id) {
    const appointments = getAppointments();
    const apt = appointments.find(a => a.id === id);
    
    if (!apt) return;
    
    if (!confirm('¿Seguro que querés cancelar este turno?')) return;
    
    try {
        const backendUrl = getBackendURL();
        const response = await fetch(`${backendUrl}/api/appointments/${apt.id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'No se pudo cancelar el turno');
        }
        
        // Remove from local list
        appointments = appointments.filter(a => a.id !== apt.id);
        saveAppointments(appointments);
        
        showToast('Turno cancelado', 'success');
        window.checkMyBookings();
    } catch (error) {
        showToast('Error: ' + error.message, 'error');  // ✅ Muestra error del servidor
        console.error('Error cancelling appointment:', error);
    }
};
```

**Verificación:** Intentar cancelar un turno con menos de 48 horas debería dar un error claro desde el servidor.

---

## FIX #7: Arreglar CORS configuration [10 min]

**Archivo:** `backend/server.js`  
**Línea:** Las primeras líneas de middleware (~23-35)  
**Acción:** Reemplazar la configuración CORS permisiva

### ANTES:
```javascript
// Middleware - CORS Configuration (Permissive for debugging)
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');  // ❌ MUY PERMISIVO
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');  // ❌ CONFLICTO CON *
    
    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});
```

### DESPUÉS:
```javascript
// CORS Configuration - Whitelist specific origins
const allowedOrigins = [
    'https://mostaza-peluqueria.web.app',
    'https://mostaza-peluqueria-staging.web.app'
];

// Para desarrollo local
if (process.env.NODE_ENV !== 'production') {
    allowedOrigins.push('http://localhost:5500');
    allowedOrigins.push('http://localhost:3000');
    allowedOrigins.push('http://127.0.0.1:5500');
}

app.use((req, res, next) => {
    const origin = req.headers.origin;
    
    // Solo permitir origins en la whitelist
    if (allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Credentials', 'true');
    }
    
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});
```

**Verificación:** El backend solo responderá a requests desde domis autorizados.

---

## FIX #8: Agregar timeouts a fetch calls [30 min]

Crear una función helper en `app.js`:

```javascript
// Agregar esta función cerca del inicio de app.js (después de getBackendURL)
async function fetchWithTimeout(url, options = {}, timeoutMs = 5000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error(`Request timeout después de ${timeoutMs}ms`);
        }
        throw error;
    }
}
```

Y reemplazar todos los `fetch(` con `fetchWithTimeout(`:

```javascript
// Ejemplo en confirmBooking:
try {
    const response = await fetchWithTimeout(
        `${BACKEND_URL}/api/appointments`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(appointment)
        },
        5000  // 5 segundos
    );
    // ...
} catch (error) {
    if (error.message.includes('timeout')) {
        showToast('Servidor no responde. Turno guardado localmente.', 'warning');
    } else {
        showToast('Error de conexión: ' + error.message, 'error');
    }
}
```

**Verificación:** Las requests ahora tendrán un máximo de 5 segundos antes de timeout.

---

## TESTING DE LOS FIXES

Después de aplicar todos los fixes, probar ESTO:

### 1. Test: Conectar/Desconectar Calendario
```
1. Ir a Panel Admin → Profesionales
2. Buscar un profesional
3. Click "Conectar Calendario"
4. Autorizar con Google
5. Verificar: Estado cambia a "✓ Google Calendar conectado"
6. Click "Desconectar"
7. Verificar: Estado vuelve a "⚠ Sin conectar"
```

### 2. Test: Crear Turno (Con Backend)
```
1. Conectar backend: cd backend && npm start
2. Ir a https://mostaza-peluqueria.web.app
3. Crear un turno normalmente
4. Verificar en consola: Mensaje "✅ Turno creado en Google Calendar"
5. Ver turno en Google Calendar del profesional
```

### 3. Test: Crear Turno (Sin Backend)
```
1. Apagar backend (Ctrl+C)
2. Ir a https://mostaza-peluqueria.web.app
3. Crear un turno
4. Verificar: Mensaje "⚠️ Turno confirmado pero SIN Google Calendar"
5. Turno todavía aparece en consulta de turnos
```

### 4. Test: Cancelar Turno (Menos de 48 horas)
```
1. Crear turno para hoy
2. Ir a "Consultar mis turnos"
3. Intentar cancelar
4. Verificar: Error "No se puede cancelar turnos con menos de 48 horas"
```

### 5. Test: Timeout
```
1. Conectar backend pero ralentizarlo artificialmente
2. O apagar internet 2-3 segundos en el middle del request
3. Verificar: Después de 5 segundos, timeout message
```

---

## CHECKLIST DE IMPLEMENTACIÓN

```
CRÍTICOS (Hacer AHORA):
☐ FIX #1: Agregar ruta /auth/disconnect
☐ FIX #2: async/await en auth.js
☐ FIX #3: async/await en calendar.js
☐ FIX #4: Better error handling en confirmBooking
☐ FIX #5: Validación de .env

ALTOS (Hacer esta semana):
☐ FIX #6: Cancelación con validación backend
☐ FIX #7: CORS whitelisting
☐ FIX #8: Timeouts en fetch

TESTING:
☐ Test #1: Connect/Disconnect Calendar
☐ Test #2: Create appointment con backend
☐ Test #3: Create appointment sin backend
☐ Test #4: Cancel appointment < 48 horas
☐ Test #5: Timeout handling
```

---

## ESTIMACIÓN DE TIEMPO

- **Fixes Críticos:** ~80 minutos (1 hora 20 min)
- **Testing:** ~30 minutos
- **Fixes Altos:** ~75 minutos (1 hora 15 min)
- **Testing completo:** ~30 minutos

**Total:** ~3.5 horas para estar en condiciones de producción

---

**Estado después de fixes:** Sistema funcional y seguro ✅
