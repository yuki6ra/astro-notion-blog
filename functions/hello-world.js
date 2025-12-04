export function onRequest(_context) {
  return new Response('Hello, world!:', _context.request, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}
