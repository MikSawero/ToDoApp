document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    const logoutBtn = document.getElementById('logout-btn');
    const calendarGrid = document.getElementById('calendar-grid');
    const monthYearTitle = document.getElementById('month-year-title');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    const eventsList = document.getElementById('upcoming-events-list');

    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('access_token');
        window.location.href = 'login.html';
    });

    let currentDate = new Date(2026, 10, 1); 

    function renderCalendar() {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const monthNames = [
            "Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec",
            "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"
        ];
        monthYearTitle.innerText = `${monthNames[month]} ${year}`;

        while (calendarGrid.children.length > 7) {
            calendarGrid.removeChild(calendarGrid.lastChild);
        }

        const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;
        const totalDays = new Date(year, month + 1, 0).getDate();

        for (let i = 0; i < firstDayIndex; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'calendar-cell empty';
            calendarGrid.appendChild(emptyCell);
        }

        for (let day = 1; day <= totalDays; day++) {
            const cell = document.createElement('div');
            cell.className = 'calendar-cell';
            cell.setAttribute('data-testid', `calendar-day-${day}`);
            
            const dayNum = document.createElement('div');
            dayNum.className = 'day-number';
            dayNum.innerText = day;
            cell.appendChild(dayNum);

            cell.addEventListener('click', () => {
                const eventTitle = prompt(`Dodaj wydarzenie na dzień ${day} ${monthNames[month]} ${year}:`);
                if (eventTitle) {
                    createEvent(year, month + 1, day, eventTitle);
                }
            });

            calendarGrid.appendChild(cell);
        }
    }

    async function fetchEvents() {
        try {
            const response = await fetch('http://localhost:8000/api/v1/events/', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const events = await response.json();
                renderEvents(events);
            } else if (response.status === 401) {
                localStorage.removeItem('access_token');
                window.location.href = 'login.html';
            }
        } catch (error) {
            console.error(error);
        }
    }

    function renderEvents(events) {
        eventsList.innerHTML = '';
        if (events.length === 0) {
            eventsList.innerHTML = '<p style="color: #718096; font-size: 0.9rem;">Brak nadchodzących wydarzeń.</p>';
            return;
        }

        events.forEach(ev => {
            const card = document.createElement('div');
            card.className = 'event-card';
            card.setAttribute('data-testid', 'event-card');
            card.innerHTML = `
                <div class="event-date">${ev.date || 'Brak daty'}</div>
                <div class="event-title">${ev.title}</div>
            `;
            eventsList.appendChild(card);
        });
    }

    async function createEvent(year, month, day, title) {
        const formattedMonth = String(month).padStart(2, '0');
        const formattedDay = String(day).padStart(2, '0');
        const dateStr = `${year}-${formattedMonth}-${formattedDay}`;

        try {
            const response = await fetch('http://localhost:8000/api/v1/events/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ title: title, date: dateStr })
            });

            if (response.ok) {
                fetchEvents();
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

    renderCalendar();
    fetchEvents();
});