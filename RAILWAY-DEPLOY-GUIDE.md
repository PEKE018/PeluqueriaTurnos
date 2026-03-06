# Railway Deploy - Sin GitHub

## Opción 1: Subir con Railway CLI (Recomendado)

1. Instalar Railway CLI:
```powershell
npm install -g @railway/cli
```

2. Login:
```powershell
railway login
```

3. Dentro de la carpeta backend:
```powershell
cd backend
railway init
railway up
```

4. Configurar variables de entorno en el dashboard de Railway

## Opción 2: Usar Render en lugar de Railway

Render permite subir código directamente sin GitHub:

1. Ir a: https://render.com/
2. "New" → "Web Service"
3. "Public Git repository" o conectar GitHub
4. Build Command: `npm install`
5. Start Command: `npm start`
6. Add Environment Variables (ver abajo)

---

## Variables de Entorno para Railway/Render:

```
GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu-client-secret
REDIRECT_URI=https://[tu-url-del-backend]/auth/google/callback
PORT=3000
FRONTEND_URL=https://mostaza-peluqueria.web.app
SESSION_SECRET=[generar-uno-random]
```

### Generar SESSION_SECRET:

**PowerShell:**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

### Obtener GOOGLE_CLIENT_ID y CLIENT_SECRET:

1. Ir a: https://console.cloud.google.com/
2. Crear proyecto "Mostaza Peluqueria"
3. "APIs & Services" → "Enable APIs"
4. Buscar "Google Calendar API" → Enable
5. "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
6. Application type: "Web application"
7. Authorized redirect URIs:
   - `https://[tu-backend-url]/auth/google/callback`
   - `http://localhost:3000/auth/google/callback`
8. Copiar Client ID y Client Secret

---

## Verificar que funcione:

1. Abrir: `https://tu-backend-url.com/health`
   - Debe responder: `{"status":"ok",...}`

2. En el frontend (Admin):
   - Ir a "Backend & Google Calendar API"
   - Pegar URL del backend
   - Click "Guardar URL Backend"
   - Click "Probar Conexión" → debe decir "✅ Conexión exitosa"
