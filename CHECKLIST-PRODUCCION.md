# ✅ Checklist Rápido para Producción

## 🔴 CRÍTICO - Hacer ANTES de poner en producción:

- [ ] **Resolver bug de confirmación** - La pantalla de confirmación desaparece inmediatamente
  - Necesito que reserves un turno y me copies TODO lo que aparezca en la consola (F12)
  - Especialmente buscar logs con "🔄 RESET BOOKING" y su stack trace

- [ ] **Cambiar contraseña de admin**
  - Actual: `admin123`
  - Ir a Admin → Configuración → Cambiar contraseña
  - Usar algo seguro

## 🟡 IMPORTANTE - Para funcionalidad completa:

- [ ] **Desplegar backend** (elegir uno):
  - [ ] Railway (recomendado - gratis y fácil)
  - [ ] Render (también gratis)
  - [ ] Otro hosting Node.js

- [ ] **Configurar Google Calendar API**
  - [ ] Crear proyecto en Google Cloud Console
  - [ ] Habilitar Calendar API
  - [ ] Crear credenciales OAuth 2.0
  - [ ] Configurar en backend

- [ ] **Conectar Backend con Frontend**
  - [ ] Ingresar URL del backend en Admin
  - [ ] Probar conexión
  - [ ] Conectar calendario de cada profesional

## 🟢 OPCIONAL - Mejoras:

- [ ] **Verificar contenido**
  - [ ] Servicios correctos con precios actualizados
  - [ ] Profesionales con emails correctos
  - [ ] Horarios de atención configurados (9:00 - 19:00 o los que uses)
  - [ ] Días laborales correctos

- [ ] **Probar flujo completo**
  - [ ] Reservar turno desde móvil
  - [ ] Verificar que llegue email
  - [ ] Verificar que aparezca en Google Calendar
  - [ ] Cancelar turno desde cliente
  - [ ] Verificar que se borre del calendario

---

## 📚 Documentación Disponible:

1. **README.md** - Descripción general del proyecto
2. **DEPLOYMENT.md** - Guía completa paso a paso para producción
3. **backend/README.md** - Documentación del API

---

## 🆘 Próximos Pasos AHORA:

1. **URGENTE:** Dame los logs de la consola cuando reserves un turno (para resolver bug de confirmación)
2. Decidir en dónde vas a desplegar el backend (te recomiendo Railway)
3. Seguir la guía de DEPLOYMENT.md paso a paso

---

**Nota:** El frontend ya está desplegado en Firebase (https://mostaza-peluqueria.web.app) ✅

**Falta:** Backend y resolver bug de confirmación
