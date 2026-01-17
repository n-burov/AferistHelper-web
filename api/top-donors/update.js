import { Octokit } from '@octokit/rest';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { donors, accessToken } = req.body;
    if (!donors || !Array.isArray(donors) || !accessToken) {
        return res.status(400).json({ error: 'Missing required parameters: donors array and accessToken' });
    }

    try {
        const octokit = new Octokit({ auth: accessToken });
        
        // Получаем текущий top-donors.json
        const { data: currentContent } = await octokit.repos.getContent({
            owner: process.env.GITHUB_OWNER,
            repo: process.env.GITHUB_REPO,
            path: 'top-donors/top-donors.json'
        });

        // Проверяем структуру данных
        for (let donor of donors) {
            if (!donor.hasOwnProperty('id') || !donor.hasOwnProperty('name') || !donor.hasOwnProperty('amount')) {
                return res.status(400).json({ error: 'Некорректная структура данных донатера: отсутствуют обязательные поля (id, name, amount)' });
            }
            
            // Преобразуем числовые поля к нужному типу
            donor.id = Number(donor.id);
            donor.amount = Number(donor.amount);
            
            if (isNaN(donor.id) || isNaN(donor.amount) || typeof donor.name !== 'string') {
                return res.status(400).json({ error: 'Некорректные типы данных донатера' });
            }
        }

        // Обновляем содержимое файла
        const content = Buffer.from(currentContent.content, 'base64').toString('utf8');
        const topDonors = JSON.parse(content);

        // Заменяем содержимое массива донатеров
        const updatedDonors = donors.map(donor => ({
            id: donor.id,
            name: donor.name,
            amount: donor.amount,
            currency: donor.currency || '₽'
        }));

        // Сохраняем в репозиторий
        await octokit.repos.createOrUpdateFileContents({
            owner: process.env.GITHUB_OWNER,
            repo: process.env.GITHUB_REPO,
            path: 'top-donors/top-donors.json',
            message: 'update top donors',
            content: Buffer.from(JSON.stringify(updatedDonors, null, 2)).toString('base64'),
            sha: currentContent.sha
        });

        res.json({ success: true, message: 'Топ донатеров успешно обновлен' });
    } catch (error) {
        console.error('Update error:', error);
        res.status(500).json({ error: 'Failed to update top donors' });
    }
}
