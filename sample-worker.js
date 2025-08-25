export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Example IoT endpoint
    if (url.pathname === '/device/status') {
      return new Response(JSON.stringify({
        status: 'online',
        temperature: 23.5,
        humidity: 45.2,
        timestamp: Date.now()
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response('Hello from workerd!');
  }
};
