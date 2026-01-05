import { Octokit } from '@octokit/rest';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { action, macroData, accessToken } = req.body;
    if (!action || !macroData || !accessToken) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }

    try {
        const octokit = new Octokit({ auth: accessToken });
        
        // Получаем текущий macros.json
        const { data: currentContent } = await octokit.repos.getContent({
            owner: process.env.GITHUB_OWNER,
            repo: process.env.GITHUB_REPO,
            path: 'macros/macros.json'
        });

        const content = Buffer.from(currentContent.content, 'base64').toString('utf8');
        const macros = JSON.parse(content);

        // Обрабатываем действие
        switch (action) {
            case 'add':
                macros.macros.push(macroData);
                break;
            case 'update':
                const index = macros.macros.findIndex(m => m.id === macroData.id);
                if (index !== -1) macros.macros[index] = macroData;
                break;
            case 'delete':
                macros.macros = macros.macros.filter(m => m.id !== macroData.id);
                break;
            default:
                return res.status(400).json({ error: 'Invalid action' });
        }

        // Обновляем метаданные
        macros.meta.lastUpdated = new Date().toISOString();
        macros.meta.totalMacros = macros.macros.length;
        macros.meta.updatedBy = macroData.author;

        // Сохраняем в репозиторий
        await octokit.repos.createOrUpdateFileContents({
            owner: process.env.GITHUB_OWNER,
            repo: process.env.GITHUB_REPO,
            path: 'macros/macros.json',
            message: `${action} macro: ${macroData.name}`,
            content: Buffer.from(JSON.stringify(macros, null, 2)).toString('base64'),
            sha: currentContent.sha
        });

        res.json({ success: true, message: 'Macro updated successfully' });

    } catch (error) {
        console.error('Update error:', error);
        res.status(500).json({ error: 'Failed to update macro' });
    }
}
