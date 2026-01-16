// api/middleware.js
export const config = {
  runtime: 'edge',
  regions: ['sin1']
};

export default async function handler(request) {
  const url = new URL(request.url);
  
  // Для статических файлов - просто пропускаем
  if (url.pathname.match(/\.(js|css|png|jpg|json|ico|svg)$/)) {
    return new Response(null, { status: 200 });
  }
  
  // Для HTML - добавляем headers
  const response = new Response(null, {
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
      'X-Is-Ajax': 'true',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
  
  return response;
}
