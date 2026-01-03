/**
 * Основной скрипт приложения
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('[App] Инициализация приложения...');
    
    // Состояние приложения
    const appState = {
        configs: [],
        filteredConfigs: [],
        filters: {
            addon: 'all',
            class: 'all',
            role: 'all'
        },
        searchQuery: '',
        isLoading: true,
        sortBy: 'date',
        sortOrder: 'desc'
    };
    
    // Инициализация
    init();
    
    async function init() {
        try {
            // Загружаем конфиги
            await loadConfigs();
            
            // Инициализируем UI
            initUI();
            
            // Периодическая проверка обновлений
            startUpdateChecker();
            
            console.log('[App] Приложение успешно инициализировано');
        } catch (error) {
            console.error('[App] Ошибка инициализации:', error);
            showNotification('Ошибка загрузки приложения', 'error');
        }
    }
    
    /**
     * Загрузка конфигов
     */
    async function loadConfigs(forceRefresh = false) {
        appState.isLoading = true;
        updateLoadingState(true);
        
        try {
            const result = await gitHubData.getConfigs(forceRefresh);
            
            if (result.success) {
                appState.configs = result.data;
                appState.filteredConfigs = [...result.data];
                
                // Обновляем статистику
                updateStats(result.data, result.meta);
                
                // Рендерим конфиги
                renderConfigs();
                
                if (forceRefresh) {
                    showNotification('Конфиги успешно обновлены', 'success');
                }
                
                console.log(`[App] Загружено ${result.data.length} конфигов`);
            } else {
                showNotification('Используем кэшированные данные', 'warning');
            }
        } catch (error) {
            console.error('[App] Ошибка загрузки конфигов:', error);
            showNotification('Ошибка загрузки конфигов', 'error');
        } finally {
            appState.isLoading = false;
            updateLoadingState(false);
        }
    }
    
    /**
     * Инициализация UI
     */
    function initUI() {
        // Фильтры
        initFilters();
        
        // Поиск
        initSearch();
        
        // Кнопки
        initButtons();
        
        // Адаптивные обработчики
        initResponsiveHandlers();
    }
    
    /**
     * Инициализация фильтров
     */
    function initFilters() {
        // Обработчики для фильтров по аддонам
        document.getElementById('addonFilter').addEventListener('click', (e) => {
            if (e.target.classList.contains('filter-btn')) {
                // Обновляем активную кнопку
                document.querySelectorAll('#addonFilter .filter-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                e.target.classList.add('active');
                
                // Обновляем фильтр
                appState.filters.addon = e.target.dataset.addon;
                applyFilters();
            }
        });
        
        // Обработчики для фильтров по классам
        document.getElementById('classFilter').addEventListener('click', (e) => {
            if (e.target.classList.contains('filter-btn')) {
                document.querySelectorAll('#classFilter .filter-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                e.target.classList.add('active');
                
                appState.filters.class = e.target.dataset.class;
                applyFilters();
            }
        });
        
        // Обработчики для фильтров по ролям
        document.getElementById('roleFilter').addEventListener('click', (e) => {
            if (e.target.classList.contains('filter-btn')) {
                document.querySelectorAll('#roleFilter .filter-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                e.target.classList.add('active');
                
                appState.filters.role = e.target.dataset.role;
                applyFilters();
            }
        });
    }
    
    /**
     * Инициализация поиска
     */
    function initSearch() {
        const searchInput = document.getElementById('searchInput');
        const clearSearchBtn = document.getElementById('clearSearch');
        
        // Поиск с дебаунсом
        const debouncedSearch = debounce(function() {
            appState.searchQuery = searchInput.value.toLowerCase().trim();
            applyFilters();
        }, 300);
        
        searchInput.addEventListener('input', debouncedSearch);
        
        // Очистка поиска
        clearSearchBtn.addEventListener('click', () => {
            searchInput.value = '';
            appState.searchQuery = '';
            applyFilters();
        });
        
        // Очистка при Escape
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                searchInput.value = '';
                appState.searchQuery = '';
                applyFilters();
                searchInput.blur();
            }
        });
    }
    
    /**
     * Инициализация кнопок
     */
    function initButtons() {
        // Кнопка обновления (если есть)
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                loadConfigs(true);
            });
        }
        
        // Кнопка сброса фильтров (если есть)
        const resetFiltersBtn = document.getElementById('resetFiltersBtn');
        if (resetFiltersBtn) {
            resetFiltersBtn.addEventListener('click', () => {
                resetFilters();
            });
        }
    }
    
    /**
     * Применение фильтров
     */
    function applyFilters() {
        if (appState.configs.length === 0) return;
        
        let filtered = [...appState.configs];
        
        // Фильтрация по аддону
        if (appState.filters.addon !== 'all') {
            filtered = filtered.filter(config => 
                config.addon === appState.filters.addon
            );
        }
        
        // Фильтрация по классу
        if (appState.filters.class !== 'all') {
            filtered = filtered.filter(config => 
                config.class === appState.filters.class
            );
        }
        
        // Фильтрация по роли
        if (appState.filters.role !== 'all') {
            filtered = filtered.filter(config => 
                config.role === appState.filters.role || config.role === 'all'
            );
        }
        
        // Поиск
        if (appState.searchQuery) {
            const query = appState.searchQuery;
            filtered = filtered.filter(config => 
                config.name.toLowerCase().includes(query) ||
                config.description.toLowerCase().includes(query) ||
                config.author.toLowerCase().includes(query)
            );
        }
        
        // Сортировка
        filtered = sortConfigs(filtered, appState.sortBy, appState.sortOrder);
        
        // Обновляем состояние
        appState.filteredConfigs = filtered;
        
        // Рендерим результаты
        renderConfigs();
        
        // Обновляем статистику поиска
        updateSearchStats(filtered.length);
    }
    
    /**
     * Сброс фильтров
     */
    function resetFilters() {
        // Сбрасываем активные кнопки фильтров
        document.querySelectorAll('.filter-btn.active').forEach(btn => {
            if (btn.dataset.addon !== 'all' && 
                btn.dataset.class !== 'all' && 
                btn.dataset.role !== 'all') {
                btn.classList.remove('active');
            }
        });
        
        // Активируем кнопки "Все"
        document.querySelector('[data-addon="all"]').classList.add('active');
        document.querySelector('[data-class="all"]').classList.add('active');
        document.querySelector('[data-role="all"]').classList.add('active');
        
        // Сбрасываем состояние
        appState.filters = {
            addon: 'all',
            class: 'all',
            role: 'all'
        };
        appState.searchQuery = '';
        
        // Сбрасываем поле поиска
        const searchInput = document.getElementById('searchInput');
        if (searchInput) searchInput.value = '';
        
        // Применяем фильтры
        applyFilters();
        
        showNotification('Фильтры сброшены', 'info');
    }
    
    /**
     * Сортировка конфигов
     */
    function sortConfigs(configs, sortBy, order = 'desc') {
        const sorted = [...configs];
        
        sorted.sort((a, b) => {
            let aValue, bValue;
            
            switch (sortBy) {
                case 'date':
                    aValue = new Date(a.created || 0);
                    bValue = new Date(b.created || 0);
                    break;
                case 'name':
                    aValue = a.name.toLowerCase();
                    bValue = b.name.toLowerCase();
                    break;
                case 'author':
                    aValue = a.author.toLowerCase();
                    bValue = b.author.toLowerCase();
                    break;
                default:
                    return 0;
            }
            
            if (order === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });
        
        return sorted;
    }
    
    /**
     * Рендеринг конфигов
     */
    function renderConfigs() {
        const grid = document.getElementById('configsGrid');
        const noResults = document.getElementById('noResults');
        
        if (!grid) return;
        
        if (appState.filteredConfigs.length === 0) {
            grid.style.display = 'none';
            if (noResults) noResults.style.display = 'block';
            return;
        }
        
        if (noResults) noResults.style.display = 'none';
        grid.style.display = 'grid';
        
        // Рендерим карточки
        grid.innerHTML = appState.filteredConfigs.map(config => 
            createConfigCard(config)
        ).join('');
        
        // Добавляем обработчики кнопок копирования
        initCopyButtons();
        
        // Обновляем счетчик
        updateConfigCount();
    }
    
    /**
     * Создание карточки конфига
     */
    function createConfigCard(config) {
        const addonIcon = getAddonIcon(config.addon);
        const classIcon = getClassIcon(config.class);
        const screenshotUrl = gitHubData.getScreenshotUrl(config.screenshot);
        
        return `
            <div class="config-card" data-id="${config.id}">
                <div class="config-header">
                    <div class="config-title">${escapeHtml(config.name)}</div>
                    <div class="config-meta">
                        <span class="config-badge addon-${config.addon}">
                            <i class="${addonIcon}"></i> ${config.addon.toUpperCase()}
                        </span>
                        <span class="config-badge">
                            <i class="${classIcon}"></i> ${getClassLabel(config.class)}
                        </span>
                        <span class="config-badge">
                            <i class="fas fa-tasks"></i> ${getRoleLabel(config.role)}
                        </span>
                    </div>
                </div>
                <div class="config-content">
                    <div class="config-description">
                        ${escapeHtml(config.description)}
                        <div class="config-footer">
                            <span class="author">
                                <i class="fas fa-user"></i> ${escapeHtml(config.author)}
                            </span>
                            <span class="date">
                                <i class="fas fa-calendar"></i> ${formatDate(config.created)}
                            </span>
                        </div>
                    </div>
                    
                    ${screenshotUrl ? `
                    <div class="config-screenshot">
                        <img src="${screenshotUrl}" 
                             alt="Скриншот: ${escapeHtml(config.name)}"
                             loading="lazy"
                             onerror="this.parentElement.className='config-screenshot placeholder'">
                    </div>
                    ` : `
                    <div class="config-screenshot placeholder">
                        <i class="fas fa-image"></i>
                        <span>Скриншот отсутствует</span>
                    </div>
                    `}
                    
                    <button class="copy-btn" data-config-id="${config.id}">
                        <i class="fas fa-copy"></i> Копировать конфиг
                    </button>
                </div>
            </div>
        `;
    }
    
    /**
     * Инициализация кнопок копирования
     */
    function initCopyButtons() {
        document.querySelectorAll('.copy-btn').forEach(btn => {
            btn.addEventListener('click', async function() {
                const configId = this.dataset.configId;
                const config = appState.configs.find(c => c.id === configId);
                
                if (!config || !config.config) {
                    showNotification('Конфиг не найден', 'error');
                    return;
                }
                
                try {
                    const success = await copyToClipboard(config.config);
                    
                    if (success) {
                        // Визуальная обратная связь
                        this.innerHTML = '<i class="fas fa-check"></i> Скопировано!';
                        this.classList.add('copied');
                        
                        // Возвращаем обратно через 2 секунды
                        setTimeout(() => {
                            this.innerHTML = '<i class="fas fa-copy"></i> Копировать конфиг';
                            this.classList.remove('copied');
                        }, 2000);
                        
                        showNotification('Конфиг скопирован в буфер обмена', 'success');
                    } else {
                        showNotification('Не удалось скопировать конфиг', 'error');
                    }
                } catch (error) {
                    console.error('Copy error:', error);
                    showNotification('Ошибка при копировании', 'error');
                }
            });
        });
    }
    
    /**
     * Обновление статистики
     */
    function updateStats(configs, meta) {
        // Общее количество конфигов
        const totalConfigs = document.getElementById('totalConfigs');
        if (totalConfigs) {
            totalConfigs.textContent = configs.length;
        }
        
        // Уникальные авторы
        const uniqueAuthors = document.getElementById('uniqueAuthors');
        if (uniqueAuthors) {
            const authors = new Set(configs.map(c => c.author));
            uniqueAuthors.textContent = authors.size;
        }
        
        // Последнее обновление
        const lastUpdated = document.getElementById('lastUpdated');
        if (lastUpdated) {
            if (meta && meta.lastUpdated) {
                lastUpdated.textContent = formatDate(meta.lastUpdated);
            } else {
                lastUpdated.textContent = 'только что';
            }
        }
        
        // Обновляем общий счетчик
        updateConfigCount();
    }
    
    /**
     * Обновление счетчика конфигов
     */
    function updateConfigCount() {
        const configCount = document.getElementById('configCount');
        if (configCount) {
            const total = appState.configs.length;
            const filtered = appState.filteredConfigs.length;
            
            if (total === filtered) {
                configCount.textContent = `(${total})`;
            } else {
                configCount.textContent = `(${filtered} из ${total})`;
            }
        }
    }
    
    /**
     * Обновление статистики поиска
     */
    function updateSearchStats(count) {
        const searchResultsCount = document.getElementById('searchResultsCount');
        if (searchResultsCount) {
            searchResultsCount.textContent = count;
        }
    }
    
    /**
     * Обновление состояния загрузки
     */
    function updateLoadingState(isLoading) {
        const loadingElement = document.querySelector('.loading');
        if (loadingElement) {
            loadingElement.style.display = isLoading ? 'flex' : 'none';
        }
    }
    
    /**
     * Запуск проверки обновлений
     */
    function startUpdateChecker() {
        // Проверяем обновления каждые 5 минут
        setInterval(async () => {
            try {
                const updateInfo = await gitHubData.checkForUpdates();
                if (updateInfo && updateInfo.hasUpdate) {
                    console.log('[App] Обнаружены обновления, загружаем...');
                    await loadConfigs(true);
                }
            } catch (error) {
                console.warn('[App] Ошибка проверки обновлений:', error);
            }
        }, 5 * 60 * 1000); // 5 минут
    }
    
    /**
     * Инициализация адаптивных обработчиков
     */
    function initResponsiveHandlers() {
        // Обработчик изменения размера окна
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                // Можно добавить адаптивные изменения
                console.log('[App] Размер окна изменен');
            }, 250);
        });
    }
    
    /**
     * Экранирование HTML
     */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Экспортируем публичные методы
    window.app = {
        loadConfigs,
        resetFilters,
        getState: () => ({ ...appState }),
        getGitHubStats: () => gitHubData.getStats()
    };
});
