/**
 * Основной скрипт приложения
 */

document.addEventListener('DOMContentLoaded', function() {
    logger.info('[App] Инициализация приложения...');
    
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
        sortOrder: 'desc',
        lastUpdate: null,
        dataSource: 'loading', // 'fresh', 'cache', 'error', 'fallback'
        error: null
    };
    
    // Инициализация
    init();
    
    async function init() {
        try {
            logger.info('[App] Начало инициализации');
            
            // Показываем начальное состояние
            updateLoadingState(true);
            
            // Создаем кнопку обновления и диагностики
            createControlButtons();
            
            // Загружаем конфиги
            await loadConfigs();
            
            // Инициализируем UI
            initUI();
            
            // Запускаем проверку обновлений
            startUpdateChecker();
            
            logger.info('[App] Приложение успешно инициализировано');
            
        } catch (error) {
            logger.errorDetails(error, 'App.init');
            showNotification('Критическая ошибка инициализации', 'error');
            
            // Показываем подробности в UI
            showErrorDetails(error);
        } finally {
            updateLoadingState(false);
        }
    }
    
    /**
     * Создание кнопок управления
     */
    function createControlButtons() {
        const searchSection = document.querySelector('.search-section');
        if (!searchSection) {
            logger.warn('Не найден .search-section для кнопок');
            return;
        }
        
        // Создаем контейнер для кнопок
        const controlsContainer = document.createElement('div');
        controlsContainer.className = 'controls-container';
        controlsContainer.style.cssText = `
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            margin-bottom: 15px;
            flex-wrap: wrap;
        `;
        
        // Кнопка обновления
        const refreshBtn = createButton(
            'refreshBtn',
            '<i class="fas fa-sync-alt"></i> Обновить конфиги',
            async () => {
                logger.info('[App] Ручное обновление конфигов');
                await refreshConfigs();
            }
        );
        
        // Кнопка диагностики
        const diagnoseBtn = createButton(
            'diagnoseBtn',
            '<i class="fas fa-stethoscope"></i> Диагностика',
            async () => {
                logger.info('[App] Запуск диагностики');
                await window.diagnoseGitHub?.();
            }
        );
        diagnoseBtn.style.background = 'linear-gradient(90deg, #3498db, #2980b9)';
        
        // Кнопка сброса фильтров
        const resetBtn = createButton(
            'resetFiltersBtn',
            '<i class="fas fa-filter"></i> Сбросить фильтры',
            () => {
                logger.info('[App] Сброс фильтров');
                resetFilters();
            }
        );
        resetBtn.style.background = 'var(--card-bg)';
        resetBtn.style.color = 'var(--light)';
        resetBtn.style.border = '1px solid var(--border)';
        
        controlsContainer.appendChild(refreshBtn);
        controlsContainer.appendChild(diagnoseBtn);
        controlsContainer.appendChild(resetBtn);
        
        // Вставляем перед поиском
        searchSection.parentNode.insertBefore(controlsContainer, searchSection);
        
        logger.debug('Кнопки управления созданы');
    }
    
    /**
     * Создание кнопки
     */
    function createButton(id, html, onClick) {
        const button = document.createElement('button');
        button.id = id;
        button.innerHTML = html;
        button.style.cssText = `
            background: linear-gradient(90deg, var(--accent), var(--accent-dark));
            color: var(--dark);
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.3s;
            font-size: 0.9rem;
        `;
        
        button.addEventListener('mouseenter', () => {
            if (!button.disabled) {
                button.style.transform = 'translateY(-2px)';
                button.style.boxShadow = '0 5px 15px rgba(92, 219, 149, 0.3)';
            }
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.transform = '';
            button.style.boxShadow = '';
        });
        
        button.addEventListener('click', onClick);
        
        return button;
    }
    
    /**
     * Загрузка конфигов
     */
    async function loadConfigs(forceRefresh = false) {
        logger.info('[App] Загрузка конфигов', { forceRefresh });
        
        appState.isLoading = true;
        appState.dataSource = 'loading';
        appState.error = null;
        
        updateLoadingState(true);
        updateControlButtonsState(true);
        
        try {
            const result = await gitHubData.getConfigs(forceRefresh);
            
            // Обновляем состояние источника данных
            appState.dataSource = result.fromCache ? 'cache' : 
                                 result.isFallback ? 'fallback' : 'fresh';
            appState.lastUpdate = new Date();
            appState.error = result.error || null;
            
            logger.info('[App] Результат загрузки:', {
                success: result.success,
                dataSource: appState.dataSource,
                configsCount: result.data?.length || 0,
                error: result.error,
                isFallback: result.isFallback
            });
            
            if (result.success || result.data?.length > 0) {
                appState.configs = result.data || [];
                appState.filteredConfigs = [...appState.configs];
                
                // Обновляем статистику
                updateStats(result.data, result.meta);
                
                // Рендерим конфиги
                renderConfigs();
                
                // Показываем уведомление о состоянии
                showDataSourceNotification(result);
                
            } else {
                appState.dataSource = 'error';
                showNotification('Не удалось загрузить конфиги', 'error');
            }
            
        } catch (error) {
            logger.errorDetails(error, 'App.loadConfigs');
            appState.dataSource = 'error';
            appState.error = error.message;
            showNotification('Ошибка загрузки конфигов: ' + error.message, 'error');
            
            // Показываем ошибку в UI
            showErrorState();
            
        } finally {
            appState.isLoading = false;
            updateLoadingState(false);
            updateControlButtonsState(false);
            updateDataSourceIndicator();
            logger.logState(appState);
        }
    }
    
    /**
     * Показать состояние ошибки
     */
    function showErrorState() {
        const grid = document.getElementById('configsGrid');
        if (!grid) return;
        
        grid.innerHTML = `
            <div class="error-state" style="
                grid-column: 1 / -1;
                text-align: center;
                padding: 60px 20px;
                color: rgba(255, 255, 255, 0.7);
            ">
                <div style="font-size: 4rem; margin-bottom: 20px; color: #e74c3c;">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h3 style="color: #e74c3c; margin-bottom: 15px;">Ошибка загрузки конфигов</h3>
                <p style="margin-bottom: 20px; max-width: 600px; margin-left: auto; margin-right: auto;">
                    ${appState.error || 'Неизвестная ошибка'}
                </p>
                <div style="margin-top: 30px;">
                    <button onclick="window.diagnoseGitHub?.()" class="refresh-btn" style="
                        background: #e74c3c;
                        color: white;
                        margin-right: 10px;
                    ">
                        <i class="fas fa-stethoscope"></i> Запустить диагностику
                    </button>
                    <button onclick="app.refreshConfigs()" class="refresh-btn">
                        <i class="fas fa-sync-alt"></i> Повторить попытку
                    </button>
                </div>
                <div style="margin-top: 20px; font-size: 0.9rem; color: rgba(255, 255, 255, 0.5);">
                    <p>Возможные причины:</p>
                    <ul style="text-align: left; display: inline-block; margin-top: 10px;">
                        <li>Файл configs/configs.json не существует в репозитории</li>
                        <li>Проблемы с доступом к GitHub</li>
                        <li>Неправильно указан username или название репозитория</li>
                    </ul>
                </div>
            </div>
        `;
    }
    
    /**
     * Показать детали ошибки
     */
    function showErrorDetails(error) {
        const errorDetails = `
            <div style="
                background: rgba(231, 76, 60, 0.1);
                border: 1px solid #e74c3c;
                border-radius: 8px;
                padding: 20px;
                margin: 20px 0;
                color: rgba(255, 255, 255, 0.9);
            ">
                <h4 style="color: #e74c3c; margin-bottom: 10px;">
                    <i class="fas fa-bug"></i> Детали ошибки
                </h4>
                <pre style="
                    background: rgba(0, 0, 0, 0.3);
                    padding: 15px;
                    border-radius: 5px;
                    overflow-x: auto;
                    font-size: 0.85rem;
                    margin: 0;
                ">${error.stack || error.message}</pre>
                <div style="margin-top: 15px; font-size: 0.9rem;">
                    <p>Откройте консоль браузера (F12) для подробной диагностики</p>
                </div>
            </div>
        `;
        
        // Можно добавить куда-то в интерфейс
        const mainContainer = document.querySelector('main .container');
        if (mainContainer) {
            mainContainer.insertAdjacentHTML('afterbegin', errorDetails);
        }
    }
    
    /**
     * Обновление состояния кнопок управления
     */
    function updateControlButtonsState(isLoading) {
        const buttons = ['refreshBtn', 'diagnoseBtn', 'resetFiltersBtn'];
        
        buttons.forEach(btnId => {
            const button = document.getElementById(btnId);
            if (!button) return;
            
            if (isLoading) {
                button.disabled = true;
                button.style.opacity = '0.7';
                button.style.cursor = 'not-allowed';
                
                if (btnId === 'refreshBtn') {
                    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Загрузка...';
                }
            } else {
                button.disabled = false;
                button.style.opacity = '1';
                button.style.cursor = 'pointer';
                
                if (btnId === 'refreshBtn') {
                    button.innerHTML = '<i class="fas fa-sync-alt"></i> Обновить конфиги';
                }
            }
        });
    }
    
    /**
     * Обновление индикатора загрузки
     */
    function updateLoadingState(isLoading) {
        const loadingElement = document.querySelector('.loading');
        if (!loadingElement) {
            logger.warn('Не найден .loading элемент');
            return;
        }
        
        if (isLoading) {
            loadingElement.style.display = 'flex';
            loadingElement.innerHTML = `
                <i class="fas fa-spinner fa-spin"></i> 
                <span>Загрузка конфигов с GitHub...</span>
            `;
        } else {
            loadingElement.style.display = 'none';
        }
    }
    
    /**
     * Рендеринг конфигов
     */
    function renderConfigs() {
        const grid = document.getElementById('configsGrid');
        const noResults = document.getElementById('noResults');
        
        if (!grid) {
            logger.error('Не найден #configsGrid элемент');
            return;
        }
        
        logger.debug('[App] Рендеринг конфигов', {
            total: appState.configs.length,
            filtered: appState.filteredConfigs.length
        });
        
        if (appState.filteredConfigs.length === 0) {
            grid.style.display = 'none';
            if (noResults) {
                noResults.style.display = 'block';
                noResults.innerHTML = `
                    <i class="fas fa-inbox"></i>
                    <h3>Конфиги не найдены</h3>
                    <p>${appState.configs.length === 0 ? 
                        'База конфигов пуста или временно недоступна' : 
                        'Попробуйте изменить параметры фильтрации'}</p>
                    ${appState.configs.length === 0 ? `
                    <div style="margin-top: 20px;">
                        <button onclick="window.diagnoseGitHub?.()" class="refresh-btn" style="font-size: 0.9rem; padding: 8px 15px;">
                            <i class="fas fa-stethoscope"></i> Проверить доступность
                        </button>
                    </div>
                    ` : ''}
                `;
            }
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
        
        logger.debug('[App] Конфиги отрендерены');
    }
    
    // Остальные функции остаются с логами...
    
    /**
     * Обновление статистики
     */
    function updateStats(configs, meta) {
        logger.debug('[App] Обновление статистики', {
            configsCount: configs?.length || 0,
            meta: meta
        });
        
        // Общее количество конфигов
        const totalConfigs = document.getElementById('totalConfigs');
        if (totalConfigs) {
            const count = configs?.length || 0;
            totalConfigs.textContent = count;
            logger.debug(`Общее количество конфигов: ${count}`);
        }
        
        // Уникальные авторы
        const uniqueAuthors = document.getElementById('uniqueAuthors');
        if (uniqueAuthors && configs) {
            const authors = new Set(configs.map(c => c.author));
            uniqueAuthors.textContent = authors.size;
            logger.debug(`Уникальных авторов: ${authors.size}`);
        }
        
        // Последнее обновление
        const lastUpdated = document.getElementById('lastUpdated');
        if (lastUpdated) {
            if (meta && meta.lastUpdated) {
                lastUpdated.textContent = formatDate(meta.lastUpdated);
                logger.debug(`Последнее обновление: ${meta.lastUpdated}`);
            } else {
                lastUpdated.textContent = 'только что';
            }
        }
        
        // Обновляем общий счетчик
        updateConfigCount();
    }
    
    // Экспортируем публичные методы
    window.app = {
        loadConfigs,
        refreshConfigs: () => loadConfigs(true),
        resetFilters,
        getState: () => ({ ...appState }),
        getGitHubStats: () => gitHubData.getStats(),
        diagnose: () => window.diagnoseGitHub?.()
    };
    
    // Добавляем глобальные функции для отладки
    window.debugApp = () => {
        console.log('=== DEBUG APP STATE ===');
        console.log('App State:', appState);
        console.log('GitHub Data Stats:', gitHubData.getStats());
        console.log('Cache:', gitHubData.cache);
        console.log('Window Location:', window.location.href);
        console.log('GitHub URL:', gitHubData.rawBaseUrl + '/configs/configs.json');
        console.log('=== END DEBUG ===');
        
        alert('Информация в консоли (F12)');
    };
    
    logger.info('[App] Инициализация завершена');
});
