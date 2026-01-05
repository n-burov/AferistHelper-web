class AdminPanel {
    constructor() {
        this.clientId = 'ваш_client_id_здесь'; // ЗАМЕНИТЕ НА РЕАЛЬНЫЙ
        this.redirectUri = window.location.origin + '/admin.html';
        this.apiBase = '/api';
        this.isAuthenticated = false;
        this.currentUser = null;
        this.configs = [];
        
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
        const cancelEdit = document.getElementById('cancelEdit');
        
        if (loginBtn) loginBtn.addEventListener('click', () => this.login());
        if (configForm) configForm.addEventListener('submit', (e) => this.handleSubmit(e));
        if (cancelEdit) cancelEdit.addEventListener('click', () => this.resetForm());
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
            // Не показываем alert, чтобы не мешать пользователю
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

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    async handleSubmit(e) {
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
            role: document.getElementById('configRole').value,
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
                this.resetForm();
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
        document.getElementById('configRole').value = config.role;
        document.getElementById('configDescription').value = config.description;
        document.getElementById('configContent').value = config.config;
        document.getElementById('configAuthor').value = config.author;
        
        document.getElementById('formTitle').textContent = 'Редактировать конфиг';
        
        // Прокручиваем к форме
        document.getElementById('configForm').scrollIntoView({ behavior: 'smooth' });
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

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

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

    resetForm() {
        document.getElementById('configForm').reset();
        document.getElementById('configId').value = '';
        document.getElementById('formTitle').textContent = 'Добавить конфиг';
    }
}

// Инициализация админ-панели
let admin;

document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin page loaded');
    admin = new AdminPanel();
    
    // Добавляем глобально для кнопок
    window.admin = admin;
    
    // Показываем что страница загрузилась
    const loadingElement = document.querySelector('.loading');
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
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
