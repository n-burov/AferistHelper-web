class AdminPanel {
    constructor() {
        this.clientId = 'ваш_client_id_здесь'; // Замените на реальный Client ID
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
        
        if (this.isAuthenticated) {
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
        } else {
            this.logout();
        }
    }

    bindEvents() {
        document.getElementById('loginBtn')?.addEventListener('click', () => this.login());
        document.getElementById('configForm')?.addEventListener('submit', (e) => this.handleSubmit(e));
        document.getElementById('cancelEdit')?.addEventListener('click', () => this.resetForm());
    }

    login() {
        const authUrl = `https://github.com/login/oauth/authorize?client_id=${this.clientId}&redirect_uri=${this.redirectUri}&scope=repo`;
        window.location.href = authUrl;
    }

    async handleAuthCallback() {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        
        if (!code) return;

        try {
            const response = await fetch(`${this.apiBase}/auth/callback?code=${code}`);
            const data = await response.json();
            
            if (data.access_token) {
                localStorage.setItem('github_access_token', data.access_token);
                localStorage.setItem('github_user', JSON.stringify(data.user));
                localStorage.setItem('token_expiry', (Date.now() + 3600000).toString());
                
                window.history.replaceState({}, document.title, window.location.pathname);
                
                this.isAuthenticated = true;
                this.currentUser = data.user;
                this.showAdminPanel();
                await this.loadConfigs();
            } else {
                throw new Error(data.error || 'Auth failed');
            }
        } catch (error) {
            console.error('Auth error:', error);
            alert('Ошибка авторизации: ' + error.message);
            this.logout();
        }
    }

    showAdminPanel() {
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('adminSection').style.display = 'block';
        
        if (this.currentUser) {
            const userInfo = document.createElement('div');
            userInfo.className = 'user-info';
            userInfo.innerHTML = `
                <span>Вы вошли как: <strong>${this.currentUser.login}</strong></span>
                <button onclick="admin.logout()" class="btn-secondary">Выйти</button>
            `;
            document.getElementById('adminSection').prepend(userInfo);
        }
    }

    logout() {
        localStorage.removeItem('github_access_token');
        localStorage.removeItem('github_user');
        localStorage.removeItem('token_expiry');
        this.isAuthenticated = false;
        this.currentUser = null;
        window.location.reload();
    }

    async loadConfigs() {
        try {
            const response = await fetch('configs/configs.json');
            const data = await response.json();
            this.configs = data.configs || [];
            this.renderConfigsList();
        } catch (error) {
            console.error('Error loading configs:', error);
        }
    }

    renderConfigsList() {
        const container = document.getElementById('configsList');
        if (!container) return;

        container.innerHTML = this.configs.map(config => `
            <div class="config-item">
                <h4>${config.name}</h4>
                <p><strong>Аддон:</strong> ${config.addon} | <strong>Класс:</strong> ${config.class}</p>
                <p>${config.description}</p>
                <p><strong>Автор:</strong> ${config.author}</p>
                <button onclick="admin.editConfig('${config.id}')" class="btn-primary">Редактировать</button>
                <button onclick="admin.deleteConfig('${config.id}')" class="btn-danger">Удалить</button>
            </div>
        `).join('');
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
        if (!config) return;

        document.getElementById('configId').value = config.id;
        document.getElementById('configName').value = config.name;
        document.getElementById('configAddon').value = config.addon;
        document.getElementById('configClass').value = config.class;
        document.getElementById('configRole').value = config.role;
        document.getElementById('configDescription').value = config.description;
        document.getElementById('configContent').value = config.config;
        document.getElementById('configAuthor').value = config.author;
        
        document.getElementById('formTitle').textContent = 'Редактировать конфиг';
    }

    async deleteConfig(configId) {
        if (!confirm('Вы уверены, что хотите удалить этот конфиг?')) return;

        const accessToken = localStorage.getItem('github_access_token');
        if (!accessToken) {
            alert('Требуется авторизация');
            return;
        }

        const config = this.configs.find(c => c.id === configId);
        if (!config) return;

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

    resetForm() {
        document.getElementById('configForm').reset();
        document.getElementById('configId').value = '';
        document.getElementById('formTitle').textContent = 'Добавить конфиг';
    }
}

// Инициализация админ-панели
const admin = new AdminPanel();

// Обработка callback при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
        admin.handleAuthCallback();
    }
});
