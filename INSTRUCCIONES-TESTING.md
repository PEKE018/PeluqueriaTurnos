# ✅ Checklist de Testing - Sistema de Turnos Mostaza

Seguí estos pasos para probar que todo funcione correctamente.

---

## 🔧 PRE-REQUISITOS

- [ ] Backend ya desplegado (o corriendo localmente)
- [ ] Frontend deployado en Firebase o Live Server
- [ ] Google Cloud Console configurado con URLs correctas

---

## 📋 TESTING PASO A PASO

### 1️⃣ Verificar Backend

**Abrir terminal y ejecutar:**
```bash
cd backend
npm start
```

**Verificar que diga:**
```
✅ Server running on port 3000
🔗 http://localhost:3000
```

**Test manual:**
- Abrir navegador: http://localhost:3000/health
- Debe mostrar: `{"status":"ok","message":"Mostaza Backend API...`

---

### 2️⃣ Configurar Panel de Admin

1. **Abrir app:**
   - Con Live Server: Abrir `index.html` con Live Server
   - Con Firebase: Ir a https://mostaza-peluqueria.web.app

2. **Entrar al panel admin:**
   - Click en botón "Panel Admin" (arriba derecha)
   - Contraseña: `admin123` (por defecto)

3. **Configurar Backend URL:**
   - Ir a pestaña **"Configuración"**
   - Bajar hasta **"Backend & Google Calendar API"**
   - En campo **"URL del Backend"** poner:
     * Si usas Live Server: `http://localhost:3000`
     * Si usas Firebase: (tu URL de backend en producción)
   - Click **"Guardar URL Backend"**
   - Click **"Probar Conexión"**
   - ✅ Debe decir: **"✓ Conexión exitosa con el servidor backend"**

---

### 3️⃣ Configurar Profesionales

1. **En panel admin, ir a pestaña "Profesionales"**

2. **Agregar profesional (si no hay ninguno):**
   - Click "+ Agregar Profesional"
   - Nombre: "María Test"
   - Email: "maria@test.com" (opcional)
   - Guardar

3. **Conectar Google Calendar:**
   - En la columna **"Google Calendar"** debe decir "⚠ Sin conectar"
   - Click en botón **"📅 Conectar Calendario"**
   - Se abre ventana de Google
   - Seleccionar cuenta de Google
   - Aceptar permisos
   - Cerrar ventana cuando diga "Success"
   - Refrescar página o esperar unos segundos
   - ✅ Debe decir: **"✓ Google Calendar conectado"** con el email

---

### 4️⃣ Crear Turno de Prueba (Cliente)

1. **Cerrar panel admin** (click fuera o en X)

2. **Como cliente, reservar un turno:**
   - Elegir un servicio (ej: "Corte")
   - Elegir profesional: "María Test"
   - Elegir fecha y hora disponible
   - Completar formulario:
     * Nombre: "Cliente Test"
     * Email: "cliente@test.com"
     * Teléfono: "11-1234-5678"
   - Click **"Confirmar Turno"**

3. **Verificar mensaje:**
   - ✅ Debe decir: **"✅ Turno confirmado y agregado automáticamente al Google Calendar del profesional"**

---

### 5️⃣ Verificar en Google Calendar

1. **Abrir Google Calendar:** https://calendar.google.com

2. **Usar la cuenta que autorizaste** (del profesional)

3. **Buscar el evento:**
   - Fecha: fecha del turno creado
   - Hora: hora del turno
   - Título: Debe incluir "Turno - Corte" y el nombre del cliente

4. ✅ **El evento debe estar creado automáticamente**

---

### 6️⃣ Gestionar Turnos (Admin)

1. **Volver al panel admin**

2. **Ver turnos creados:**
   - Pestaña **"Turnos"**
   - Debe aparecer el turno recién creado
   - Estado: "Confirmado" (badge verde)

3. **Probar acciones:**
   - Click "Completar" → cambia a estado "Completado"
   - O "Cancelar" → cambia a "Cancelado"

---

## 🐛 TROUBLESHOOTING

### ❌ "No se puede conectar al servidor backend"

**Solución:**
1. Verificar que backend esté corriendo: `npm start` en carpeta backend
2. Verificar URL en Configuración: debe ser exacta (http://localhost:3000)
3. No usar https con localhost
4. Si usas Live Server, verificar que no haya conflicto de puertos

---

### ❌ "Error al conectar calendario"

**Solución:**
1. Verificar que backend esté funcionando
2. Abrir consola del navegador (F12) y buscar errores
3. Verificar en Google Cloud Console que las URLs de redirect estén correctas:
   - http://localhost:3000/auth/google/callback (para local)
   - Tu URL de producción + /auth/google/callback (para producción)

---

### ❌ El evento NO aparece en Google Calendar

**Solución:**
1. Verificar que el profesional esté **conectado** (✓ en columna Google Calendar)
2. Verificar en consola del navegador (F12) si hay errores
3. Abrir terminal del backend y ver logs
4. Verificar que la cuenta de Google del profesional sea la misma que autorizaste

---

### ❌ "Turno confirmado" pero sin evento en calendario

**Verificar:**
1. Estado de conexión del profesional (panel admin → Profesionales)
2. Logs del backend (terminal)
3. Probar desconectar y volver a conectar calendario

---

## ✅ CHECKLIST FINAL

- [ ] Backend responde en /health
- [ ] URL del backend configurada y testeada
- [ ] Al menos 1 profesional con Google Calendar conectado (✓)
- [ ] Crear turno como cliente → mensaje de éxito
- [ ] Evento aparece automáticamente en Google Calendar
- [ ] Ver turno en panel admin
- [ ] Cambiar estado de turno (Completar/Cancelar)

---

## 🚀 TODO OK = LISTO PARA PRODUCCIÓN

Si todos los puntos funcionan, estás listo para:

1. Deployar backend a Railway/Render
2. Actualizar URL de backend en Google Cloud Console
3. Actualizar URL de backend en panel de admin
4. ¡A usarlo! 🎉

---

## 📞 CONTACTO

Si algo no funciona:
1. Revisar logs del backend (terminal)
2. Revisar consola del navegador (F12)
3. Verificar que todas las URLs coincidan

---

¡Éxito! 🎊
