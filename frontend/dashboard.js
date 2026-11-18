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
    const weekViewContainer = document.getElementById('week-view-container');
    const weekHeaderRow = document.getElementById('week-header-row');
    const weekBody = document.getElementById('week-body');
    const viewMonthBtn = document.getElementById('view-month-btn');
    const viewWeekBtn = document.getElementById('view-week-btn');
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
    const eventAllDayInput = document.getElementById('event-all-day-input');
    const eventTimesRow = document.getElementById('event-times-row');
    const eventTimeInput = document.getElementById('event-time-input');
    const eventEndTimeInput = document.getElementById('event-end-time-input');
    const eventTimeError = document.getElementById('event-time-error');
    const eventCategoryInput = document.getElementById('event-category-input');
    const eventDescInput = document.getElementById('event-desc-input');

    let currentDate = new Date();
    let currentView = 'month';
    let allEvents = [];
    let allProjects = [];
    let editingEventId = null;

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
        if (!folderId || folderId === 'other') return t('other_folder');
        const proj = allProjects.find(p => p.id === Number(folderId));
        return proj ? proj.name : t('other_folder');
    }

    function getFilteredEvents() {
        const selectedProj = projectFilter.value;
        if (selectedProj === 'all') {
            return allEvents;
        }
        if (selectedProj === 'other' || selectedProj === 'personal') {
            return allEvents.filter(e => !e.folder_id);
        }
        return allEvents.filter(e => Number(e.folder_id) === Number(selectedProj));
    }

    function populateProjectSelects() {
        const currentFilter = projectFilter.value;
        projectFilter.innerHTML = `
            <option value="all">${t('all_events')}</option>
            <option value="other">${t('project_select_prefix')} ${t('other_folder')}</option>
        `;
        eventProjectInput.innerHTML = `<option value="other">${t('other_folder')}</option>`;

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

    function openModal(dateStr, displayDate, defaultTime = '12:00', defaultAllDay = false) {
        editingEventId = null;
        eventDateInput.value = dateStr;
        modalDateTitle.innerText = `${t('add_event_title')} (${displayDate})`;
        eventTitleInput.value = '';
        eventAllDayInput.checked = defaultAllDay;
        eventTimeInput.value = defaultTime;
        eventEndTimeInput.value = addOneHour(defaultTime);
        eventCategoryInput.value = 'meeting';
        eventDescInput.value = '';
        syncAllDayVisibility();

        if (projectFilter.value !== 'all') {
            eventProjectInput.value = projectFilter.value;
        } else {
            eventProjectInput.value = 'other';
        }

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

    function getMondayOfWeek(d) {
        const date = new Date(d);
        const day = (date.getDay() + 6) % 7;
        date.setDate(date.getDate() - day);
        date.setHours(0, 0, 0, 0);
        return date;
    }

    function renderWeekView() {
        const monday = getMondayOfWeek(currentDate);
        const monthNames = t('months');
        const daysShort = t('days_short');
        const today = new Date();
        const visibleEvents = getFilteredEvents();

        const weekDays = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const dayNum = String(d.getDate()).padStart(2, '0');
            const isToday = y === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
            weekDays.push({
                dateObj: d,
                dateStr: `${y}-${m}-${dayNum}`,
                displayDate: `${d.getDate()} ${monthNames[d.getMonth()]} ${y}`,
                shortLabel: `${daysShort[i]} ${dayNum}.${m}`,
                isToday: isToday
            });
        }

        const firstDay = weekDays[0].dateObj;
        const lastDay = weekDays[6].dateObj;
        if (firstDay.getMonth() === lastDay.getMonth()) {
            monthYearTitle.innerText = `${firstDay.getDate()} - ${lastDay.getDate()} ${monthNames[firstDay.getMonth()]} ${firstDay.getFullYear()}`;
        } else {
            monthYearTitle.innerText = `${firstDay.getDate()} ${monthNames[firstDay.getMonth()].slice(0, 3)} - ${lastDay.getDate()} ${monthNames[lastDay.getMonth()].slice(0, 3)} ${lastDay.getFullYear()}`;
        }

        weekHeaderRow.innerHTML = `<div class="week-header-cell time-corner">🕒</div>`;
        weekDays.forEach(wd => {
            const headerCell = document.createElement('div');
            headerCell.className = `week-header-cell ${wd.isToday ? 'today' : ''}`;
            headerCell.innerText = wd.shortLabel;
            weekHeaderRow.appendChild(headerCell);
        });

        const prevScroll = weekBody.scrollTop;
        weekBody.innerHTML = '';

        const allDayRow = document.createElement('div');
        allDayRow.className = 'week-hour-row all-day-row';
        const allDayLabel = document.createElement('div');
        allDayLabel.className = 'week-time-label';
        allDayLabel.style.fontSize = '0.7rem';
        allDayLabel.style.textAlign = 'center';
        allDayLabel.innerText = t('all_day');
        allDayRow.appendChild(allDayLabel);

        weekDays.forEach(wd => {
            const slot = document.createElement('div');
            slot.className = `week-hour-slot ${wd.isToday ? 'today-col' : ''}`;
            slot.setAttribute('data-date', wd.dateStr);
            slot.setAttribute('data-testid', `week-allday-${wd.dateStr}`);

            const allDayEvents = visibleEvents.filter(ev => ev.date === wd.dateStr && (ev.is_all_day || !ev.time));
            allDayEvents.forEach(ev => {
                const pill = document.createElement('div');
                pill.className = `day-event-pill cat-${ev.category || 'meeting'}`;
                pill.setAttribute('data-testid', 'calendar-event-pill');
                const projName = getProjectName(ev.folder_id);
                const prefix = projName ? `[${projName}] ` : '';
                pill.innerText = `${prefix}${ev.title}`;
                pill.addEventListener('click', (e) => {
                    e.stopPropagation();
                    openEditModal(ev);
                });
                slot.appendChild(pill);
            });

            slot.addEventListener('click', () => {
                openModal(wd.dateStr, wd.displayDate, '12:00', true);
            });

            allDayRow.appendChild(slot);
        });
        weekBody.appendChild(allDayRow);

        const HOUR_HEIGHT = 56;

        function timeToMinutes(tStr) {
            if (!tStr || !tStr.includes(':')) return 0;
            const [h, m] = tStr.split(':').map(Number);
            return h * 60 + m;
        }

        function layoutDayEvents(dayEvents) {
            const prepared = dayEvents.map(ev => {
                const startMin = timeToMinutes(ev.time || '12:00');
                let endMin = ev.end_time ? timeToMinutes(ev.end_time) : startMin + 60;
                if (endMin <= startMin) endMin = Math.min(24 * 60, startMin + 60);
                return { ev, startMin, endMin, colIndex: 0, totalCols: 1 };
            });

            prepared.sort((a, b) => a.startMin - b.startMin || b.endMin - a.endMin);

            let clusters = [];
            let currentCluster = [];
            let clusterMaxEnd = -1;

            prepared.forEach(item => {
                if (currentCluster.length === 0 || item.startMin < clusterMaxEnd) {
                    currentCluster.push(item);
                    clusterMaxEnd = Math.max(clusterMaxEnd, item.endMin);
                } else {
                    clusters.push(currentCluster);
                    currentCluster = [item];
                    clusterMaxEnd = item.endMin;
                }
            });
            if (currentCluster.length > 0) clusters.push(currentCluster);

            clusters.forEach(cluster => {
                const colEndTimes = [];
                cluster.forEach(item => {
                    let placedCol = -1;
                    for (let c = 0; c < colEndTimes.length; c++) {
                        if (colEndTimes[c] <= item.startMin) {
                            placedCol = c;
                            colEndTimes[c] = item.endMin;
                            break;
                        }
                    }
                    if (placedCol === -1) {
                        placedCol = colEndTimes.length;
                        colEndTimes.push(item.endMin);
                    }
                    item.colIndex = placedCol;
                });

                const totalCols = colEndTimes.length;
                cluster.forEach(item => {
                    item.totalCols = totalCols;
                });
            });

            return prepared;
        }

        const timelineGrid = document.createElement('div');
        timelineGrid.className = 'week-timeline-grid';

        const timesCol = document.createElement('div');
        timesCol.className = 'week-times-column';
        for (let hour = 0; hour < 24; hour++) {
            const hourStr = String(hour).padStart(2, '0');
            const timeCell = document.createElement('div');
            timeCell.className = 'week-time-cell';
            timeCell.innerText = `${hourStr}:00`;
            timesCol.appendChild(timeCell);
        }
        timelineGrid.appendChild(timesCol);

        weekDays.forEach(wd => {
            const dayCol = document.createElement('div');
            dayCol.className = `week-day-column ${wd.isToday ? 'today-col' : ''}`;
            dayCol.setAttribute('data-date', wd.dateStr);

            for (let hour = 0; hour < 24; hour++) {
                const hourStr = String(hour).padStart(2, '0');
                const bgSlot = document.createElement('div');
                bgSlot.className = 'week-hour-bg';
                bgSlot.setAttribute('data-date', wd.dateStr);
                bgSlot.setAttribute('data-time', `${hourStr}:00`);
                bgSlot.setAttribute('data-testid', `week-slot-${wd.dateStr}-${hourStr}`);
                bgSlot.addEventListener('click', () => {
                    openModal(wd.dateStr, wd.displayDate, `${hourStr}:00`);
                });
                dayCol.appendChild(bgSlot);
            }

            const timedDayEvents = visibleEvents.filter(ev => ev.date === wd.dateStr && !ev.is_all_day && ev.time);
            const positionedEvents = layoutDayEvents(timedDayEvents);

            positionedEvents.forEach(({ ev, startMin, endMin, colIndex, totalCols }) => {
                const topPx = (startMin / 60) * HOUR_HEIGHT;
                const heightPx = Math.max(22, ((endMin - startMin) / 60) * HOUR_HEIGHT - 2);

                const block = document.createElement('div');
                block.className = `week-event-block cat-${ev.category || 'meeting'}`;
                block.setAttribute('data-testid', 'calendar-event-pill');
                block.style.top = `${topPx}px`;
                block.style.height = `${heightPx}px`;
                block.style.width = `calc((100% - 4px) / ${totalCols})`;
                block.style.left = `calc(2px + ((100% - 4px) * ${colIndex} / ${totalCols}))`;

                const projName = getProjectName(ev.folder_id);
                const prefix = projName ? `[${projName}] ` : '';

                block.innerHTML = `
                    <div class="week-event-time">${formatEventTime(ev)}</div>
                    <div class="week-event-title">${prefix}${ev.title}</div>
                `;
                block.title = `${formatEventTime(ev)} | ${prefix}${ev.title}${ev.description ? '\n' + ev.description : ''}`;

                block.addEventListener('click', (e) => {
                    e.stopPropagation();
                    openEditModal(ev);
                });

                dayCol.appendChild(block);
            });

            timelineGrid.appendChild(dayCol);
        });

        weekBody.appendChild(timelineGrid);

        if (prevScroll > 0) {
            weekBody.scrollTop = prevScroll;
        } else {
            weekBody.scrollTop = 8 * HOUR_HEIGHT;
        }
    }

    function renderCalendar() {
        if (currentView === 'week') {
            calendarGrid.style.display = 'none';
            weekViewContainer.style.display = 'flex';
            renderWeekView();
            return;
        }

        calendarGrid.style.display = 'grid';
        weekViewContainer.style.display = 'none';

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
                pill.setAttribute('data-testid', 'calendar-event-pill');
                const projName = getProjectName(ev.folder_id);
                const prefix = projName ? `[${projName}] ` : '';
                const timePrefix = (ev.is_all_day || !ev.time) ? '' : `${formatEventTime(ev)} `;
                pill.innerText = `${prefix}${timePrefix}${ev.title}`;
                pill.addEventListener('click', (e) => {
                    e.stopPropagation();
                    openEditModal(ev);
                });
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
            const shortDesc = ev.description
                ? (ev.description.length > 20 ? `${ev.description.slice(0, 20)}...` : ev.description)
                : '';
            const card = document.createElement('div');
            card.className = `event-card border-${ev.category || 'meeting'}`;
            card.setAttribute('data-testid', 'event-card');
            
            card.innerHTML = `
                <div class="event-header-row">
                    <span class="event-date">${ev.date} | ${formatEventTime(ev)}</span>
                    <span class="event-badge ${badgeInfo.urgent ? 'urgent' : ''}">${badgeInfo.text}</span>
                </div>
                <div class="event-title">${ev.title}</div>
                <div style="font-size: 0.78rem; color: #3182ce; font-weight: bold; margin-bottom: 4px;">
                    ${t('project_prefix')} ${projName}
                </div>
                ${shortDesc ? `<div class="event-desc" title="${ev.description.replace(/"/g, '&quot;')}">${shortDesc}</div>` : ''}
                <div class="event-actions">
                    <button type="button" class="edit-event-btn" data-testid="edit-event-btn" data-id="${ev.id}">${t('edit_btn')}</button>
                    <button type="button" class="delete-event-btn" data-testid="delete-event-btn" data-id="${ev.id}">${t('delete_btn')}</button>
                </div>
            `;

            card.querySelector('.edit-event-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                openEditModal(ev);
            });

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
        renderCalendar();
        renderEventsSidebar();
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

        populateProjectSelects();
        allEvents = await cleanupExpiredEvents(allEvents, token);
        renderCalendar();
        renderEventsSidebar();
        closeSettingsModal();
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

    viewMonthBtn.addEventListener('click', () => {
        currentView = 'month';
        viewMonthBtn.classList.add('active');
        viewWeekBtn.classList.remove('active');
        renderCalendar();
    });

    viewWeekBtn.addEventListener('click', () => {
        currentView = 'week';
        viewWeekBtn.classList.add('active');
        viewMonthBtn.classList.remove('active');
        renderCalendar();
    });

    prevMonthBtn.addEventListener('click', () => {
        if (currentView === 'week') {
            currentDate.setDate(currentDate.getDate() - 7);
        } else {
            currentDate.setMonth(currentDate.getMonth() - 1);
        }
        renderCalendar();
    });

    nextMonthBtn.addEventListener('click', () => {
        if (currentView === 'week') {
            currentDate.setDate(currentDate.getDate() + 7);
        } else {
            currentDate.setMonth(currentDate.getMonth() + 1);
        }
        renderCalendar();
    });

    async function init() {
        await fetchProjects();
        await fetchEvents();
    }

    init();
});