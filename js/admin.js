class AdminPanel {
    constructor() {
        this.clientId = 'Ov23liPIpQgvhqpl1zAg';
        this.redirectUri = window.location.origin + '/admin.html';
        this.apiBase = '/api';
        this.isAuthenticated = false;
        this.currentUser = null;
        this.configs = [];
        this.macros = [];
        this.addons = [];
        this.guides = [];
        this.currentTab = 'configs';
        
        this.init();
    }

    async init() {
        this.checkAuth();
        this.bindEvents();
        
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
        const macroForm = document.getElementById('macroForm'); // ← ЭТА СТРОЧКА ДОЛЖНА БЫТЬ
        const addonForm = document.getElementById('addonForm');
        const cancelEdit = document.getElementById('cancelEdit');
        const cancelMacroEdit = document.getElementById('cancelMacroEdit');
        const cancelAddonEdit = document.getElementById('cancelAddonEdit');
        const guideForm = document.getElementById('guideForm');
        const cancelGuideEdit = document.getElementById('cancelGuideEdit');
        
        if (loginBtn) loginBtn.addEventListener('click', () => this.login());
        if (configForm) configForm.addEventListener('submit', (e) => this.handleConfigSubmit(e));
        if (macroForm) macroForm.addEventListener('submit', (e) => this.handleMacroSubmit(e));
        if (addonForm) addonForm.addEventListener('submit', (e) => this.handleAddonSubmit(e));
        if (guideForm) guideForm.addEventListener('submit', (e) => this.handleGuideSubmit(e));
        if (cancelEdit) cancelEdit.addEventListener('click', () => this.resetForm('config'));
        if (cancelMacroEdit) cancelMacroEdit.addEventListener('click', () => this.resetForm('macro'));
        if (cancelAddonEdit) cancelAddonEdit.addEventListener('click', () => this.resetForm('addon'));
        if (cancelGuideEdit) cancelGuideEdit.addEventListener('click', () => this.resetForm('guide'));
        
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
        
        if (!code) return;

        try {
            const response = await fetch(`${this.apiBase}/auth/callback?code=${encodeURIComponent(code)}`);
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

    switchTab(tabName) {
        this.currentTab = tabName;
        
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });
        
        document.getElementById('configsTab').style.display = tabName === 'configs' ? 'block' : 'none';
        document.getElementById('macrosTab').style.display = tabName === 'macros' ? 'block' : 'none';
        document.getElementById('addonsTab').style.display = tabName === 'addons' ? 'block' : 'none';
        document.getElementById('guidesTab').style.display = tabName === 'guides' ? 'block' : 'none';
        
        if (tabName === 'macros' && this.macros.length === 0) {
            this.loadMacros();
        }
        if (tabName === 'addons' && this.addons.length === 0) {
            this.loadAddons();
        }
        if (tabName === 'guides' && this.guides.length === 0) {
            this.loadGuides();
        }
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
                <h4>${this.escapeHtml(config.name)}</h4>
                <p><strong>Аддон:</strong> ${this.escapeHtml(config.addon)} | <strong>Класс:</strong> ${this.escapeHtml(config.class)}</p>
                <p>${this.escapeHtml(config.description)}</p>
                <p><strong>Автор:</strong> ${this.escapeHtml(config.author)}</p>
                ${config.screenshot && config.screenshot !== 'blank.png' ? `
                    <img src="screenshots/${this.escapeHtml(config.screenshot)}" alt="Скриншот" 
                         onerror="this.style.display='none'" style="max-width: 300px;">
                ` : ''}
                <button onclick="admin.editConfig('${this.escapeHtml(config.id)}')" class="btn-primary">Редактировать</button>
                <button onclick="admin.deleteConfig('${this.escapeHtml(config.id)}')" class="btn-danger">Удалить</button>
            </div>
        `).join('');
    }

    async loadMacros() {
        try {
            const response = await fetch('macros/macros.json');
            const data = await response.json();
            this.macros = data.macros || [];
            this.renderMacrosList();
        } catch (error) {
            console.error('Error loading macros:', error);
        }
    }

    async loadAddons() {
        try {
            const response = await fetch('addons/addons.json');
            const data = await response.json();
            this.addons = data.addons || [];
            this.renderAddonsList();
        } catch (error) {
            console.error('Error loading addons:', error);
        }
    }

    async loadGuides() {
        try {
            const response = await fetch('guides/guides.json');
            const data = await response.json();
            this.guides = data.guides || [];
            this.renderGuidesList();
        } catch (error) {
            console.error('Error loading guides:', error);
        }
    }

    renderMacrosList() {
        const container = document.getElementById('macrosList');
        if (!container) return;

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

    renderAddonsList() {
        const container = document.getElementById('addonsList');
        if (!container) return;

        container.innerHTML = this.addons.map(addon => `
            <div class="config-item">
                <h4>${this.escapeHtml(addon.name)}</h4>
                <p><strong>Версия:</strong> ${this.escapeHtml(addon.version)} | <strong>Автор:</strong> ${this.escapeHtml(addon.author)}</p>
                <p>${this.escapeHtml(addon.description)}</p>
                ${addon.downloadUrl ? `<p><strong>Ссылка:</strong> <a href="${this.escapeHtml(addon.downloadUrl)}" target="_blank">${this.escapeHtml(addon.downloadUrl)}</a></p>` : '<p><strong>Статус:</strong> В разработке</p>'}
                <button onclick="admin.editAddon('${this.escapeHtml(addon.id)}')" class="btn-primary">Редактировать</button>
                <button onclick="admin.deleteAddon('${this.escapeHtml(addon.id)}')" class="btn-danger">Удалить</button>
            </div>
        `).join('');
    }

    renderGuidesList() {
        const container = document.getElementById('guidesList');
        if (!container) return;

        container.innerHTML = this.guides.map(guide => `
            <div class="config-item">
                <h4>${this.escapeHtml(guide.title)}</h4>
                <p><strong>Автор:</strong> ${this.escapeHtml(guide.author)}</p>
                <p>${this.escapeHtml(guide.description)}</p>
                <a href="${this.escapeHtml(guide.youtubeUrl)}" target="_blank" class="download-btn">
                    <i class="fab fa-youtube"></i> Смотреть на YouTube
                </a>
                <button onclick="admin.editGuide('${this.escapeHtml(guide.id)}')" class="btn-primary">Редактировать</button>
                <button onclick="admin.deleteGuide('${this.escapeHtml(guide.id)}')" class="btn-danger">Удалить</button>
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
            description: document.getElementById('configDescription').value,
            class: document.getElementById('configClass').value,
            addon: document.getElementById('configAddon').value,
            content: document.getElementById('configContent').value,
            author: document.getElementById('configAuthor').value,
            created: new Date().toISOString()
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
                // Проверяем чекбокс уведомления
                const shouldNotify = document.getElementById('configNotify').checked;
                
                if (shouldNotify) {
                    try {
                        await fetch('/api/telegram/notify', {
                            method: 'POST',
                            headers: { 'Content-Type': '极端的application/json' },
                            body: JSON.stringify({
                                type: 'конфиг',
                                title: formData.name,
                                description: formData.description,
                                url: `${window.location.origin}/index.html`
                            })
                        });
                    } catch (telegramError) {
                        console.error('Telegram notification failed:', telegramError);
                    }
                }
                
                this.resetForm('config');
                await this.loadConfigs();
                alert('Конфиг успешно сохранен!' + (shouldNotify ? ' Уведомление отправлено.' : ''));
            } else {
                throw new Error(result.error || 'Ошибка сохранения');
            }
        } catch (error) {
            console.error('Error saving config:', error);
            alert('Ошибка при сохранении конфига: ' + error.message);
        }
    }

     

    async deleteConfig(configId) {
        if (!confirm('Вы уверены, что хотите удалить этот конфиг?')) return;

        const accessToken = localStorage.getItem('github_access_token');
        if (!accessToken) return;

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

    async deleteMacro(macroId) {
        if (!confirm('Вы уверены, что хотите удалить этот макрос?')) return;

        const accessToken = localStorage.getItem('github_access_token');
        if (!accessToken) return;

        const macro = this.macros.find(m => m.id === macroId);
        if (!macro) return;

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
            document.getElementById('configScreenshot').value = '';
            document.getElementById('formTitle').textContent = 'Добавить конфиг';
        } else if (type === 'macro') {
            document.getElementById('macroForm').reset();
            document.getElementById('macroId').value = '';
            document.getElementById('macroFormTitle').textContent = 'Добавить макрос';
        } else if (type === 'addon') {
            document.getElementById('addonForm').reset();
            document.getElementById('addonId').value = '';
            document.getElementById('addonFormTitle').textContent = 'Добавить аддон';
        } else if (type === 'guide') {
            document.getElementById('guideForm').reset();
            document.getElementById('guideId').value = '';
            document.getElementById('guideFormTitle').textContent = 'Добавить гайд';
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
            description: document.getElementById('macroDescription').value,
            class: document.getElementById('macroClass').value,
            content: document.getElementById('macroContent').value,
            author: document.getElementById('macroAuthor').value,
            created: new Date().toISOString()
        };
    
        try {
            const action = document.getElementById('macroId').value ? '极端的update' : 'add';
            
            const response = await fetch(`${this.apiBase}/macro/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, macroData: formData, accessToken })
            });
    
            const result = await response.json();
            
            if (result.success) {
                // Проверяем чекбокс уведомления
                const shouldNotify = document.getElementById('macroNotify').checked;
                
                if (shouldNotify) {
                    try {
                        await fetch('/极端的api/telegram/notify', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                type: 'макрос',
                                title: formData.name,
                                description: formData.description,
                                url: `${window.location.origin}/macros.html`
                            })
                        });
                    } catch (telegramError) {
                        console.error('Telegram notification failed:', telegramError);
                    }
                }
                
                this.resetForm('macro');
                await this.loadMacros();
                alert('Макрос успешно сохранен!' + (shouldNotify ? ' Уведомление отправлено.' : ''));
            } else {
                throw new Error(result.error || 'Ошибка сохранения');
            }
        } catch (error) {
            console.error('Error saving macro:', error);
            alert('Ошибка при сохранении макроса: ' + error.message);
        }
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    editConfig(configId) {
        const config = this.configs.find(c => c.id === configId);
        if (!config) return;

        document.getElementById('configId').value = config.id;
        document.getElementById('configName').value = config.name;
        document.getElementById('configAddon').value = config.addon;
        document.getElementById('configClass').value = config.class;
        document.getElementById('configDescription').value = config.description;
        document.getElementById('configContent').value = config.config;
        document.getElementById('configScreenshot').value = config.screenshot || '';
        document.getElementById('configAuthor').value = config.author;
        document.getElementById('formTitle').textContent = 'Редактировать конфиг';
    }

    editAddon(addonId) {
        const addon = this.addons.find(a => a.id === addonId);
        if (!addon) return;

        document.getElementById('addonId').value = addon.id;
        document.getElementById('addonName').value = addon.name;
        document.getElementById('addonVersion').value = addon.version;
        document.getElementById('addonDescription').value = addon.description;
        document.getElementById('addonFeatures').value = addon.features.join(', ');
        document.getElementById('addonDownloadUrl').value = addon.downloadUrl || '';
        document.getElementById('addonAuthor').value = addon.author;
        document.getElementById('addonFormTitle').textContent = 'Редактировать аддон';
    }

    editGuide(guideId) {
        const guide = this.guides.find(g => g.id === guideId);
        if (!guide) return;

        document.getElementById('guideId').value = guide.id;
        document.getElementById('guideTitle').value = guide.title;
        document.getElementById('guideDescription').value = guide.description;
        document.getElementById('guideYoutubeUrl').value = guide.youtubeUrl;
        document.getElementById('guideAuthor').value = guide.author;
        
        document.getElementById('guideFormTitle').textContent = 'Редактировать гайд';
    }

    // Метод для обработки отправки формы аддона
    async handleAddonSubmit(e) {
        e.preventDefault();
        
        const accessToken = localStorage.getItem('github_access_token');
        if (!accessToken) {
            alert('Требуется авторизация');
            return;
        }
    
        const formData = {
            id: document.getElementById('addonId').value || this.generateId(),
            name: document.getElementById('addonName').value,
            version: document.getElementById('addonVersion').value,
            description: document.getElementById('addonDescription').value,
            features: document.getElementById('addonFeatures').value.split(',').map(f => f.trim()).filter(f => f),
            downloadUrl: document.getElementById('addonDownloadUrl').value,
            author: document.getElementById('addonAuthor').value,
            created: new Date().toISOString()
        };
    
        try {
            const action = document.getElementById('addonId').value ? 'update' : 'add';
            
            const response = await fetch(`${this.api极端的Base}/addon/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, addonData: formData, accessToken })
            });
    
            const result = await response.json();
            
            if (result.success) {
                // Проверяем чекбокс уведомления
                const shouldNotify = document.getElementById('addonNotify').checked;
                
                if (shouldNotify) {
                    try {
                        await fetch('/api/telegram/notify', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                type: 'аддон',
                                title: formData.name,
                                description: formData.description,
                                url: `${window.location.origin}/addons.html`
                            })
                        });
                    } catch (telegramError) {
                        console.error('Telegram notification failed:', telegramError);
                    }
                }
                
                this.resetForm('addon');
                await this.loadAddons();
                alert('Аддон успешно сохранен!' + (shouldNotify ? ' Уведомление отправлено.' : ''));
            } else {
                throw new Error(result.error || 'Ошибка сохранения');
            }
        } catch (error) {
            console.error('Error saving addon:', error);
            alert('Ошибка при сохранении аддона: ' + error.message);
        }
    }

    async handleGuideSubmit(e) {
        e.preventDefault();
        
        const accessToken = localStorage.getItem('github_access_token');
        if (!accessToken) {
            alert('Требуется авторизация');
            return;
        }
    
        const formData = {
            id: document.getElementById('guideId').value || this.generateId(),
            title: document.getElementById('guideTitle').value,
            description: document.getElementById('guideDescription').value,
            youtubeUrl: document.getElementById('guideYoutubeUrl').value,
            author: document.getElementById('guideAuthor').value,
            created: new Date().toISOString()
        };
    
        try {
            const action = document.getElementById('guideId').value ? 'update' : 'add';
            
            const response = await fetch(`${this.apiBase}/guide/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, guideData: formData, accessToken })
            });
    
            const result = await response.json();
            
            if (result.success) {
                // Проверяем чекбокс уведомления
                const shouldNotify = document.getElementById('guideNotify').checked;
                
                if (shouldNotify) {
                    try {
                        await fetch('/api/telegram/notify', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                type: 'гайд',
                                title: formData.title,
                                description: formData.description,
                                url: `${window.location.origin}/guides.html`
                            })
                        });
                    } catch (telegramError) {
                        console.error('Telegram notification failed:', telegramError);
                    }
                }
                
                this.resetForm('guide');
                await this.loadGuides();
                alert('Гайд успешно сохранен!' + (shouldNotify ? ' Уведомление отправлено.' : ''));
            } else {
                throw new Error(result.error || 'Ошибка сохранения');
            }
        } catch (error) {
            console.error('Error saving guide:', error);
            alert('Ошибка при сохранении гайда: ' + error.message);
        }
    }

    // Метод для удаления аддона
    async deleteAddon(addonId) {
        if (!confirm('Вы уверены, что хотите удалить этот аддон?')) return;

        const accessToken = localStorage.getItem('github_access_token');
        if (!accessToken) return;

        const addon = this.addons.find(a => a.id === addonId);
        if (!addon) return;

        try {
            const response = await fetch(`${this.apiBase}/addon/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'delete',
                    addonData: addon,
                    accessToken: accessToken
                })
            });

            const result = await response.json();
            
            if (result.success) {
                await this.loadAddons();
                alert('Аддон удален!');
            } else {
                throw new Error(result.error || 'Ошибка удаления');
            }
        } catch (error) {
            console.error('Error deleting addon:', error);
            alert('Ошибка при удалении аддона: ' + error.message);
        }
    }

    async deleteGuide(guideId) {
        if (!confirm('Вы уверены, что хотите удалить этот гайд?')) return;
        
        const accessToken = localStorage.getItem('github_access_token');
        if (!accessToken) {
            alert('Требуется авторизация');
            return;
        }

        try {
            const response = await fetch(`${this.apiBase}/guide/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete', guideId, accessToken })
            });

            const result = await response.json();
            
            if (result.success) {
                await this.loadGuides();
                alert('Гайд успешно удален!');
            } else {
                throw new Error(result.error || 'Ошибка удаления');
            }
        } catch (error) {
            console.error('Error deleting guide:', error);
            alert('Ошибка при удалении гайда: ' + error.message);
        }
    }

    editMacro(macroId) {
        const macro = this.macros.find(m => m.id === macroId);
        if (!macro) return;

        document.getElementById('macroId').value = macro.id;
        document.getElementById('macroName').value = macro.name;
        document.getElementById('macroClass').value = macro.class;
        document.getElementById('macroDescription').value = macro.description;
        document.getElementById('macroContent').value = macro.macro;
        document.getElementById('macroAuthor').value = macro.author;
        document.getElementById('macroFormTitle').textContent = 'Редактировать макрос';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Инициализация
let admin;

document.addEventListener('DOMContentLoaded', function() {
    admin = new AdminPanel();
    window.admin = admin;
});
