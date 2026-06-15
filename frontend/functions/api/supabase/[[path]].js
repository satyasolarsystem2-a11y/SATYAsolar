export async function onRequest(context) {
  const { request, env } = context;
  
  // Cloudflare Pages stores Environment Variables in the `env` object.
  const targetBaseUrl = env.SUPABASE_URL || env.REACT_APP_SUPABASE_URL;
  const anonKey = env.SUPABASE_ANON_KEY || env.REACT_APP_SUPABASE_ANON_KEY;

  if (!targetBaseUrl || !anonKey) {
    return new Response('Missing Supabase credentials in server environment', { status: 500 });
  }

  const url = new URL(request.url);
  
  // Extract the path after /api/supabase
  const pathPrefix = '/api/supabase';
  const pathWithQuery = url.pathname.replace(pathPrefix, '') + url.search;
  
  const targetUrl = targetBaseUrl + pathWithQuery;

  // Create a new request based on the original one
  const newRequest = new Request(targetUrl, request);
  
  // We must mutate headers using a new Headers object or directly on the request
  newRequest.headers.set('apikey', anonKey);

  const authHeader = newRequest.headers.get('authorization');
  if (!authHeader || authHeader.includes('hidden-key')) {
    newRequest.headers.set('authorization', `Bearer ${anonKey}`);
  }

  // Cloudflare Fetch natively proxies everything including bodies and streams perfectly
  return fetch(newRequest);
}
