/**
 * Утилиты для проекта
 */
// utils.js - ОБНОВЛЕННАЯ ВЕРСИЯ

// В САМОМ НАЧАЛЕ файла добавьте:
class Logger {
    constructor(name = 'App') {
        this.name = name;
        this.enabled = true;
    }

    log(...args) {
        if (this.enabled) {
            console.log(`[${this.name}]`, ...args);
        }
    }

    info(...args) {
        if (this.enabled) {
            console.info(`[${this.name}]`, ...args);
        }
    }

    warn(...args) {
        if (this.enabled) {
            console.warn(`[${this.name}]`, ...args);
        }
    }

    error(...args) {
        if (this.enabled) {
            console.error(`[${this.name}]`, ...args);
        }
    }
}

// Сразу создаем глобальный экземпляр
const logger = new Logger('App');

// Кэш для уведомлений
let notificationTimeout = null;

/**
 * Показать уведомление
 */
function showNotification(message, type = 'success', duration = 3000) {
    // Удаляем предыдущее уведомление
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Создаем новое уведомление
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-icon">
            <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'times' : 'info'}-circle"></i>
        </div>
        <div class="notification-content">${message}</div>
    `;
    
    // Стили
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#2ecc71' : type === 'error' ? '#e74c3c' : '#3498db'};
        color: white;
        border-radius: 8px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        gap: 10px;
        max-width: 400px;
        backdrop-filter: blur(10px);
    `;
    
    document.body.appendChild(notification);
    
    // Удаляем через duration
    if (notificationTimeout) clearTimeout(notificationTimeout);
    notificationTimeout = setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }
    }, duration);
    
    // Добавляем кнопку закрытия
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '<i class="fas fa-times"></i>';
    closeBtn.style.cssText = `
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        padding: 5px;
        margin-left: 10px;
        opacity: 0.7;
        transition: opacity 0.3s;
    `;
    closeBtn.onmouseover = () => closeBtn.style.opacity = '1';
    closeBtn.onmouseout = () => closeBtn.style.opacity = '0.7';
    closeBtn.onclick = () => notification.remove();
    notification.appendChild(closeBtn);
}

/**
 * Копирование в буфер обмена
 */
function copyToClipboard(text) {
    if (!text) return Promise.resolve(false);
    
    // Проверяем поддержку Clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text)
            .then(() => true)
            .catch(err => {
                console.error('Clipboard API error:', err);
                return fallbackCopyToClipboard(text);
            });
    } else {
        return Promise.resolve(fallbackCopyToClipboard(text));
    }
}

/**
 * Фолбэк для старых браузеров
 */
function fallbackCopyToClipboard(text) {
    try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.top = '0';
        textArea.style.left = '0';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        return successful;
    } catch (err) {
        console.error('Fallback copy error:', err);
        return false;
    }
}

/**
 * Форматирование даты
 */
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

/**
 * Дебаунс функция
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Генерация уникального ID
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Проверка мобильного устройства
 */
function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Получить иконку аддона
 */
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

/**
 * Получить иконку класса
 */
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

/**
 * Получить название класса
 */
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

/**
 * Получить название роли
 */
function getRoleLabel(role) {
    const labels = {
        'tank': 'Танк',
        'healer': 'Хил',
        'dps': 'ДПС',
        'all': 'Все роли'
    };
    return labels[role] || role;
}

/**
 * Показать/скрыть загрузку
 */
function showLoading(show, message = 'Загрузка...') {
    const loadingElement = document.querySelector('.loading');
    if (loadingElement) {
        if (show) {
            loadingElement.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${message}`;
            loadingElement.style.display = 'flex';
        } else {
            loadingElement.style.display = 'none';
        }
    }
}

// Добавляем CSS анимации для уведомлений
if (!document.querySelector('#notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}
