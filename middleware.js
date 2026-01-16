// middleware.js в корне проекта
import { NextResponse } from 'next/server';

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|public/).*)',
  ],
};

export function middleware(request) {
  const response = NextResponse.next();
  
  // Добавляем headers для обхода DPI
  response.headers.set('X-Requested-With', 'XMLHttpRequest');
  response.headers.set('X-Is-Ajax', 'true');
  response.headers.set('Sec-Fetch-Dest', 'document');
  response.headers.set('Sec-Fetch-Mode', 'navigate');
  response.headers.set('Sec-Fetch-Site', 'none');
  response.headers.set('Upgrade-Insecure-Requests', '1');
  
  // Для API запросов добавляем дополнительные headers
  if (request.nextUrl.pathname.startsWith('/api/')) {
    response.headers.set('Content-Type', 'application/json');
  }
  
  return response;
}
