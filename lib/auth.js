// Утилита для проверки авторизации
// Простая проверка токена из localStorage
// В production лучше использовать JWT или хранить сессии в БД

export function verifyAuth(req) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  
  // Простая проверка - токен должен быть валидной hex строкой длиной 64 символа
  // В реальном приложении здесь должна быть проверка токена в БД или Redis
  if (token && /^[a-f0-9]{64}$/i.test(token)) {
    return { authenticated: true, token };
  }
  
  return null;
}

export function requireAuth(req, res, next) {
  const auth = verifyAuth(req);
  
  if (!auth) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  req.auth = auth;
  if (next) next();
}
