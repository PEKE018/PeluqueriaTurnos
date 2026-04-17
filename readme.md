# 💇 PeluqueriaTurnos

Sistema completo de gestión de turnos para peluquerías con integración a Google Calendar, panel de administración y reservas online.

![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat&logo=firebase&logoColor=black)
![Google Calendar](https://img.shields.io/badge/Google%20Calendar-4285F4?style=flat&logo=google-calendar&logoColor=white)

---

## ✨ Características

- 📅 **Reservas online** - Los clientes eligen día, hora y servicio desde cualquier dispositivo
- 🔗 **Sincronización con Google Calendar** - Los turnos se reflejan automáticamente en el calendario del profesional
- ⚙️ **Panel de administración** - Configurar horarios, servicios, precios y duración
- 🚫 **Cancelación automática** - El cliente puede cancelar su turno y se elimina del calendario
- 📱 **100% Responsive** - Funciona perfecto en móvil, tablet y desktop
- 🎨 **Personalizable** - Logo, colores y datos del negocio configurables

---

## 🛠️ Stack Tecnológico

| Tecnología | Uso |
|------------|-----|
| JavaScript (Vanilla) | Frontend y lógica de reservas |
| Firebase Firestore | Base de datos en tiempo real |
| Firebase Hosting | Deploy del frontend |
| Google Calendar API | Sincronización de turnos |
| Node.js | Backend para integración con Google |
| Render | Hosting del backend |

---

## 📁 Estructura del Proyecto

```
PeluqueriaTurnos/
├── backend/           # Servidor Node.js para Google Calendar
│   ├── server.js      # API endpoints
│   └── package.json
├── index.html         # Página de reservas (cliente)
├── styles.css         # Estilos del sistema
├── app.js             # Lógica principal
├── firebase.json      # Configuración Firebase
└── firestore.rules    # Reglas de seguridad
```

---

## 🚀 Instalación

### Requisitos
- Node.js 18+
- Cuenta de Firebase
- Proyecto en Google Cloud con Calendar API habilitada

### Frontend (Firebase)
```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Login y deploy
firebase login
firebase deploy
```

### Backend (Google Calendar)
```bash
cd backend
npm install

# Configurar variables de entorno
# GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, etc.

npm start
```

---

## 📸 Screenshots

> *Agregar capturas del sistema de reservas, calendario y panel admin*

---

## 🔐 Seguridad

- Reglas de Firestore configuradas para proteger datos
- Tokens de Google Calendar manejados de forma segura en backend
- Sin exposición de credenciales en frontend

---

## 📝 Roadmap

- [ ] Notificaciones por WhatsApp/SMS
- [ ] Recordatorios automáticos 24hs antes
- [ ] Múltiples profesionales/sillas
- [ ] Historial de clientes

---

## 👤 Autor

**Valentín Escudero**  
Desarrollador de software independiente

- GitHub: [@PEKE018](https://github.com/PEKE018)
- Email: valentin.dev.escudero@gmail.com

---

## 📄 Licencia

Este proyecto es privado. Contactar al autor para uso comercial.
