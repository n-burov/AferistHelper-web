const fs = require('fs').promises;
const path = require('path');

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Метод не разрешен' });
        return;
    }

    try {
        // Получаем данные из тела запроса
        const { donors } = req.body;

        if (!donors || !Array.isArray(donors)) {
            res.status(400).json({ error: 'Некорректные данные: ожидается массив донатеров' });
            return;
        }

        // Проверяем структуру данных
        for (let donor of donors) {
            if (typeof donor.id !== 'number' || typeof donor.name !== 'string' || typeof donor.amount !== 'number') {
                res.status(400).json({ error: 'Некорректная структура данных донатера' });
                return;
            }
        }

        // Определяем путь к файлу
        const filePath = path.join(process.cwd(), 'top-donors', 'top-donors.json');

        // Записываем обновленные данные
        await fs.writeFile(filePath, JSON.stringify(donors, null, 2));

        res.status(200).json({ success: true, message: 'Топ донатеров успешно обновлен' });
    } catch (error) {
        console.error('Ошибка при обновлении топа донатеров:', error);
        res.status(500).json({ error: 'Ошибка сервера при обновлении топа донатеров' });
    }
};
