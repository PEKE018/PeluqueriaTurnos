# 🔍 DIAGNÓSTICO PROFUNDO: Sistema "Turnos Peluquería"

**Fecha:** 9 de marzo de 2026  
**Estado General:** ⚠️ **MÚLTIPLES ERRORES CRÍTICOS ENCONTRADOS**  
**Versión Analizada:** Beta 1.2

---

## 📋 ÍNDICE DE PROBLEMAS

### CRÍTICOS (Impacto Alto) — 5 problemas
### ALTOS (Impacto Medio) — 8 problemas  
### MEDIOS (Impacto Bajo) — 6 problemas
### MENORES (Información) — 4 problemas

**Total:** 23 problemas encontrados

---

# ⚠️ PROBLEMAS CRÍTICOS (Severidad 1/5)

## CRÍTICO #1: Ruta `/auth/disconnect` no existe — Flujo bloqueado
**Ubicación:** `app.js` línea 1277 + `auth.js`  
**Severidad:** 🔴 CRÍTICO  
**Impacto:** Desconexión de Google Calendar no funciona  

### Descripción
En `app.js` línea 1277, se llama a `${backendUrl}/auth/disconnect/${stylistId}` pero esta ruta **NO está definida** en `routes/auth.js`. Cuando el admin intenta desconectar un calendario, la app falla silenciosamente.

### Código problemático
```javascript
// app.js línea 1277
const response = await fetch(`${backendUrl}/auth/disconnect/${stylistId}`, {
    method: 'DELETE'
});
```

### Causa raíz
La ruta correspondiente en `routes/auth.js` no existe. Las únicas rutas definidas son:
- `GET /auth/google/callback`
- `GET /auth/google/:stylistId`
- `GET /auth/status/:stylistId`
- **FALTA** `DELETE /auth/disconnect/:stylistId`

### Solución requerida
Agregar la ruta en `backend/routes/auth.js`:
```javascript
router.delete('/disconnect/:stylistId', async (req, res) => {
    const { stylistId } = req.params;
    const { removeTokens } = require('../utils/db');
    
    try {
        await removeTokens(stylistId);
        res.json({ 
            success: true,
            message: 'Calendar disconnected successfully'
        });
    } catch (error) {
        res.status(500).json({ 
            error: 'Failed to disconnect calendar',
            message: error.message
        });
    }
});
```

---

## CRÍTICO #2: `hasAuthorizedCalendar` es async pero se llama como síncrono
**Ubicación:** `routes/auth.js` línea ~96  
**Severidad:** 🔴 CRÍTICO  
**Impacto:** Status de calendarios siempre devuelve falso  

### Descripción
En `routes/auth.js`, la función `hasAuthorizedCalendar` es asíncrona (accede a Firestore), pero se llama **sin await**:

```javascript
// routes/auth.js línea ~96
const isAuthorized = hasAuthorizedCalendar(stylistId); // ❌ Sin await!
```

Esto devuelve una Promise, no un boolean, por lo que siempre será truthy (verdadero como Promise), causando resultados incorrectos.

### Código problemático
```javascript
router.get('/auth/status/:stylistId', (req, res) => {
    const { stylistId } = req.params;
    const { hasAuthorizedCalendar } = require('../utils/db');
    
    const isAuthorized = hasAuthorizedCalendar(stylistId); // ❌ Problema
    
    res.json({ 
        stylistId,
        authorized: isAuthorized,  // Siempre una Promise
        message: isAuthorized ? 'Calendar is connected' : 'Calendar not connected yet'
    });
});
```

### Solución requerida
```javascript
router.get('/auth/status/:stylistId', async (req, res) => {  // ✅ async
    const { stylistId } = req.params;
    const { hasAuthorizedCalendar } = require('../utils/db');
    
    try {
        const isAuthorized = await hasAuthorizedCalendar(stylistId);  // ✅ await
        
        res.json({ 
            stylistId,
            authorized: isAuthorized,
            message: isAuthorized ? 'Calendar is connected' : 'Calendar not connected yet'
        });
    } catch (error) {
        res.status(500).json({ 
            error: 'Failed to check authorization status',
            message: error.message
        });
    }
});
```

---

## CRÍTICO #3: `getTokens` es async pero se llama como síncrono en `calendar.js`
**Ubicación:** `routes/calendar.js` línea ~12  
**Severidad:** 🔴 CRÍTICO  
**Impacto:** Falla silenciosa al crear eventos de calendario  

### Descripción
En `routes/calendar.js`, la función `getAuthClientForStylist` llama a `getTokens` sin await:

```javascript
async function getAuthClientForStylist(stylistId) {
    let tokens = getTokens(stylistId);  // ❌ Sin await - devuelve Promise
    
    if (!tokens) {  // Siempre falso porque tokens es una Promise
        throw new Error('Stylist has not authorized calendar access');
    }
    // ...
}
```

### Código problemático
```javascript
// routes/calendar.js línea ~12
async function getAuthClientForStylist(stylistId) {
    let tokens = getTokens(stylistId);  // ❌ Problema
    
    if (!tokens) {
        throw new Error('Stylist has not authorized calendar access');
    }
    // ...
}
```

### Causa raíz
`getTokens` es asíncrono en `utils/db.js` pero se llama sin `await`, retornando una Promise en lugar de los datos reales.

### Solución requerida
```javascript
async function getAuthClientForStylist(stylistId) {
    let tokens = await getTokens(stylistId);  // ✅ await
    
    if (!tokens) {
        throw new Error('Stylist has not authorized calendar access');
    }
    // ...
}
```

---

## CRÍTICO #4: Validación de email incoherente
**Ubicación:** `app.js` línea ~475 + múltiples lugares  
**Severidad:** 🔴 CRÍTICO  
**Impacto:** Emails inválidos pueden registrarse  

### Descripción
El sistema tiene validación inconsistente de emails:

1. **En `confirmBooking()`** (línea 475):
   ```javascript
   if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
       isConfirming = false;
       showToast('Email inválido', 'error');
       return;
   }
   ```

2. **En HTML** (index.html):
   ```html
   <input type="email" id="client-email" class="input-field" placeholder="tu@email.com" maxlength="100">
   ```

**Problema:** El regex NO valida correctamente dominios con múltiples puntos (ej: `test@co.uk.com`) ni algunos formatos válidos de RFC 5322.

### Ejemplos de strings que fallan incorrectamente:
- ✅ `user@domain.co.uk` — Válido pero puede fallar en algunos casos
- ❌ Emails con `+` sign (ej: `user+tag@domain.com`) — Rechazados erróneamente
- ❌ Emails con números (ej: `user123@domain.com`) — Rechazados erróneamente

### Solución requerida
Usar validación más robusta:
```javascript
function isValidEmail(email) {
    // Regex más permisiva según HTML5 spec (aproximado)
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

// O mejor aún, en HTML5:
// <input type="email" required>
// Dejar que el navegador valide con .validity.valid
```

---

## CRÍTICO #5: Frontend puede quedarse sin backend sin notificación clara
**Ubicación:** `app.js` línea ~520-540  
**Severidad:** 🔴 CRÍTICO  
**Impacto:** Turnos se crean localmente pero no se sincronizan con Google Calendar  

### Descripción
En `confirmBooking()`, cuando se envía el turno al backend:

```javascript
try {
    const response = await fetch(`${BACKEND_URL}/api/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appointment)
    });

    if (response.ok) {
        // ...
    } else {
        console.warn('Backend no disponible, turno guardado solo localmente');
    }
} catch (error) {
    console.warn('No se pudo conectar con el backend:', error);
    // Continue anyway - appointment is saved locally ❌ PROBLEMA!
}
```

**El problema:** Si el backend no está disponible:
1. El turno se crea localmente ✅
2. **NO se crea en Google Calendar** ❌
3. El cliente solo ve mensajes de warning en la consola
4. No hay indicación visual clara de que la sincronización falló

Cuando el cliente recibe un email de confirmación, **cree que el turno está en Google Calendar cuando NO lo está**.

### Impacto real
- Profesional no ve el turno en su Google Calendar
- Cliente intenta cancelar desde otro dispositivo y el turno no existe en Firestore
- Inconsistencia de datos entre frontend, Firestore y Google Calendar

### Solución requerida
Mostrar un error **importante** pero permitir que continúe:
```javascript
try {
    const response = await fetch(`${BACKEND_URL}/api/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appointment)
    });

    if (!response.ok) {
        console.warn('⚠️ Backend no disponible - turno NO sincronizado con Google Calendar');
        // Show toast with YELLOW warning, not invisible console warning
        showToast('⚠️ Turno creado pero sin sincronización con calendario', 'warning');
    }
} catch (error) {
    console.error('❌ Error de conexión con backend:', error);
    showToast('⚠️ Turno guardado localmente pero sin Google Calendar', 'warning');
}
```

---

# 🔴 PROBLEMAS ALTOS (Severidad 2/5)

## ALTO #1: Múltiples llamadas async sin await en renderAdminStylists
**Ubicación:** `app.js` línea ~1114-1160  
**Severidad:** 🟠 ALTO  
**Impacto:** Estado de calendarios no se actualiza correctamente en paralelo  

### Descripción
En `renderAdminStylists()`, se hace un forEach con llamadas async sin esperar:

```javascript
stylists.forEach(async (s) => {
    try {
        const backendUrl = getBackendURL();
        const response = await fetch(`${backendUrl}/auth/status/${s.id}`);
        if (response.ok) {
            const data = await response.json();
            s.calendarConnected = data.authorized;  // ❌ Modifica objeto directamente
            s.calendarEmail = data.email;  // ❌ Sin validación
        }
    } catch (error) {
        s.calendarConnected = false;
    }
});
```

### Problemas
1. **Race condition:** El HTML se renderiza antes de que terminen los fetches
2. **Sin Promise.all():** No espera a que todas las requests terminen
3. **Mutación de datos:** Modifica objetos del array sin guardar cambios
4. **Sin timeout:** Si backend no responde, la UI se queda esperando

### Solución requerida
```javascript
async function updateCalendarStatus() {
    const stylists = getStylists();
    const backendUrl = getBackendURL();
    
    // Usar Promise.all para esperar todas
    const promises = stylists.map(async (stylist) => {
        try {
            const response = await fetch(`${backendUrl}/auth/status/${stylist.id}`, {
                signal: AbortSignal.timeout(5000)  // 5s timeout
            });
            if (response.ok) {
                const data = await response.json();
                return {
                    id: stylist.id,
                    connected: data.authorized,
                    email: data.email
                };
            }
        } catch (error) {
            console.warn(`Failed to check status for stylist ${stylist.id}:`, error);
            return { id: stylist.id, connected: false };
        }
    });
    
    const results = await Promise.all(promises);
    
    // Actualizar UI una sola vez
    results.forEach(result => {
        const statusEl = document.getElementById(`calendar-status-${result.id}`);
        if (statusEl) {
            statusEl.className = `badge ${result.connected ? 'badge-confirmed' : 'badge-pending'}`;
            statusEl.textContent = result.connected ? '✓ Conectado' : '⚠ Sin conectar';
        }
    });
}
```

---

## ALTO #2: Variables de entorno backend incompletas
**Ubicación:** `backend/.env.example` y `backend/server.js`  
**Severidad:** 🟠 ALTO  
**Impacto:** Google Calendar no funciona en producción sin manualidades  

### Descripción
El archivo `.env.example` tiene un formato antigua:

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
REDIRECT_URI=http://localhost:3000/auth/google/callback
```

**Pero en `server.js` y `routes/auth.js`**, se usan estas variables directamente sin validar que existan:

```javascript
const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,      // ❌ No validado
    process.env.GOOGLE_CLIENT_SECRET,   // ❌ No validado
    process.env.REDIRECT_URI            // ❌ No validado
);
```

Si alguna variable falta, Google API falla **silenciosamente en runtime** en lugar de reportar el error al iniciar.

### Solución requerida
Agregar validación en `backend/server.js`:
```javascript
// Después de require('dotenv').config()
const requiredEnvVars = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'REDIRECT_URI',
    'FRONTEND_URL'
];

const missing = requiredEnvVars.filter(v => !process.env[v]);
if (missing.length > 0) {
    console.error('❌ FATAL: Variables de entorno faltantes:', missing.join(', '));
    process.exit(1);
}

console.log('✅ Variables de entorno validadas');
```

---

## ALTO #3: getBackendURL() está hardcodeado en lugar de configurable
**Ubicación:** `app.js` línea 10 + línea 1648  
**Severidad:** 🟠 ALTO  
**Impacto:** Difícil de cambiar entre desarrollo/producción  

### Descripción
El BACKEND_URL está hardcodeado en una constante:

```javascript
// app.js línea 10
const BACKEND_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000'
    : 'https://peluqueriaturnos.onrender.com';
```

**Problemas:**
1. Si cambias a otro proveedor de hosting (Railway, Vercel, etc), hay que editar código
2. No se puede cambiar sin recompilar
3. Si la app se deployea en un subdirectorio, falla
4. No puede haber varias instancias de backend

### Solución requerida
Permitir configuración desde admin panel (ya existe parcialmente):

```javascript
function getBackendURL() {
    // 1. Intentar cargar de localStorage (configurado por admin)
    const saved = localStorage.getItem('pelu_backend_url');
    if (saved) return saved;
    
    // 2. Fallback a detección automática
    return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3000'
        : 'https://peluqueriaturnos.onrender.com';
}
```

---

## ALTO #4: CORS configuration too permissive
**Ubicación:** `backend/server.js` línea 23-31  
**Severidad:** 🟠 ALTO  
**Impacto:** Riesgo de seguridad en producción  

### Descripción
El backend acepta CORS desde cualquier origen:

```javascript
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');  // ⚠️ MUY PERMISIVO
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');  // ❌ USA CREDENTIALS CON *
    
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});
```

**Problemas SERIOS:**
1. Permite cross-origin requests desde **cualquier dominio**
2. Combina `Access-Control-Allow-Credentials: true` con `*` (violación de spec)
3. Puede permitir CSRF attacks
4. No hay validación de origen

### Solución requerida
```javascript
const allowedOrigins = [
    'https://mostaza-peluqueria.web.app',
    'https://mostaza-peluqueria-staging.web.app',
    'http://localhost:5500',
    'http://localhost:3000'
];

app.use((req, res, next) => {
    const origin = req.headers.origin;
    
    if (allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Credentials', 'true');
    }
    
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});
```

---

## ALTO #5: EmailJS integration incompleta
**Ubicación:** `app.js` línea ~1539-1690  
**Severidad:** 🟠 ALTO  
**Impacto:** Clientes no reciben invitaciones de calendario por email  

### Descripción
La función `sendCalendarInvitations()` existe pero:

1. **No se configura EmailJS automáticamente**
2. **Requiere que el admin configure manualmente** credenciales
3. **No hay envío en segundo plano robusto**
4. **Si falla, solo show error al cliente**

Código actual:
```javascript
function sendCalendarInvitations(appointment, stylist, service) {
    const icsContent = generateICS(appointment, stylist, service);
    const emailJSConfig = getData('emailjs_config', null);
    
    if (!emailJSConfig || !emailJSConfig.serviceId) {
        console.warn('EmailJS no configurado');
        showCalendarDownloadOption(icsContent, appointment);  // Solo fallback
        return;
    }
    
    // Envío manual con EmailJS
    emailjs.init(emailJSConfig.publicKey);
    // ...
}
```

**Problemas:**
- EmailJS es **cliente-side** (inseguro, expone credenciales)
- Mejor sería usar backend
-No hay reintentos si falla

### Solución requerida
Implementar viasde email en el backend:
```javascript
// backend/routes/appointments.js
router.post('/', async (req, res) => {
    const appointmentData = req.body;
    
    // ... crear turno ...
    
    // Enviar email DESDE EL BACKEND (más seguro)
    try {
        await sendAppointmentEmail(
            appointmentData.clientEmail,
            appointmentData.stylistEmail,
            appointmentData,
            icsContent
        );
    } catch (error) {
        console.warn('Failed to send emails:', error);
        // Continue anyway - turno ya está creado
    }
});
```

---

## ALTO #6: No hay timeout en fetch calls
**Ubicación:** Múltiples locations en `app.js` y `backend`  
**Severidad:** 🟠 ALTO  
**Impacto:** App se queda colgada si backend lento  

### Descripción
Los fetch calls no tienen timeout definido:

```javascript
const response = await fetch(`${BACKEND_URL}/api/appointments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(appointment)
    // ❌ SIN TIMEOUT - Si backend demora 5min, app espera 5min
});
```

Si el backend está lento o no responde, el cliente se queda esperando indefinidamente.

### Solución requerida
```javascript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

try {
    const response = await fetch(`${BACKEND_URL}/api/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appointment),
        signal: controller.signal
    });
    clearTimeout(timeoutId);
    // ...
} catch (error) {
    if (error.name === 'AbortError') {
        showToast('Backend no responde (timeout)', 'error');
    }
}
```

---

## ALTO #7: Cancelación de turnos no tiene validación del cliente
**Ubicación:** `app.js` línea 680-715  
**Severidad:** 🟠 ALTO   
**Impacto:** Solo confía en la fecha del lado del cliente  

### Descripción
La validación de 48 horas se realiza **completamente en el frontend**:

```javascript
window.cancelMyBooking = async function (id) {
    const appointments = getAppointments();
    const apt = appointments.find(a => a.id === id);
    
    // ❌ VALIDACIÓN SOLO EN FRONTEND
    const appointmentDateTime = new Date(apt.date + 'T' + apt.time);
    const now = new Date();
    const hoursUntilAppointment = (appointmentDateTime - now) / (1000 * 60 * 60);
    
    if (hoursUntilAppointment < 48) {
        showToast('No se puede cancelar turnos con menos de 48 horas', 'error');
        return;
    }
    
    // El cliente puede manipular localStorage y saltarse esta validación! ❌
};
```

**Problemas:**
- Cualquier usuario puede abrir DevTools y modificar localStorage
- Puede editar la fecha del turno y cancelar
- No hay validación en el backend

### Solución requerida
Mover la validación al backend:
```javascript
// backend/routes/appointments.js
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    const appointment = await getAppointmentById(id);
    
    if (!appointment) {
        return res.status(404).json({ error: 'Appointment not found' });
    }
    
    // ✅ VALIDACIÓN EN SERVIDOR
    const appointmentTime = new Date(appointment.date + 'T' + appointment.time);
    const now = new Date();
    const hoursUntil = (appointmentTime - now) / (1000 * 60 * 60);
    
    if (hoursUntil < 48) {
        return res.status(400).json({
            error: 'Cannot cancel within 48 hours',
            hoursRemaining: Math.round(hoursUntil * 10) / 10
        });
    }
    
    // Proceder con cancelación
    // ...
});
```

---

## ALTO #8: Data sync issues entre localStorage, Firestore y Google Calendar
**Ubicación:** Múltiples funciones en `app.js`  
**Severidad:** 🟠 ALTO  
**Impacto:** Datos inconsistentes entre sistemas  

### Descripción
El sistema tiene **3 fuentes de verdad** sin sincronización clara:

1. **localStorage** (cliente): `pelu_appointments`
2. **Firestore** (nube): `appointments` collection
3. **Google Calendar** (profesional): eventos en calendario

Cuando un turno se crea:
- ✅ Se guarda en localStorage
- ⚠️ Se intenta enviar a backend (que lo guarda en Firestore)
- ⚠️ Se intenta crear evento en Google Calendar
- ❌ **Si uno falla, los otros pueden quedar inconsistentes**

Ejemplo de inconsistencia:
1. Cliente crea turno → Guardado en localStorage ✅
2. Backend está down → **No se guarda en Firestore** ❌
3. Google Calendar no se actualiza ❌
4. Cliente cierra la app
5. Cliente abre otras dispositivo → **No ve el turno** ❌ (data no en Firestore)
6. Vuelve al primer dispositivo → **Ve el turno** ✅ (data en localStorage)

### Solución requerida
Implementar un **queue de sincronización**:
```javascript
// app.js
class SyncQueue {
    constructor() {
        this.queue = [];
        this.syncing = false;
    }
    
    async add(appointment) {
        this.queue.push(appointment);
        this.save();
        await this.sync();
    }
    
    async sync() {
        if (this.syncing) return;
        this.syncing = true;
        
        while (this.queue.length > 0) {
            const item = this.queue[0];
            try {
                await fetch(`${BACKEND_URL}/api/appointments`, {
                    method: 'POST',
                    body: JSON.stringify(item)
                });
                this.queue.shift();
                this.save();
            } catch (error) {
                console.warn('Sync failed, retrying later:', error);
                break;
            }
        }
        
        this.syncing = false;
    }
    
    save() {
        localStorage.setItem('pelu_sync_queue', JSON.stringify(this.queue));
    }
    
    load() {
        this.queue = JSON.parse(localStorage.getItem('pelu_sync_queue') || '[]');
    }
}
```

---

# 🟡 PROBLEMAS MEDIOS (Severidad 3/5)

## MEDIO #1: No hay validación de duración de servicios
**Ubicación:** `app.js` línea 1357-1380  
**Severidad:** 🟡 MEDIO  
**Impacto:** Servicios con duración 0 pueden crearse  

### Descripción
En `saveService()`, la validación es insuficiente:

```javascript
if (!duration || duration < 5) { 
    showToast('Duración inválida', 'error'); 
    return; 
}
```

**Problema:** Un servicio con duración `5` minutos es muy incómodo. No hay máximo.

### Solución
```javascript
if (!duration || duration < 15 || duration > 480) {
    showToast('Duración debe estar entre 15 minutos y 8 horas', 'error');
    return;
}
```

---

## MEDIO #2: Tipo de precio incorrecto (entero vs decimal)
**Ubicación:** `app.js` línea 1359 + `backend/utils/db.js`  
**Severidad:** 🟡 MEDIO  
**Impacto:** Montos decimales se pierden  

### Descripción
Los precios se guardan como enteros:

```javascript
const price = parseInt($('svc-price').value, 10);  // ❌ parseInt, no parseFloat
```

Si alguien ingresa `99.50`, se guarda como `99`.

### Solución
```javascript
const price = parseFloat($('svc-price').value);  // ✅ parseFloat
if (isNaN(price) || price < 0) {
    showToast('Precio inválido', 'error');
    return;
}
```

---

## MEDIO #3: No hay indicación visual de que se está guardando
**Ubicación:** Múltiples funciones en `app.js`  
**Severidad:** 🟡 MEDIO  
**Impacto:** Usuario cree que no funcionó mientras se guarda  

### Descripción
Cuando se guarda un servicio, no hay loader:

```javascript
window.saveService = function (id) {
    const name = $('svc-name').value.trim();
    // ... validaciones ...
    
    // ❌ Sin indicación de que se está procesando
    saveFinalService(id, name, duration, price, image);
    // Usuario cree que nada pasó hasta que aparezca el toast
};
```

---

## MEDIO #4: JavaScript archivo muy grande (estructura deficiente)
**Ubicación:** `app.js` (entire file)  
**Severidad:** 🟡 MEDIO  
**Impacto:** Difícil de mantener, debugging complicado  

### Descripción
- **Tamaño:** +1700 líneas de código en un solo archivo
- **Estructura:** Todo dentro de IIFE, sin módulos
- **Acoplamiento:** Frontend y admin panel mezclados
- **Reutilización:** Código duplicado (ej: renderCalendar aparece 2 veces)

### Solución
Refactorizar en módulos:
```
app.js (IIFE principal)
├── modules/
│   ├── calendar.js
│   ├── booking.js
│   ├── admin.js
│   ├── sync.js
│   └── api.js
└── utils/
    ├── storage.js
    ├── validation.js
    └── formatting.js
```

---

## MEDIO #5: Sin manejo de errores de red en sincronización
**Ubicación:** `app.js` línea ~87-145  
**Severidad:** 🟡 MEDIO  
**Impacto:** Errores silenciosos al cargar desde Firestore  

### Descripción
```javascript
async function loadFromFirestore() {
    try {
        if (!window.db) return;
        
        const { getDocs, collection } = await import(...);
        
        const servicesSnapshot = await getDocs(collection(window.db, 'services'));
        // ❌ SI falla, solo lo loguea en console.log,  no avisa al usuario
    } catch (error) {
        console.log('Firestore sync not available, using localStorage cache');  // ❌ Muy silencioso
    }
}
```

### Solución
```javascript
async function loadFromFirestore() {
    try {
        // ...
    } catch (error) {
        if (error.code === 'permission-denied') {
            console.warn('⚠️ Permisos insuficientes en Firestore');
            showToast('⚠️ No se puede sincronizar datos con el servidor', 'warning');
        } else {
            console.warn('Error loading from Firestore:', error.code, error.message);
        }
    }
}
```

---

## MEDIO #6: No hay límite de reintentos en sync
**Ubicación:** `app.js` línea ~520-540  
**Severidad:** 🟡 MEDIO  
**Impacto:** Potencial de loops infinitos de retry  

### Descripción
Si el backend no responde, no hay límite de reintentos. El fetch fallará, pero no hay backoff exponencial.

---

# 🔵 PROBLEMAS MENORES (Severidad 4-5/5)

## MENOR #1: Inconsistencia en nombres de propiedades
**Ubicación:** múltiples archivos  
**Severidad:** 🔵 MENOR  

Algunos lugares usan `calendarEventId`, otros usan `eventId`. Hay inconsistencia en nomenclatura de propiedades entre frontend y backend.

---

## MENOR #2: CSS no optimizado para móvil en algunos casos
**Ubicación:** `styles.css` y `index.html`  
**Severidad:** 🔵 MENOR  

Algunos elementos no tienen breakpoints definidos. Botones de acciones en tabla de admin no se adaptan bien en móvil.

---

## MENOR #3: No hay versionado de API en backend
**Ubicación:** `backend/server.js`  
**Severidad:** 🔵 MENOR  

Endpoints no tienen versión (ej: `/v1/api/appointments`). Si en el futuro hay cambios incompatibles, habrá problemas.

---

## MENOR #4: Falta de logging estructurado
**Ubicación:** `backend/server.js` y `routes/`  
**Severidad:** 🔵 MENOR  

Los logs usan `console.log` simple. En producción, sería mejor usar un logger (winston, pino).

---

---

# 📊 TABLA RESUMEN

| Tipo | ID | Título | Severidad | Estado |
|------|----|----|:---:|:--- |
| Crítico | #1 | Ruta `/auth/disconnect` no existe | 🔴 CRÍTICO | ❌ No funciona |
| Crítico | #2 | `hasAuthorizedCalendar` async sin await | 🔴 CRÍTICO | ❌ No funciona |
| Crítico | #3 | `getTokens` async sin await en calendar.js | 🔴 CRÍTICO | ❌ No funciona |
| Crítico | #4 | Validación email incoherente | 🔴 CRÍTICO | ⚠️ Parcial |
| Crítico | #5 | Sin notificación si backend cae | 🔴 CRÍTICO | ⚠️ Silencioso |
| Alto | #1 | Race condition en renderAdminStylists | 🟠 ALTO | ❌ No sincroniza |
| Alto | #2 | Variables de entorno no validadas | 🟠 ALTO | ⚠️ En runtime |
| Alto | #3 | Backend URL hardcodeado | 🟠 ALTO | ⚠️ No flexible |
| Alto | #4 | CORS demasiado permisivo | 🟠 ALTO | 🔒 Security |
| Alto | #5 | EmailJS incompleto | 🟠 ALTO | ⚠️ Sin emails |
| Alto | #6 | Sin timeout en fetch | 🟠 ALTO | ⚠️ Cuelga |
| Alto | #7 | Validación cancelación solo frontend | 🟠 ALTO | 🔒 Security |
| Alto | #8 | Data sync inconsistente | 🟠 ALTO | ⚠️ Conflictos |
| Medio | #1 | Sin validación duración > 480 | 🟡 MEDIO | ⚠️ Menor |
| Medio | #2 | Precio como entero, no float | 🟡 MEDIO | ⚠️ Datos |
| Medio | #3 | Sin loader visual | 🟡 MEDIO | ⚠️ UX |
| Medio | #4 | app.js muy grande | 🟡 MEDIO | 📝 Técnico |
| Medio | #5 | Errores Firestore silenciosos | 🟡 MEDIO | ⚠️ Debug |
| Medio | #6 | Sin backoff exponencial | 🟡 MEDIO | ⚠️ Menor |
| Menor | #1 | Inconsistencia nomenclatura | 🔵 MENOR | 📝 Técnico |
| Menor | #2 | CSS no responsive complete | 🔵 MENOR | 📝 Técnico |
| Menor | #3 | Sin API versioning | 🔵 MENOR | 📝 Técnico |
| Menor | #4 | Sin logging estructurado | 🔵 MENOR | 📝 Técnico |

---

# ✅ PLAN DE ACCIÓN RECOMENDADO

## FASE 1: BLOQUEOS CRÍTICOS (HOY) — ~4 horas
1. ✅ Agregar ruta `DELETE /auth/disconnect` a backend
2. ✅ Arreglar async/await en `auth.js` y `calendar.js`
3. ✅ Mejorar error handling en confirmBooking

## FASE 2: SEGURIDAD Y VALIDACIÓN (MAÑANA) — ~3 horas
4. ✅ Mover validaciones al backend
5. ✅ Arreglar CORS configuration
6. ✅ Agregar timeouts a fetch calls

## FASE 3: SINCRONIZACIÓN (SEMANA) — ~6 horas
7. ✅ Implementar sync queue
8. ✅ Validación de env vars
9. ✅ Implementar reintentos con backoff

## FASE 4: MEJORAS (FUTURO) — ~8 horas
10. ✅ Refactorizar app.js en módulos
11. ✅ Implementar EmailJS en backend
12. ✅ Agregar logging estructurado

---

# 🔧 ARCHIVOS A MODIFICAR

### Crítico (DEBEN fixearse HOY):
1. `backend/routes/auth.js` — Agregar ruta disconnect + arreglar async
2. `backend/routes/calendar.js` — Arreglar getTokens sin await
3. `app.js` — Mejor error handling en confirmBooking

### Alto (DEBEN fixearse esta semana):
4. `backend/server.js` — CORS + env vars validation + timeouts
5. `app.js` — Cancelación con validación backend
6. `app.js` — Implementar sync queue

### Técnico (Refactoring):
7. `styles.css` — Media queries completos
8. `app.js` — Dividir en módulos

---

## 📝 CONCLUSIÓN

El sistema tiene **una estructura funcional** pero con **múltiples fallos críticos** que pueden causar:
- **Data inconsistencia** (turnos en cliente pero no en servidor)
- **Google Calendar no sincroniza** (problemas async/await)
- **Seguridad débil** (CORS, validaciones solo frontend)
- **Poor UX** (errores silenciosos, sin feedback)

**Recomendación:** Fijar los problemas **CRÍTICOS** antes de usar en producción con clientes reales.
