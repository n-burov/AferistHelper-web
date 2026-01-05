export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { code } = req.query;
  if (!code) return res.status(400).json({ error: 'Code parameter required' });

  try {
    // Обмен кода на токен
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.GH_APP_CLIENT_ID,
        client_secret: process.env.GH_APP_CLIENT_SECRET,
        code: code
      })
    });

    const tokenData = await tokenResponse.json();
    if (tokenData.error) return res.status(400).json({ error: tokenData.error_description });

    // Получение данных пользователя
    const userResponse = await fetch('https://api.github.com/user', {
      headers: { 'Authorization': `token ${tokenData.access_token}`, 'User-Agent': 'AferistHelper-Admin' }
    });

    const userData = await userResponse.json();

    // Проверка прав доступа
    const adminUsers = process.env.ADMIN_USERS?.split(',') || [];
    if (!adminUsers.includes(userData.login)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      access_token: tokenData.access_token,
      user: { login: userData.login, name: userData.name, avatar_url: userData.avatar_url }
    });

  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
