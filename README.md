# 💈 Mostaza — Sistema de Turnos Online

Sistema completo de reserva de turnos online para peluquerías con **integración automática de Google Calendar**.

## ✨ Características Principales

### 👥 Panel Cliente
- ✅ Reserva de turnos en 4 pasos simples
- ✅ Selección de servicio, profesional, fecha y hora
- ✅ Visualización de horarios disponibles/ocupados en tiempo real
- ✅ Formulario con nombre, email y teléfono
- ✅ **Integración automática con Google Calendar** (backend)
- ✅ **Invitación por email con archivo .ics**
- ✅ Consulta de turnos por teléfono
- ✅ Cancelación de turnos desde el cliente
- ✅ Confirmación visual con todos los detalles
- ✅ Logo profesional sin fondo con sombra dorada
- ✅ Sección de contacto (Instagram, WhatsApp, Mapa)

### ⚙️ Panel Administrador
- ✅ **Turnos**: Ver, filtrar por fecha, completar, cancelar
- ✅ **Servicios**: ABM completo (nombre, duración, precio)
- ✅ **Profesionales**: Gestión con email para notificaciones
- ✅ **Configuración**:
  - Nombre del local
  - Contraseña de acceso
  - Horarios de atención
  - Intervalo de turnos (minutos)
  - Días laborales
  - **Integración EmailJS** (envío automático)

### 📅 Integración de Calendario (NUEVO)

**Al reservar un turno:**
1. Cliente ingresa su **email**
2. Sistema genera archivo `.ics` (formato universal de calendario)
3. EmailJS envía automáticamente:
   - ✉️ Email al **cliente** con invitación de calendario
   - ✉️ Email al **profesional** con invitación de calendario
4. Ambos pueden agregar el evento a Google Calendar con **1 clic**

**Sin configuración de EmailJS:**
- Se ofrece descarga manual del archivo `.ics`
- Compatible con Google Calendar, Outlook, Apple Calendar

## 🚀 Instalación

1. **Descargar los archivos:**
   ```
   index.html
   styles.css
   app.js
   CONFIGURACION-EMAILJS.md
   ```

2. **Abrir** `index.html` en tu navegador

3. **Configurar EmailJS** (opcional pero recomendado):
   - Leer `CONFIGURACION-EMAILJS.md` para instrucciones detalladas
   - Crear cuenta gratuita en [EmailJS](https://www.emailjs.com/)
   - Configurar en: Panel Admin → Configuración → Integración Email

## 📖 Uso

### Cliente

1. **Abrir la app** en el navegador
2. Seguir los 4 pasos:
   - **Paso 1:** Elegir servicio
   - **Paso 2:** Elegir profesional
   - **Paso 3:** Elegir fecha y hora
   - **Paso 4:** Ingresar datos (nombre, email, teléfono)
3. **Confirmar turno**
4. **Revisar email** y agregar evento a Google Calendar

### Profesional

1. **Configurar email** en Panel Admin → Profesionales → Editar
2. **Recibir notificaciones** automáticas por email cuando hay nuevos turnos
3. **Agregar turnos a Google Calendar** desde el email con 1 clic

### Administrador

1. **Acceder**: Hacer clic en el ícono ⚙️ en el footer
2. **Contraseña por defecto:** `admin123` 
   - ⚠️ **Cambiarla inmediatamente** en Configuración
3. **Gestionar**:
   - Ver turnos del día o filtrar por fecha
   - Agregar/editar servicios con precios
   - Agregar/editar profesionales con sus emails
   - Configurar horarios y días laborales
   - Configurar EmailJS para envío automático

## 🎨 Diseño

- **Paleta de colores:**
  - 🟡 Mostaza: `#D4A024` (primario)
  - 🔵 Azul marino: `#1B3A57` (secundario)
  - ⚪ Grises, blanco y negro (neutros)
- **Modo claro/oscuro:** Detección automática según preferencias del sistema
- **Responsive:** Funciona en desktop, tablet y móvil
- **Animaciones:** Transiciones suaves y efectos modernos
- **Iconos SVG:** Profesionales, sin dependencias externas

## 📧 Configuración de Emails (Opcional)

Para enviar invitaciones automáticas de calendario:

1. **Crear cuenta gratuita** en [EmailJS](https://www.emailjs.com/) (200 emails/mes gratis)
2. **Configurar servicio de email** (Gmail, Outlook, etc.)
3. **Crear template de email** con el formato de calendario
4. **Copiar credenciales:**
   - Service ID
   - Template ID
   - Public Key
5. **Guardar en la app:** Panel Admin → Configuración → Integración Email
6. **Probar conexión** con el botón integrado

📄 **Ver guía completa en:** `CONFIGURACION-EMAILJS.md`

## 🔒 Seguridad

- ✅ Sanitización de inputs (prevención XSS)
- ✅ Validación de emails
- ✅ Contraseña de admin personalizable
- ✅ Datos almacenados en localStorage (lado cliente)
- ⚠️ **No exponer en internet sin medidas adicionales de seguridad**

## 💾 Persistencia de Datos

### Almacenamiento Local (Frontend):
Los datos se guardan en **localStorage** del navegador:
- ✅ No requiere base de datos para funcionar
- ✅ Funciona offline
- ⚠️ Los datos están en el navegador donde se abre la app
- ⚠️ Si se borra el caché, se pierden los datos locales

### Backend (Opcional pero recomendado para producción):
- ✅ **Persistencia JSON** (fácil de migrar a DB)
- ✅ **Sincronización con Google Calendar** automática
- ✅ **Respaldo centralizado** de todos los turnos
- ✅ **Acceso desde múltiples dispositivos**

Para habilitar backend, ver [DEPLOYMENT.md](./DEPLOYMENT.md)

## 🌐 Compatibilidad

### Navegadores:
- ✅ Chrome/Edge (recomendado)
- ✅ Firefox
- ✅ Safari
- ✅ Opera

### Dispositivos:
- ✅ Desktop
- ✅ Tablet
- ✅ Mobile

### Calendarios compatibles:
- ✅ Google Calendar
- ✅ Outlook Calendar
- ✅ Apple Calendar
- ✅ Cualquier app que soporte formato `.ics`

## 🛠️ Tecnologías

- **Frontend:** HTML5, CSS3 (Variables CSS, Grid, Flexbox)
- **JavaScript:** Vanilla JS (ES6+), sin frameworks
- **Fuentes:** Inter (Google Fonts)
- **Iconos:** SVG inline
- **Emails:** EmailJS (servicio externo)
- **Calendario:** Formato iCalendar (.ics)

## 📁 Estructura de Archivos

```
📦 Turnos-Peluquerias/
├── 📄 index.html              # Estructura HTML principal
├── 🎨 styles.css              # Estilos con tema claro/oscuro
├── ⚙️ app.js                  # Lógica completa de la aplicación
├── 📧 CONFIGURACION-EMAILJS.md # Guía de configuración de emails
└── 📖 README.md               # Este archivo
```

## ⚡ Características Técnicas

- **Sin dependencias externas** (excepto EmailJS opcional)
- **SPA (Single Page Application)** con cambio de vistas dinámico
- **Validación en tiempo real** de horarios disponibles
- **Generación de archivos .ics** según estándar RFC 5545
- **Animaciones CSS** con hardware acceleration
- **Accesibilidad:** Labels, contrast ratio optimizado
- **Performance:** < 100KB total sin compresión

## 🔄 Flujo de Reserva

```
Cliente abre app
     ↓
Selecciona servicio
     ↓
Selecciona profesional
     ↓
Elige fecha y hora disponible
     ↓
Ingresa nombre, EMAIL y teléfono
     ↓
Confirma turno
     ↓
Sistema genera .ics
     ↓
[SI EmailJS configurado]
├→ Envía email al CLIENTE con .ics
└→ Envía email al PROFESIONAL con .ics
     ↓
[SI NO configurado]
└→ Ofrece descarga manual del .ics
     ↓
Cliente y profesional agregan a calendario
     ↓
✓ Turno agendado en Google Calendar
```

## 💡 Backend & Google Calendar API

Este proyecto incluye un backend Node.js completo con integración directa a Google Calendar:

### Características del Backend:
- ✅ **Integración OAuth 2.0** con Google Calendar
- ✅ **Eventos automáticos** en el calendario del profesional
- ✅ **API REST completa** (crear, actualizar, eliminar turnos)
- ✅ **Multi-profesional** (cada uno con su calendario)
- ✅ **CORS configurado** para frontend

📁 Ver carpeta `backend/` para código del servidor

📚 Ver `DEPLOYMENT.md` para guía completa de deployment a producción

### Para producción:
1. Desplegar backend en Railway, Render o Vercel
2. Configurar credenciales de Google Calendar API
3. Conectar calendarios de profesionales desde Admin
4. Configurar URL del backend en panel Admin

Ver [DEPLOYMENT.md](./DEPLOYMENT.md) para instrucciones detalladas.

## 🌐 Deployment & Producción

### Frontend (Firebase Hosting):
```bash
firebase deploy
```
✅ **En producción:** https://mostaza-peluqueria.web.app

### Backend:
Ver guía completa en [DEPLOYMENT.md](./DEPLOYMENT.md) que incluye:
- Configuración de Google Calendar API
- Deploy en Railway/Render
- Variables de entorno
- Seguridad y credenciales
- Testing completo

### Contacto:
- 📸 **Instagram:** [@mostazapeluqueria](https://www.instagram.com/mostazapeluqueria)
- 💬 **WhatsApp:** +54 9 3537 33-2152 (Nesti)
- 📍 **Ubicación:** Ver mapa en la app

## 💡 Mejoras Futuras

- [ ] Notificaciones push
- [ ] Recordatorios automáticos por WhatsApp (API oficial)
- [ ] Estadísticas y reportes avanzados
- [ ] Sistema de pagos online (Mercado Pago)
- [ ] Multi-sucursal
- [ ] App móvil nativa (React Native)
- [ ] Programa de fidelización
- [ ] Sistema de reseñas y puntuaciones

## 📞 Soporte

Para configuración de EmailJS, consultar `CONFIGURACION-EMAILJS.md`

## 📄 Licencia

Uso libre para fines educativos y comerciales.

---

**Desarrollado con ❤️ para Mostaza Peluquería**

*Última actualización: Marzo 2026*
