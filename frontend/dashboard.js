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
    const calendarGrid = document.getElementById('calendar-grid');
    const monthYearTitle = document.getElementById('month-year-title');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    const eventsList = document.getElementById('upcoming-events-list');

    const projectFilter = document.getElementById('project-filter');
    const newProjectBtn = document.getElementById('new-project-btn');
    const projectModal = document.getElementById('project-modal');
    const projectForm = document.getElementById('project-form');
    const projectNameInput = document.getElementById('project-name-input');
    const closeProjectModalBtn = document.getElementById('close-project-modal-btn');

    const eventModal = document.getElementById('event-modal');
    const eventForm = document.getElementById('event-form');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const modalDateTitle = document.getElementById('modal-date-title');
    const eventDateInput = document.getElementById('event-date-input');
    const eventProjectInput = document.getElementById('event-project-input');
    const eventTitleInput = document.getElementById('event-title-input');
    const eventTimeInput = document.getElementById('event-time-input');
    const eventCategoryInput = document.getElementById('event-category-input');
    const eventDescInput = document.getElementById('event-desc-input');

    let currentDate = new Date();
    let allEvents = [];
    let allProjects = [];

    langSwitcher.addEventListener('change', (e) => {
        setCurrentLang(e.target.value);
        populateProjectSelects();
        renderCalendar();
        renderEventsSidebar();
    });

    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('username');
        window.location.href = 'login.html';
    });

    function getProjectName(folderId) {
        if (!folderId) return null;
        const proj = allProjects.find(p => p.id === Number(folderId));
        return proj ? proj.name : `#${folderId}`;
    }

    function getFilteredEvents() {
        const selectedProj = projectFilter.value;
        if (selectedProj === 'all') {
            return allEvents;
        }
        if (selectedProj === 'personal') {
            return allEvents.filter(e => !e.folder_id);
        }
        return allEvents.filter(e => Number(e.folder_id) === Number(selectedProj));
    }

    function populateProjectSelects() {
        const currentFilter = projectFilter.value;
        projectFilter.innerHTML = `
            <option value="all">${t('all_events')}</option>
            <option value="personal">${t('personal_only')}</option>
        `;
        eventProjectInput.innerHTML = `<option value="">${t('no_project_opt')}</option>`;

        allProjects.forEach(proj => {
            const filterOpt = document.createElement('option');
            filterOpt.value = proj.id;
            filterOpt.innerText = `${t('project_select_prefix')} ${proj.name}`;
            projectFilter.appendChild(filterOpt);

            const modalOpt = document.createElement('option');
            modalOpt.value = proj.id;
            modalOpt.innerText = proj.name;
            eventProjectInput.appendChild(modalOpt);
        });

        if ([...projectFilter.options].some(o => o.value === currentFilter)) {
            projectFilter.value = currentFilter;
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
        populateProjectSelects();
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
                await fetchProjects();
                projectFilter.value = String(created.id);
            } else {
                const fallbackProj = { id: Date.now(), name: name };
                allProjects.push(fallbackProj);
                localStorage.setItem('fallback_projects', JSON.stringify(allProjects));
                populateProjectSelects();
                projectFilter.value = String(fallbackProj.id);
            }
        } catch (error) {
            const fallbackProj = { id: Date.now(), name: name };
            allProjects.push(fallbackProj);
            localStorage.setItem('fallback_projects', JSON.stringify(allProjects));
            populateProjectSelects();
            projectFilter.value = String(fallbackProj.id);
        }

        closeProjectModal();
        renderCalendar();
        renderEventsSidebar();
    });

    projectFilter.addEventListener('change', () => {
        renderCalendar();
        renderEventsSidebar();
    });

    function openModal(dateStr, displayDate) {
        eventDateInput.value = dateStr;
        modalDateTitle.innerText = `${t('add_event_title')} (${displayDate})`;
        eventTitleInput.value = '';
        eventTimeInput.value = '12:00';
        eventCategoryInput.value = 'meeting';
        eventDescInput.value = '';

        if (projectFilter.value !== 'all' && projectFilter.value !== 'personal') {
            eventProjectInput.value = projectFilter.value;
        } else {
            eventProjectInput.value = '';
        }

        eventModal.classList.add('active');
        eventTitleInput.focus();
    }

    function closeModal() {
        eventModal.classList.remove('active');
    }

    closeModalBtn.addEventListener('click', closeModal);

    eventModal.addEventListener('click', (e) => {
        if (e.target === eventModal) closeModal();
    });

    calendarGrid.addEventListener('click', (e) => {
        const cell = e.target.closest('.calendar-cell:not(.empty)');
        if (!cell) return;
        const dateStr = cell.getAttribute('data-date');
        const displayDate = cell.getAttribute('data-display');
        if (dateStr) {
            openModal(dateStr, displayDate);
        }
    });

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

    function renderCalendar() {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const monthNames = t('months');
        monthYearTitle.innerText = `${monthNames[month]} ${year}`;

        while (calendarGrid.children.length > 7) {
            calendarGrid.removeChild(calendarGrid.lastChild);
        }

        const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;
        const totalDays = new Date(year, month + 1, 0).getDate();
        const today = new Date();
        const visibleEvents = getFilteredEvents();

        for (let i = 0; i < firstDayIndex; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'calendar-cell empty';
            calendarGrid.appendChild(emptyCell);
        }

        for (let day = 1; day <= totalDays; day++) {
            const cell = document.createElement('div');
            cell.className = 'calendar-cell';
            cell.setAttribute('data-testid', `calendar-day-${day}`);

            const formattedMonth = String(month + 1).padStart(2, '0');
            const formattedDay = String(day).padStart(2, '0');
            const dateStr = `${year}-${formattedMonth}-${formattedDay}`;
            const displayDate = `${day} ${monthNames[month]} ${year}`;

            cell.setAttribute('data-date', dateStr);
            cell.setAttribute('data-display', displayDate);

            if (year === today.getFullYear() && month === today.getMonth() && day === today.getDate()) {
                cell.classList.add('today');
            }

            const dayNum = document.createElement('div');
            dayNum.className = 'day-number';
            dayNum.innerText = day;
            cell.appendChild(dayNum);

            const eventsContainer = document.createElement('div');
            eventsContainer.className = 'day-events-container';

            const dayEvents = visibleEvents.filter(e => e.date === dateStr);
            dayEvents.forEach(ev => {
                const pill = document.createElement('div');
                pill.className = `day-event-pill cat-${ev.category || 'meeting'}`;
                const projName = getProjectName(ev.folder_id);
                const prefix = projName ? `[${projName}] ` : '';
                pill.innerText = `${prefix}${ev.time ? ev.time + ' ' : ''}${ev.title}`;
                eventsContainer.appendChild(pill);
            });

            cell.appendChild(eventsContainer);
            calendarGrid.appendChild(cell);
        }
    }

    function renderEventsSidebar() {
        eventsList.innerHTML = '';
        const visibleEvents = getFilteredEvents();
        
        const sorted = [...visibleEvents].sort((a, b) => {
            const dateA = new Date(`${a.date}T${a.time || '00:00'}`);
            const dateB = new Date(`${b.date}T${b.time || '00:00'}`);
            return dateA - dateB;
        });

        if (sorted.length === 0) {
            eventsList.innerHTML = `<p style="color: #718096; font-size: 0.9rem;">${t('no_events')}</p>`;
            return;
        }

        sorted.forEach(ev => {
            const badgeInfo = getDaysDiffText(ev.date);
            const projName = getProjectName(ev.folder_id);
            const card = document.createElement('div');
            card.className = `event-card border-${ev.category || 'meeting'}`;
            card.setAttribute('data-testid', 'event-card');
            
            card.innerHTML = `
                <div class="event-header-row">
                    <span class="event-date">${ev.date} | ${ev.time || t('all_day')}</span>
                    <span class="event-badge ${badgeInfo.urgent ? 'urgent' : ''}">${badgeInfo.text}</span>
                </div>
                <div class="event-title">${ev.title}</div>
                <div style="font-size: 0.78rem; color: #3182ce; font-weight: bold; margin-bottom: 4px;">
                    ${projName ? `${t('project_prefix')} ${projName}` : t('personal_event')}
                </div>
                ${ev.description ? `<div class="event-desc">${ev.description}</div>` : ''}
                <button type="button" class="delete-event-btn" data-testid="delete-event-btn" data-id="${ev.id}">${t('delete_btn')}</button>
            `;

            card.querySelector('.delete-event-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                deleteEvent(ev.id);
            });

            eventsList.appendChild(card);
        });
    }

    async function fetchEvents() {
        try {
            const response = await fetch('http://localhost:8000/api/v1/events/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                allEvents = await response.json();
            } else if (response.status === 401) {
                localStorage.removeItem('access_token');
                window.location.href = 'login.html';
                return;
            }
        } catch (error) {
            console.error(error);
        }
        renderCalendar();
        renderEventsSidebar();
    }

    eventForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const selectedFolderId = eventProjectInput.value ? Number(eventProjectInput.value) : null;

        const newEvent = {
            title: eventTitleInput.value.trim(),
            date: eventDateInput.value,
            time: eventTimeInput.value,
            category: eventCategoryInput.value,
            description: eventDescInput.value.trim(),
            folder_id: selectedFolderId
        };

        try {
            const response = await fetch('http://localhost:8000/api/v1/events/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newEvent)
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

    prevMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });

    nextMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });

    async function init() {
        await fetchProjects();
        await fetchEvents();
    }

    init();
});