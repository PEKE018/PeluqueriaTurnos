# 🚀 Guía de Deployment a Producción - Mostaza Peluquería

## 📋 Checklist Pre-Producción

### ✅ Frontend (Firebase Hosting)
- [x] Logo integrado y optimizado
- [x] Sección de contacto (Instagram, WhatsApp, Maps)
- [x] Responsive para móviles
- [ ] Bug de confirmación resuelto (pendiente logs)
- [ ] Probar flujo completo de reserva
- [ ] Verificar todos los formularios

### ⚙️ Backend (Railway/Render/Vercel)
- [ ] Backend desplegado y funcionando
- [ ] URL del backend configurada en Admin
- [ ] Google Calendar API conectada
- [ ] Test de endpoints funcionando

---

## 🔧 Paso 1: Preparar Backend para Producción

### A. Limpiar credenciales del .env.example

**Archivo:** `backend/.env.example`

Debe quedar así (SIN credenciales reales):

```env
# Google OAuth 2.0 Credentials
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
REDIRECT_URI=https://your-backend-url.com/auth/google/callback

# Server Configuration
PORT=3000
FRONTEND_URL=https://mostaza-peluqueria.web.app

# Session Secret (generar uno random en producción)
SESSION_SECRET=generate-random-secret-here
```

### B. Obtener credenciales de Google Calendar API

1. Ir a: https://console.cloud.google.com/
2. Crear nuevo proyecto: "Mostaza Peluqueria"
3. Habilitar **Google Calendar API**
4. Crear credenciales OAuth 2.0:
   - Tipo: "Web application"
   - URIs de redirección autorizadas:
     - `https://tu-backend-url.com/auth/google/callback`
     - `http://localhost:3000/auth/google/callback` (para testing local)
5. Copiar Client ID y Client Secret

---

## 🌐 Paso 2: Desplegar Backend

### Opción A: Railway (Recomendado)

1. Ir a: https://railway.app/
2. Conectar cuenta GitHub
3. "New Project" → "Deploy from GitHub repo"
4. Seleccionar carpeta `backend`
5. Añadir variables de entorno:
   ```
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   REDIRECT_URI=https://tu-backend.railway.app/auth/google/callback
   PORT=3000
   FRONTEND_URL=https://mostaza-peluqueria.web.app
   SESSION_SECRET=<generar-con-openssl-rand-base64-32>
   ```
6. Deploy automático
7. Copiar URL del backend (ej: `https://mostaza-backend.railway.app`)

### Opción B: Render

1. Ir a: https://render.com/
2. "New" → "Web Service"
3. Conectar GitHub
4. Root Directory: `backend`
5. Build Command: `npm install`
6. Start Command: `npm start`
7. Añadir Environment Variables (las mismas de arriba)
8. Deploy
9. Copiar URL del backend

### Opción C: Vercel (Serverless)

Requiere adaptar el código a formato serverless. No recomendado para este proyecto.

---

## 🔗 Paso 3: Configurar Backend URL en la App

1. Abrir: https://mostaza-peluqueria.web.app
2. Hacer clic en "Acceso Admin" (abajo a la derecha)
3. Ingresar contraseña
4. En "Backend & Google Calendar API":
   - URL del Backend: `https://tu-backend.railway.app`
   - Click "Guardar URL Backend"
   - Click "Probar Conexión" (debe decir "✅ Conexión exitosa")

---

## 📅 Paso 4: Conectar Google Calendar de cada Profesional

Para cada estilista:

1. Ir a Admin → "Profesionales"
2. Click en "Conectar Google Calendar"
3. Se abrirá ventana de autorización de Google
4. Permitir acceso a Google Calendar
5. Verificar estado: debe decir "✅ Calendario conectado"

---

## 🧪 Paso 5: Testing Completo

### Flujo Cliente:
1. Elegir servicio
2. Elegir profesional
3. Elegir fecha y hora
4. Completar datos (nombre, email, teléfono)
5. Confirmar turno
6. ✅ Verificar que aparezca pantalla de confirmación
7. ✅ Revisar que llegue email con invitación .ics
8. ✅ Verificar que aparezca en Google Calendar del profesional

### Flujo Admin:
1. Ver turnos del día
2. Ver todos los turnos
3. Cancelar un turno → verificar que se borre en Google Calendar
4. Bloquear horarios
5. Editar servicios y precios

---

## 🛡️ Paso 6: Seguridad

### Cambiar contraseña de admin (IMPORTANTE ⚠️):

**Contraseña por defecto:** `admin123`

1. Entrar al Admin con la contraseña por defecto
2. Ir a la sección "Configuración General"
3. Cambiar la contraseña a algo seguro
4. Click "Guardar Configuración"

**Recomendación:** Usar una contraseña fuerte con mayúsculas, minúsculas, números y símbolos.

### Generar SESSION_SECRET seguro:

```bash
openssl rand -base64 32
```

Usar este output en las variables de entorno del backend.

---

## 📊 Monitoreo Post-Producción

### Verificar que funcione:
- [ ] Reservas se crean correctamente
- [ ] Emails llegan a los clientes
- [ ] Eventos aparecen en Google Calendar
- [ ] Cancelaciones funcionan
- [ ] Bloqueos de horarios funcionan
- [ ] Panel admin accesible

### Logs del backend:
- Railway: Ver logs en el dashboard
- Render: Logs en el dashboard
- Errores comunes: tokens expirados (requiere re-autorizar calendario)

---

## 🆘 Troubleshooting

### "Backend no disponible"
- Verificar que el backend esté corriendo
- Verificar URL configurada en Admin
- Verificar CORS permite el frontend URL

### "Google Calendar no se actualiza"
- Verificar que el profesional haya autorizado su cuenta
- Re-autorizar si es necesario
- Verificar logs del backend

### "Confirmación desaparece"
- Revisar logs de la consola del navegador (F12)
- Verificar que no haya errores JavaScript

---

## 📞 Contacto y Soporte

- Instagram: [@mostazapeluqueria](https://www.instagram.com/mostazapeluqueria)
- WhatsApp Nesti: +54 9 3537 33-2152

---

## 🎉 ¡Listo para Producción!

Una vez completados todos los pasos:
1. ✅ Frontend desplegado en Firebase
2. ✅ Backend funcionando con Google Calendar
3. ✅ Profesionales autorizados
4. ✅ Testing completo realizado
5. ✅ Contraseña admin cambiada

**Tu sistema está listo para recibir reservas reales 🚀**
