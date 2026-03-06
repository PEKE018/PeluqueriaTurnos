# 🚀 Mostaza Backend - Google Calendar Integration

Backend Node.js con integración directa a Google Calendar API para el sistema de turnos de Mostaza Peluquería.

## 📋 Características

- ✅ Autenticación OAuth 2.0 con Google
- ✅ Creación automática de eventos en Google Calendar
- ✅ Sincronización bidireccional (crear, actualizar, eliminar)
- ✅ Multi-profesional (cada uno con su propio calendario)
- ✅ API REST completa
- ✅ Base de datos JSON (fácil de migrar)
- ✅ CORS configurado para frontend

## 🛠️ Instalación

### 1. Instalar dependencias

```bash
cd backend
npm install
```

### 2. Configurar variables de entorno

Copiar `.env.example` a `.env` y completar:

```bash
cp .env.example .env
```

Editar `.env` con tus credenciales:

```env
GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu-client-secret
REDIRECT_URI=http://localhost:3000/auth/google/callback
PORT=3000
FRONTEND_URL=https://mostaza-peluqueria.web.app
SESSION_SECRET=cambia-esto-por-algo-seguro
```

### 3. Iniciar servidor

**Desarrollo (con auto-reload):**
```bash
npm run dev
```

**Producción:**
```bash
npm start
```

El servidor estará en: `http://localhost:3000`

## 📡 API Endpoints

### Auth (OAuth 2.0)

#### GET `/auth/google/:stylistId`
Genera URL de autorización para que un profesional conecte su Google Calendar.

**Response:**
```json
{
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?...",
  "message": "Redirect user to this URL..."
}
```

#### GET `/auth/google/callback`
Callback de OAuth - recibe el código y guarda los tokens.

#### GET `/auth/status/:stylistId`
Verifica si un profesional ha autorizado su calendario.

**Response:**
```json
{
  "stylistId": "1",
  "authorized": true,
  "message": "Calendar is connected"
}
```

#### DELETE `/auth/disconnect/:stylistId`
Desconecta el Google Calendar de un profesional.

---

### Appointments

#### POST `/api/appointments`
Crea un turno y lo agrega automáticamente al Google Calendar del profesional.

**Body:**
```json
{
  "id": "turno-123",
  "clientName": "Juan Pérez",
  "clientEmail": "juan@example.com",
  "clientPhone": "11-1234-5678",
  "serviceId": "1",
  "serviceName": "Corte de pelo",
  "stylistId": "1",
  "stylistName": "María",
  "date": "2026-03-10",
  "time": "14:30",
  "price": 5000,
  "duration": 30
}
```

**Response:**
```json
{
  "success": true,
  "appointment": {...},
  "calendarCreated": true,
  "message": "Appointment created and added to calendar"
}
```

#### GET `/api/appointments`
Obtiene todos los turnos.

#### GET `/api/appointments/:id`
Obtiene un turno específico.

#### DELETE `/api/appointments/:id`
Cancela un turno y lo elimina del Google Calendar.

---

### Calendar (Manual event management)

#### POST `/api/calendar/create-event`
Crea un evento manualmente en Google Calendar.

**Body:**
```json
{
  "stylistId": "1",
  "summary": "Corte - Juan Pérez",
  "description": "Cliente: Juan Pérez...",
  "startDateTime": "2026-03-10T14:30:00-03:00",
  "endDateTime": "2026-03-10T15:00:00-03:00",
  "attendees": [{"email": "juan@example.com"}]
}
```

#### DELETE `/api/calendar/delete-event`
Elimina un evento del calendario.

#### PUT `/api/calendar/update-event`
Actualiza un evento del calendario.

---

## 🔐 Flujo OAuth 2.0

### Para conectar el calendario de un profesional:

1. **Admin panel del frontend** hace request a:
   ```
   GET /auth/google/{stylistId}
   ```

2. **Backend responde** con URL de autorización:
   ```
   https://accounts.google.com/o/oauth2/v2/auth?...
   ```

3. **Frontend redirige** al profesional a esa URL

4. **Profesional autoriza** en Google

5. **Google redirige** a:
   ```
   /auth/google/callback?code=...&state={stylistId}
   ```

6. **Backend guarda tokens** y redirige a frontend:
   ```
   https://mostaza-peluqueria.web.app/?calendar_auth=success&stylist=1
   ```

7. **Frontend muestra confirmación** ✅

---

## 📁 Estructura

```
backend/
├── server.js              # Servidor Express principal
├── package.json           # Dependencias
├── .env                   # Variables de entorno (NO commitear)
├── .env.example          # Template de variables
├── routes/
│   ├── auth.js           # OAuth flow
│   ├── appointments.js   # CRUD de turnos
│   └── calendar.js       # Manejo directo de calendario
├── utils/
│   ├── googleAuth.js     # Helpers de Google OAuth
│   └── db.js             # Base de datos JSON
└── data/                 # Archivos de datos (generado)
    ├── tokens.json       # Tokens OAuth por profesional
    └── appointments.json # Turnos guardados
```

---

## 🧪 Testing

### Test de health check:
```bash
curl http://localhost:3000
```

### Test de autorización:
```bash
curl http://localhost:3000/auth/google/1
```

### Test de creación de turno:
```bash
curl -X POST http://localhost:3000/api/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "clientName": "Test Cliente",
    "clientEmail": "test@example.com",
    "clientPhone": "11-1111-1111",
    "serviceId": "1",
    "serviceName": "Corte",
    "stylistId": "1",
    "stylistName": "María",
    "date": "2026-03-10",
    "time": "10:00",
    "price": 5000,
    "duration": 30
  }'
```

---

## 🚀 Deploy

### Opción 1: Railway / Render
1. Push a GitHub
2. Conectar repo en Railway/Render
3. Configurar variables de entorno
4. Deploy automático

### Opción 2: Heroku
```bash
heroku create mostaza-backend
heroku config:set GOOGLE_CLIENT_ID=...
heroku config:set GOOGLE_CLIENT_SECRET=...
git push heroku main
```

### Opción 3: VPS (DigitalOcean, AWS, etc.)
```bash
# Instalar Node.js
# Clonar repo
# Instalar PM2
npm install -g pm2
pm2 start server.js --name mostaza-backend
pm2 save
pm2 startup
```

---

## ⚠️ Importante

- **Tokens sensibles:** Los archivos en `data/tokens.json` contienen tokens de acceso. ¡NO los commitees a Git!
- **HTTPS en producción:** Google OAuth requiere HTTPS para redirect URIs en producción
- **Rate limits:** Google Calendar API tiene límites de requests. Para alto tráfico, implementar queue system
- **Refresh tokens:** El código maneja automáticamente la renovación de tokens expirados

---

## 🔧 Troubleshooting

### "Stylist has not authorized calendar access"
→ El profesional debe autorizar su calendario primero desde el panel admin

### "Token expired"
→ El backend renueva automáticamente. Si persiste, reconectar calendario

### "Invalid redirect URI"
→ Verificar que la URL en Google Cloud Console coincida con `REDIRECT_URI` en `.env`

### "CORS error"
→ Agregar tu dominio frontend a la whitelist en `server.js`

---

## 📚 Recursos

- [Google Calendar API Docs](https://developers.google.com/calendar/api/guides/overview)
- [OAuth 2.0 for Web Server Apps](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Express.js](https://expressjs.com/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

---

**¿Dudas?** Revisar los logs del servidor o consultar la documentación de Google Calendar API.
