# 🔐 Variables de Entorno para Producción (Backend)

## Para Railway / Render / Heroku

Copiar y pegar estas variables en el panel de configuración del hosting:

### 📋 Variables (completar con tus valores reales):

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
REDIRECT_URI=https://your-backend-url.com/auth/google/callback
PORT=3000
FRONTEND_URL=https://mostaza-peluqueria.web.app
SESSION_SECRET=generar-con-comando-abajo
```

---

## 🔑 Cómo obtener cada valor:

### 1. GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET

**Ir a:** https://console.cloud.google.com/

**Pasos:**
1. Crear nuevo proyecto → "Mostaza Peluqueria"
2. "APIs & Services" → "Enable APIs and Services"
3. Buscar y habilitar: **"Google Calendar API"**
4. "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Application type: **Web application**
6. Name: "Mostaza Backend"
7. Authorized redirect URIs:
   - `https://your-backend-url.com/auth/google/callback`
   - `http://localhost:3000/auth/google/callback` (para testing local)
8. Click "Create"
9. Copiar **Client ID** y **Client Secret**

### 2. REDIRECT_URI

**Formato:** `https://your-backend-url.com/auth/google/callback`

**Ejemplos:**
- Railway: `https://mostaza-backend-production.up.railway.app/auth/google/callback`
- Render: `https://mostaza-backend.onrender.com/auth/google/callback`

⚠️ **IMPORTANTE:** Usar la URL exacta que te dé Railway/Render después del deploy

### 3. PORT

Dejar en `3000` (la mayoría de hostings lo reemplazan automáticamente)

### 4. FRONTEND_URL

Ya está desplegado en: `https://mostaza-peluqueria.web.app`

### 5. SESSION_SECRET

**Generar uno seguro con:**

**Windows (PowerShell):**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

**Mac/Linux:**
```bash
openssl rand -base64 32
```

**Online:** https://randomkeygen.com/ (sección "Fort Knox Passwords")

---

## 📝 Ejemplos Completos

### Railway:

```env
GOOGLE_CLIENT_ID=938542380078-abc123def456.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-AbCdEfGhIjKlMnOpQr
REDIRECT_URI=https://mostaza-backend-production.up.railway.app/auth/google/callback
PORT=3000
FRONTEND_URL=https://mostaza-peluqueria.web.app
SESSION_SECRET=Kx7Vm3Qp9Zt2Bn5Wc8Yr6Hf4Jl1Dg0Sa
```

### Render:

```env
GOOGLE_CLIENT_ID=938542380078-abc123def456.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-AbCdEfGhIjKlMnOpQr
REDIRECT_URI=https://mostaza-backend.onrender.com/auth/google/callback
PORT=3000
FRONTEND_URL=https://mostaza-peluqueria.web.app
SESSION_SECRET=Kx7Vm3Qp9Zt2Bn5Wc8Yr6Hf4Jl1Dg0Sa
```

---

## ✅ Checklist:

- [ ] Proyecto creado en Google Cloud Console
- [ ] Google Calendar API habilitada
- [ ] Credenciales OAuth 2.0 creadas
- [ ] REDIRECT_URI agregada en Google Console
- [ ] SESSION_SECRET generado de forma segura
- [ ] Todas las variables copiadas al hosting
- [ ] Backend desplegado correctamente
- [ ] Probada conexión desde Frontend (Admin panel)

---

## 🧪 Probar que funcione:

1. Abrir: `https://your-backend-url.com/health`
   - Debe responder: `{"status":"ok","message":"Backend is healthy",...}`

2. En el frontend:
   - Admin → Backend & Google Calendar API
   - Ingresar URL del backend
   - Click "Guardar" y luego "Probar Conexión"
   - Debe decir: ✅ "Conexión exitosa"

3. Conectar calendario de un profesional:
   - Admin → Profesionales
   - Click "Conectar Google Calendar"
   - Autorizar con tu cuenta Google
   - Verificar estado: "✅ Calendario conectado"

---

## 🆘 Errores Comunes:

### "OAuth error: redirect_uri_mismatch"
- El REDIRECT_URI no coincide con el configurado en Google Console
- Verificar que sea EXACTAMENTE el mismo (con https://, sin trailing slash)

### "Invalid client"
- CLIENT_ID o CLIENT_SECRET incorrectos
- Verificar que estés usando las credenciales del proyecto correcto

### "CORS error"
- Verificar que FRONTEND_URL esté correctamente configurado
- El backend ya tiene CORS configurado para https://mostaza-peluqueria.web.app

---

Ver **DEPLOYMENT.md** para guía completa paso a paso.
