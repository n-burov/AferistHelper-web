import { Octokit } from '@octokit/rest';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { action, configData, accessToken } = req.body;
  if (!action || !configData || !accessToken) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    const octokit = new Octokit({ auth: accessToken });
    
    // Получаем текущий configs.json
    const { data: currentContent } = await octokit.repos.getContent({
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      path: 'configs/configs.json'
    });

    const content = Buffer.from(currentContent.content, 'base64').toString('utf8');
    const configs = JSON.parse(content);

    // Обрабатываем действие
    switch (action) {
      case 'add':
        configs.configs.push(configData);
        break;
      case 'update':
        const index = configs.configs.findIndex(c => c.id === configData.id);
        if (index !== -1) configs.configs[index] = configData;
        break;
      case 'delete':
        configs.configs = configs.configs.filter(c => c.id !== configData.id);
        break;
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    // Обновляем метаданные
    configs.meta.lastUpdated = new Date().toISOString();
    configs.meta.totalConfigs = configs.configs.length;
    configs.meta.updatedBy = configData.author;

    // Сохраняем в репозиторий
    await octokit.repos.createOrUpdateFileContents({
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      path: 'configs/configs.json',
      message: `${action} config: ${configData.name}`,
      content: Buffer.from(JSON.stringify(configs, null, 2)).toString('base64'),
      sha: currentContent.sha
    });

    res.json({ success: true, message: 'Config updated successfully' });

  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ error: 'Failed to update config' });
  }
}
