/**
 * Менеджер данных из GitHub
 * Загружает конфиги напрямую из репозитория
 */

class GitHubDataManager {
    constructor(options = {}) {
        // Настройки по умолчанию - ЗАМЕНИТЕ USERNAME!
        this.config = {
            owner: options.owner || 'n-burov', // ✅ Ваш GitHub username
            repo: options.repo || 'AferistHelper-web', // ✅ Ваш репозиторий
            branch: options.branch || 'main',
            cacheTTL: options.cacheTTL || 10 * 1000, // ✅ 10 секунд вместо 5 минут
            retryCount: options.retryCount || 2,
            retryDelay: options.retryDelay || 1000
        };
        
        // Базовые URL
        this.rawBaseUrl = `https://raw.githubusercontent.com/${this.config.owner}/${this.config.repo}/${this.config.branch}`;
        this.apiBaseUrl = `https://api.github.com/repos/${this.config.owner}/${this.config.repo}`;
        
        // Кэш
        this.cache = {
            configs: null,
            meta: null,
            timestamp: 0,
            etag: null
        };
        
        // Состояние
        this.isLoading = false;
        this.lastError = null;
        
        // Статистика
        this.stats = {
            requests: 0,
            cacheHits: 0,
            errors: 0,
            lastSuccess: null
        };
        
        console.log('[GitHubData] Инициализирован для:', this.config.owner, this.config.repo);
    }
    
    /**
     * Получить все конфиги
     */
    async getConfigs(forceRefresh = false) {
        // Всегда пробуем загрузить свежие данные, но используем кэш при ошибке
        const shouldUseCache = !forceRefresh && this._isCacheValid();
        
        if (shouldUseCache) {
            console.log('[GitHubData] Используем кэшированные данные (TTL еще не истек)');
        }
        
        this.isLoading = true;
        this.lastError = null;
        
        try {
            console.log('[GitHubData] Загрузка данных с GitHub...');
            this.stats.requests++;
            
            const url = `${this.rawBaseUrl}/configs/configs.json`;
            const headers = {};
            
            // Добавляем параметр для предотвращения кэширования браузером
            const cacheBuster = `?t=${Date.now()}`;
            const finalUrl = url + cacheBuster;
            
            // НЕ добавляем ETag - хотим всегда свежие данные
            const response = await this._fetchWithRetry(finalUrl, { 
                headers,
                cache: 'no-cache' // ✅ Предотвращаем кэширование браузером
            });
            
            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            
            // Валидация данных
            if (!this._validateData(data)) {
                throw new Error('Invalid data structure from GitHub');
            }
            
            // Обновляем кэш
            this.cache.configs = data.configs || [];
            this.cache.meta = data.meta || {};
            this.cache.timestamp = Date.now();
            
            this.stats.lastSuccess = new Date();
            this.isLoading = false;
            
            console.log(`[GitHubData] Загружено ${this.cache.configs.length} конфигов`);
            
            return {
                success: true,
                data: this.cache.configs,
                meta: this.cache.meta,
                fromCache: false,
                fresh: true,
                timestamp: this.cache.timestamp
            };
            
        } catch (error) {
            console.error('[GitHubData] Ошибка загрузки:', error);
            this.lastError = error;
            this.stats.errors++;
            this.isLoading = false;
            
            // Возвращаем кэшированные данные только при ошибке сети
            if (this.cache.configs && this.cache.configs.length > 0) {
                console.log('[GitHubData] Используем старые данные из кэша из-за ошибки:', error.message);
                return {
                    success: false,
                    data: this.cache.configs,
                    meta: this.cache.meta,
                    fromCache: true,
                    error: error.message,
                    fresh: false
                };
            }
            
            // Если кэш пуст, возвращаем заглушку
            return {
                success: false,
                data: this._getFallbackConfigs(),
                meta: {},
                fromCache: false,
                error: error.message,
                fresh: false
            };
        }
    }
    
    /**
     * Принудительное обновление данных
     */
    async refreshConfigs() {
        console.log('[GitHubData] Принудительное обновление данных...');
        
        // Очищаем кэш
        this.clearCache();
        
        // Загружаем заново
        return this.getConfigs(true);
    }
    
    /**
     * Получить URL скриншота
     */
    getScreenshotUrl(filename) {
        if (!filename) return null;
        
        // Проверяем различные форматы URL
        if (filename.startsWith('http://') || filename.startsWith('https://')) {
            return filename; // Уже полный URL
        }
        
        if (filename.startsWith('data:')) {
            return filename; // Data URL
        }
        
        // Относительный путь в репозитории с cache buster
        const cacheBuster = `?t=${Date.now()}`;
        return `${this.rawBaseUrl}/configs/screenshots/${filename}${cacheBuster}`;
    }
    
    /**
     * Получить информацию о репозитории
     */
    async getRepoInfo() {
        try {
            const response = await fetch(this.apiBaseUrl);
            if (!response.ok) throw new Error('Failed to fetch repo info');
            
            const data = await response.json();
            return {
                stars: data.stargazers_count,
                forks: data.forks_count,
                issues: data.open_issues_count,
                lastPush: data.pushed_at,
                description: data.description
            };
        } catch (error) {
            console.error('Error fetching repo info:', error);
            return null;
        }
    }
    
    /**
     * Проверить обновления
     */
    async checkForUpdates() {
        try {
            const response = await fetch(`${this.rawBaseUrl}/configs/configs.json?t=${Date.now()}`, {
                method: 'HEAD',
                cache: 'no-cache'
            });
            
            if (response.ok) {
                const lastModified = response.headers.get('last-modified');
                
                return {
                    hasUpdate: true, // Всегда возвращаем true, чтобы проверяли
                    lastModified: lastModified,
                    url: `${this.rawBaseUrl}/configs/configs.json`
                };
            }
            
            return null;
        } catch (error) {
            console.error('Error checking for updates:', error);
            return null;
        }
    }
    
    /**
     * Получить ссылки для контрибьютинга
     */
    getContributeUrls() {
        return {
            newIssue: `https://github.com/${this.config.owner}/${this.config.repo}/issues/new`,
            newPR: `https://github.com/${this.config.owner}/${this.config.repo}/compare`,
            editConfigs: `https://github.com/${this.config.owner}/${this.config.repo}/edit/main/configs/configs.json`,
            viewRepo: `https://github.com/${this.config.owner}/${this.config.repo}`
        };
    }
    
    /**
     * Получить статистику
     */
    getStats() {
        const cacheAge = this.cache.timestamp ? Date.now() - this.cache.timestamp : null;
        return {
            ...this.stats,
            cacheAge: cacheAge,
            cacheAgeText: cacheAge ? `${Math.floor(cacheAge / 1000)} секунд назад` : 'нет',
            hasCache: !!this.cache.configs,
            cacheSize: this.cache.configs ? this.cache.configs.length : 0,
            isLoading: this.isLoading,
            lastError: this.lastError?.message,
            config: this.config
        };
    }
    
    /**
     * Очистить кэш
     */
    clearCache() {
        this.cache = {
            configs: null,
            meta: null,
            timestamp: 0,
            etag: null
        };
        console.log('[GitHubData] Кэш очищен');
    }
    
    // Вспомогательные методы
    
    /**
     * Проверка валидности кэша
     */
    _isCacheValid() {
        if (!this.cache.configs || !this.cache.timestamp) return false;
        
        const age = Date.now() - this.cache.timestamp;
        return age < this.config.cacheTTL;
    }
    
    /**
     * Валидация данных
     */
    _validateData(data) {
        if (!data || typeof data !== 'object') return false;
        
        // Проверяем наличие configs массива
        if (!Array.isArray(data.configs)) return false;
        
        return true;
    }
    
    /**
     * Запрос с повторными попытками
     */
    async _fetchWithRetry(url, options = {}, retries = this.config.retryCount) {
        for (let i = 0; i <= retries; i++) {
            try {
                // Добавляем timeout
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 секунд timeout
                
                const response = await fetch(url, {
                    ...options,
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                return response;
                
            } catch (error) {
                if (i === retries) throw error;
                
                // Ждем перед следующей попыткой
                await new Promise(resolve => 
                    setTimeout(resolve, this.config.retryDelay * Math.pow(2, i))
                );
            }
        }
        
        throw new Error(`Failed after ${retries} retries`);
    }
    
    /**
     * Запасные данные
     */
    _getFallbackConfigs() {
        return [
            {
                id: 'fallback-1',
                name: 'ElvUI - Базовая настройка',
                addon: 'elvui',
                class: 'universal',
                role: 'all',
                description: 'Базовая настройка ElvUI для всех классов и ролей.',
                config: '-- Вставьте сюда ваш конфиг ElvUI\n-- Этот конфиг загружается при ошибке соединения',
                screenshot: null,
                author: 'system',
                created: new Date().toISOString()
            }
        ];
    }
}

// Создаем глобальный экземпляр
const gitHubData = new GitHubDataManager();

// Экспортируем для использования в других файлах
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GitHubDataManager, gitHubData };
}
