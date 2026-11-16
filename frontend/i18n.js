const translations = {
    pl: {
        app_title: "ToDoApp & Planer",
        calendar_tab: "Kalendarz",
        my_projects: "Moje Projekty",
        my_projects_title: "Moje Projekty (Foldery)",
        no_projects: "Nie masz jeszcze żadnych projektów (folderów). Utwórz pierwszy powyżej!",
        folder_subtitle: "Folder projektu",
        all_events: "Wszystkie wydarzenia",
        personal_only: "Tylko osobiste",
        new_project: "+ Nowy Projekt",
        logged_in: "Zalogowany",
        settings: "Ustawienia",
        logout: "Wyloguj",
        prev_month: "< Poprzedni",
        next_month: "Następny >",
        upcoming_events: "Nadchodzące Wydarzenia",
        no_events: "Brak zaplanowanych wydarzeń w tym widoku.",
        personal_event: "Wydarzenie osobiste",
        project_prefix: "Projekt:",
        project_select_prefix: "Projekt:",
        delete_btn: "Usuń",
        today: "Dzisiaj",
        tomorrow: "Jutro",
        days_ago: "dni temu",
        in_days: "Za",
        days: "dni",
        all_day: "Cały dzień",
        add_event_title: "Dodaj wydarzenie",
        project_label: "Projekt (opcjonalnie)",
        no_project_opt: "Brak projektu",
        event_name_label: "Nazwa wydarzenia",
        event_title_ph: "Np. Demo projektu",
        event_time_label: "Godzina",
        event_cat_label: "Typ wydarzenia",
        cat_meeting: "Spotkanie",
        cat_deadline: "Deadline / Ważne",
        cat_other: "Inne / Zadanie",
        event_desc_label: "Opis / Dodatkowe informacje",
        event_desc_ph: "Szczegóły wydarzenia...",
        cancel_btn: "Anuluj",
        save_event_btn: "Zapisz datę",
        create_project_title: "Utwórz nowy projekt",
        project_name_label: "Nazwa projektu",
        project_name_ph: "Np. Aplikacja Webowa, Wyjazd...",
        create_project_btn: "Utwórz projekt",
        login_title: "Logowanie",
        username_label: "Nazwa użytkownika",
        username_ph: "Wpisz login",
        email_label: "Adres e-mail",
        email_ph: "Wpisz e-mail",
        password_label: "Hasło",
        password_ph: "Wpisz hasło",
        login_btn: "Zaloguj się",
        no_account: "Nie masz konta?",
        register_link: "Zarejestruj się",
        register_title: "Rejestracja",
        register_btn: "Utwórz konto",
        have_account: "Masz już konto?",
        login_link: "Zaloguj się",
        login_error: "Błędny login lub hasło.",
        register_error: "Nie udało się utworzyć konta. Sprawdź dane.",
        server_error: "Błąd połączenia z serwerem.",
        months: [
            "Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec",
            "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"
        ],
        days_short: ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Nied"]
    },
    en: {
        app_title: "ToDoApp & Planner",
        calendar_tab: "Calendar",
        my_projects: "My Projects",
        my_projects_title: "My Projects (Folders)",
        no_projects: "You don't have any projects (folders) yet. Create your first one above!",
        folder_subtitle: "Project folder",
        all_events: "All events",
        personal_only: "Personal only",
        new_project: "New Project",
        logged_in: "Logged in",
        settings: "Settings",
        logout: "Logout",
        prev_month: "< Previous",
        next_month: "Next >",
        upcoming_events: "Upcoming Events",
        no_events: "No scheduled events in this view.",
        personal_event: "Personal event",
        project_prefix: "Project:",
        project_select_prefix: "Project:",
        delete_btn: "Delete",
        today: "Today",
        tomorrow: "Tomorrow",
        days_ago: "days ago",
        in_days: "In",
        days: "days",
        all_day: "All day",
        add_event_title: "Add event",
        project_label: "Project (optional)",
        no_project_opt: "No project",
        event_name_label: "Event title",
        event_title_ph: "E.g. Project Demo",
        event_time_label: "Time",
        event_cat_label: "Event category",
        cat_meeting: "Meeting",
        cat_deadline: "Deadline / Urgent",
        cat_other: "Other / Task (Green)",
        event_desc_label: "Description / Details",
        event_desc_ph: "Event details...",
        cancel_btn: "Cancel",
        save_event_btn: "Save date",
        create_project_title: "Create new project",
        project_name_label: "Project name",
        project_name_ph: "E.g. Web App, Trip...",
        create_project_btn: "Create project",
        login_title: "Sign In",
        username_label: "Username",
        username_ph: "Enter username",
        email_label: "Email address",
        email_ph: "Enter email",
        password_label: "Password",
        password_ph: "Enter password",
        login_btn: "Sign In",
        no_account: "Don't have an account?",
        register_link: "Sign Up",
        register_title: "Sign Up",
        register_btn: "Create Account",
        have_account: "Already have an account?",
        login_link: "Sign In",
        login_error: "Invalid username or password.",
        register_error: "Could not create account. Check your data.",
        server_error: "Server connection error.",
        months: [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ],
        days_short: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    }
};

function getCurrentLang() {
    return localStorage.getItem('app_lang') || 'pl';
}

function setCurrentLang(lang) {
    localStorage.setItem('app_lang', lang);
    applyTranslations();
}

function t(key) {
    const lang = getCurrentLang();
    return translations[lang][key] || key;
}

function applyTranslations() {
    const lang = getCurrentLang();
    document.documentElement.lang = lang;

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang][key]) {
            el.innerText = translations[lang][key];
        }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (translations[lang][key]) {
            el.placeholder = translations[lang][key];
        }
    });

    const dayHeaders = document.querySelectorAll('.calendar-day-name');
    if (dayHeaders.length === 7) {
        dayHeaders.forEach((el, idx) => {
            el.innerText = translations[lang].days_short[idx];
        });
    }

    const switcher = document.getElementById('lang-switcher');
    if (switcher) {
        switcher.value = lang;
    }
}