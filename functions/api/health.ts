import { handleOptions, jsonResponse } from '../_lib/cors';
import { Env, getSupabaseUserClient } from '../_lib/supabaseServer';

export async function onRequestOptions() {
  return handleOptions();
}

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const startTime = Date.now();

  let dbStatus = 'unknown';
  let latencyMs = 0;

  try {
    const { client } = getSupabaseUserClient(request, env);
    const dbStart = Date.now();
    const { error } = await client.from('courses').select('id').limit(1);
    latencyMs = Date.now() - dbStart;
    dbStatus = error ? `error: ${error.message}` : 'connected';
  } catch (err: any) {
    dbStatus = `unreachable: ${err.message || 'unknown'}`;
  }

  const isHealthy = dbStatus === 'connected';

  return jsonResponse(
    {
      status: isHealthy ? 'healthy' : 'degraded',
      service: 'cenna-live-platform',
      version: '1.0.0-pilot',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(performance.now() / 1000),
      durationMs: Date.now() - startTime,
      checks: {
        database: {
          status: dbStatus,
          latencyMs,
        },
        edgeRuntime: {
          status: 'operational',
          engine: 'Cloudflare Pages Functions / V8 Worker',
        },
        storage: {
          status: 'configured',
          buckets: ['course-resources', 'user-avatars'],
        },
        email: {
          status: env.RESEND_API_KEY ? 'active' : 'simulated',
          provider: 'Resend',
        },
      },
    },
    isHealthy ? 200 : 503
  );
}
