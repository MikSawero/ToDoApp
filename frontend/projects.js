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

    let allProjects = [];

    langSwitcher.addEventListener('change', (e) => {
        setCurrentLang(e.target.value);
        renderProjects();
    });

    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('username');
        window.location.href = 'login.html';
    });

    function renderProjects() {
        projectsGrid.innerHTML = '';

        if (allProjects.length === 0) {
            projectsGrid.innerHTML = `<p data-testid="no-projects-msg" style="color: #718096; font-size: 0.95rem;">${t('no_projects')}</p>`;
            return;
        }

        allProjects.forEach(proj => {
            const card = document.createElement('div');
            card.className = 'project-card';
            card.setAttribute('data-testid', 'project-card');
            card.setAttribute('data-folder-id', proj.id);

            card.innerHTML = `
                <div class="project-card-info">
                    <span class="project-card-icon">📁</span>
                    <div>
                        <div class="project-card-title" data-testid="project-card-name">${proj.name}</div>
                        <div class="project-card-sub">${t('folder_subtitle')}</div>
                    </div>
                </div>
                <button type="button" class="delete-project-btn" data-testid="delete-project-btn" data-id="${proj.id}">${t('delete_btn')}</button>
            `;

            card.querySelector('.delete-project-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                deleteProject(proj.id);
            });

            projectsGrid.appendChild(card);
        });
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
        renderProjects();
    }

    async function deleteProject(id) {
        try {
            const response = await fetch(`http://localhost:8000/api/v1/folders/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                await fetchProjects();
                return;
            }
        } catch (error) {
            console.error(error);
        }
        allProjects = allProjects.filter(p => Number(p.id) !== Number(id));
        localStorage.setItem('fallback_projects', JSON.stringify(allProjects));
        renderProjects();
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
                await fetchProjects();
            } else {
                const fallbackProj = { id: Date.now(), name: name };
                allProjects.push(fallbackProj);
                localStorage.setItem('fallback_projects', JSON.stringify(allProjects));
                renderProjects();
            }
        } catch (error) {
            const fallbackProj = { id: Date.now(), name: name };
            allProjects.push(fallbackProj);
            localStorage.setItem('fallback_projects', JSON.stringify(allProjects));
            renderProjects();
        }

        closeProjectModal();
    });

    fetchProjects();
});
