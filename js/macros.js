/**
 * Скрипт для страницы макросов
 * Загружает и отображает макросы из GitHub
 */

// Глобальные переменные
let allMacros = [];

// Вспомогательные функции
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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
        'hunter': 'fas fa-bullseye',
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

// Функция для загрузки макросов
async function loadMacros() {
    try {
        showLoading(true, 'Загрузка макросов...');
        
        console.log('🚀 Загрузка макросов...');
        
        // Пробуем загрузить макросы напрямую
        const macrosUrl = 'https://raw.githubusercontent.com/n-burov/AferistHelper-web/main/macros/macros.json';
        console.log('📥 Загружаем макросы из:', macrosUrl);
        
        const response = await fetch(macrosUrl + '?t=' + Date.now());
        
        if (!response.ok) {
            throw new Error(`HTTP ошибка: ${response.status} ${response.statusText}`);
        }
        
        const text = await response.text();
        console.log('✅ Данные получены, размер:', text.length, 'символов');
        
        const data = JSON.parse(text);
        console.log('📊 Макросы загружены:', {
            count: data.macros?.length || 0,
            meta: data.meta
        });
        
        if (!data.macros || !Array.isArray(data.macros)) {
            throw new Error('Некорректная структура данных макросов');
        }
        
        // Сохраняем макросы
        allMacros = data.macros;
        
        // Рендерим макросы
        renderMacros(allMacros);
        showLoading(false);
        
        showNotification(`Загружено ${allMacros.length} макросов!`, 'success');
        
    } catch (error) {
        console.error('❌ Ошибка загрузки макросов:', error);
        showLoading(false);
        
        // Показываем сообщение об ошибке
        const grid = document.getElementById('macrosGrid');
        if (grid) {
            grid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                    <div style="font-size: 3rem; color: #e74c3c; margin-bottom: 20px;">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <h3 style="color: #e74c3c; margin-bottom: 15px;">
                        Ошибка загрузки макросов
                    </h3>
                    <p style="margin-bottom: 20px; color: rgba(255, 255, 255, 0.8);">
                        ${error.message}
                    </p>
                    <p style="margin-bottom: 20px; color: rgba(255, 255, 255, 0.6);">
                        Убедитесь, что файл macros/macros.json существует в репозитории
                    </p>
                    <button onclick="location.reload(true)" style="
                        background: #3498db;
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: bold;
                    ">
                        <i class="fas fa-sync-alt"></i> Перезагрузить страницу
                    </button>
                </div>
            `;
        }
        
        showNotification('Ошибка загрузки макросов', 'error');
    }
}

// Функция рендеринга макросов
function renderMacros(macros) {
    const grid = document.getElementById('macrosGrid');
    if (!grid) return;
    
    if (!macros || macros.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                <div style="font-size: 3rem; color: #3498db; margin-bottom: 20px;">
                    <i class="fas fa-inbox"></i>
                </div>
                <h3 style="margin-bottom: 10px;">Макросы не найдены</h3>
                <p style="color: rgba(255, 255, 255, 0.7); margin-bottom: 20px;">
                    База макросов пуста. Добавьте первый макрос!
                </p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = macros.map(macro => {
        // Безопасно кодируем макрос для data-атрибута
        const macroEncoded = encodeURIComponent(macro.macro || '');
        
        return `
        <div class="macro-card" 
             data-class="${macro.class || ''}"
             data-name="${escapeHtml(macro.name || '').toLowerCase()}"
             data-description="${escapeHtml(macro.description || '').toLowerCase()}">
            <div class="macro-header">
                <div class="macro-title">${escapeHtml(macro.name || 'Без названия')}</div>
                <div class="macro-meta">
                    <span class="macro-badge class-${macro.class}">
                        <i class="${getClassIcon(macro.class)}"></i> ${getClassLabel(macro.class || '')}
                    </span>
                </div>
            </div>
            <div class="macro-content">
                <div class="macro-description">
                    ${escapeHtml(macro.description || 'Нет описания')}
                    <div class="macro-footer">
                        <span class="author">👤 ${escapeHtml(macro.author || 'Неизвестный автор')}</span>
                        ${macro.created ? `<span class="date">📅 ${formatDate(macro.created)}</span>` : ''}
                    </div>
                </div>
                <div class="macro-actions">
                    <button class="copy-macro-btn" 
                        data-macro="${macroEncoded}"
                        onclick="copyMacroFromButton(this)">
                        <i class="fas fa-copy"></i> Копировать макрос
                    </button>
                </div>
                ${macro.macro ? `<div class="macro-preview">
                    <pre><code>${escapeHtml(macro.macro.substring(0, 200))}${macro.macro.length > 200 ? '...' : ''}</code></pre>
                </div>` : ''}
            </div>
        </div>
        `;
    }).join('');
    
    // Обновляем статистику
    updateStats(macros);
    
    // Инициализируем фильтры
    initFilters();
    
    // Обновляем счетчик
    updateMacrosCount(macros.length);
}

// Функция для копирования макроса
function copyMacroFromButton(button) {
    try {
        const macroEncoded = button.getAttribute('data-macro');
        if (!macroEncoded) {
            showNotification('Макрос не найден', 'error');
            return;
        }
        
        // Декодируем макрос (многострочный текст с сохранением форматирования)
        const macro = decodeURIComponent(macroEncoded);
        
        // Копируем макрос как есть, с переносами строк
        copyToClipboard(macro)
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
                    showNotification('Макрос скопирован в буфер обмена!', 'success');
                } else {
                    showNotification('Не удалось скопировать макрос', 'error');
                }
            })
            .catch(error => {
                console.error('Ошибка копирования:', error);
                showNotification('Ошибка при копировании', 'error');
            });
    } catch (error) {
        console.error('Ошибка обработки макроса:', error);
        showNotification('Ошибка обработки макроса', 'error');
    }
}

// Инициализация фильтров (ТОЛЬКО по классу)
function initFilters() {
    // Кнопки фильтрации по классу
    const classFilterButtons = document.querySelectorAll('#classFilter .filter-btn');
    classFilterButtons.forEach(button => {
        button.addEventListener('click', () => {
            classFilterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            filterMacros();
        });
    });
    
    // Поле поиска
    const searchInput = document.getElementById('searchInput');
    const clearSearchBtn = document.getElementById('clearSearch');
    
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            filterMacros();
            
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
                filterMacros();
            }
        });
    }
}

// Фильтрация макросов (ТОЛЬКО по классу и поиску)
function filterMacros() {
    if (!allMacros || !allMacros.length) return;
    
    // Получаем активные фильтры
    const activeClass = document.querySelector('#classFilter .filter-btn.active')?.dataset.class || 'all';
    const searchQuery = document.getElementById('searchInput')?.value?.toLowerCase().trim() || '';
    
    // Фильтруем макросы
    const filteredMacros = allMacros.filter(macro => {
        // Проверяем фильтр по классу
        const classMatches = activeClass === 'all' || activeClass === macro.class;
        
        // Проверяем поиск
        let searchMatches = true;
        if (searchQuery) {
            const name = (macro.name || '').toLowerCase();
            const description = (macro.description || '').toLowerCase();
            const macroText = (macro.macro || '').toLowerCase();
            searchMatches = name.includes(searchQuery) || 
                           description.includes(searchQuery) ||
                           macroText.includes(searchQuery);
        }
        
        return classMatches && searchMatches;
    });
    
    // Обновляем отображение
    updateFilteredMacros(filteredMacros);
}

// Обновление отфильтрованных макросов
function updateFilteredMacros(filteredMacros) {
    const grid = document.getElementById('macrosGrid');
    const noResultsElement = document.getElementById('noResults');
    
    if (!filteredMacros || filteredMacros.length === 0) {
        if (grid) {
            grid.innerHTML = '';
        }
        if (noResultsElement) {
            noResultsElement.style.display = 'block';
        }
        
        updateMacrosCount(0);
        updateSearchResultsCount(0);
        return;
    }
    
    if (noResultsElement) {
        noResultsElement.style.display = 'none';
    }
    
    // Рендерим отфильтрованные макросы
    renderMacros(filteredMacros);
    
    // Обновляем счетчики
    updateMacrosCount(filteredMacros.length);
    updateSearchResultsCount(filteredMacros.length);
}

// Обновление статистики
function updateStats(macros) {
    const totalElement = document.getElementById('totalMacros');
    const authorsElement = document.getElementById('uniqueAuthors');
    const lastUpdatedElement = document.getElementById('lastUpdated');
    
    if (totalElement) {
        totalElement.textContent = macros.length;
    }
    
    if (authorsElement && macros.length > 0) {
        const authors = new Set(macros.map(m => m.author).filter(Boolean));
        authorsElement.textContent = authors.size;
    }
    
    if (lastUpdatedElement && macros.length > 0) {
        const dates = macros
            .map(m => m.created ? new Date(m.created) : null)
            .filter(d => d && !isNaN(d.getTime()));
        
        if (dates.length > 0) {
            const latestDate = new Date(Math.max(...dates.map(d => d.getTime())));
            lastUpdatedElement.textContent = formatDate(latestDate.toISOString());
        }
    }
}

// Обновление счетчика макросов
function updateMacrosCount(count) {
    const macrosCountElement = document.getElementById('macrosCount');
    if (macrosCountElement) {
        macrosCountElement.textContent = `(${count})`;
    }
}

// Обновление счетчика результатов поиска
function updateSearchResultsCount(count) {
    const searchResultsCount = document.getElementById('searchResultsCount');
    if (searchResultsCount) {
        searchResultsCount.textContent = count;
    }
}

// Показать/скрыть загрузку
function showLoading(show, message = 'Загрузка...') {
    const loadingElement = document.querySelector('.loading');
    if (loadingElement) {
        if (show) {
            loadingElement.style.display = 'flex';
            loadingElement.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${message}`;
        } else {
            loadingElement.style.display = 'none';
        }
    }
}

// Запуск при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Макросы - Загрузка страницы');
    loadMacros();
    
    // Добавляем CSS для макросов
    addMacrosStyles();
});

// Добавляем стили для макросов
function addMacrosStyles() {
    const styles = document.createElement('style');
    styles.textContent = `
        .macros-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        
        .macro-card {
            background: rgba(30, 30, 40, 0.7);
            border-radius: 12px;
            padding: 20px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
        }
        
        .macro-card:hover {
            border-color: rgba(52, 152, 219, 0.5);
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
        }
        
        .macro-header {
            margin-bottom: 15px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            padding-bottom: 10px;
        }
        
        .macro-title {
            font-size: 1.2em;
            font-weight: bold;
            color: white;
            margin-bottom: 8px;
        }
        
        .macro-meta {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
        }
        
        .macro-badge {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 0.8em;
            background: rgba(52, 152, 219, 0.2);
            color: #3498db;
            border: 1px solid rgba(52, 152, 219, 0.3);
        }
        
        .macro-description {
            color: rgba(255, 255, 255, 0.8);
            margin-bottom: 15px;
            line-height: 1.5;
        }
        
        .macro-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 15px;
            font-size: 0.9em;
            color: rgba(255, 255, 255, 0.6);
        }
        
        .macro-actions {
            display: flex;
            gap: 10px;
            margin-bottom: 15px;
        }
        
        .copy-macro-btn {
            flex: 1;
            padding: 10px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: bold;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            background: linear-gradient(135deg, #CC3700, #A52A2A);
            color: white;
        }
        
        .copy-macro-btn:hover {
            background: linear-gradient(135deg, #A52A2A, #CC3700);
        }
        
        .copy-macro-btn.copied {
            background: #2ecc71 !important;
        }
        
        .macro-preview {
            background: rgba(0, 0, 0, 0.3);
            border-radius: 6px;
            padding: 10px;
            margin-top: 10px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .macro-preview pre {
            margin: 0;
            white-space: pre-wrap;
            word-wrap: break-word;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
            color: rgba(255, 255, 255, 0.7);
            max-height: 100px;
            overflow-y: auto;
        }
        
        .filter-btn.active {
            background-color: #CC3700 !important;
            color: white !important;
            border-color: #CC3700 !important;
        }
        
        /* Стили для бейджей классов */
        .macro-badge.class-shaman {
            background: rgba(0, 112, 222, 0.2);
            color: #0070de;
            border-color: rgba(0, 112, 222, 0.3);
        }
        
        .macro-badge.class-mage {
            background: rgba(105, 204, 240, 0.2);
            color: #69ccf0;
            border-color: rgba(105, 204, 240, 0.3);
        }
        
        .macro-badge.class-warlock {
            background: rgba(148, 130, 201, 0.2);
            color: #9482c9;
            border-color: rgba(148, 130, 201, 0.3);
        }
        
        .macro-badge.class-druid {
            background: rgba(255, 125, 10, 0.2);
            color: #ff7d0a;
            border-color: rgba(255, 125, 10, 0.3);
        }
        
        .macro-badge.class-warrior {
            background: rgba(199, 156, 110, 0.2);
            color: #c99c6e;
            border-color: rgba(199, 156, 110, 0.3);
        }
        
        .macro-badge.class-paladin {
            background: rgba(245, 140, 186, 0.2);
            color: #f58cba;
            border-color: rgba(245, 140, 186, 0.3);
        }
        
        .macro-badge.class-deathknight {
            background: rgba(196, 31, 59, 0.2);
            color: #c41f3b;
            border-color: rgba(196, 31, 59, 0.3);
        }
        
        .macro-badge.class-priest {
            background: rgba(255, 255, 255, 0.2);
            color: #ffffff;
            border-color: rgba(255, 255, 255, 0.3);
        }
        
        .macro-badge.class-rogue {
            background: rgba(255, 245, 105, 0.2);
            color: #fff569;
            border-color: rgba(255, 245, 105, 0.3);
        }
        
        .macro-badge.class-hunter {
            background: rgba(171, 212, 115, 0.2);
            color: #abd473;
            border-color: rgba(171, 212, 115, 0.3);
        }
        
        .macro-badge.class-universal {
            background: rgba(52, 152, 219, 0.2);
            color: #3498db;
            border-color: rgba(52, 152, 219, 0.3);
        }
    `;
    document.head.appendChild(styles);
}

// Экспортируем глобальные функции
window.copyMacroFromButton = copyMacroFromButton;
window.filterMacros = filterMacros;
