document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('access_token');

    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    applyTranslations();

    const savedUsername = localStorage.getItem('username');
    const loggedUserEl = document.getElementById('logged-user');
    if (savedUsername) {
        loggedUserEl.removeAttribute('data-i18n');
        loggedUserEl.innerText = savedUsername;
    }

    const langSwitcher = document.getElementById('lang-switcher');
    const logoutBtn = document.getElementById('logout-btn');
    const projectsGrid = document.getElementById('projects-grid');
    const newProjectBtn = document.getElementById('new-project-btn');
    const projectModal = document.getElementById('project-modal');
    const projectForm = document.getElementById('project-form');
    const projectNameInput = document.getElementById('project-name-input');
    const closeProjectModalBtn = document.getElementById('close-project-modal-btn');

    const projectEventsPanel = document.getElementById('project-events-panel');
    const selectedProjectTitle = document.getElementById('selected-project-title');
    const projectEventsList = document.getElementById('project-events-list');
    const addProjectEventBtn = document.getElementById('add-project-event-btn');

    const eventModal = document.getElementById('event-modal');
    const eventForm = document.getElementById('event-form');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const modalDateTitle = document.getElementById('modal-date-title');
    const eventDateInput = document.getElementById('event-date-input');
    const eventProjectInput = document.getElementById('event-project-input');
    const eventTitleInput = document.getElementById('event-title-input');
    const eventAllDayInput = document.getElementById('event-all-day-input');
    const eventTimesRow = document.getElementById('event-times-row');
    const eventTimeInput = document.getElementById('event-time-input');
    const eventEndTimeInput = document.getElementById('event-end-time-input');
    const eventTimeError = document.getElementById('event-time-error');
    const eventCategoryInput = document.getElementById('event-category-input');
    const eventDescInput = document.getElementById('event-desc-input');

    let allProjects = [];
    let allEvents = [];
    let selectedProjectId = null;
    let editingEventId = null;

    langSwitcher.addEventListener('change', (e) => {
        setCurrentLang(e.target.value);
        populateProjectSelect();
        renderProjects();
        renderSelectedProjectEvents();
    });

    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('username');
        window.location.href = 'login.html';
    });

    function addOneHour(timeStr) {
        if (!timeStr || !timeStr.includes(':')) return '13:00';
        const [h, m] = timeStr.split(':').map(Number);
        const nextH = Math.min(23, h + 1);
        const nextM = h === 23 ? 59 : m;
        return `${String(nextH).padStart(2, '0')}:${String(nextM).padStart(2, '0')}`;
    }

    function formatEventTime(ev) {
        if (ev.is_all_day || !ev.time) return t('all_day');
        if (ev.end_time) return `${ev.time} - ${ev.end_time}`;
        return ev.time;
    }

    function getDaysDiffText(dateStr) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const target = new Date(dateStr);
        target.setHours(0, 0, 0, 0);

        const diffTime = target - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return { text: t('today'), urgent: true };
        if (diffDays === 1) return { text: t('tomorrow'), urgent: true };
        if (diffDays < 0) return { text: `${Math.abs(diffDays)} ${t('days_ago')}`, urgent: false };
        return { text: `${t('in_days')} ${diffDays} ${t('days')}`, urgent: diffDays <= 3 };
    }

    function populateProjectSelect() {
        eventProjectInput.innerHTML = `<option value="other">${t('other_folder')}</option>`;
        allProjects.forEach(proj => {
            const opt = document.createElement('option');
            opt.value = proj.id;
            opt.innerText = proj.name;
            eventProjectInput.appendChild(opt);
        });
    }

    function getDisplayProjects() {
        return [
            { id: 'other', name: t('other_folder'), isDefault: true },
            ...allProjects
        ];
    }

    function isEventInProject(ev, projId) {
        if (projId === 'other') {
            return !ev.folder_id || !allProjects.some(p => Number(p.id) === Number(ev.folder_id));
        }
        return Number(ev.folder_id) === Number(projId);
    }

    function renderProjects() {
        projectsGrid.innerHTML = '';
        const displayProjects = getDisplayProjects();

        displayProjects.forEach(proj => {
            const count = allEvents.filter(ev => isEventInProject(ev, proj.id)).length;
            const isSelected = String(selectedProjectId) === String(proj.id);

            const card = document.createElement('div');
            card.className = `project-card ${isSelected ? 'selected' : ''}`;
            card.setAttribute('data-testid', 'project-card');
            card.setAttribute('data-folder-id', proj.id);

            card.innerHTML = `
                <div class="project-card-info">
                    <span class="project-card-icon">${isSelected ? '📂' : '📁'}</span>
                    <div>
                        <div class="project-card-title" data-testid="project-card-name">${proj.name}</div>
                        <div class="project-card-sub">${t('events_count_label')} ${count}</div>
                    </div>
                </div>
                ${proj.isDefault ? '' : `<button type="button" class="delete-project-btn" data-testid="delete-project-btn" data-id="${proj.id}">${t('delete_btn')}</button>`}
            `;

            card.addEventListener('click', () => {
                selectedProjectId = proj.id;
                renderProjects();
                renderSelectedProjectEvents();
            });

            const delBtn = card.querySelector('.delete-project-btn');
            if (delBtn) {
                delBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    deleteProject(proj.id);
                });
            }

            projectsGrid.appendChild(card);
        });
    }

    function renderSelectedProjectEvents() {
        if (!selectedProjectId) {
            projectEventsPanel.style.display = 'none';
            return;
        }

        const displayProjects = getDisplayProjects();
        const proj = displayProjects.find(p => String(p.id) === String(selectedProjectId));
        if (!proj) {
            selectedProjectId = null;
            projectEventsPanel.style.display = 'none';
            return;
        }

        projectEventsPanel.style.display = 'block';
        selectedProjectTitle.innerText = `📂 ${t('project_events_heading')} ${proj.name}`;
        projectEventsList.innerHTML = '';

        const projEvents = allEvents
            .filter(ev => isEventInProject(ev, selectedProjectId))
            .sort((a, b) => {
                const dateA = new Date(`${a.date}T${a.time || '00:00'}`);
                const dateB = new Date(`${b.date}T${b.time || '00:00'}`);
                return dateA - dateB;
            });

        if (projEvents.length === 0) {
            projectEventsList.innerHTML = `<p data-testid="no-project-events-msg" style="color: #718096; font-size: 0.92rem;">${t('no_project_events')}</p>`;
            return;
        }

        projEvents.forEach(ev => {
            const badgeInfo = getDaysDiffText(ev.date);
            const card = document.createElement('div');
            card.className = `event-card border-${ev.category || 'meeting'}`;
            card.setAttribute('data-testid', 'project-event-card');
            card.style.marginBottom = '0';

            card.innerHTML = `
                <div class="event-header-row">
                    <span class="event-date">${ev.date} | ${formatEventTime(ev)}</span>
                    <span class="event-badge ${badgeInfo.urgent ? 'urgent' : ''}">${badgeInfo.text}</span>
                </div>
                <div class="event-title">${ev.title}</div>
                ${ev.description ? `<div class="event-desc">${ev.description}</div>` : ''}
                <div class="event-actions">
                    <button type="button" class="edit-event-btn" data-testid="edit-event-btn" data-id="${ev.id}">${t('edit_btn')}</button>
                    <button type="button" class="delete-event-btn" data-testid="delete-event-btn" data-id="${ev.id}">${t('delete_btn')}</button>
                </div>
            `;

            card.querySelector('.edit-event-btn').addEventListener('click', () => {
                openEditModal(ev);
            });

            card.querySelector('.delete-event-btn').addEventListener('click', () => {
                deleteEvent(ev.id);
            });

            projectEventsList.appendChild(card);
        });
    }

    function syncAllDayVisibility() {
        const isAllDay = eventAllDayInput.checked;
        eventTimesRow.style.display = isAllDay ? 'none' : 'grid';
        eventTimeInput.required = !isAllDay;
        eventEndTimeInput.required = !isAllDay;
        if (isAllDay) {
            eventTimeError.style.display = 'none';
            eventEndTimeInput.setCustomValidity('');
        } else {
            eventEndTimeInput.min = eventTimeInput.value;
            validateTimeRange();
        }
    }

    function validateTimeRange() {
        if (eventAllDayInput.checked) {
            eventTimeError.style.display = 'none';
            eventEndTimeInput.setCustomValidity('');
            return true;
        }
        eventEndTimeInput.min = eventTimeInput.value;
        if (eventTimeInput.value && eventEndTimeInput.value && eventEndTimeInput.value <= eventTimeInput.value) {
            const msg = t('time_range_error');
            eventTimeError.innerText = msg;
            eventTimeError.style.display = 'block';
            eventEndTimeInput.setCustomValidity(msg);
            return false;
        }
        eventTimeError.style.display = 'none';
        eventEndTimeInput.setCustomValidity('');
        return true;
    }

    eventAllDayInput.addEventListener('change', syncAllDayVisibility);

    eventTimeInput.addEventListener('change', () => {
        eventEndTimeInput.min = eventTimeInput.value;
        if (eventEndTimeInput.value <= eventTimeInput.value) {
            eventEndTimeInput.value = addOneHour(eventTimeInput.value);
        }
        validateTimeRange();
    });

    eventEndTimeInput.addEventListener('input', validateTimeRange);
    eventEndTimeInput.addEventListener('change', validateTimeRange);

    function openAddEventForProject() {
        editingEventId = null;
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        eventDateInput.value = `${yyyy}-${mm}-${dd}`;
        modalDateTitle.innerText = t('add_event_title');
        eventProjectInput.value = selectedProjectId ? String(selectedProjectId) : 'other';
        eventTitleInput.value = '';
        eventAllDayInput.checked = false;
        eventTimeInput.value = '12:00';
        eventEndTimeInput.value = '13:00';
        eventCategoryInput.value = 'meeting';
        eventDescInput.value = '';
        syncAllDayVisibility();

        eventModal.classList.add('active');
        eventTitleInput.focus();
    }

    function openEditModal(ev) {
        editingEventId = ev.id;
        modalDateTitle.innerText = t('edit_event_title');
        eventDateInput.value = ev.date || '';
        eventProjectInput.value = ev.folder_id ? String(ev.folder_id) : 'other';
        eventTitleInput.value = ev.title || '';
        const isAllDay = Boolean(ev.is_all_day || !ev.time);
        eventAllDayInput.checked = isAllDay;
        eventTimeInput.value = ev.time || '12:00';
        eventEndTimeInput.value = ev.end_time || addOneHour(ev.time || '12:00');
        eventCategoryInput.value = ev.category || 'meeting';
        eventDescInput.value = ev.description || '';
        syncAllDayVisibility();

        eventModal.classList.add('active');
        eventTitleInput.focus();
    }

    function closeModal() {
        editingEventId = null;
        eventModal.classList.remove('active');
    }

    addProjectEventBtn.addEventListener('click', openAddEventForProject);
    closeModalBtn.addEventListener('click', closeModal);
    eventModal.addEventListener('click', (e) => {
        if (e.target === eventModal) closeModal();
    });

    eventForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!validateTimeRange()) {
            eventEndTimeInput.reportValidity();
            return;
        }
        const selectedFolderId = (eventProjectInput.value && eventProjectInput.value !== 'other')
            ? Number(eventProjectInput.value)
            : null;
        const isAllDay = eventAllDayInput.checked;

        const eventPayload = {
            title: eventTitleInput.value.trim().slice(0, 50),
            date: eventDateInput.value,
            is_all_day: isAllDay,
            time: isAllDay ? null : eventTimeInput.value,
            end_time: isAllDay ? null : eventEndTimeInput.value,
            category: eventCategoryInput.value,
            description: eventDescInput.value.trim().slice(0, 300),
            folder_id: selectedFolderId
        };

        const url = editingEventId
            ? `http://localhost:8000/api/v1/events/${editingEventId}`
            : 'http://localhost:8000/api/v1/events/';
        const method = editingEventId ? 'PATCH' : 'POST';

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(eventPayload)
            });

            if (response.ok) {
                await fetchEvents();
            }
        } catch (error) {
            console.error(error);
        }
        closeModal();
    });

    async function deleteEvent(id) {
        try {
            const response = await fetch(`http://localhost:8000/api/v1/events/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                await fetchEvents();
            }
        } catch (error) {
            console.error(error);
        }
    }

    async function fetchProjects() {
        try {
            const response = await fetch('http://localhost:8000/api/v1/folders/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                allProjects = await response.json();
            } else {
                const stored = localStorage.getItem('fallback_projects');
                allProjects = stored ? JSON.parse(stored) : [];
            }
        } catch (error) {
            const stored = localStorage.getItem('fallback_projects');
            allProjects = stored ? JSON.parse(stored) : [];
        }
        populateProjectSelect();
        renderProjects();
        renderSelectedProjectEvents();
    }

    async function fetchEvents() {
        try {
            const response = await fetch('http://localhost:8000/api/v1/events/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const rawEvents = await response.json();
                allEvents = await cleanupExpiredEvents(rawEvents, token);
            } else if (response.status === 401) {
                localStorage.removeItem('access_token');
                window.location.href = 'login.html';
                return;
            }
        } catch (error) {
            console.error(error);
        }
        renderProjects();
        renderSelectedProjectEvents();
    }

    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const settingsForm = document.getElementById('settings-form');
    const settingsThemeSelect = document.getElementById('settings-theme-select');
    const settingsLangSelect = document.getElementById('settings-lang-select');
    const settingsAutodeleteSelect = document.getElementById('settings-autodelete-select');
    const closeSettingsModalBtn = document.getElementById('close-settings-modal-btn');

    function openSettingsModal() {
        settingsThemeSelect.value = getCurrentTheme();
        settingsLangSelect.value = getCurrentLang();
        settingsAutodeleteSelect.value = getAutoDeleteDays();
        settingsModal.classList.add('active');
    }

    function closeSettingsModal() {
        settingsModal.classList.remove('active');
    }

    settingsBtn.addEventListener('click', openSettingsModal);
    closeSettingsModalBtn.addEventListener('click', closeSettingsModal);
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) closeSettingsModal();
    });

    settingsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        setCurrentTheme(settingsThemeSelect.value);
        setCurrentLang(settingsLangSelect.value);
        setAutoDeleteDays(settingsAutodeleteSelect.value);

        populateProjectSelect();
        allEvents = await cleanupExpiredEvents(allEvents, token);
        renderProjects();
        renderSelectedProjectEvents();
        closeSettingsModal();
    });

    async function deleteProject(id) {
        try {
            const response = await fetch(`http://localhost:8000/api/v1/folders/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                if (Number(selectedProjectId) === Number(id)) selectedProjectId = null;
                await fetchProjects();
                await fetchEvents();
                return;
            }
        } catch (error) {
            console.error(error);
        }
        allProjects = allProjects.filter(p => Number(p.id) !== Number(id));
        if (Number(selectedProjectId) === Number(id)) selectedProjectId = null;
        localStorage.setItem('fallback_projects', JSON.stringify(allProjects));
        renderProjects();
        renderSelectedProjectEvents();
    }

    newProjectBtn.addEventListener('click', () => {
        projectNameInput.value = '';
        projectModal.classList.add('active');
        projectNameInput.focus();
    });

    function closeProjectModal() {
        projectModal.classList.remove('active');
    }

    closeProjectModalBtn.addEventListener('click', closeProjectModal);

    projectModal.addEventListener('click', (e) => {
        if (e.target === projectModal) closeProjectModal();
    });

    projectForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = projectNameInput.value.trim();
        if (!name) return;

        try {
            const response = await fetch('http://localhost:8000/api/v1/folders/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name: name })
            });

            if (response.ok) {
                const created = await response.json();
                selectedProjectId = created.id;
                await fetchProjects();
            } else {
                const fallbackProj = { id: Date.now(), name: name };
                allProjects.push(fallbackProj);
                selectedProjectId = fallbackProj.id;
                localStorage.setItem('fallback_projects', JSON.stringify(allProjects));
                populateProjectSelect();
                renderProjects();
                renderSelectedProjectEvents();
            }
        } catch (error) {
            const fallbackProj = { id: Date.now(), name: name };
            allProjects.push(fallbackProj);
            selectedProjectId = fallbackProj.id;
            localStorage.setItem('fallback_projects', JSON.stringify(allProjects));
            populateProjectSelect();
            renderProjects();
            renderSelectedProjectEvents();
        }

        closeProjectModal();
    });

    async function init() {
        await fetchProjects();
        await fetchEvents();
    }

    init();
});
