class Guides {
    constructor() {
        this.guides = [];
        this.init();
    }

    async init() {
        await this.loadGuides();
        this.renderGuides();
    }

    async loadGuides() {
        try {
            const response = await fetch('guides/guides.json');
            if (!response.ok) {
                throw new Error('Не удалось загрузить гайды');
            }
            this.guides = await response.json();
        } catch (error) {
            console.error('Ошибка загрузки гайдов:', error);
            document.getElementById('guidesList').innerHTML = 
                '<div class="error">Не удалось загрузить гайды. Попробуйте позже.</div>';
        }
    }

    renderGuides() {
        const container = document.getElementById('guidesList');
        if (!container) return;

        if (this.guides.length === 0) {
            container.innerHTML = '<div class="empty">Гайды пока не добавлены</div>';
            return;
        }

        container.innerHTML = this.guides.map(guide => `
            <div class="guide-card">
                <div class="guide-content">
                    <h3>${this.escapeHtml(guide.title)}</h3>
                    <p class="guide-author">Автор: ${this.escapeHtml(guide.author)}</p>
                    <p class="guide-description">${this.escapeHtml(guide.description)}</p>
                    <a href="${this.escapeHtml(guide.youtubeUrl)}" target="_blank" class="youtube-btn">
                        <i class="fab fa-youtube"></i> Смотреть на YouTube
                    </a>
                </div>
            </div>
        `).join('');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    new Guides();
});
