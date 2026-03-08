// ============================================================
//  TURNOS PELUQUERÍA — App principal
// ============================================================

(function () {
    'use strict';

    // ---------- BACKEND CONFIGURATION ----------
    const BACKEND_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3000'
        : 'https://peluqueriaturnos.onrender.com';

    // ---------- DEFAULT DATA ----------
    const DEFAULT_SETTINGS = {
        shopName: 'Mostaza',
        adminPassword: 'admin123',
        openTime: '09:00',
        closeTime: '20:00',
        intervalMinutes: 30,
        workingDays: [1, 2, 3, 4, 5, 6] // 0=Dom,1=Lun...6=Sáb
    };

    const DEFAULT_SERVICES = [];

    const DEFAULT_STYLISTS = [];

    // ---------- DATA LAYER (localStorage) ----------
    function getData(key, fallback) {
        try {
            const raw = localStorage.getItem('pelu_' + key);
            return raw ? JSON.parse(raw) : fallback;
        } catch {
            return fallback;
        }
    }

    function setData(key, value) {
        localStorage.setItem('pelu_' + key, JSON.stringify(value));
    }

    function getSettings() { return getData('settings', DEFAULT_SETTINGS); }
    function saveSettingsData(s) { setData('settings', s); }
    function getServices() { return getData('services', DEFAULT_SERVICES); }
    function saveServices(s) { setData('services', s); }
    function getStylists() { return getData('stylists', DEFAULT_STYLISTS); }
    function saveStylists(s) { setData('stylists', s); }
    function getAppointments() { return getData('appointments', []); }
    function saveAppointments(a) { setData('appointments', a); }
    function getBlocks() { return getData('blocks', []); }
    function saveBlocks(b) { setData('blocks', b); }

    // ---------- HELPERS ----------
    function $(id) { return document.getElementById(id); }

    function sanitize(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function formatPrice(n) {
        return '$' + Number(n).toLocaleString('es-AR');
    }

    function formatDate(dateStr) {
        const [y, m, d] = dateStr.split('-');
        return d + '/' + m + '/' + y;
    }

    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    }

    function showToast(msg, type) {
        const existing = document.querySelector('.toast');
        if (existing) existing.remove();
        const toast = document.createElement('div');
        toast.className = 'toast' + (type ? ' toast-' + type : '');
        toast.textContent = msg;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    // ---------- BOOKING STATE ----------
    let bookingState = {
        serviceId: null,
        stylistId: null,
        date: null,
        time: null
    };

    // ============================================================
    //  CLIENT — BOOKING FLOW
    // ============================================================

    // ===== CALENDAR STATE =====
    let calendarDate = new Date();
    
    function initClient() {
        const settings = getSettings();
        $('shop-name-display').textContent = settings.shopName;
        $('footer-shop-name').textContent = settings.shopName;
        $('footer-year').textContent = new Date().getFullYear();
        document.title = settings.shopName + ' — Turnos';

        // Initialize custom calendar
        const today = new Date().toISOString().split('T')[0];
        $('booking-date').value = today;
        renderCalendar();

        renderServices();
        
        // Only reset booking if not already on a step
        const visibleStep = document.querySelector('#app-client .step:not(.hidden)');
        if (!visibleStep || visibleStep.id === 'step-service') {
            resetBooking();
        }
    }
    
    // ===== CUSTOM CALENDAR FUNCTIONS =====
    function renderCalendar() {
        const year = calendarDate.getFullYear();
        const month = calendarDate.getMonth();
        const settings = getSettings();
        
        // Update header
        const monthNames = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        $('calendar-month-year').textContent = `${monthNames[month]} ${year}`;
        
        // Get first and last day of month
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();
        
        // Get today for comparison
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Get selected date
        const selectedDateStr = $('booking-date').value;
        const selectedDate = selectedDateStr ? new Date(selectedDateStr + 'T00:00:00') : null;
        
        // Get blocks for selected stylist (if any)
        const blocks = bookingState.stylistId ? getBlocks().filter(b => b.stylistId === bookingState.stylistId) : [];
        const blockedFullDays = new Set(blocks.filter(b => b.fullDay).map(b => b.date));
        
        // Generate calendar days
        const calendarDays = $('calendar-days');
        calendarDays.innerHTML = '';
        
        // Add empty cells for days before month starts
        for (let i = 0; i < startingDayOfWeek; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day empty';
            calendarDays.appendChild(emptyDay);
        }
        
        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dayDate = new Date(year, month, day);
            dayDate.setHours(0, 0, 0, 0);
            const dayOfWeek = dayDate.getDay();
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            dayElement.textContent = day;
            
            // Check if day is in the past
            if (dayDate < today) {
                dayElement.classList.add('disabled');
            }
            // Check if it's a working day
            else if (!settings.workingDays.includes(dayOfWeek)) {
                dayElement.classList.add('disabled');
            }
            // Check if day is fully blocked by the stylist
            else if (blockedFullDays.has(dateStr)) {
                dayElement.classList.add('disabled');
            }
            // Check if it's today
            else if (dayDate.getTime() === today.getTime()) {
                dayElement.classList.add('today');
            }
            
            // Check if it's selected
            if (selectedDate && dayDate.getTime() === selectedDate.getTime()) {
                dayElement.classList.add('selected');
            }
            
            // Add click handler if not disabled
            if (!dayElement.classList.contains('disabled')) {
                dayElement.onclick = () => selectDate(year, month, day);
            }
            
            calendarDays.appendChild(dayElement);
        }
    }
    
    window.changeMonth = function(offset) {
        calendarDate.setMonth(calendarDate.getMonth() + offset);
        renderCalendar();
    };
    
    function selectDate(year, month, day) {
        // Format date as YYYY-MM-DD
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        $('booking-date').value = dateStr;
        
        // Update calendar UI
        renderCalendar();
        
        // Trigger time slots update
        onDateChange();
    }

    function renderServices() {
        const services = getServices();
        const container = $('services-list');
        if (services.length === 0) {
            container.innerHTML = '<div class="empty-state"><div class="empty-state-icon"><svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor"><path d="M9.64 7.64c.23-.5.36-1.05.36-1.64 0-2.21-1.79-4-4-4S2 3.79 2 6s1.79 4 4 4c.59 0 1.14-.13 1.64-.36L10 12l-2.36 2.36C7.14 14.13 6.59 14 6 14c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4c0-.59-.13-1.14-.36-1.64L12 14l7 7h3v-1L9.64 7.64zM6 8c-1.1 0-2-.89-2-2s.9-2 2-2 2 .89 2 2-.9 2-2 2zm0 12c-1.1 0-2-.89-2-2s.9-2 2-2 2 .89 2 2-.9 2-2 2zm6-7.5c-.28 0-.5-.22-.5-.5s.22-.5.5-.5.5.22.5.5-.22.5-.5.5zM19 3l-6 6 2 2 7-7V3z"/></svg></div><p>No hay servicios disponibles</p></div>';
            return;
        }
        container.innerHTML = services.map(s => `
            <div class="card ${s.image ? 'has-image' : ''}" data-id="${s.id}" onclick="selectService(${s.id})">
                ${s.image ? `<div class="card-image" style="background-image:url('${s.image}');"></div>` : ''}
                <div class="card-content">
                    <div class="card-name">${sanitize(s.name)}</div>
                    <div class="card-detail">${s.duration} min</div>
                    <div class="card-price">${formatPrice(s.price)}</div>
                </div>
            </div>
        `).join('');
    }

    window.selectService = function (id) {
        bookingState.serviceId = id;
        // Mark selected
        document.querySelectorAll('#services-list .card').forEach(c => {
            c.classList.toggle('selected', Number(c.dataset.id) === id);
        });
        
        // Check if there's only one active stylist
        const activeStylists = getStylists().filter(s => s.active);
        
        if (activeStylists.length === 1) {
            // Auto-select the only stylist and skip to datetime
            bookingState.stylistId = activeStylists[0].id;
            updateDateTimeTitle(activeStylists[0].name);
            renderTimeSlots();
            goToStep('step-datetime');
        } else if (activeStylists.length === 0) {
            // No stylists available
            showToast('No hay profesionales disponibles en este momento', 'error');
        } else {
            // Multiple stylists, show selection
            renderStylists();
            goToStep('step-stylist');
        }
    };

    function renderStylists() {
        const stylists = getStylists().filter(s => s.active);
        const container = $('stylists-list');
        if (stylists.length === 0) {
            container.innerHTML = '<div class="empty-state"><div class="empty-state-icon"><svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg></div><p>No hay profesionales disponibles</p></div>';
            return;
        }
        container.innerHTML = stylists.map(s => `
            <div class="card" data-id="${s.id}" onclick="selectStylist(${s.id})">
                <div class="card-name">${sanitize(s.name)}</div>
                <div class="card-detail">Disponible</div>
            </div>
        `).join('');
    }

    window.selectStylist = function (id) {
        bookingState.stylistId = id;
        document.querySelectorAll('#stylists-list .card').forEach(c => {
            c.classList.toggle('selected', Number(c.dataset.id) === id);
        });
        
        // Update title with stylist name
        const stylist = getStylists().find(s => s.id === id);
        if (stylist) {
            updateDateTimeTitle(stylist.name);
        }
        
        renderTimeSlots();
        goToStep('step-datetime');
    };

    function onDateChange() {
        renderTimeSlots();
    }

    function updateDateTimeTitle(stylistName) {
        const title = $('datetime-title');
        if (title) {
            title.textContent = `Elegí fecha y hora con ${sanitize(stylistName)}`;
        }
    }

    function renderTimeSlots() {
        const dateStr = $('booking-date').value;
        if (!dateStr) return;

        const settings = getSettings();
        const selectedDate = new Date(dateStr + 'T00:00:00');
        const dayOfWeek = selectedDate.getDay();

        const container = $('time-slots-container');

        // Check if it's a working day
        if (!settings.workingDays.includes(dayOfWeek)) {
            container.innerHTML = '<p class="text-center mt-2" style="color:var(--text-muted)">Este día no hay atención. Elegí otro día.</p>';
            return;
        }
        
        // Check if day is fully blocked
        const blocks = getBlocks().filter(b => b.stylistId === bookingState.stylistId && b.date === dateStr);
        const fullDayBlock = blocks.find(b => b.fullDay);
        
        if (fullDayBlock) {
            container.innerHTML = '<p class="text-center mt-2" style="color:var(--text-muted)">Este día no hay atención. Elegí otro día.</p>';
            return;
        }
        
        // Get blocked times for this date
        const partialBlock = blocks.find(b => !b.fullDay);
        const blockedTimes = partialBlock ? new Set(partialBlock.blockedTimes || []) : new Set();

        // Generate time slots
        const [openH, openM] = settings.openTime.split(':').map(Number);
        const [closeH, closeM] = settings.closeTime.split(':').map(Number);
        const interval = settings.intervalMinutes;

        const openMinutes = openH * 60 + openM;
        const closeMinutes = closeH * 60 + closeM;

        // Get existing appointments for this date and stylist
        const appointments = getAppointments().filter(a =>
            a.date === dateStr &&
            a.stylistId === bookingState.stylistId &&
            a.status !== 'cancelled'
        );
        const bookedTimes = new Set(appointments.map(a => a.time));

        // Check if date is today — disable past times
        const now = new Date();
        const isToday = dateStr === now.toISOString().split('T')[0];
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        let slots = [];
        for (let m = openMinutes; m < closeMinutes; m += interval) {
            const hh = String(Math.floor(m / 60)).padStart(2, '0');
            const mm = String(m % 60).padStart(2, '0');
            const timeStr = hh + ':' + mm;

            const isPast = isToday && m <= currentMinutes;
            const isBooked = bookedTimes.has(timeStr);
            const isBlocked = blockedTimes.has(timeStr);
            const isAvailable = !isPast && !isBooked && !isBlocked;

            slots.push({ time: timeStr, available: isAvailable });
        }

        if (slots.length === 0) {
            container.innerHTML = '<p class="text-center mt-2" style="color:var(--text-muted)">No hay horarios disponibles.</p>';
            return;
        }

        container.innerHTML = slots.map(s => `
            <div class="time-slot ${s.available ? '' : 'unavailable'}" 
                 onclick="${s.available ? "selectTime('" + s.time + "')" : ''}">${s.time}</div>
        `).join('');
    }

    window.selectTime = function (time) {
        bookingState.time = time;
        bookingState.date = $('booking-date').value;

        document.querySelectorAll('.time-slot').forEach(s => {
            s.classList.toggle('selected', s.textContent.trim() === time && !s.classList.contains('unavailable'));
        });

        // Show client form
        renderBookingSummary();
        goToStep('step-client');
    };

    function renderBookingSummary() {
        const service = getServices().find(s => s.id === bookingState.serviceId);
        const stylist = getStylists().find(s => s.id === bookingState.stylistId);
        const summary = $('booking-summary');
        summary.innerHTML = `
            <p><strong>Servicio:</strong> ${sanitize(service?.name || '—')}</p>
            <p><strong>Profesional:</strong> ${sanitize(stylist?.name || '—')}</p>
            <p><strong>Fecha:</strong> ${formatDate(bookingState.date)}</p>
            <p><strong>Hora:</strong> ${bookingState.time} hs</p>
            <p><strong>Precio:</strong> ${formatPrice(service?.price || 0)}</p>
        `;
    }

    let isConfirming = false; // Prevenir doble clic

    window.confirmBooking = async function () {
        if (isConfirming) return; // Prevenir múltiples clics
        isConfirming = true;
        
        const name = $('client-name').value.trim();
        const email = $('client-email').value.trim();
        const phone = $('client-phone').value.trim();

        if (!name) { isConfirming = false; showToast('Ingresá tu nombre', 'error'); return; }
        if (!email) { isConfirming = false; showToast('Ingresá tu email', 'error'); return; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            isConfirming = false;
            showToast('Email inválido', 'error');
            return;
        }
        if (!phone) { isConfirming = false; showToast('Ingresá tu teléfono', 'error'); return; }

        // Double-check slot is still available
        const appointments = getAppointments();
        const conflict = appointments.find(a =>
            a.date === bookingState.date &&
            a.time === bookingState.time &&
            a.stylistId === bookingState.stylistId &&
            a.status !== 'cancelled'
        );
        if (conflict) {
            isConfirming = false;
            showToast('Ese horario ya fue reservado. Elegí otro.', 'error');
            goToStep('step-datetime');
            renderTimeSlots();
            return;
        }

        const service = getServices().find(s => s.id === bookingState.serviceId);
        const stylist = getStylists().find(s => s.id === bookingState.stylistId);

        const appointment = {
            id: generateId(),
            clientName: name,
            clientEmail: email,
            clientPhone: phone,
            serviceId: bookingState.serviceId,
            serviceName: service?.name || '—',
            stylistId: bookingState.stylistId,
            stylistName: stylist?.name || '—',
            date: bookingState.date,
            time: bookingState.time,
            price: service?.price || 0,
            duration: service?.duration || 30,
            status: 'confirmed',
            createdAt: new Date().toISOString()
        };

        // Save locally first
        appointments.push(appointment);
        saveAppointments(appointments);

        // Send to backend (Google Calendar integration)
        try {
            const response = await fetch(`${BACKEND_URL}/api/appointments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(appointment)
            });

            if (response.ok) {
                const result = await response.json();
                console.log('✅ Turno creado en Google Calendar:', result);
                
                // Update appointment with calendar event ID
                if (result.appointment && result.appointment.calendarEventId) {
                    const index = appointments.findIndex(a => a.id === appointment.id);
                    if (index >= 0) {
                        appointments[index].calendarEventId = result.appointment.calendarEventId;
                        saveAppointments(appointments);
                    }
                }
            } else {
                console.warn('Backend no disponible, turno guardado solo localmente');
            }
        } catch (error) {
            console.warn('No se pudo conectar con el backend:', error);
            // Continue anyway - appointment is saved locally
        }

        // Show confirmation FIRST
        console.log('📝 Preparando detalles de confirmación...');
        $('confirmation-details').innerHTML = `
            <p><strong>Servicio:</strong> ${sanitize(appointment.serviceName)}</p>
            <p><strong>Profesional:</strong> ${sanitize(appointment.stylistName)}</p>
            <p><strong>Fecha:</strong> ${formatDate(appointment.date)}</p>
            <p><strong>Hora:</strong> ${appointment.time} hs</p>
            <p><strong>Precio:</strong> ${formatPrice(appointment.price)}</p>
            <p><strong>Cliente:</strong> ${sanitize(appointment.clientName)}</p>
            <p><strong>Email:</strong> ${sanitize(appointment.clientEmail)}</p>
            <p><strong>Teléfono:</strong> ${sanitize(appointment.clientPhone)}</p>
            <p style="margin-top:1rem;padding:1rem;background:rgba(212,160,36,0.1);border-radius:8px;font-size:0.9rem;">
                ✅ Turno confirmado y agregado automáticamente al Google Calendar del profesional.
            </p>
        `;

        console.log('✅ Mostrando pantalla de confirmación');
        goToStep('step-confirmation');
        showToast('¡Turno reservado con éxito!', 'success');
        
        // Reset flag after showing confirmation
        isConfirming = false;
        console.log('✅ Confirmación completada, flag reseteado');
        
        // Send calendar invitations AFTER showing confirmation (asynchronous)
        setTimeout(() => {
            console.log('📧 Enviando invitaciones en segundo plano...');
            sendCalendarInvitations(appointment, stylist, service);
        }, 100);
    };

    window.resetBooking = function () {
        console.log('🔄 RESET BOOKING llamado');
        console.trace('Stack trace de resetBooking:'); // Ver desde dónde se llama
        bookingState = { serviceId: null, stylistId: null, date: null, time: null };
        $('client-name').value = '';
        $('client-email').value = '';
        $('client-phone').value = '';
        const today = new Date().toISOString().split('T')[0];
        $('booking-date').value = today;
        
        // Reset calendar to current month
        calendarDate = new Date();
        renderCalendar();
        
        // Reset datetime title
        const title = $('datetime-title');
        if (title) {
            title.textContent = 'Elegí fecha y hora';
        }
        
        renderServices();
        goToStep('step-service');
    };

    window.goToStep = function (stepId) {
        console.log('📍 goToStep llamado:', stepId);
        document.querySelectorAll('#app-client .step').forEach(s => s.classList.add('hidden'));
        $(stepId).classList.remove('hidden');
        
        // Scroll to top when changing steps
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Render calendar when going to datetime step
        if (stepId === 'step-datetime') {
            renderCalendar();
        }
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Smart back button from datetime step - skips stylist selection if only one stylist
    window.goBackFromDateTime = function () {
        const activeStylists = getStylists().filter(s => s.active);
        
        if (activeStylists.length === 1) {
            // Only one stylist, go back to service selection
            // Reset title
            const title = $('datetime-title');
            if (title) {
                title.textContent = 'Elegí fecha y hora';
            }
            goToStep('step-service');
        } else {
            // Multiple stylists, go back to stylist selection
            renderStylists();
            goToStep('step-stylist');
        }
    };

    // ---------- CHECK MY BOOKINGS ----------
    window.checkMyBookings = function () {
        const phone = $('check-phone').value.trim();
        if (!phone) { showToast('Ingresá tu teléfono', 'error'); return; }

        const appointments = getAppointments().filter(a =>
            a.clientPhone === phone && a.status !== 'cancelled'
        ).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

        const container = $('my-bookings-result');
        if (appointments.length === 0) {
            container.innerHTML = '<p class="mt-1" style="color:var(--text-muted)">No se encontraron turnos con ese teléfono.</p>';
            return;
        }

        container.innerHTML = appointments.map(a => `
            <div class="my-booking-card">
                <div class="info">
                    <span class="date-time">${formatDate(a.date)} a las ${a.time} hs</span>
                    <span>${sanitize(a.serviceName)} con ${sanitize(a.stylistName)}</span>
                    <span class="badge badge-${a.status}">${statusLabel(a.status)}</span>
                </div>
                <button class="btn-danger" onclick="cancelMyBooking('${a.id}')">Cancelar</button>
            </div>
        `).join('');
    };

    window.cancelMyBooking = function (id) {
        const appointments = getAppointments();
        const apt = appointments.find(a => a.id === id);
        
        if (!apt) return;
        
        // Validar 48 horas de anticipación
        const appointmentDateTime = new Date(apt.date + 'T' + apt.time);
        const now = new Date();
        const hoursUntilAppointment = (appointmentDateTime - now) / (1000 * 60 * 60);
        
        if (hoursUntilAppointment < 48) {
            showToast('No se puede cancelar turnos con menos de 48 horas de anticipación', 'error');
            return;
        }
        
        if (!confirm('¿Seguro que querés cancelar este turno?')) return;
        
        apt.status = 'cancelled';
        saveAppointments(appointments);
        showToast('Turno cancelado', 'success');
        window.checkMyBookings();
    };

    function statusLabel(status) {
        const labels = { pending: 'Pendiente', confirmed: 'Confirmado', completed: 'Completado', cancelled: 'Cancelado' };
        return labels[status] || status;
    }

    // ============================================================
    //  ADMIN — LOGIN
    // ============================================================

    window.showAdminLogin = function () {
        $('admin-login-modal').classList.remove('hidden');
        $('admin-password').value = '';
        $('login-error').classList.add('hidden');
        setTimeout(() => $('admin-password').focus(), 100);
    };

    window.adminLogin = function () {
        const pwd = $('admin-password').value;
        const settings = getSettings();
        if (pwd === settings.adminPassword) {
            $('admin-login-modal').classList.add('hidden');
            $('app-client').classList.add('hidden');
            $('app-admin').classList.remove('hidden');
            initAdmin();
        } else {
            $('login-error').classList.remove('hidden');
        }
    };

    // Allow Enter key for login
    document.addEventListener('DOMContentLoaded', () => {
        $('admin-password').addEventListener('keydown', e => {
            if (e.key === 'Enter') window.adminLogin();
        });
    });

    window.adminLogout = function () {
        $('app-admin').classList.add('hidden');
        $('app-client').classList.remove('hidden');
        initClient();
    };

    window.closeModal = function (id) {
        $(id).classList.add('hidden');
    };

    // ============================================================
    //  ADMIN — PANEL
    // ============================================================

    function initAdmin() {
        renderAdminAppointments();
        renderAdminServices();
        renderAdminStylists();
        loadSettingsForm();
        populateAvailabilityStylistDropdown();
    }
    
    function populateAvailabilityStylistDropdown() {
        const select = $('availability-stylist');
        if (!select) return;
        
        const stylists = getStylists();
        const options = [`<option value="">Seleccioná un profesional</option>`];
        
        stylists.forEach(s => {
            options.push(`<option value="${s.id}">${sanitize(s.name)}</option>`);
        });
        
        select.innerHTML = options.join('');
    }

    // ---------- TABS ----------
    window.switchTab = function (btn) {
        document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.add('hidden'));
        $(btn.dataset.tab).classList.remove('hidden');
    };

    // ---------- APPOINTMENTS ----------
    window.renderAdminAppointments = function () {
        let appointments = getAppointments();
        const filterDate = $('filter-date').value;
        if (filterDate) {
            appointments = appointments.filter(a => a.date === filterDate);
        }
        appointments.sort((a, b) => {
            const cmp = a.date.localeCompare(b.date);
            return cmp !== 0 ? cmp : a.time.localeCompare(b.time);
        });

        const tbody = $('appointments-tbody');
        if (appointments.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center" style="padding:2rem;color:var(--text-muted)">No hay turnos para mostrar</td></tr>';
            return;
        }

        tbody.innerHTML = appointments.map(a => `
            <tr>
                <td>${formatDate(a.date)}</td>
                <td>${a.time}</td>
                <td>${sanitize(a.clientName)}</td>
                <td>${sanitize(a.clientPhone)}</td>
                <td>${sanitize(a.serviceName)}</td>
                <td>${sanitize(a.stylistName)}</td>
                <td><span class="badge badge-${a.status}">${statusLabel(a.status)}</span></td>
                <td class="actions">
                    ${a.status === 'confirmed' ? `
                        <button class="btn-success" onclick="updateAppointmentStatus('${a.id}','completed')">Completar</button>
                        <button class="btn-danger" onclick="updateAppointmentStatus('${a.id}','cancelled')">Cancelar</button>
                    ` : ''}
                    ${a.status === 'pending' ? `
                        <button class="btn-success" onclick="updateAppointmentStatus('${a.id}','confirmed')">Confirmar</button>
                        <button class="btn-danger" onclick="updateAppointmentStatus('${a.id}','cancelled')">Cancelar</button>
                    ` : ''}
                </td>
            </tr>
        `).join('');
    };

    window.updateAppointmentStatus = function (id, status) {
        const appointments = getAppointments();
        const apt = appointments.find(a => a.id === id);
        if (apt) {
            apt.status = status;
            saveAppointments(appointments);
            renderAdminAppointments();
            showToast('Estado actualizado', 'success');
        }
    };

    window.clearFilterDate = function () {
        $('filter-date').value = '';
        renderAdminAppointments();
    };

    // ---------- SERVICES CRUD ----------
    function renderAdminServices() {
        const services = getServices();
        const tbody = $('services-tbody');
        if (services.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center" style="padding:2rem;color:var(--text-muted)">No hay servicios</td></tr>';
            return;
        }
        tbody.innerHTML = services.map(s => `
            <tr>
                <td>
                    ${s.image ? `<img src="${s.image}" style="width:40px;height:40px;object-fit:cover;border-radius:4px;vertical-align:middle;margin-right:0.5rem;">` : ''}
                    ${sanitize(s.name)}
                </td>
                <td>${s.duration} min</td>
                <td>${formatPrice(s.price)}</td>
                <td>${s.image ? '✓ Imagen' : '—'}</td>
                <td class="actions">
                    <button class="btn-warning" onclick="editService(${s.id})">Editar</button>
                    <button class="btn-danger" onclick="deleteService(${s.id})">Eliminar</button>
                </td>
            </tr>
        `).join('');
    }

    window.showServiceForm = function (service) {
        const isEdit = !!service;
        $('form-modal-title').textContent = isEdit ? 'Editar Servicio' : 'Nuevo Servicio';
        $('form-modal-body').innerHTML = `
            <div class="form-group">
                <label>Nombre del servicio</label>
                <input type="text" id="svc-name" class="input-field" value="${isEdit ? sanitize(service.name) : ''}" maxlength="100">
            </div>
            <div class="form-group">
                <label>Duración (minutos)</label>
                <input type="number" id="svc-duration" class="input-field" min="5" max="480" value="${isEdit ? service.duration : 30}">
            </div>
            <div class="form-group">
                <label>Precio ($)</label>
                <input type="number" id="svc-price" class="input-field" min="0" value="${isEdit ? service.price : ''}">
            </div>
            <div class="form-group">
                <label>Imagen del servicio (opcional)</label>
                <input type="file" id="svc-image" class="input-field" accept="image/*" onchange="previewServiceImage(event)">
                <small style="display:block;margin-top:0.5rem;color:var(--text-muted);">Formatos: JPG, PNG, GIF (máx. 500KB recomendado)</small>
                <div id="image-preview" style="margin-top:1rem;">
                    ${isEdit && service.image ? `
                        <img src="${service.image}" style="max-width:200px;max-height:200px;border-radius:8px;border:2px solid var(--border-color);">
                        <br>
                        <button type="button" class="btn-danger btn-sm" onclick="removeServiceImage()" style="margin-top:0.5rem;">✕ Eliminar imagen</button>
                    ` : ''}
                </div>
            </div>
            <button class="btn-primary" onclick="saveService(${isEdit ? service.id : 0})">Guardar</button>
        `;
        $('form-modal').classList.remove('hidden');
    };

    window.previewServiceImage = function (event) {
        const file = event.target.files[0];
        if (!file) return;
        
        // Validar tamaño (máx 1MB)
        if (file.size > 1024 * 1024) {
            showToast('La imagen es muy grande. Máximo 1MB.', 'error');
            event.target.value = '';
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = $('image-preview');
            preview.innerHTML = `<img src="${e.target.result}" style="max-width:200px;max-height:200px;border-radius:8px;border:2px solid var(--border-color);">
                <br>
                <button type="button" class="btn-danger btn-sm" onclick="removeServiceImage()" style="margin-top:0.5rem;">✕ Eliminar imagen</button>`;
        };
        reader.readAsDataURL(file);
    };

    window.removeServiceImage = function () {
        const preview = $('image-preview');
        preview.innerHTML = '<p style="color:var(--text-muted);font-size:0.9rem;">Imagen eliminada</p>';
        $('svc-image').value = '';
        // Set a flag to remove image on save
        preview.dataset.removeImage = 'true';
    };

    window.saveService = function (id) {
        const name = $('svc-name').value.trim();
        const duration = parseInt($('svc-duration').value, 10);
        const price = parseInt($('svc-price').value, 10);
        const imageInput = $('svc-image');
        const preview = $('image-preview');

        if (!name) { showToast('Ingresá el nombre', 'error'); return; }
        if (!duration || duration < 5) { showToast('Duración inválida', 'error'); return; }
        if (isNaN(price) || price < 0) { showToast('Precio inválido', 'error'); return; }

        const services = getServices();
        
        // Check if image was explicitly removed
        if (preview.dataset.removeImage === 'true') {
            saveFinalService(id, name, duration, price, null);
            return;
        }
        
        // Procesar imagen si hay una nueva
        if (imageInput.files && imageInput.files[0]) {
            const file = imageInput.files[0];
            const reader = new FileReader();
            
            reader.onload = function(e) {
                const imageData = e.target.result;
                saveFinalService(id, name, duration, price, imageData);
            };
            
            reader.readAsDataURL(file);
        } else {
            // No hay imagen nueva, mantener la existente si es edición
            const existingImage = id !== 0 ? services.find(s => s.id === id)?.image : null;
            saveFinalService(id, name, duration, price, existingImage || null);
        }
    };

    function saveFinalService(id, name, duration, price, image) {
        const services = getServices();
        
        if (id === 0) {
            // New
            const newId = services.length > 0 ? Math.max(...services.map(s => s.id)) + 1 : 1;
            const newService = { id: newId, name, duration, price };
            if (image) {
                newService.image = image;
            }
            services.push(newService);
        } else {
            // Edit
            const svc = services.find(s => s.id === id);
            if (svc) { 
                svc.name = name; 
                svc.duration = duration; 
                svc.price = price;
                if (image) {
                    svc.image = image;
                } else {
                    // Remove image property if null
                    delete svc.image;
                }
            }
        }

        saveServices(services);
        renderAdminServices();
        renderServices(); // Update client view
        closeModal('form-modal');
        showToast('Servicio guardado', 'success');
    }

    window.editService = function (id) {
        const service = getServices().find(s => s.id === id);
        if (service) window.showServiceForm(service);
    };

    window.deleteService = function (id) {
        if (!confirm('¿Eliminar este servicio?')) return;
        const services = getServices().filter(s => s.id !== id);
        saveServices(services);
        renderAdminServices();
        showToast('Servicio eliminado', 'success');
    };

    // ---------- STYLISTS CRUD ----------
    function renderAdminStylists() {
        const stylists = getStylists();
        const tbody = $('stylists-tbody');
        if (stylists.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center" style="padding:2rem;color:var(--text-muted)">No hay profesionales</td></tr>';
            return;
        }
        
        // Check authorization status for each stylist
        stylists.forEach(async (s) => {
            try {
                const backendUrl = getBackendURL();
                const response = await fetch(`${backendUrl}/auth/status/${s.id}`);
                if (response.ok) {
                    const data = await response.json();
                    s.calendarConnected = data.authorized;
                    s.calendarEmail = data.email;
                }
            } catch (error) {
                s.calendarConnected = false;
            }
        });
        
        tbody.innerHTML = stylists.map(s => `
            <tr>
                <td>${sanitize(s.name)}</td>
                <td>${s.email ? sanitize(s.email) : '<span style="color:var(--text-muted);font-style:italic">Sin email</span>'}</td>
                <td><span class="badge ${s.active ? 'badge-confirmed' : 'badge-cancelled'}">${s.active ? 'Activo' : 'Inactivo'}</span></td>
                <td>
                    <span id="calendar-status-${s.id}" class="badge ${s.calendarConnected ? 'badge-confirmed' : 'badge-pending'}">
                        ${s.calendarConnected ? '✓ Google Calendar conectado' : '⚠ Sin conectar'}
                    </span>
                    ${s.calendarConnected && s.calendarEmail ? `<br><small style="color:var(--text-muted)">${sanitize(s.calendarEmail)}</small>` : ''}
                </td>
                <td class="actions">
                    <button class="btn-warning" onclick="editStylist(${s.id})">Editar</button>
                    <button class="btn-secondary btn-sm" onclick="toggleStylist(${s.id})">${s.active ? 'Desactivar' : 'Activar'}</button>
                    ${!s.calendarConnected ? 
                        `<button class="btn-success btn-sm" onclick="connectStylistCalendar(${s.id})">📅 Conectar Calendario</button>` : 
                        `<button class="btn-danger btn-sm" onclick="disconnectStylistCalendar(${s.id})">🔌 Desconectar</button>`
                    }
                    <button class="btn-danger" onclick="deleteStylist(${s.id})">Eliminar</button>
                </td>
            </tr>
        `).join('');
        
        // Update status after initial render
        setTimeout(() => updateCalendarStatus(), 1000);
    }

    window.showStylistForm = function (stylist) {
        const isEdit = !!stylist;
        $('form-modal-title').textContent = isEdit ? 'Editar Profesional' : 'Nuevo Profesional';
        $('form-modal-body').innerHTML = `
            <div class="form-group">
                <label>Nombre</label>
                <input type="text" id="sty-name" class="input-field" value="${isEdit ? sanitize(stylist.name) : ''}" maxlength="100">
            </div>
            <div class="form-group">
                <label>Email (para recibir notificaciones de turnos)</label>
                <input type="email" id="sty-email" class="input-field" value="${isEdit && stylist.email ? sanitize(stylist.email) : ''}" placeholder="profesional@email.com" maxlength="100">
            </div>
            <button class="btn-primary" onclick="saveStylist(${isEdit ? stylist.id : 0})">Guardar</button>
        `;
        $('form-modal').classList.remove('hidden');
    };

    window.saveStylist = function (id) {
        const name = $('sty-name').value.trim();
        const email = $('sty-email').value.trim();
        if (!name) { showToast('Ingresá el nombre', 'error'); return; }
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showToast('Email inválido', 'error');
            return;
        }

        const stylists = getStylists();
        if (id === 0) {
            const newId = stylists.length > 0 ? Math.max(...stylists.map(s => s.id)) + 1 : 1;
            stylists.push({ id: newId, name, email: email || '', active: true });
        } else {
            const sty = stylists.find(s => s.id === id);
            if (sty) {
                sty.name = name;
                sty.email = email || '';
            }
        }

        saveStylists(stylists);
        renderAdminStylists();
        closeModal('form-modal');
        showToast('Profesional guardado', 'success');
    };

    window.editStylist = function (id) {
        const stylist = getStylists().find(s => s.id === id);
        if (stylist) window.showStylistForm(stylist);
    };

    window.toggleStylist = function (id) {
        const stylists = getStylists();
        const sty = stylists.find(s => s.id === id);
        if (sty) {
            sty.active = !sty.active;
            saveStylists(stylists);
            renderAdminStylists();
            showToast(sty.active ? 'Profesional activado' : 'Profesional desactivado', 'success');
        }
    };

    window.deleteStylist = function (id) {
        if (!confirm('¿Eliminar este profesional?')) return;
        const stylists = getStylists().filter(s => s.id !== id);
        saveStylists(stylists);
        renderAdminStylists();
        showToast('Profesional eliminado', 'success');
    };

    // ---------- GOOGLE CALENDAR CONNECTION ----------
    window.connectStylistCalendar = async function (stylistId) {
        try {
            const backendUrl = getBackendURL();
            const response = await fetch(`${backendUrl}/auth/google/${stylistId}`);
            
            if (!response.ok) {
                throw new Error('No se pudo obtener la URL de autorización');
            }
            
            const data = await response.json();
            
            // Open OAuth window
            const width = 600;
            const height = 700;
            const left = (screen.width - width) / 2;
            const top = (screen.height - height) / 2;
            
            const authWindow = window.open(
                data.authUrl,
                'Google Calendar Authorization',
                `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
            );
            
            // Poll for authorization completion
            const checkInterval = setInterval(async () => {
                if (authWindow.closed) {
                    clearInterval(checkInterval);
                    // Wait a bit and check status
                    setTimeout(async () => {
                        await updateCalendarStatus();
                        renderAdminStylists();
                        showToast('Verificando estado de conexión...', 'info');
                    }, 1000);
                }
            }, 500);
            
        } catch (error) {
            showToast('Error al conectar calendario: ' + error.message, 'error');
            console.error('Calendar connection error:', error);
        }
    };

    window.disconnectStylistCalendar = async function (stylistId) {
        if (!confirm('¿Desconectar el Google Calendar de este profesional?\n\nLos turnos nuevos no se agregarán automáticamente.')) {
            return;
        }
        
        try {
            const backendUrl = getBackendURL();
            const response = await fetch(`${backendUrl}/auth/disconnect/${stylistId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error('No se pudo desconectar el calendario');
            }
            
            await updateCalendarStatus();
            renderAdminStylists();
            showToast('Calendario desconectado', 'success');
            
        } catch (error) {
            showToast('Error al desconectar: ' + error.message, 'error');
            console.error('Calendar disconnection error:', error);
        }
    };

    async function updateCalendarStatus() {
        const stylists = getStylists();
        const backendUrl = getBackendURL();
        
        for (const stylist of stylists) {
            try {
                const response = await fetch(`${backendUrl}/auth/status/${stylist.id}`);
                if (response.ok) {
                    const data = await response.json();
                    const statusEl = document.getElementById(`calendar-status-${stylist.id}`);
                    if (statusEl) {
                        statusEl.className = `badge ${data.authorized ? 'badge-confirmed' : 'badge-pending'}`;
                        statusEl.textContent = data.authorized ? '✓ Google Calendar conectado' : '⚠ Sin conectar';
                    }
                }
            } catch (error) {
                console.warn(`Could not check calendar status for stylist ${stylist.id}:`, error);
            }
        }
    }

    // ---------- SETTINGS ----------
    function loadSettingsForm() {
        const s = getSettings();
        $('setting-shop-name').value = s.shopName;
        $('setting-password').value = s.adminPassword;
        $('setting-open-time').value = s.openTime;
        $('setting-close-time').value = s.closeTime;
        $('setting-interval').value = s.intervalMinutes;

        // Working days checkboxes
        const container = $('working-days-checks');
        container.innerHTML = DAY_NAMES.map((name, i) => `
            <label class="day-check">
                <input type="checkbox" value="${i}" ${s.workingDays.includes(i) ? 'checked' : ''}>
                <span>${name}</span>
            </label>
        `).join('');

        // Load EmailJS config
        const emailConfig = getEmailJSConfig();
        $('emailjs-service-id').value = emailConfig.serviceId || '';
        $('emailjs-template-id').value = emailConfig.templateId || '';
        $('emailjs-public-key').value = emailConfig.publicKey || '';
        
        // Load Backend URL config
        const backendUrl = getBackendURL();
        $('backend-url').value = backendUrl || '';
    }

    window.saveSettings = function () {
        const shopName = $('setting-shop-name').value.trim();
        const adminPassword = $('setting-password').value;
        const openTime = $('setting-open-time').value;
        const closeTime = $('setting-close-time').value;
        const intervalMinutes = parseInt($('setting-interval').value, 10);

        if (!shopName) { showToast('Ingresá el nombre del local', 'error'); return; }
        if (!adminPassword) { showToast('Ingresá una contraseña', 'error'); return; }
        if (!openTime || !closeTime) { showToast('Ingresá horarios de apertura y cierre', 'error'); return; }
        if (openTime >= closeTime) { showToast('La hora de apertura debe ser antes del cierre', 'error'); return; }
        if (!intervalMinutes || intervalMinutes < 10) { showToast('Intervalo mínimo: 10 minutos', 'error'); return; }

        const workingDays = [];
        document.querySelectorAll('#working-days-checks input:checked').forEach(cb => {
            workingDays.push(parseInt(cb.value, 10));
        });

        if (workingDays.length === 0) { showToast('Seleccioná al menos un día laboral', 'error'); return; }

        saveSettingsData({ shopName, adminPassword, openTime, closeTime, intervalMinutes, workingDays });
        showToast('Configuración guardada', 'success');
    };

    // ---------- EMAIL INTEGRATION SETTINGS ----------
    window.saveEmailJSSettings = function () {
        const serviceId = $('emailjs-service-id').value.trim();
        const templateId = $('emailjs-template-id').value.trim();
        const publicKey = $('emailjs-public-key').value.trim();

        if (!serviceId || !templateId || !publicKey) {
            showToast('Completá todos los campos de EmailJS', 'error');
            return;
        }

        saveEmailJSConfig(serviceId, templateId, publicKey);
        showToast('Configuración de EmailJS guardada correctamente', 'success');
    };

    window.testEmailJSConnection = function () {
        const serviceId = $('emailjs-service-id').value.trim();
        const templateId = $('emailjs-template-id').value.trim();
        const publicKey = $('emailjs-public-key').value.trim();

        if (!serviceId || !templateId || !publicKey) {
            showToast('Primero guardá la configuración de EmailJS', 'error');
            return;
        }

        if (typeof emailjs === 'undefined') {
            showToast('EmailJS library no está cargada', 'error');
            return;
        }

        // Initialize EmailJS
        emailjs.init(publicKey);

        showToast('Probando conexión...', 'info');

        // Send test email
        const testParams = {
            to_email: 'test@test.com',
            client_name: 'Test Cliente',
            service_name: 'Test Servicio',
            stylist_name: 'Test Profesional',
            appointment_date: 'Test Fecha',
            appointment_time: 'Test Hora',
            shop_name: getSettings().shopName,
            ics_content: 'TEST',
            ics_filename: 'test.ics'
        };

        emailjs.send(serviceId, templateId, testParams, publicKey)
            .then(
                () => showToast('✓ Conexión exitosa con EmailJS', 'success'),
                (error) => {
                    console.error('Error en test de EmailJS:', error);
                    showToast('Error: ' + (error.text || 'Verificá tus credenciales'), 'error');
                }
            );
    };

    // ---------- BACKEND INTEGRATION SETTINGS ----------
    window.saveBackendSettings = function () {
        const backendUrl = $('backend-url').value.trim();
        
        if (!backendUrl) {
            showToast('Ingresá la URL del servidor backend', 'error');
            return;
        }
        
        // Validate URL format
        try {
            new URL(backendUrl);
        } catch (error) {
            showToast('URL inválida. Ejemplo: http://localhost:3000 o https://tubackend.com', 'error');
            return;
        }
        
        saveBackendURL(backendUrl);
        showToast('URL del backend guardada correctamente', 'success');
    };

    window.testBackendConnection = async function () {
        const backendUrl = $('backend-url').value.trim();
        
        if (!backendUrl) {
            showToast('Primero guardá la URL del backend', 'error');
            return;
        }
        
        showToast('Probando conexión...', 'info');
        
        const result = await checkBackendHealth(backendUrl);
        
        if (result.success) {
            showToast('✓ Conexión exitosa con el servidor backend', 'success');
        } else {
            showToast('Error: ' + result.message, 'error');
        }
    };

    // ============================================================
    //  CALENDAR INTEGRATION (.ics & EmailJS)
    // ============================================================

    /**
     * Genera un archivo .ics para eventos de calendario
     */
    function generateICS(appointment, stylist, service) {
        const settings = getSettings();
        const shopName = settings.shopName || 'Peluquería';
        
        // Parse date and time
        const [year, month, day] = appointment.date.split('-');
        const [hours, minutes] = appointment.time.split(':');
        const startDate = new Date(year, month - 1, day, hours, minutes);
        
        // Calculate end time based on service duration
        const duration = service?.duration || 30;
        const endDate = new Date(startDate.getTime() + duration * 60000);
        
        // Format dates for .ics (YYYYMMDDTHHMMSS)
        const formatICSDate = (date) => {
            const pad = (n) => String(n).padStart(2, '0');
            return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}00`;
        };
        
        const dtStart = formatICSDate(startDate);
        const dtEnd = formatICSDate(endDate);
        const dtStamp = formatICSDate(new Date());
        
        // Generate unique UID
        const uid = `appointment-${appointment.id}@${shopName.toLowerCase().replace(/\s/g, '')}.com`;
        
        // Build .ics content
        const icsContent = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Mostaza//Turnos//ES',
            'CALSCALE:GREGORIAN',
            'METHOD:REQUEST',
            'BEGIN:VEVENT',
            `UID:${uid}`,
            `DTSTAMP:${dtStamp}`,
            `DTSTART:${dtStart}`,
            `DTEND:${dtEnd}`,
            `SUMMARY:${shopName} - ${appointment.serviceName}`,
            `DESCRIPTION:Cliente: ${appointment.clientName}\nTeléfono: ${appointment.clientPhone}\nServicio: ${appointment.serviceName}\nProfesional: ${appointment.stylistName}\nPrecio: ${formatPrice(appointment.price)}`,
            `LOCATION:${shopName}`,
            'STATUS:CONFIRMED',
            'SEQUENCE:0',
            `ORGANIZER;CN=${shopName}:mailto:noreply@${shopName.toLowerCase().replace(/\s/g, '')}.com`,
            'BEGIN:VALARM',
            'TRIGGER:-PT1H',
            'ACTION:DISPLAY',
            'DESCRIPTION:Recordatorio: Turno en 1 hora',
            'END:VALARM',
            'END:VEVENT',
            'END:VCALENDAR'
        ].join('\r\n');
        
        return icsContent;
    }

    /**
     * Envía invitaciones de calendario usando EmailJS
     * Requiere configuración previa en https://www.emailjs.com/
     */
    function sendCalendarInvitations(appointment, stylist, service) {
        const settings = getSettings();
        const icsContent = generateICS(appointment, stylist, service);
        
        // Check if EmailJS is configured
        const emailJSConfig = getData('emailjs_config', null);
        
        if (!emailJSConfig || !emailJSConfig.serviceId || !emailJSConfig.templateId || !emailJSConfig.publicKey) {
            console.warn('EmailJS no configurado. Las invitaciones de calendario no se enviarán automáticamente.');
            console.log('Configurar en: Panel Admin > Configuración > Integración Email');
            // Fallback: Show download links
            showCalendarDownloadOption(icsContent, appointment);
            return;
        }
        
        if (typeof emailjs === 'undefined') {
            console.error('EmailJS library no cargada. Agregá el script en el HTML.');
            showCalendarDownloadOption(icsContent, appointment);
            return;
        }
        
        // Encode .ics content to base64 for email attachment
        const icsBase64 = btoa(unescape(encodeURIComponent(icsContent)));
        
        // Prepare template parameters
        const emailParams = {
            to_email: appointment.clientEmail,
            client_name: appointment.clientName,
            service_name: appointment.serviceName,
            stylist_name: appointment.stylistName,
            appointment_date: formatDate(appointment.date),
            appointment_time: appointment.time,
            shop_name: settings.shopName,
            ics_content: icsContent,
            ics_filename: `turno-${appointment.id}.ics`
        };
        
        // Send to client
        emailjs.send(
            emailJSConfig.serviceId,
            emailJSConfig.templateId,
            emailParams,
            emailJSConfig.publicKey
        ).then(
            () => console.log('Email enviado al cliente:', appointment.clientEmail),
            (error) => {
                console.error('Error enviando email al cliente:', error);
                showCalendarDownloadOption(icsContent, appointment);
            }
        );
        
        // Send to stylist if email is configured
        if (stylist?.email) {
            const stylistParams = {
                ...emailParams,
                to_email: stylist.email,
                client_phone: appointment.clientPhone
            };
            
            emailjs.send(
                emailJSConfig.serviceId,
                emailJSConfig.templateId,
                stylistParams,
                emailJSConfig.publicKey
            ).then(
                () => console.log('Email enviado al profesional:', stylist.email),
                (error) => console.error('Error enviando email al profesional:', error)
            );
        }
    }

    /**
     * Muestra opción de descarga manual de .ics si EmailJS no está configurado
     */
    function showCalendarDownloadOption(icsContent, appointment) {
        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = `turno-${appointment.id}.ics`;
        downloadLink.textContent = 'Descargar evento de calendario (.ics)';
        downloadLink.className = 'btn-secondary';
        downloadLink.style.marginTop = '1rem';
        downloadLink.style.display = 'inline-block';
        
        const confirmDetails = $('confirmation-details');
        if (confirmDetails) {
            const downloadContainer = document.createElement('div');
            downloadContainer.style.marginTop = '1.5rem';
            downloadContainer.style.padding = '1rem';
            downloadContainer.style.background = 'rgba(212,160,36,0.1)';
            downloadContainer.style.borderRadius = '8px';
            downloadContainer.innerHTML = '<p style="margin:0 0 0.5rem 0;font-size:0.9rem;"><strong>📅 Agregar a tu calendario:</strong></p>';
            downloadContainer.appendChild(downloadLink);
            confirmDetails.appendChild(downloadContainer);
        }
    }

    // Helper functions for EmailJS config
    function saveEmailJSConfig(serviceId, templateId, publicKey) {
        setData('emailjs_config', { serviceId, templateId, publicKey });
    }

    function getEmailJSConfig() {
        return getData('emailjs_config', { serviceId: '', templateId: '', publicKey: '' });
    }

    // Helper functions for Backend Config
    function saveBackendURL(url) {
        setData('backend_url', url);
    }

    function getBackendURL() {
        return getData('backend_url', '') || BACKEND_URL;
    }

    function saveGoogleOAuthConfig(clientId, redirectUri) {
        setData('google_oauth_config', { clientId, redirectUri });
    }

    function getGoogleOAuthConfig() {
        return getData('google_oauth_config', { clientId: '', redirectUri: '' });
    }

    async function checkBackendHealth(url) {
        try {
            const response = await fetch(`${url}/health`, { 
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            if (response.ok) {
                const data = await response.json();
                return { success: true, message: data.message || 'Conectado' };
            }
            return { success: false, message: 'Servidor backend no responde correctamente' };
        } catch (error) {
            return { success: false, message: 'No se puede conectar al servidor backend: ' + error.message };
        }
    }

    // ============================================================
    //  AVAILABILITY / BLOCKS MANAGEMENT
    // ============================================================

    let availabilityCalendarDate = new Date();
    let selectedBlockDate = null;
    let selectedBlockStylist = null;

    window.renderAvailabilityCalendar = function() {
        const stylistId = parseInt($('availability-stylist').value);
        if (!stylistId) {
            $('availability-calendar-wrapper').classList.add('hidden');
            return;
        }
        
        $('availability-calendar-wrapper').classList.remove('hidden');
        selectedBlockStylist = stylistId;
        renderAvailabilityCalendarDays();
        renderBlocksList();
    };

    function renderAvailabilityCalendarDays() {
        const year = availabilityCalendarDate.getFullYear();
        const month = availabilityCalendarDate.getMonth();
        const settings = getSettings();
        
        // Update header
        const monthNames = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        $('availability-month-year').textContent = `${monthNames[month]} ${year}`;
        
        // Get first and last day of month
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();
        
        // Get today for comparison
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Get blocks for selected stylist
        const blocks = getBlocks().filter(b => b.stylistId === selectedBlockStylist);
        const blockedDates = new Set(blocks.filter(b => b.fullDay).map(b => b.date));
        const partialBlockedDates = new Set(blocks.filter(b => !b.fullDay).map(b => b.date));
        
        // Generate calendar days
        const calendarDays = $('availability-calendar-days');
        calendarDays.innerHTML = '';
        
        // Add empty cells for days before month starts
        for (let i = 0; i < startingDayOfWeek; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day empty';
            calendarDays.appendChild(emptyDay);
        }
        
        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dayDate = new Date(year, month, day);
            dayDate.setHours(0, 0, 0, 0);
            const dayOfWeek = dayDate.getDay();
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            dayElement.textContent = day;
            
            // Check if day is in the past
            if (dayDate < today) {
                dayElement.classList.add('disabled');
            }
            // Check if it's not a working day
            else if (!settings.workingDays.includes(dayOfWeek)) {
                dayElement.classList.add('disabled');
            }
            // Check if it's blocked (full day)
            else if (blockedDates.has(dateStr)) {
                dayElement.classList.add('blocked-day');
                dayElement.title = 'Día bloqueado';
            }
            // Check if has partial blocks
            else if (partialBlockedDates.has(dateStr)) {
                dayElement.classList.add('partial-blocked-day');
                dayElement.title = 'Tiene horarios bloqueados';
            }
            // Check if it's today
            else if (dayDate.getTime() === today.getTime()) {
                dayElement.classList.add('today');
            }
            
            // Add click handler if not disabled
            if (!dayElement.classList.contains('disabled')) {
                dayElement.onclick = () => showBlockTimesModal(dateStr);
            }
            
            calendarDays.appendChild(dayElement);
        }
    }

    window.changeAvailabilityMonth = function(offset) {
        availabilityCalendarDate.setMonth(availabilityCalendarDate.getMonth() + offset);
        renderAvailabilityCalendarDays();
    };

    window.showBlockTimesModal = function(dateStr) {
        selectedBlockDate = dateStr;
        const date = new Date(dateStr + 'T00:00:00');
        const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const monthNames = [
            'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
            'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
        ];
        
        $('block-modal-date').textContent = `${dayNames[date.getDay()]} ${date.getDate()} de ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
        
        // Check if day is already fully blocked
        const blocks = getBlocks();
        const dayBlock = blocks.find(b => 
            b.stylistId === selectedBlockStylist && 
            b.date === dateStr && 
            b.fullDay
        );
        
        if (dayBlock) {
            // Day is fully blocked - show option to unblock
            $('admin-time-slots').innerHTML = '<p style="text-align:center; color:var(--danger); font-weight:600;">⚠️ Este día está completamente bloqueado</p>';
        } else {
            // Show time slots
            renderAdminTimeSlots(dateStr);
        }
        
        $('block-times-modal').classList.remove('hidden');
    };

    function renderAdminTimeSlots(dateStr) {
        const settings = getSettings();
        const container = $('admin-time-slots');
        
        // Generate time slots
        const [openH, openM] = settings.openTime.split(':').map(Number);
        const [closeH, closeM] = settings.closeTime.split(':').map(Number);
        const interval = settings.intervalMinutes;
        
        const openMinutes = openH * 60 + openM;
        const closeMinutes = closeH * 60 + closeM;
        
        // Get existing blocks for this date and stylist
        const blocks = getBlocks();
        const dayBlocks = blocks.filter(b => 
            b.stylistId === selectedBlockStylist && 
            b.date === dateStr &&
            !b.fullDay
        );
        const blockedTimes = dayBlocks.length > 0 ? new Set(dayBlocks[0].blockedTimes || []) : new Set();
        
        // Get existing appointments
        const appointments = getAppointments().filter(a =>
            a.date === dateStr &&
            a.stylistId === selectedBlockStylist &&
            a.status !== 'cancelled'
        );
        const bookedTimes = new Set(appointments.map(a => a.time));
        
        let html = '';
        for (let m = openMinutes; m < closeMinutes; m += interval) {
            const h = Math.floor(m / 60);
            const min = m % 60;
            const timeStr = `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
            
            const isBooked = bookedTimes.has(timeStr);
            const isBlocked = blockedTimes.has(timeStr);
            
            let classes = 'time-slot';
            let onclick = '';
            let text = timeStr;
            
            if (isBooked) {
                classes += ' unavailable';
                text += ' (Reservado)';
            } else {
                if (isBlocked) {
                    classes += ' selected';
                }
                onclick = `onclick="toggleTimeBlock('${timeStr}')"`;
            }
            
            html += `<div class="${classes}" ${onclick} data-time="${timeStr}">${text}</div>`;
        }
        
        container.innerHTML = html;
    }

    window.toggleTimeBlock = function(timeStr) {
        const slot = document.querySelector(`#admin-time-slots .time-slot[data-time="${timeStr}"]`);
        if (slot && !slot.classList.contains('unavailable')) {
            slot.classList.toggle('selected');
        }
    };

    window.blockFullDay = function() {
        if (!selectedBlockDate || !selectedBlockStylist) return;
        
        const stylist = getStylists().find(s => s.id === selectedBlockStylist);
        if (!confirm(`¿Bloquear completamente el día ${selectedBlockDate} para ${stylist.name}?`)) {
            return;
        }
        
        let blocks = getBlocks();
        
        // Remove any partial blocks for this date
        blocks = blocks.filter(b => !(b.stylistId === selectedBlockStylist && b.date === selectedBlockDate));
        
        // Add full day block
        blocks.push({
            id: Date.now(),
            stylistId: selectedBlockStylist,
            date: selectedBlockDate,
            fullDay: true,
            blockedTimes: []
        });
        
        saveBlocks(blocks);
        showToast('Día bloqueado completamente', 'success');
        closeModal('block-times-modal');
        renderAvailabilityCalendarDays();
        renderBlocksList();
    };

    window.saveTimeBlocks = function() {
        if (!selectedBlockDate || !selectedBlockStylist) return;
        
        const selectedSlots = Array.from(document.querySelectorAll('#admin-time-slots .time-slot.selected:not(.unavailable)'));
        const blockedTimes = selectedSlots.map(slot => slot.dataset.time);
        
        let blocks = getBlocks();
        
        // Remove existing block for this date
        blocks = blocks.filter(b => !(b.stylistId === selectedBlockStylist && b.date === selectedBlockDate));
        
        // Add new block only if there are blocked times
        if (blockedTimes.length > 0) {
            blocks.push({
                id: Date.now(),
                stylistId: selectedBlockStylist,
                date: selectedBlockDate,
                fullDay: false,
                blockedTimes: blockedTimes
            });
            showToast(`${blockedTimes.length} horario(s) bloqueado(s)`, 'success');
        } else {
            showToast('Bloqueo eliminado (no hay horarios seleccionados)', 'success');
        }
        
        saveBlocks(blocks);
        closeModal('block-times-modal');
        renderAvailabilityCalendarDays();
        renderBlocksList();
    };

    function renderBlocksList() {
        if (!selectedBlockStylist) return;
        
        const blocks = getBlocks()
            .filter(b => b.stylistId === selectedBlockStylist)
            .sort((a, b) => a.date.localeCompare(b.date));
        
        const container = $('blocks-list');
        
        if (blocks.length === 0) {
            container.innerHTML = '<p style="color:var(--text-muted); text-align:center;">No hay bloqueos configurados para este profesional</p>';
            return;
        }
        
        const html = blocks.map(block => {
            const displayText = block.fullDay 
                ? '🚫 Día completo bloqueado' 
                : `⏰ ${block.blockedTimes.length} horario(s) bloqueado(s)`;
            
            return `
                <div class="block-item" style="background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 1rem; margin-bottom: 0.5rem; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>${block.date}</strong> - ${displayText}
                        ${!block.fullDay && block.blockedTimes.length > 0 ? `<div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.25rem;">${block.blockedTimes.join(', ')}</div>` : ''}
                    </div>
                    <button class="btn-secondary btn-sm" onclick="removeBlock(${block.id})" style="margin-left: 1rem;">Eliminar</button>
                </div>
            `;
        }).join('');
        
        container.innerHTML = html;
    }

    window.removeBlock = function(blockId) {
        if (!confirm('¿Eliminar este bloqueo?')) return;
        
        let blocks = getBlocks();
        blocks = blocks.filter(b => b.id !== blockId);
        saveBlocks(blocks);
        
        showToast('Bloqueo eliminado', 'success');
        renderAvailabilityCalendarDays();
        renderBlocksList();
    };

    // ============================================================
    //  INIT
    // ============================================================

    document.addEventListener('DOMContentLoaded', () => {
        // Initialize EmailJS if configured
        const emailConfig = getEmailJSConfig();
        if (emailConfig.publicKey && typeof emailjs !== 'undefined') {
            emailjs.init(emailConfig.publicKey);
        }
        
        initClient();
    });

})();
