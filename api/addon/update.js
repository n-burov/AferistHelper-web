import { Octokit } from '@octokit/rest';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { action, addonData, accessToken } = req.body;
    if (!action || !addonData || !accessToken) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }

    try {
        const octokit = new Octokit({ auth: accessToken });
        
        // Получаем текущий addons.json
        const { data: currentContent } = await octokit.repos.getContent({
            owner: process.env.GITHUB_OWNER,
            repo: process.env.GITHUB_REPO,
            path: 'addons/addons.json'
        });

        const content = Buffer.from(currentContent.content, 'base64').toString('utf8');
        const addons = JSON.parse(content);

        // Обрабатываем действие
        switch (action) {
            case 'add':
                addons.addons.push(addonData);
                break;
            case 'update':
                const index = addons.addons.findIndex(a => a.id === addonData.id);
                if (index !== -1) addons.addons[index] = addonData;
                break;
            case 'delete':
                addons.addons = addons.addons.filter(a => a.id !== addonData.id);
                break;
            default:
                return res.status(400).json({ error: 'Invalid action' });
        }

        // Обновляем метаданные
        addons.meta.lastUpdated = new Date().toISOString();
        addons.meta.totalAddons = addons.addons.length;
        addons.meta.updatedBy = addonData.author || 'Unknown';

        // Сохраняем в репозиторий
        await octokit.repos.createOrUpdateFileContents({
            owner: process.env.GITHUB_OWNER,
            repo: process.env.GITHUB_REPO,
            path: 'addons/addons.json',
            message: `${action} addon: ${addonData.name}`,
            content: Buffer.from(JSON.stringify(addons, null, 2)).toString('base64'),
            sha: currentContent.sha
        });

        res.json({ success: true, message: 'Addon updated successfully' });

    } catch (error) {
        console.error('Update error:', error);
        res.status(500).json({ error: 'Failed to update addon' });
    }
}
