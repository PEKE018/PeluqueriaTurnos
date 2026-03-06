# 🎯 Sistema Completo de Turnos Mostaza

## ✅ BACKEND LISTO Y CONFIGURADO

He creado un backend completo con integración directa a Google Calendar API.

---

## 🚀 CÓMO INICIAR TODO

### 1. Iniciar el Backend

**Opción A - Doble clic:**
```
START-BACKEND.bat
```

**Opción B - Terminal:**
```bash
cd backend
npm start
```

El backend estará en: `http://localhost:3000`

### 2. Frontend ya está deployado

Ya está online en: **https://mostaza-peluqueria.web.app**

---

## 🔧 CONFIGURACIÓN FINAL PENDIENTE

### 1. Actualizar URLs de producción en Google Cloud Console

Ve a: https://console.cloud.google.com/apis/credentials

Edita tu Cliente OAuth y actualiza **"URIs de redireccionamiento autorizados"**:

**Para desarrollo local:**
```
http://localhost:3000/auth/google/callback
```

**Para producción (cuando deploys el backend):**
```
https://tu-backend-en-produccion.com/auth/google/callback
```

---

## 📱 CÓMO FUNCIONA EL SISTEMA

### 🌐 **NUEVO: Panel de Administración Integrado**

Ahora el frontend tiene un panel completo para conectar Google Calendar **sin tocar código**.

#### **Paso 1: Configurar URL del Backend**

1. **Abrir panel admin:** https://mostaza-peluqueria.web.app (click en "Panel Admin")
2. Ingresar contraseña: `admin123` (por defecto)
3. **Ir a pestaña "Configuración"**
4. Bajar hasta la sección **"Backend & Google Calendar API"**
5. En el campo **"URL del Backend"** ingresar:
   - Para local: `http://localhost:3000`
   - Para producción: URL de tu servidor desplegado
6. **Click en "Guardar URL Backend"**
7. **Click en "Probar Conexión"** → Debe decir "✓ Conexión exitosa"

#### **Paso 2: Conectar Calendarios de Profesionales**

1. Ir a pestaña **"Profesionales"**
2. Para cada profesional, verás una columna **"Google Calendar"**
3. Si dice "⚠ Sin conectar", click en **"📅 Conectar Calendario"**
4. Se abre ventana de Google pidiendo autorización
5. El profesional debe:
   - Seleccionar su cuenta de Google
   - Aceptar permisos para ver/crear eventos en su calendario
   - Cerrar la ventana cuando diga "Success"
6. El estado cambia a **"✓ Google Calendar conectado"**
7. Se muestra el email de la cuenta conectada

✅ **Listo!** Ahora cuando un cliente cree un turno:
- Se guarda automáticamente en la app
- Se crea un evento en el Google Calendar del profesional
- El profesional recibe notificaciones de Google (si las tiene configuradas)

---

### Para el Administrador (Primera vez - MÉTODO ANTERIOR):

> **NOTA:** Este método ya NO es necesario si usaste el panel de admin (arriba). 
> Solo para referencia técnica.

1. **Abrir panel admin** en https://mostaza-peluqueria.web.app
2. Ir a **"Profesionales"**
3. Para cada profesional, hacer clic en **"Conectar Calendario"**
4. Se abre ventana de Google para autorizar
5. El profesional autoriza su Google Calendar
6. ✅ Listo - ahora los turnos se crean automáticamente

### Para los Clientes:

1. Cliente entra a https://mostaza-peluqueria.web.app
2. Elige servicio, profesional, fecha y hora
3. Ingresa nombre, email y teléfono
4. Confirma turno
5. **Automáticamente:**
   - Se crea evento en Google Calendar del profesional
   - Cliente puede recibir email (si EmailJS está configurado)
   - Profesional ve el turno en su calendario personal

---

## 📊 ESTRUCTURA DEL PROYECTO

```
📦 Turnos Peluquerias/
├── 📄 index.html              # Frontend (ya deployado)
├── 🎨 styles.css
├── ⚙️ app.js
├── 🚀 START-BACKEND.bat       # Iniciar backend fácil
├── 📧 CONFIGURACION-EMAILJS.md
├── 📖 README.md
├── 📖 GUIA-COMPLETA.md        # ← ESTE ARCHIVO
└── 📁 backend/                # ← Nuevo sistema
    ├── server.js              # Servidor Express
    ├── package.json
    ├── .env                   # Credenciales (ya configurado)
    ├── routes/
    │   ├── auth.js           # OAuth con Google
    │   ├── appointments.js   # Turnos → Calendar
    │   └── calendar.js       # Manejo manual
    └── utils/
        ├── googleAuth.js     # Helper de Google API
        └── db.js             # Base de datos JSON
```

---

## 🎯 PRÓXIMOS PASOS

### ✅ YA COMPLETADO:

1. ✅ **Frontend conectado con backend** 
   - app.js actualizado con fetch API
   - Panel de admin con configuración de backend
   - Botón "Conectar Calendario" en tabla de profesionales
   - Estado visual de conexión de calendarios

### SOLO FALTA:

1. **Deployar el backend** a producción (Opciones):
   - Railway.app (fácil, gratis) → https://railway.app
   - Render.com (fácil, gratis) → https://render.com  
   - Heroku (fácil, $5/mes) → https://heroku.com
   - VPS propio (más control)

2. **Actualizar configuración en Google Cloud Console:**
   - Agregar URL de producción en "URIs de redireccionamiento autorizados"
   - Ejemplo: `https://tu-backend.railway.app/auth/google/callback`

3. **Configurar en el panel de admin:**
   - Ir a Configuración → Backend & Google Calendar API
   - Cambiar URL de `http://localhost:3000` a tu URL de producción
   - Probar conexión

---

## 📡 API DEL BACKEND

### Endpoints disponibles:

#### **OAuth / Autorización**
```
GET  /auth/google/:stylistId          → URL para autorizar calendario
GET  /auth/google/callback            → Callback de Google OAuth
GET  /auth/status/:stylistId          → Ver si profesional autorizó
DELETE /auth/disconnect/:stylistId    → Desconectar calendario
```

#### **Turnos**
```
POST   /api/appointments              → Crear turno + evento calendar
GET    /api/appointments              → Listar todos los turnos
GET    /api/appointments/:id          → Ver un turno específico
DELETE /api/appointments/:id          → Cancelar turno + borrar de calendar
```

#### **Calendar (manual)**
```
POST   /api/calendar/create-event    → Crear evento manualmente
DELETE /api/calendar/delete-event    → Borrar evento
PUT    /api/calendar/update-event    → Actualizar evento
```

---

## 🔐 SEGURIDAD

✅ Tokens encriptados por Google
✅ OAuth 2.0 flow seguro
✅ CORS configurado
✅ .env en .gitignore
✅ Refresh tokens automático

---

## 📞 TESTING

### Test 1: Backend funcionando
```bash
curl http://localhost:3000
```

Debería responder:
```json
{
  "status": "ok",
  "message": "Mostaza Backend API running",
  "version": "1.0.0"
}
```

### Test 2: Crear turno de prueba
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

## ⚡ COMANDOS ÚTILES

```bash
# Iniciar backend
npm start

# Iniciar con auto-reload (desarrollo)
npm run dev

# Ver logs en tiempo real
# (Los logs aparecen en la terminal automáticamente)

# Detener servidor
Ctrl + C

# Reinstalar dependencias
cd backend
npm install
```

---

## 🐛 TROUBLESHOOTING

### "Cannot find module..."
```bash
cd backend
npm install
```

### "Port 3000 already in use"
Cambiar `PORT=3001` en `backend/.env`

### "Calendar not authorized"
El profesional debe autorizar su calendario primero desde el panel admin

### "CORS error"
Agregar tu dominio en `backend/server.js` en la lista de origins permitidos

---

## 📚 DOCUMENTACIÓN COMPLETA

- **Backend:** Ver `backend/README.md`
- **EmailJS:** Ver `CONFIGURACION-EMAILJS.md`
- **Frontend:** Ver `README.md`

---

**¡El sistema está completo y listo para usarse!** 🎉

Solo falta conectar el frontend con el backend (te lo paso cuando vuelvas).
