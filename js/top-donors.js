// Загрузка и отображение топа донатеров
document.addEventListener('DOMContentLoaded', function() {
    loadTopDonors();
});

async function loadTopDonors() {
    try {
        const response = await fetch('top-donors/top-donors.json');
        if (!response.ok) {
            throw new Error(`Ошибка загрузки данных: ${response.status}`);
        }
        
        const donors = await response.json();
        displayTopDonors(donors);
    } catch (error) {
        console.error('Ошибка при загрузке топа донатеров:', error);
        // В случае ошибки показываем сообщение об ошибке
        const container = document.getElementById('top-donors-container');
        if (container) {
            container.innerHTML = '<div class="error-message">Ошибка загрузки данных о донатерах</div>';
        }
    }
}

function displayTopDonors(donors) {
    const container = document.getElementById('top-donors-container');
    if (!container) return;

    // Сортируем донатеров по сумме доната в порядке убывания
    const sortedDonors = [...donors].sort((a, b) => b.amount - a.amount);

    // Берем только первые 5 донатеров
    const top5Donors = sortedDonors.slice(0, 5);

    container.innerHTML = top5Donors.map((donor, index) => {
        // Определяем класс для кубка в зависимости от позиции
        let trophyClass = 'gray'; // по умолчанию серый
        switch(index) {
            case 0:
                trophyClass = 'gold';
                break;
            case 1:
                trophyClass = 'silver';
                break;
            case 2:
                trophyClass = 'bronze';
                break;
        }

        return `
            <div class="twitch-donor-item">
                <div class="donor-cup">
                    <i class="fas fa-trophy ${trophyClass}"></i>
                </div>
                <div class="donor-info">
                    <div class="donor-name">${donor.name}</div>
                    <div class="donor-amount">${donor.amount}${donor.currency}</div>
                </div>
            </div>
        `;
    }).join('');
}
