export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
  regions: ['sin1']
};

export default function middleware(request) {
  // Создаем новый Response с измененными headers
  const response = NextResponse.next();
  
  // Добавляем headers которые могут обойти DPI
  response.headers.set('X-Requested-With', 'XMLHttpRequest');
  response.headers.set('X-Is-Ajax', 'true');
  response.headers.set('Sec-Fetch-Dest', 'document');
  response.headers.set('Sec-Fetch-Mode', 'navigate');
  response.headers.set('Sec-Fetch-Site', 'none');
  response.headers.set('Sec-Fetch-User', '?1');
  response.headers.set('Upgrade-Insecure-Requests', '1');
  
  // Маскируемся под разные User-Agents случайным образом
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  ];
  
  const randomUA = userAgents[Math.floor(Math.random() * userAgents.length)];
  response.headers.set('User-Agent', randomUA);
  
  return response;
}
