/**
 * УЛЬТРА-ДИАГНОСТИЧЕСКАЯ версия приложения
 * Показывает все ошибки прямо на странице
 */

// Сначала добавим стили для отображения ошибок
const errorStyles = document.createElement('style');
errorStyles.textContent = `
    .error-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.9);
        z-index: 99999;
        padding: 40px;
        overflow-y: auto;
        color: white;
        font-family: 'Courier New', monospace;
    }
    
    .error-header {
        background: #e74c3c;
        padding: 20px;
        border-radius: 10px 10px 0 0;
        margin-bottom: 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .error-content {
        background: #2c3e50;
        padding: 30px;
        border-radius: 0 0 10px 10px;
        overflow-x: auto;
    }
    
    .error-title {
        margin: 0;
        font-size: 24px;
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    .close-error {
        background: white;
        color: #e74c3c;
        border: none;
        padding: 10px 20px;
        border-radius: 5px;
        cursor: pointer;
        font-weight: bold;
    }
    
    .debug-section {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 5px;
        padding: 15px;
        margin-bottom: 15px;
    }
    
    .debug-section h4 {
        margin-top: 0;
        color: #3498db;
        border-bottom: 1px solid #3498db;
        padding-bottom: 5px;
    }
    
    .debug-info {
        background: rgba(0, 0, 0, 0.3);
        padding: 10px;
        border-radius: 3px;
        font-family: 'Courier New', monospace;
        font-size: 14px;
        overflow-x: auto;
        white-space: pre-wrap;
    }
    
    .status-badge {
        display: inline-block;
        padding: 3px 8px;
        border-radius: 3px;
        font-size: 12px;
        font-weight: bold;
        margin-left: 10px;
    }
    
    .status-success { background: #2ecc71; color: white; }
    .status-error { background: #e74c3c; color: white; }
    .status-warning { background: #f39c12; color: white; }
    .status-info { background: #3498db; color: white; }
`;
document.head.appendChild(errorStyles);

// Глобальный обработчик ошибок
window.addEventListener('error', function(event) {
    console.error('Глобальная ошибка:', event.error);
    showErrorOverlay({
        type: 'Глобальная ошибка',
        message: event.message,
        error: event.error,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
    });
});

window.addEventListener('unhandledrejection', function(event) {
    console.error('Необработанный Promise rejection:', event.reason);
    showErrorOverlay({
        type: 'Promise rejection',
        message: event.reason?.message || 'Неизвестная ошибка Promise',
        error: event.reason
    });
});

// Функция показа ошибки
function showErrorOverlay(errorInfo) {
    // Удаляем старый оверлей если есть
    const oldOverlay = document.querySelector('.error-overlay');
    if (oldOverlay) oldOverlay.remove();
    
    const overlay = document.createElement('div');
    overlay.className = 'error-overlay';
    
    // Собираем всю возможную информацию
    const appState = window.app?.getState?.() || 'app недоступен';
    const githubData = window.gitHubData || 'gitHubData недоступен';
    const configUrl = 'https://raw.githubusercontent.com/n-burov/AferistHelper-web/main/configs/configs.json';
    
    overlay.innerHTML = `
        <div class="error-header">
            <h2 class="error-title">
                <i class="fas fa-exclamation-triangle"></i>
                Критическая ошибка приложения
            </h2>
            <button class="close-error" onclick="this.parentElement.parentElement.remove()">
                Закрыть
            </button>
        </div>
        
        <div class="error-content">
            <div class="debug-section">
                <h4>Основная ошибка</h4>
                <div class="debug-info">
Тип: ${errorInfo.type}
Сообщение: ${errorInfo.message}
Файл: ${errorInfo.filename || 'неизвестно'}
Строка: ${errorInfo.lineno || 'неизвестно'}
Колонка: ${errorInfo.colno || 'неизвестно'}
                </div>
            </div>
            
            <div class="debug-section">
                <h4>Состояние приложения</h4>
                <div class="debug-info">
${JSON.stringify(appState, null, 2)}
                </div>
            </div>
            
            <div class="debug-section">
                <h4>Проверка доступности файла конфигов</h4>
                <div id="fileCheckResult" class="debug-info">
Проверяем доступность ${configUrl}...
                </div>
            </div>
            
            <div class="debug-section">
                <h4>Действия для решения</h4>
                <div class="debug-info">
1. Откройте консоль браузера (F12) для подробных логов
2. Проверьте URL файла: <a href="${configUrl}" target="_blank" style="color: #3498db;">${configUrl}</a>
3. Убедитесь что файл существует в репозитории
4. Проверьте права доступа к репозиторию
5. Попробуйте очистить кэш браузера (Ctrl+F5)
                </div>
                <div style="margin-top: 15px;">
                    <button onclick="testFileAccess()" style="
                        background: #3498db;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 5px;
                        cursor: pointer;
                        margin-right: 10px;
                    ">
                        <i class="fas fa-check"></i> Проверить доступность файла
                    </button>
                    <button onclick="location.reload(true)" style="
                        background: #2ecc71;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 5px;
                        cursor: pointer;
                    ">
                        <i class="fas fa-sync-alt"></i> Перезагрузить страницу
                    </button>
                </div>
            </div>
            
            <div class="debug-section">
                <h4>Стек ошибки</h4>
                <div class="debug-info">
${errorInfo.error?.stack || 'Стек не доступен'}
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Проверяем доступность файла
    testFileAccess();
}

// Функция проверки доступа к файлу
async function testFileAccess() {
    const resultElement = document.getElementById('fileCheckResult');
    if (!resultElement) return;
    
    const configUrl = 'https://raw.githubusercontent.com/n-burov/AferistHelper-web/main/configs/configs.json';
    
    try {
        resultElement.innerHTML = `Проверяем доступность ${configUrl}...`;
        
        const startTime = Date.now();
        const response = await fetch(configUrl, { cache: 'no-cache' });
        const duration = Date.now() - startTime;
        
        if (response.ok) {
            const text = await response.text();
            let status = '✅ ФАЙЛ ДОСТУПЕН!';
            
            try {
                const json = JSON.parse(text);
                status += `\nНайдено конфигов: ${json.configs?.length || 0}`;
                status += `\nМета: ${JSON.stringify(json.meta || {})}`;
            } catch (e) {
                status += `\n⚠️ Ошибка парсинга JSON: ${e.message}`;
            }
            
            resultElement.innerHTML = `
URL: ${configUrl}
Статус: ${response.status} ${response.statusText}
Время ответа: ${duration}ms
Размер: ${text.length} символов
${status}
            `;
        } else {
            resultElement.innerHTML = `
❌ ФАЙЛ НЕ ДОСТУПЕН!
URL: ${configUrl}
Статус: ${response.status} ${response.statusText}
Проверьте:
1. Существует ли файл в репозитории
2. Правильно ли указан путь
3. Публичный ли репозиторий
            `;
        }
    } catch (error) {
        resultElement.innerHTML = `
❌ ОШИБКА ПРИ ПРОВЕРКЕ!
URL: ${configUrl}
Ошибка: ${error.message}
Возможные причины:
1. Проблемы с интернет-соединением
2. CORS ошибки
3. Блокировка запросов
        `;
    }
}

// Теперь основной код приложения
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 APP START - Ультра-диагностическая версия');
    
    try {
        // Сразу показываем статус загрузки
        updateLoadingState(true, 'Инициализация...');
        
        // 1. Проверяем загрузку всех скриптов
        console.log('1. Проверка загрузки скриптов:');
        const scripts = ['utils.js', 'github-data.js', 'app.js'];
        scripts.forEach(script => {
            console.log(`   ${script}: ${document.querySelector(`script[src*="${script}"]`) ? '✅' : '❌'}`);
        });
        
        // 2. Проверяем наличие gitHubData
        console.log('2. Проверка глобальных объектов:');
        console.log('   window.gitHubData:', window.gitHubData ? '✅' : '❌');
        
        if (!window.gitHubData) {
            throw new Error('gitHubData не загружен! Проверьте загрузку github-data.js');
        }
        
        // 3. Проверяем конфигурацию
        console.log('3. Конфигурация gitHubData:');
        console.log('   Owner:', gitHubData.config?.owner);
        console.log('   Repo:', gitHubData.config?.repo);
        console.log('   Branch:', gitHubData.config?.branch);
        
        if (gitHubData.config?.owner !== 'n-burov' || gitHubData.config?.repo !== 'AferistHelper-web') {
            console.warn('⚠️ Конфигурация не совпадает с ожидаемой!');
        }
        
        // 4. Пробуем загрузить конфиги напрямую (без кэша)
        console.log('4. Прямая загрузка конфигов...');
        updateLoadingState(true, 'Загрузка конфигов...');
        
        const testUrl = 'https://raw.githubusercontent.com/n-burov/AferistHelper-web/main/configs/configs.json';
        console.log('   URL:', testUrl);
        
        try {
            const response = await fetch(testUrl + '?t=' + Date.now());
            console.log('   Статус:', response.status, response.ok);
            
            if (response.ok) {
                const text = await response.text();
                console.log('   Размер ответа:', text.length, 'символов');
                
                try {
                    const data = JSON.parse(text);
                    console.log('✅ JSON успешно распарсен!');
                    console.log('   Конфигов:', data.configs?.length || 0);
                    console.log('   Мета:', data.meta);
                    
                    // Теперь используем gitHubData
                    const result = await gitHubData.getConfigs(true);
                    console.log('5. Результат через gitHubData:', result);
                    
                    if (result.success || result.data?.length > 0) {
                        // Успех! Рендерим конфиги
                        renderConfigs(result.data || []);
                        updateLoadingState(false);
                        showNotification('Конфиги успешно загружены!', 'success');
                    } else {
                        throw new Error('gitHubData вернул пустой результат: ' + (result.error || 'неизвестная ошибка'));
                    }
                    
                } catch (jsonError) {
                    throw new Error('Ошибка парсинга JSON: ' + jsonError.message);
                }
            } else {
                throw new Error(`HTTP ошибка: ${response.status} ${response.statusText}`);
            }
        } catch (fetchError) {
            throw new Error('Ошибка загрузки файла: ' + fetchError.message);
        }
        
    } catch (error) {
        console.error('❌ КРИТИЧЕСКАЯ ОШИБКА:', error);
        
        // Показываем ошибку в UI
        showErrorOverlay({
            type: 'Инициализация приложения',
            message: error.message,
            error: error
        });
        
        // Также показываем простую версию для пользователя
        const grid = document.getElementById('configsGrid');
        if (grid) {
            grid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                    <div style="font-size: 4rem; color: #e74c3c; margin-bottom: 20px;">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <h3 style="color: #e74c3c; margin-bottom: 15px;">
                        Ошибка загрузки конфигов
                    </h3>
                    <p style="margin-bottom: 20px; color: rgba(255, 255, 255, 0.8);">
                        ${error.message}
                    </p>
                    <div style="margin-top: 30px;">
                        <button onclick="location.reload(true)" style="
                            background: #3498db;
                            color: white;
                            border: none;
                            padding: 12px 24px;
                            border-radius: 8px;
                            cursor: pointer;
                            font-weight: bold;
                            margin-right: 10px;
                        ">
                            <i class="fas fa-sync-alt"></i> Перезагрузить страницу
                        </button>
                        <button onclick="testFileAccess()" style="
                            background: #2ecc71;
                            color: white;
                            border: none;
                            padding: 12px 24px;
                            border-radius: 8px;
                            cursor: pointer;
                            font-weight: bold;
                        ">
                            <i class="fas fa-check"></i> Проверить доступность
                        </button>
                    </div>
                    <div style="margin-top: 30px; padding: 20px; background: rgba(255, 255, 255, 0.1); border-radius: 8px;">
                        <p style="margin-bottom: 10px; font-size: 0.9em; color: rgba(255, 255, 255, 0.7);">
                            Для разработчика: откройте консоль (F12) для подробной диагностики
                        </p>
                        <button onclick="console.clear(); console.log('App state:', window.app?.getState?.()); console.log('GitHubData:', window.gitHubData);" style="
                            background: transparent;
                            color: #3498db;
                            border: 1px solid #3498db;
                            padding: 8px 16px;
                            border-radius: 4px;
                            cursor: pointer;
                            font-size: 0.9em;
                        ">
                            Показать состояние в консоли
                        </button>
                    </div>
                </div>
            `;
        }
        
        updateLoadingState(false);
    }
    
    // Создаем кнопку диагностики в UI
    createDiagnosticButton();
});

// Функция рендеринга конфигов с безопасным копированием
function renderConfigs(configs) {
    const grid = document.getElementById('configsGrid');
    if (!grid) return;
    
    // Сохраняем конфиги в глобальной переменной для фильтрации
    window.allConfigs = configs;
    
    if (!configs || configs.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                <div style="font-size: 3rem; color: #3498db; margin-bottom: 20px;">
                    <i class="fas fa-inbox"></i>
                </div>
                <h3 style="margin-bottom: 10px;">Конфиги не найдены</h3>
                <p style="color: rgba(255, 255, 255, 0.7); margin-bottom: 20px;">
                    База конфигов пуста. Добавьте первый конфиг!
                </p>
            </div>
        `;
        return;
    }
    
    // Рендерим конфиги без изменения порядка
    grid.innerHTML = configs.map(config => {
        // Безопасно кодируем конфиг для data-атрибута
        const configEncoded = encodeURIComponent(JSON.stringify(config.config || ''));
        
        return `
        <div class="config-card" 
             data-addon="${config.addon || ''}"
             data-class="${config.class || ''}"
             data-name="${escapeHtml(config.name || '').toLowerCase()}"
             data-description="${escapeHtml(config.description || '').toLowerCase()}">
            <div class="config-header">
                <div class="config-title">${escapeHtml(config.name || 'Без названия')}</div>
                <div class="config-meta">
                    <span class="config-badge addon-${config.addon || 'unknown'}">
                        <i class="${getAddonIcon(config.addon)}"></i> ${(config.addon || 'unknown').toUpperCase()}
                    </span>
                    <span class="config-badge class-${config.class || 'unknown'}">
                        <i class="${getClassIcon(config.class)}"></i> ${getClassLabel(config.class || '')}
                    </span>
                </div>
            </div>
            <div class="config-content">
                <div class="config-description">
                    ${escapeHtml(config.description || 'Нет описания')}
                    <div class="config-footer">
                        <span class="author">👤 ${escapeHtml(config.author || 'Неизвестный автор')}</span>
                        ${config.created ? `<span class="date">📅 ${formatDate(config.created)}</span>` : ''}
                    </div>
                </div>
                <button class="copy-btn" 
                    data-config="${configEncoded}"
                    onclick="copyConfigFromButton(this)">
                    <i class="fas fa-copy"></i> Копировать конфиг
                </button>
            </div>
        </div>
        `;
    }).join('');
    
    // Обновляем счетчики
    updateStats(configs);
    
    // Инициализируем фильтры
    initFilters();
    
    // Обновляем счетчик конфигов
    updateConfigCount(configs.length);
}

// Инициализация фильтров
function initFilters() {
    // Кнопки фильтрации по аддону
    const addonFilterButtons = document.querySelectorAll('#addonFilter .filter-btn');
    addonFilterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Убираем активный класс у всех кнопок в этой группе
            addonFilterButtons.forEach(btn => btn.classList.remove('active'));
            // Добавляем активный класс нажатой кнопке
            button.classList.add('active');
            
            // Применяем фильтры
            filterConfigs();
        });
    });
    
    // Кнопки фильтрации по классу
    const classFilterButtons = document.querySelectorAll('#classFilter .filter-btn');
    classFilterButtons.forEach(button => {
        button.addEventListener('click', () => {
            classFilterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            filterConfigs();
        });
    });
    
    // Поле поиска
    const searchInput = document.getElementById('searchInput');
    const clearSearchBtn = document.getElementById('clearSearch');
    
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            filterConfigs();
            
            // Показываем/скрываем кнопку очистки
            if (clearSearchBtn) {
                clearSearchBtn.style.display = searchInput.value ? 'flex' : 'none';
            }
        });
    }
    
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', () => {
            if (searchInput) {
                searchInput.value = '';
                searchInput.focus();
                clearSearchBtn.style.display = 'none';
                filterConfigs();
            }
        });
    }
}

// Фильтрация конфигов
function filterConfigs() {
    if (!window.allConfigs || !window.allConfigs.length) return;
    
    // Получаем активные фильтры
    const activeAddon = document.querySelector('#addonFilter .filter-btn.active')?.dataset.addon || 'all';
    const activeClass = document.querySelector('#classFilter .filter-btn.active')?.dataset.class || 'all';
    const searchQuery = document.getElementById('searchInput')?.value?.toLowerCase().trim() || '';
    
    // Фильтруем конфиги
    const filteredConfigs = window.allConfigs.filter(config => {
        // Проверяем фильтр по аддону
        const addonMatches = activeAddon === 'all' || activeAddon === config.addon;
        
        // Проверяем фильтр по классу
        const classMatches = activeClass === 'all' || activeClass === config.class;
        
        // Проверяем поиск
        let searchMatches = true;
        if (searchQuery) {
            const name = (config.name || '').toLowerCase();
            const description = (config.description || '').toLowerCase();
            searchMatches = name.includes(searchQuery) || description.includes(searchQuery);
        }
        
        // ИГНОРИРУЕМ фильтр по роли - всегда true
        const roleMatches = true; // Всегда показываем все конфиги независимо от роли
        
        return addonMatches && classMatches && roleMatches && searchMatches;
    });
    
    // Обновляем отображение
    updateFilteredConfigs(filteredConfigs);
}

// Обновление отфильтрованных конфигов
function updateFilteredConfigs(filteredConfigs) {
    const grid = document.getElementById('configsGrid');
    if (!grid) return;
    
    if (!filteredConfigs || filteredConfigs.length === 0) {
        grid.innerHTML = `
            <div class="no-results" style="display: block; grid-column: 1 / -1; text-align: center; padding: 40px;">
                <i class="fas fa-search"></i>
                <h3>Конфиги не найдены</h3>
                <p>Попробуйте изменить параметры фильтрации</p>
            </div>
        `;
        
        // Обновляем счетчики
        updateConfigCount(0);
        updateSearchResultsCount(0);
        return;
    }
    
    // Обновляем сетку с отфильтрованными конфигами
    grid.innerHTML = filteredConfigs.map(config => {
        const configEncoded = encodeURIComponent(JSON.stringify(config.config || ''));
        
        return `
        <div class="config-card">
            <div class="config-header">
                <div class="config-title">${escapeHtml(config.name || 'Без названия')}</div>
                <div class="config-meta">
                    <span class="config-badge addon-${config.addon || 'unknown'}">
                        <i class="${getAddonIcon(config.addon)}"></i> ${(config.addon || 'unknown').toUpperCase()}
                    </span>
                    <span class="config-badge class-${config.class || 'unknown'}">
                        <i class="${getClassIcon(config.class)}"></i> ${getClassLabel(config.class || '')}
                    </span>
                </div>
            </div>
            <div class="config-content">
                <div class="config-description">
                    ${escapeHtml(config.description || 'Нет описания')}
                    <div class="config-footer">
                        <span class="author">👤 ${escapeHtml(config.author || 'Неизвестный автор')}</span>
                        ${config.created ? `<span class="date">📅 ${formatDate(config.created)}</span>` : ''}
                    </div>
                </div>
                <button class="copy-btn" 
                    data-config="${configEncoded}"
                    onclick="copyConfigFromButton(this)">
                    <i class="fas fa-copy"></i> Копировать конфиг
                </button>
            </div>
        </div>
        `;
    }).join('');
    
    // Обновляем счетчики
    updateConfigCount(filteredConfigs.length);
    updateSearchResultsCount(filteredConfigs.length);
}

// Обновление счетчика конфигов в заголовке
function updateConfigCount(count) {
    const configCountElement = document.getElementById('configCount');
    if (configCountElement) {
        configCountElement.textContent = `(${count})`;
    }
}

// Обновление счетчика результатов поиска
function updateSearchResultsCount(count) {
    const searchResultsCount = document.getElementById('searchResultsCount');
    if (searchResultsCount) {
        searchResultsCount.textContent = count;
    }
}

// Функция для копирования конфига из кнопки
function copyConfigFromButton(button) {
    try {
        const configEncoded = button.getAttribute('data-config');
        if (!configEncoded) {
            showNotification('Конфиг не найден', 'error');
            return;
        }
        
        const config = JSON.parse(decodeURIComponent(configEncoded));
        
        copyToClipboard(config)
            .then(success => {
                if (success) {
                    // Меняем иконку на успех
                    const icon = button.querySelector('i');
                    if (icon) {
                        icon.className = 'fas fa-check';
                        button.classList.add('copied');
                        
                        // Возвращаем иконку обратно через 2 секунды
                        setTimeout(() => {
                            icon.className = 'fas fa-copy';
                            button.classList.remove('copied');
                        }, 2000);
                    }
                    showNotification('Конфиг скопирован в буфер обмена!', 'success');
                } else {
                    showNotification('Не удалось скопировать конфиг', 'error');
                }
            })
            .catch(error => {
                console.error('Ошибка копирования:', error);
                showNotification('Ошибка при копировании', 'error');
            });
    } catch (error) {
        console.error('Ошибка обработки конфига:', error);
        showNotification('Ошибка обработки конфига', 'error');
    }
}

// Обновление статистики
function updateStats(configs) {
    const totalElement = document.getElementById('totalConfigs');
    const authorsElement = document.getElementById('uniqueAuthors');
    const lastUpdatedElement = document.getElementById('lastUpdated');
    
    if (totalElement) {
        totalElement.textContent = configs.length;
    }
    
    if (authorsElement && configs.length > 0) {
        const authors = new Set(configs.map(c => c.author).filter(Boolean));
        authorsElement.textContent = authors.size;
    }
    
    if (lastUpdatedElement && configs.length > 0) {
        // Находим самую свежую дату создания
        const dates = configs
            .map(c => c.created ? new Date(c.created) : null)
            .filter(d => d && !isNaN(d.getTime()));
        
        if (dates.length > 0) {
            const latestDate = new Date(Math.max(...dates.map(d => d.getTime())));
            lastUpdatedElement.textContent = formatDate(latestDate.toISOString());
        }
    }
}

// Обновление состояния загрузки
function updateLoadingState(isLoading, message = 'Загрузка...') {
    const loadingElement = document.querySelector('.loading');
    if (loadingElement) {
        if (isLoading) {
            loadingElement.style.display = 'flex';
            loadingElement.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${message}`;
        } else {
            loadingElement.style.display = 'none';
        }
    }
}

// Создание кнопки диагностики
function createDiagnosticButton() {
    const nav = document.querySelector('nav');
    if (!nav) return;
    
    const diagnosticBtn = document.createElement('a');
    diagnosticBtn.href = '#';
    diagnosticBtn.className = 'contribute-link';
    diagnosticBtn.innerHTML = '<i class="fas fa-bug"></i> Диагностика';
    diagnosticBtn.style.marginLeft = '10px';
    
    diagnosticBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        
        // Запускаем диагностику
        console.clear();
        console.log('=== ЗАПУСК ДИАГНОСТИКИ ===');
        
        // Проверяем доступность файла
        await testFileAccess();
        
        // Проверяем состояние gitHubData
        if (window.gitHubData) {
            console.log('GitHubData состояние:', {
                isLoading: window.gitHubData.isLoading,
                lastError: window.gitHubData.lastError,
                stats: window.gitHubData.stats,
                cache: window.gitHubData.cache
            });
            
            // Запускаем встроенную диагностику
            try {
                const results = await window.gitHubData.diagnose();
                console.log('Результаты диагностики GitHubData:', results);
            } catch (diagnoseError) {
                console.error('Ошибка диагностики:', diagnoseError);
            }
        }
        
        alert('Диагностика запущена. Проверьте консоль (F12) для подробной информации.');
    });
    
    nav.appendChild(diagnosticBtn);
}

// Вспомогательные функции
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getAddonIcon(addon) {
    const icons = {
        'elvui': 'fas fa-layer-group',
        'wa': 'fas fa-bolt',
        'details': 'fas fa-chart-bar',
        'plater': 'fas fa-users',
        'dbm': 'fas fa-clock',
        'bigwigs': 'fas fa-hourglass-half'
    };
    return icons[addon] || 'fas fa-plug';
}

function getClassIcon(className) {
    const icons = {
        'warrior': 'fas fa-shield-alt',
        'paladin': 'fas fa-sun',
        'deathknight': 'fas fa-skull',
        'mage': 'fas fa-fire',
        'priest': 'fas fa-cross',
        'rogue': 'fas fa-user-secret',
        'shaman': 'fas fa-bolt',
        'hunter': 'fas fa-bow-arrow',
        'warlock': 'fas fa-hat-wizard',
        'druid': 'fas fa-paw',
        'universal': 'fas fa-users'
    };
    return icons[className] || 'fas fa-user';
}

function getClassLabel(className) {
    const labels = {
        'warrior': 'Воин',
        'paladin': 'Паладин',
        'deathknight': 'Рыцарь смерти',
        'mage': 'Маг',
        'priest': 'Жрец',
        'rogue': 'Разбойник',
        'shaman': 'Шаман',
        'hunter': 'Охотник',
        'warlock': 'Чернокнижник',
        'druid': 'Друид',
        'universal': 'Универсальный'
    };
    return labels[className] || className;
}

function formatDate(dateString) {
    if (!dateString) return 'Неизвестно';
    
    try {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        
        // Если сегодня
        if (diff < 24 * 60 * 60 * 1000) {
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            return `сегодня в ${hours}:${minutes}`;
        }
        
        // Если вчера
        if (diff < 48 * 60 * 60 * 1000) {
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            return `вчера в ${hours}:${minutes}`;
        }
        
        // Более 2 дней назад
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        
        return `${day}.${month}.${year}`;
    } catch (error) {
        return dateString;
    }
}

// Экспортируем глобальные функции
window.testFileAccess = testFileAccess;
window.showErrorOverlay = showErrorOverlay;
window.copyConfigFromButton = copyConfigFromButton;
window.renderConfigs = renderConfigs;
window.filterConfigs = filterConfigs;

// Добавляем CSS для кнопки копирования
const copyButtonStyles = document.createElement('style');
copyButtonStyles.textContent = `
    .copy-btn.copied {
        background-color: #2ecc71 !important;
    }
    
    .copy-btn.copied:hover {
        background-color: #27ae60 !important;
    }
    
    .config-card {
        transition: transform 0.2s ease;
        display: block !important;
    }
    
    .config-card:hover {
        transform: translateY(-2px);
    }
    
    /* Стили для активных кнопок фильтров */
    .filter-btn.active {
        background-color: #3498db !important;
        color: white !important;
        border-color: #3498db !important;
    }
    
    /* Показываем кнопку очистки поиска */
    .clear-btn {
        display: none;
        align-items: center;
        justify-content: center;
        background: rgba(255, 255, 255, 0.1);
        border: none;
        color: rgba(255, 255, 255, 0.6);
        cursor: pointer;
        padding: 0 10px;
        border-radius: 0 5px 5px 0;
        transition: all 0.2s;
    }
    
    .clear-btn:hover {
        background: rgba(255, 255, 255, 0.2);
        color: white;
    }
`;
document.head.appendChild(copyButtonStyles);

console.log('🚀 Ультра-диагностическая версия загружена!');
