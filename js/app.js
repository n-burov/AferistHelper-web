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
        sortOrder: 'desc',
        lastUpdate: null,
        dataSource: 'loading' // 'fresh', 'cache', 'error'
    };
    
    // Инициализация
    init();
    
    async function init() {
        try {
            // Создаем кнопку обновления
            createRefreshButton();
            
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
     * Создание кнопки обновления
     */
    function createRefreshButton() {
        // Проверяем, есть ли уже кнопка
        if (document.getElementById('refreshBtn')) return;
        
        // Ищем место для кнопки (рядом с поиском)
        const searchSection = document.querySelector('.search-section');
        if (!searchSection) return;
        
        // Создаем контейнер для кнопки
        const refreshContainer = document.createElement('div');
        refreshContainer.className = 'refresh-container';
        refreshContainer.style.cssText = `
            display: flex;
            justify-content: flex-end;
            margin-bottom: 10px;
        `;
        
        // Создаем кнопку
        const refreshBtn = document.createElement('button');
        refreshBtn.id = 'refreshBtn';
        refreshBtn.className = 'refresh-btn';
        refreshBtn.innerHTML = `
            <i class="fas fa-sync-alt"></i> Обновить конфиги
        `;
        refreshBtn.style.cssText = `
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
        
        // Добавляем обработчик
        refreshBtn.addEventListener('click', async () => {
            await refreshConfigs();
        });
        
        refreshContainer.appendChild(refreshBtn);
        
        // Вставляем перед поиском
        searchSection.parentNode.insertBefore(refreshContainer, searchSection);
    }
    
    /**
     * Загрузка конфигов
     */
    async function loadConfigs(forceRefresh = false) {
        appState.isLoading = true;
        appState.dataSource = 'loading';
        updateLoadingState(true);
        updateRefreshButtonState(true);
        
        try {
            const result = await gitHubData.getConfigs(forceRefresh);
            
            // Обновляем состояние источника данных
            appState.dataSource = result.fromCache ? 'cache' : 'fresh';
            appState.lastUpdate = new Date();
            
            if (result.success) {
                appState.configs = result.data;
                appState.filteredConfigs = [...result.data];
                
                // Обновляем статистику
                updateStats(result.data, result.meta);
                
                // Рендерим конфиги
                renderConfigs();
                
                // Показываем уведомление только если данные из кэша
                if (result.fromCache && !forceRefresh) {
                    showDataSourceNotification(result);
                }
                
                if (forceRefresh) {
                    showNotification('Конфиги успешно обновлены', 'success');
                }
                
                console.log(`[App] Загружено ${result.data.length} конфигов (${result.fromCache ? 'из кэша' : 'свежие'})`);
            } else {
                appState.dataSource = 'error';
                showNotification('Используем кэшированные данные из-за ошибки', 'warning');
            }
        } catch (error) {
            console.error('[App] Ошибка загрузки конфигов:', error);
            appState.dataSource = 'error';
            showNotification('Ошибка загрузки конфигов', 'error');
        } finally {
            appState.isLoading = false;
            updateLoadingState(false);
            updateRefreshButtonState(false);
            updateDataSourceIndicator();
        }
    }
    
    /**
     * Принудительное обновление конфигов
     */
    async function refreshConfigs() {
        console.log('[App] Принудительное обновление...');
        await loadConfigs(true);
    }
    
    /**
     * Уведомление об источнике данных
     */
    function showDataSourceNotification(result) {
        const cacheAge = result.timestamp ? Date.now() - result.timestamp : null;
        
        if (cacheAge && cacheAge < 60000) { // Меньше минуты
            // Не показываем уведомление для свежего кэша
            return;
        }
        
        const ageText = cacheAge ? 
            `${Math.floor(cacheAge / 1000)} секунд назад` : 
            'недавно';
        
        showNotification(
            `Данные из кэша (обновлены ${ageText}). Нажмите "Обновить конфиги" для загрузки свежих данных.`,
            'info',
            5000
        );
    }
    
    /**
     * Обновление состояния кнопки обновления
     */
    function updateRefreshButtonState(isLoading) {
        const refreshBtn = document.getElementById('refreshBtn');
        if (!refreshBtn) return;
        
        if (isLoading) {
            refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Загрузка...';
            refreshBtn.disabled = true;
            refreshBtn.style.opacity = '0.7';
        } else {
            refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Обновить конфиги';
            refreshBtn.disabled = false;
            refreshBtn.style.opacity = '1';
        }
    }
    
    /**
     * Обновление индикатора источника данных
     */
    function updateDataSourceIndicator() {
        // Можно добавить индикатор в интерфейс
        const statsBar = document.querySelector('.stats-bar');
        if (!statsBar) return;
        
        // Ищем или создаем индикатор
        let indicator = document.getElementById('dataSourceIndicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'dataSourceIndicator';
            indicator.className = 'stat';
            indicator.style.cssText = `
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 0.85rem;
            `;
            statsBar.appendChild(indicator);
        }
        
        const icons = {
            'fresh': 'fas fa-check-circle',
            'cache': 'fas fa-history',
            'error': 'fas fa-exclamation-triangle',
            'loading': 'fas fa-spinner fa-spin'
        };
        
        const colors = {
            'fresh': '#2ecc71',
            'cache': '#f39c12',
            'error': '#e74c3c',
            'loading': '#3498db'
        };
        
        const texts = {
            'fresh': 'Свежие данные',
            'cache': 'Данные из кэша',
            'error': 'Ошибка загрузки',
            'loading': 'Загрузка...'
        };
        
        const source = appState.dataSource;
        indicator.innerHTML = `
            <i class="${icons[source]}" style="color: ${colors[source]}"></i>
            <span>${texts[source]}</span>
        `;
        
        // Добавляем время обновления
        if (appState.lastUpdate && source !== 'loading') {
            const timeAgo = Math.floor((Date.now() - appState.lastUpdate) / 1000);
            const timeText = timeAgo < 60 ? 
                `${timeAgo} сек назад` : 
                `${Math.floor(timeAgo / 60)} мин назад`;
            
            indicator.innerHTML += `<span style="margin-left: 5px; opacity: 0.7;">(${timeText})</span>`;
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
    
    // Остальные функции остаются без изменений...
    // ... (фильтры, поиск, рендеринг и т.д.)
    
    /**
     * Запуск проверки обновлений
     */
    function startUpdateChecker() {
        // Проверяем обновления каждую минуту
        setInterval(async () => {
            try {
                const updateInfo = await gitHubData.checkForUpdates();
                if (updateInfo && appState.dataSource === 'cache') {
                    console.log('[App] Обнаружены обновления на сервере');
                    // Можно показать уведомление или автоматически обновить
                    // showNotification('Доступны обновления конфигов', 'info');
                }
            } catch (error) {
                console.warn('[App] Ошибка проверки обновлений:', error);
            }
        }, 60 * 1000); // 1 минута
    }
    
    // Экспортируем публичные методы
    window.app = {
        loadConfigs,
        refreshConfigs,
        resetFilters,
        getState: () => ({ ...appState }),
        getGitHubStats: () => gitHubData.getStats()
    };
});
