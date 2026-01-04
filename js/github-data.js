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
            cacheTTL: options.cacheTTL || 10 * 1000, // 10 секунд
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
        
        logger.info('GitHubDataManager инициализирован', {
            owner: this.config.owner,
            repo: this.config.repo,
            branch: this.config.branch,
            rawBaseUrl: this.rawBaseUrl
        });
    }
    
    /**
     * Получить все конфиги из репозитория
     */
    async getConfigs(forceRefresh = false) {
        logger.info('Запрос конфигов', { forceRefresh, hasCache: !!this.cache.configs });
        
        this.isLoading = true;
        this.lastError = null;
        
        try {
            const startTime = Date.now();
            const url = `${this.rawBaseUrl}/configs/configs.json`;
            const cacheBuster = `?t=${Date.now()}`;
            const finalUrl = url + cacheBuster;
            
            logger.debug('Fetching URL:', finalUrl);
            
            this.stats.requests++;
            
            const response = await this._fetchWithRetry(finalUrl, { 
                cache: 'no-cache',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            const duration = Date.now() - startTime;
            logger.logRequest(finalUrl, 'GET', response.status, duration);
            
            if (!response.ok) {
                logger.warn('HTTP ошибка', {
                    status: response.status,
                    statusText: response.statusText,
                    url: finalUrl
                });
                
                // Попробуем альтернативный URL без cache buster для диагностики
                if (response.status === 404) {
                    logger.warn('Файл не найден (404). Проверьте URL:', url);
                    
                    // Попробуем получить информацию о репозитории для диагностики
                    try {
                        const repoInfo = await this.getRepoInfo();
                        logger.info('Информация о репозитории:', repoInfo);
                    } catch (repoError) {
                        logger.error('Не удалось получить информацию о репозитории:', repoError);
                    }
                }
                
                throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            logger.debug('Получены данные с GitHub:', {
                configsCount: data.configs?.length || 0,
                hasMeta: !!data.meta,
                dataKeys: Object.keys(data)
            });
            
            // Валидация данных
            if (!this._validateData(data)) {
                logger.error('Невалидные данные от GitHub', data);
                throw new Error('Invalid data structure from GitHub');
            }
            
            // Обновляем кэш
            this.cache.configs = data.configs || [];
            this.cache.meta = data.meta || {};
            this.cache.timestamp = Date.now();
            
            this.stats.lastSuccess = new Date();
            this.isLoading = false;
            
            logger.info(`Загружено ${this.cache.configs.length} конфигов`, {
                fromCache: false,
                duration: `${duration}ms`
            });
            
            return {
                success: true,
                data: this.cache.configs,
                meta: this.cache.meta,
                fromCache: false,
                fresh: true,
                timestamp: this.cache.timestamp,
                responseStatus: response.status
            };
            
        } catch (error) {
            logger.errorDetails(error, 'GitHubData.getConfigs');
            this.lastError = error;
            this.stats.errors++;
            this.isLoading = false;
            
            // Возвращаем кэшированные данные только при ошибке сети
            if (this.cache.configs && this.cache.configs.length > 0) {
                logger.warn('Используем кэшированные данные из-за ошибки', {
                    error: error.message,
                    cacheSize: this.cache.configs.length
                });
                
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
            logger.warn('Кэш пуст, возвращаем заглушки');
            const fallback = this._getFallbackConfigs();
            
            return {
                success: false,
                data: fallback,
                meta: {},
                fromCache: false,
                error: error.message,
                fresh: false,
                isFallback: true
            };
        }
    }
    
    /**
     * Проверить доступность файла конфигов
     */
    async checkConfigsFile() {
        try {
            const url = `${this.rawBaseUrl}/configs/configs.json`;
            logger.debug('Проверка файла конфигов:', url);
            
            const response = await fetch(url, { method: 'HEAD' });
            logger.debug('HEAD запрос результат:', {
                url: url,
                status: response.status,
                ok: response.ok,
                headers: {
                    'content-type': response.headers.get('content-type'),
                    'content-length': response.headers.get('content-length')
                }
            });
            
            return {
                exists: response.ok,
                status: response.status,
                statusText: response.statusText,
                url: url
            };
        } catch (error) {
            logger.errorDetails(error, 'checkConfigsFile');
            return {
                exists: false,
                error: error.message,
                url: `${this.rawBaseUrl}/configs/configs.json`
            };
        }
    }
    
    /**
     * Получить информацию о репозитории
     */
    async getRepoInfo() {
        try {
            logger.debug('Получение информации о репозитории:', this.apiBaseUrl);
            
            const response = await fetch(this.apiBaseUrl);
            
            if (!response.ok) {
                logger.warn('Ошибка получения информации о репозитории:', {
                    status: response.status,
                    statusText: response.statusText
                });
                throw new Error(`Failed to fetch repo info: ${response.status}`);
            }
            
            const data = await response.json();
            logger.debug('Информация о репозитории получена:', {
                name: data.name,
                full_name: data.full_name,
                private: data.private,
                size: data.size
            });
            
            return {
                name: data.name,
                fullName: data.full_name,
                private: data.private,
                size: data.size,
                stars: data.stargazers_count,
                forks: data.forks_count,
                issues: data.open_issues_count,
                lastPush: data.pushed_at,
                description: data.description,
                defaultBranch: data.default_branch,
                url: data.html_url
            };
        } catch (error) {
            logger.errorDetails(error, 'getRepoInfo');
            throw error;
        }
    }
    
    /**
     * Диагностика проблем с доступом
     */
    async diagnose() {
        logger.info('Запуск диагностики...');
        
        const results = {
            repoInfo: null,
            configsFile: null,
            rawAccess: null,
            apiAccess: null
        };
        
        try {
            // 1. Проверяем информацию о репозитории
            results.repoInfo = await this.getRepoInfo();
            logger.info('Диагностика: информация о репозитории', results.repoInfo);
        } catch (error) {
            logger.error('Диагностика: ошибка получения информации о репозитории:', error);
            results.repoInfo = { error: error.message };
        }
        
        try {
            // 2. Проверяем доступ к файлу конфигов
            results.configsFile = await this.checkConfigsFile();
            logger.info('Диагностика: проверка файла конфигов', results.configsFile);
        } catch (error) {
            logger.error('Диагностика: ошибка проверки файла конфигов:', error);
            results.configsFile = { error: error.message };
        }
        
        try {
            // 3. Проверяем доступ к raw.githubusercontent.com
            const testUrl = 'https://raw.githubusercontent.com/n-burov/AferistHelper-web/main/README.md';
            const response = await fetch(testUrl, { method: 'HEAD' });
            results.rawAccess = {
                url: testUrl,
                status: response.status,
                ok: response.ok
            };
            logger.info('Диагностика: доступ к raw.githubusercontent.com', results.rawAccess);
        } catch (error) {
            logger.error('Диагностика: ошибка доступа к raw.githubusercontent.com:', error);
            results.rawAccess = { error: error.message };
        }
        
        return results;
    }
    
    // Остальные методы остаются с логами...
    
    /**
     * Запрос с повторными попытками
     */
    async _fetchWithRetry(url, options = {}, retries = this.config.retryCount) {
        for (let i = 0; i <= retries; i++) {
            try {
                logger.debug(`Попытка запроса ${i + 1}/${retries + 1}:`, url);
                
                const controller = new AbortController();
                const timeoutId = setTimeout(() => {
                    logger.warn(`Таймаут запроса: ${url}`);
                    controller.abort();
                }, 10000);
                
                const startTime = Date.now();
                const response = await fetch(url, {
                    ...options,
                    signal: controller.signal
                });
                const duration = Date.now() - startTime;
                
                clearTimeout(timeoutId);
                
                logger.debug(`Запрос успешен: ${response.status} (${duration}ms)`);
                return response;
                
            } catch (error) {
                logger.warn(`Ошибка запроса (попытка ${i + 1}):`, error.name, error.message);
                
                if (i === retries) {
                    logger.error('Все попытки исчерпаны');
                    throw error;
                }
                
                // Ждем перед следующей попыткой
                const delay = this.config.retryDelay * Math.pow(2, i);
                logger.debug(`Ожидание ${delay}ms перед следующей попыткой`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        
        throw new Error(`Failed after ${retries} retries`);
    }
    
    /**
     * Запасные данные
     */
    _getFallbackConfigs() {
        logger.warn('Используются запасные данные');
        return [
            {
                id: 'fallback-1-' + Date.now(),
                name: 'ElvUI - Базовая настройка (тест)',
                addon: 'elvui',
                class: 'universal',
                role: 'all',
                description: 'Тестовый конфиг. Проверьте доступность файла configs/configs.json в репозитории.',
                config: '-- Этот конфиг загружается при ошибке соединения\n-- Проверьте:\n-- 1. Существует ли файл configs/configs.json в репозитории\n-- 2. Доступен ли raw.githubusercontent.com\n-- 3. Правильно ли указан username и название репозитория',
                screenshot: null,
                author: 'system',
                created: new Date().toISOString()
            },
            {
                id: 'fallback-2-' + Date.now(),
                name: 'Пример конфига WeakAuras',
                addon: 'wa',
                class: 'universal',
                role: 'dps',
                description: 'Пример того, как будут выглядеть конфиги',
                config: '-- Пример конфига WeakAuras\n-- Добавьте свои конфиги в файл configs/configs.json',
                screenshot: null,
                author: 'system',
                created: new Date().toISOString()
            }
        ];
    }
}

// Создаем глобальный экземпляр
const gitHubData = new GitHubDataManager();

// Добавляем глобальную функцию для диагностики
window.diagnoseGitHub = async () => {
    console.clear();
    console.log('=== ДИАГНОСТИКА GITHUB ДОСТУПА ===');
    console.log('URL репозитория:', gitHubData.rawBaseUrl);
    console.log('Файл конфигов:', `${gitHubData.rawBaseUrl}/configs/configs.json`);
    
    try {
        const results = await gitHubData.diagnose();
        console.log('Результаты диагностики:', results);
        
        // Показываем в UI
        alert(`Диагностика завершена:\n\n` +
              `1. Репозиторий: ${results.repoInfo?.name || 'ошибка'}\n` +
              `2. Файл конфигов: ${results.configsFile?.exists ? 'НАЙДЕН' : 'НЕ НАЙДЕН'}\n` +
              `3. Статус: ${results.configsFile?.status || 'неизвестно'}\n\n` +
              `Подробности в консоли браузера (F12)`);
        
        return results;
    } catch (error) {
        console.error('Ошибка диагностики:', error);
        alert('Ошибка диагностики: ' + error.message);
    }
};

// Проверяем, есть ли уже gitHubData
if (!window.gitHubData) {
    console.log('📦 Создаем window.gitHubData...');
    window.gitHubData = new GitHubDataManager();
    console.log('✅ window.gitHubData создан:', !!window.gitHubData);
} else {
    console.log('⚠️ window.gitHubData уже существует');
}
