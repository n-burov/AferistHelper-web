import { Octokit } from '@octokit/rest';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { action, guideData, guideId, accessToken } = req.body;
    if (!action || !accessToken) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    // Для действий add и update требуется guideData
    if ((action === 'add' || action === 'update') && !guideData) {
        return res.status(400).json({ error: 'Missing guideData for add/update' });
    }
    
    // Для действия delete требуется guideId
    if (action === 'delete' && !guideId) {
        return res.status(400).json({ error: 'Missing guideId for delete' });
    }

    try {
        const octokit = new Octokit({ auth: accessToken });
        
        // Получаем текущий guides.json
        const { data: currentContent } = await octokit.repos.getContent({
            owner: process.env.GITHUB_OWNER,
            repo: process.env.GITHUB_REPO,
            path: 'guides/guides.json'
        });

        const content = Buffer.from(currentContent.content, 'base64').toString('utf8');
        const guides = JSON.parse(content);

        // Обрабатываем действие
        switch (action) {
            case 'add':
                guides.guides.push(guideData);
                break;
            case 'update':
                const index = guides.guides.findIndex(g => g.id === guideData.id);
                if (index !== -1) guides.guides[index] = guideData;
                break;
            case 'delete':
                guides.guides = guides.guides.filter(g => g.id !== guideId);
                break;
            default:
                return res.status(400).json({ error: 'Invalid action' });
        }

        // Обновляем метаданные
        guides.meta.lastUpdated = new Date().toISOString();
        guides.meta.totalGuides = guides.guides.length;
        guides.meta.updatedBy = (guideData && guideData.author) || 'Unknown';

        // Сохраняем в репозиторий
        await octokit.repos.createOrUpdateFileContents({
            owner: process.env.GITHUB_OWNER,
            repo: process.env.GITHUB_REPO,
            path: 'guides/guides.json',
            message: `${action} guide: ${action === 'delete' ? guideId : guideData.title}`,
            content: Buffer.from(JSON.stringify(guides, null, 2)).toString('base64'),
            sha: currentContent.sha
        });

        res.json({ success: true, message: 'Guide updated successfully' });

    } catch (error) {
        console.error('Update error:', error);
        res.status(500).json({ error: 'Failed to update guide' });
    }
}
