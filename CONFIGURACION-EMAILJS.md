# Configuración de EmailJS para Envío Automático de Invitaciones de Calendario

Este sistema envía automáticamente invitaciones de Google Calendar tanto al **cliente** como al **profesional** cuando se confirma un turno.

## 📧 ¿Qué es EmailJS?

EmailJS es un servicio que permite enviar emails directamente desde JavaScript sin necesidad de un servidor backend. El plan gratuito incluye **200 emails por mes**.

## 🚀 Configuración Paso a Paso

### 1. Crear Cuenta en EmailJS

1. Ir a [https://www.emailjs.com/](https://www.emailjs.com/)
2. Hacer clic en **"Sign Up"** (registrarse)
3. Completar el formulario con tu email
4. Verificar tu cuenta desde el email recibido

### 2. Conectar tu Servicio de Email

1. Una vez logueado, ir a **"Email Services"** en el menú lateral
2. Hacer clic en **"Add New Service"**
3. Elegir tu proveedor de email (ej: Gmail, Outlook, Yahoo)
4. Para **Gmail**:
   - Hacer clic en "Connect Account"
   - Autorizar el acceso a tu cuenta de Gmail
   - Copiar el **Service ID** (ej: `service_abc1234`)

### 3. Crear un Template de Email

1. Ir a **"Email Templates"** en el menú
2. Hacer clic en **"Create New Template"**
3. Configurar el template:

**Subject (Asunto):**
```
{{shop_name}} - Confirmación de Turno
```

**Body (Cuerpo del email):**
```html
Hola {{client_name}},

Tu turno ha sido confirmado:

📅 Fecha: {{appointment_date}}
🕐 Hora: {{appointment_time}}
💈 Servicio: {{service_name}}
👤 Profesional: {{stylist_name}}
📍 Local: {{shop_name}}

Agregá este turno a tu calendario haciendo clic en el archivo adjunto (.ics).

¡Te esperamos!

---
{{shop_name}}
```

**Importante:** En la sección "Attachments", agregar:
- **Attachment name:** `{{ics_filename}}`
- **Attachment content:** `{{ics_content}}`
- **Content type:** `text/calendar`

4. Hacer clic en **"Save"**
5. Copiar el **Template ID** (ej: `template_xyz5678`)

### 4. Obtener tu Public Key

1. Ir a **"Account"** → **"General"**
2. Copiar tu **Public Key** (ej: `XyZ123AbC456`)

### 5. Configurar en la App

1. Abrir la app de turnos
2. Ingresar al **Panel de Administración** (clic en ⚙️ en el footer)
3. Ir a la pestaña **"Configuración"**
4. Desplazarse hasta **"Integración Email (EmailJS)"**
5. Completar los campos:
   - **Service ID:** (copiado del paso 2)
   - **Template ID:** (copiado del paso 3)
   - **Public Key:** (copiado del paso 4)
6. Hacer clic en **"Guardar Integración"**
7. Hacer clic en **"Probar Conexión"** para verificar

## ✅ Configurar Emails de Profesionales

Para que los profesionales reciban las notificaciones:

1. Ir a **Panel Admin** → **"Profesionales"**
2. Editar cada profesional
3. Agregar su **email** en el campo correspondiente
4. Guardar

## 🎯 ¿Cómo Funciona?

Cuando un cliente reserva un turno:

1. **Cliente completa el formulario** con:
   - Nombre completo
   - Email
   - Teléfono

2. **Sistema genera archivo .ics** con el evento de calendario

3. **EmailJS envía 2 emails automáticamente:**
   - ✉️ Al email del **cliente**
   - ✉️ Al email del **profesional** (si está configurado)

4. **Cliente y profesional reciben:**
   - Email con detalles del turno
   - Archivo `.ics` adjunto para agregar a Google Calendar con 1 clic

## 📱 Agregar a Google Calendar

### Desde Gmail:
1. Abrir el email recibido
2. Hacer clic en el archivo `.ics` adjunto
3. Gmail detectará automáticamente el evento
4. Hacer clic en **"Agregar a Calendar"**

### Desde otro email:
1. Descargar el archivo `.ics`
2. Abrirlo con doble clic
3. Se abrirá Google Calendar / Outlook / Apple Calendar
4. Confirmar agregar el evento

## 🔧 Solución de Problemas

### "EmailJS no configurado"
- Verificar que los 3 campos (Service ID, Template ID, Public Key) estén completos
- Probar la conexión con el botón "Probar Conexión"

### "Error enviando email"
- Verificar que no hayas excedido el límite de 200 emails/mes (plan gratuito)
- Revisar que el Template ID sea correcto
- Verificar que el servicio de email esté conectado correctamente

### "El profesional no recibe emails"
- Verificar que el email del profesional esté configurado en el panel admin
- Revisar la carpeta de SPAM del profesional

## 💡 Consejos

- **Límite gratuito:** 200 emails/mes = 100 turnos (cliente + profesional)
- **Upgrade:** Si necesitás más, el plan Personal cuesta $9.99/mes (1000 emails)
- **Testing:** Usar el botón "Probar Conexión" antes de configurar en producción
- **Backup:** Si EmailJS falla, la app ofrece descarga manual del archivo `.ics`

## 📚 Recursos

- [Documentación EmailJS](https://www.emailjs.com/docs/)
- [Soporte EmailJS](https://www.emailjs.com/docs/faq/)
- [Formato .ics (iCalendar)](https://en.wikipedia.org/wiki/ICalendar)

---

**¿Necesitás ayuda?** Contactá al desarrollador del sistema.
