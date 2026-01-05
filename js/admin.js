class AdminPanel {
    constructor() {
        this.clientId = 'Ov23liPIpQgvhqpl1zAg';
        this.redirectUri = window.location.origin + '/admin.html';
        this.apiBase = '/api';
        this.isAuthenticated = false;
        this.currentUser = null;
        this.configs = [];
        this.macros = [];
        this.currentTab = 'configs';
        
        this.init();
    }

    async init() {
        this.checkAuth();
        this.bindEvents();
        
        // Обрабатываем callback только если есть код в URL
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        
        if (code) {
            await this.handleAuthCallback();
        } else if (this.isAuthenticated) {
            await this.loadConfigs();
            this.showAdminPanel();
        }
    }

    checkAuth() {
        const token = localStorage.getItem('github_access_token');
        const user = localStorage.getItem('github_user');
        const expiry = localStorage.getItem('token_expiry');
        
        if (token && user && expiry && Date.now() < parseInt(expiry)) {
            this.isAuthenticated = true;
            this.currentUser = JSON.parse(user);
            return true;
        }
        return false;
    }

    bindEvents() {
        const loginBtn = document.getElementById('loginBtn');
        const configForm = document.getElementById('configForm');
        const macroForm = document.getElementById('macroForm');
        const cancelEdit = document.getElementById('cancelEdit');
        const cancelMacroEdit = document.getElementById('cancelMacroEdit');
        
        if (loginBtn) loginBtn.addEventListener('click', () => this.login());
        if (configForm) configForm.addEventListener('submit', (e) => this.handleConfigSubmit(e));
        if (macroForm) macroForm.addEventListener('submit', (e) => this.handleMacroSubmit(e));
        if (cancelEdit) cancelEdit.addEventListener('click', () => this.resetForm('config'));
        if (cancelMacroEdit) cancelMacroEdit.addEventListener('click', () => this.resetForm('macro'));
        
        // Обработчики вкладок
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });
    }

    login() {
        const authUrl = `https://github.com/login/oauth/authorize?client_id=${this.clientId}&redirect_uri=${this.redirectUri}&scope=repo`;
        window.location.href = authUrl;
    }

    async handleAuthCallback() {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        
        if (!code) {
            console.log('No code found in URL');
            return;
        }

        console.log('Processing auth callback with code:', code);

        try {
            const response = await fetch(`${this.apiBase}/auth/callback?code=${encodeURIComponent(code)}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.access_token) {
                console.log('Auth successful, saving token');
                
                localStorage.setItem('github_access_token', data.access_token);
                localStorage.setItem('github_user', JSON.stringify(data.user));
                localStorage.setItem('token_expiry', (Date.now() + 3600000).toString());
                
                // Очищаем URL от параметра code
                window.history.replaceState({}, document.title, window.location.pathname);
                
                this.isAuthenticated = true;
                this.currentUser = data.user;
                this.showAdminPanel();
                await this.loadConfigs();
                
            } else if (data.error) {
                console.error('Auth error from server:', data.error);
                alert('Ошибка авторизации: ' + data.error);
                this.logout();
            } else {
                throw new Error('No access token received');
            }
            
        } catch (error) {
            console.error('Auth callback error:', error);
            alert('Ошибка авторизации: ' + error.message);
            this.logout();
        }
    }

    showAdminPanel() {
        const loginSection = document.getElementById('loginSection');
        const adminSection = document.getElementById('adminSection');
        
        if (loginSection) loginSection.style.display = 'none';
        if (adminSection) adminSection.style.display = 'block';
        
        if (this.currentUser && adminSection) {
            // Удаляем старую информацию о пользователе если есть
            const oldUserInfo = document.querySelector('.user-info');
            if (oldUserInfo) oldUserInfo.remove();
            
            const userInfo = document.createElement('div');
            userInfo.className = 'user-info';
            userInfo.innerHTML = `
                <span>Вы вошли как: <strong>${this.currentUser.login}</strong></span>
                <button onclick="admin.logout()" class="btn-secondary">Выйти</button>
            `;
            adminSection.prepend(userInfo);
        }
    }

    logout() {
        console.log('Logging out');
        localStorage.removeItem('github_access_token');
        localStorage.removeItem('github_user');
        localStorage.removeItem('token_expiry');
        this.isAuthenticated = false;
        this.currentUser = null;
        
        // Показываем кнопку входа
        const loginSection = document.getElementById('loginSection');
        const adminSection = document.getElementById('adminSection');
        
        if (loginSection) loginSection.style.display = 'block';
        if (adminSection) adminSection.style.display = 'none';
        
        // Очищаем URL на всякий случай
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    switchTab(tabName) {
        this.currentTab = tabName;
        
        // Обновляем активные вкладки
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });
        
        // Показываем/скрываем контент
        document.getElementById('configsTab').style.display = tabName === 'configs' ? 'block' : 'none';
        document.getElementById('macrosTab').style.display = tabName === 'macros' ? 'block' : 'none';
        
        // Загружаем данные если нужно
        if (tabName === 'macros' && this.macros.length === 0) {
            this.loadMacros();
        }
    }

    async loadConfigs() {
        try {
            console.log('Loading configs...');
            const response = await fetch('configs/configs.json');
            if (!response.ok) {
                throw new Error(`Failed to load configs: ${response.status}`);
            }
            const data = await response.json();
            this.configs = data.configs || [];
            this.renderConfigsList();
            console.log('Configs loaded:', this.configs.length);
        } catch (error) {
            console.error('Error loading configs:', error);
        }
    }

    renderConfigsList() {
        const container = document.getElementById('configsList');
        if (!container) {
                        console.warn('Configs list container not found');
            return;
        }

        if (this.configs.length === 0) {
            container.innerHTML = '<p>Конфигов пока нет</p>';
            return;
        }

        container.innerHTML = this.configs.map(config => `
            <div class="config-item">
                <h4>${this.escapeHtml(config.name)}</h4>
                <p><strong>Аддон:</strong> ${this.escapeHtml(config.addon)} | <strong>Класс:</strong> ${this.escapeHtml(config.class)}</p>
                <p>${this.escapeHtml(config.description)}</p>
                <p><strong>Автор:</strong> ${this.escapeHtml(config.author)}</p>
                <button onclick="admin.editConfig('${this.escapeHtml(config.id)}')" class="btn-primary">Редактировать</button>
                <button onclick="admin.deleteConfig('${this.escapeHtml(config.id)}')" class="btn-danger">Удалить</button>
            </div>
        `).join('');
    }

    async loadMacros() {
        try {
            console.log('Loading macros...');
            const response = await fetch('macros/macros.json');
            if (!response.ok) {
                throw new Error(`Failed to load macros: ${response.status}`);
            }
            const data = await response.json();
            this.macros = data.macros || [];
            this.renderMacrosList();
            console.log('Macros loaded:', this.macros.length);
        } catch (error) {
            console.error('Error loading macros:', error);
        }
    }

    renderMacrosList() {
        const container = document.getElementById('macrosList');
        if (!container) {
            console.warn('Macros list container not found');
            return;
        }

        if (this.macros.length === 0) {
            container.innerHTML = '<p>Макросов пока нет</p>';
            return;
        }

        container.innerHTML = this.macros.map(macro => `
            <div class="config-item">
                <h4>${this.escapeHtml(macro.name)}</h4>
                <p><strong>Класс:</strong> ${this.escapeHtml(macro.class)}</p>
                <p>${this.escapeHtml(macro.description)}</p>
                <p><strong>Автор:</strong> ${this.escapeHtml(macro.author)}</p>
                <pre>${this.escapeHtml(macro.macro)}</pre>
                <button onclick="admin.editMacro('${this.escapeHtml(macro.id)}')" class="btn-primary">Редактировать</button>
                <button onclick="admin.deleteMacro('${this.escapeHtml(macro.id)}')" class="btn-danger">Удалить</button>
            </div>
        `).join('');
    }

    async handleConfigSubmit(e) {
        e.preventDefault();
        
        const accessToken = localStorage.getItem('github_access_token');
        if (!accessToken) {
            alert('Требуется авторизация');
            return;
        }

        const formData = {
            id: document.getElementById('configId').value || this.generateId(),
            name: document.getElementById('configName').value,
            addon: document.getElementById('configAddon').value,
            class: document.getElementById('configClass').value,
            description: document.getElementById('configDescription').value,
            config: document.getElementById('configContent').value,
            author: document.getElementById('configAuthor').value,
            created: new Date().toISOString(),
            screenshot: "blank.png"
        };

        try {
            const action = document.getElementById('configId').value ? 'update' : 'add';
            
            const response = await fetch(`${this.apiBase}/config/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, configData: formData, accessToken })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.success) {
                this.resetForm('config');
                await this.loadConfigs();
                alert('Конфиг успешно сохранен!');
            } else {
                throw new Error(result.error || 'Ошибка сохранения');
            }
        } catch (error) {
            console.error('Error saving config:', error);
            alert('Ошибка при сохранении конфига: ' + error.message);
        }
    }

    async handleMacroSubmit(e) {
        e.preventDefault();
        
        const accessToken = localStorage.getItem('github_access_token');
        if (!accessToken) {
            alert('Требуется авторизация');
            return;
        }

        const formData = {
            id: document.getElementById('macroId').value || this.generateId(),
            name: document.getElementById('macroName').value,
            class: document.getElementById('macroClass').value,
            description: document.getElementById('macroDescription').value,
            macro: document.getElementById('macroContent').value,
            author: document.getElementById('macroAuthor').value,
            created: new Date().toISOString()
        };

        try {
            const action = document.getElementById('macroId').value ? 'update' : 'add';
            
            const response = await fetch(`${this.apiBase}/macro/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, macroData: formData, accessToken })
            });

            const result = await response.json();
            
            if (result.success) {
                this.resetForm('macro');
                await this.loadMacros();
                alert('Макрос успешно сохранен!');
            } else {
                throw new Error(result.error || 'Ошибка сохранения');
            }
        } catch (error) {
            console.error('Error saving macro:', error);
            alert('Ошибка при сохранении макроса: ' + error.message);
        }
    }

    generateId() {
        return `config-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    editConfig(configId) {
        const config = this.configs.find(c => c.id === configId);
        if (!config) {
            alert('Конфиг не найден');
            return;
        }

        document.getElementById('configId').value = config.id;
        document.getElementById('configName').value = config.name;
        document.getElementById('configAddon').value = config.addon;
        document.getElementById('configClass').value = config.class;
        document.getElementById('configDescription').value = config.description;
        document.getElementById('configContent').value = config.config;
        document.getElementById('configAuthor').value = config.author;
        
        document.getElementById('formTitle').textContent = 'Редактировать конфиг';
        
        // Прокручиваем к форме
        document.getElementById('configForm').scrollIntoView({ behavior: 'smooth' });
    }

    editMacro(macroId) {
        const macro = this.macros.find(m => m.id === macroId);
        if (!macro) {
            alert('Макрос не найден');
            return;
        }

        document.getElementById('macroId').value = macro.id;
        document.getElementById('macroName').value = macro.name;
        document.getElementById('macroClass').value = macro.class;
        document.getElementById('macroDescription').value = macro.description;
        document.getElementById('macroContent').value = macro.macro;
        document.getElementById('macroAuthor').value = macro.author;
        
        document.getElementById('macroFormTitle').textContent = 'Редактировать макрос';
        
        // Переключаемся на вкладку макросов если нужно
        if (this.currentTab !== 'macros') {
            this.switchTab('macros');
        }
        
        document.getElementById('macroForm').scrollIntoView({ behavior: 'smooth' });
    }

    async deleteConfig(configId) {
        if (!confirm('Вы уверены, что хотите удалить этот конфиг?')) return;

        const accessToken = localStorage.getItem('github_access_token');
        if (!accessToken) {
            alert('Требуется авторизация');
            return;
        }

        const config = this.configs.find(c => c.id === configId);
        if (!config) {
            alert('Конфиг не найден');
            return;
        }

        try {
            const response = await fetch(`${this.apiBase}/config/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'delete',
                    configData: config,
                    accessToken: accessToken
                })
            });

            const result = await response.json();
            
            if (result.success) {
                await this.loadConfigs();
                alert('Конфиг удален!');
            } else {
                throw new Error(result.error || 'Ошибка удаления');
            }
        } catch (error) {
            console.error('Error deleting config:', error);
            alert('Ошибка при удалении конфига: ' + error.message);
        }
    }

    async deleteMacro(macroId) {
        if (!confirm('Вы уверены, что хотите удалить этот макрос?')) return;

        const accessToken = localStorage.getItem('github_access_token');
                if (!accessToken) {
            alert('Требуется авторизация');
            return;
        }

        const macro = this.macros.find(m => m.id === macroId);
        if (!macro) {
            alert('Макрос не найден');
            return;
        }

        try {
            const response = await fetch(`${this.apiBase}/macro/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'delete',
                    macroData: macro,
                    accessToken: accessToken
                })
            });

            const result = await response.json();
            
            if (result.success) {
                await this.loadMacros();
                alert('Макрос удален!');
            } else {
                throw new Error(result.error || 'Ошибка удаления');
            }
        } catch (error) {
            console.error('Error deleting macro:', error);
            alert('Ошибка при удалении макроса: ' + error.message);
        }
    }

    resetForm(type = 'config') {
        if (type === 'config') {
            document.getElementById('configForm').reset();
            document.getElementById('configId').value = '';
            document.getElementById('formTitle').textContent = 'Добавить конфиг';
        } else {
            document.getElementById('macroForm').reset();
            document.getElementById('macroId').value = '';
            document.getElementById('macroFormTitle').textContent = 'Добавить макрос';
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Инициализация админ-панели
let admin;

document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin page loaded');
    admin = new AdminPanel();
    
    // Добавляем глобально для кнопок
    window.admin = admin;
});

// Простая функция для отладки - проверяет доступность API
async function checkApiHealth() {
    try {
        const response = await fetch('/api/auth/callback');
        console.log('API health check:', response.status);
        return response.ok;
    } catch (error) {
        console.error('API health check failed:', error);
        return false;
    }
}

// Запускаем проверку при загрузке
setTimeout(checkApiHealth, 1000);
