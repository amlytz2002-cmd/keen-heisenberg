import { handleOptions, jsonResponse, errorResponse } from '../../_lib/cors';
import { authenticateUser, getSupabaseServiceClient, Env } from '../../_lib/supabaseServer';

export async function onRequestOptions() {
  return handleOptions();
}

async function sha256(str: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function onRequestGet(context: { params: { token: string }; env: Env }) {
  const { params, env } = context;
  const tokenHash = await sha256(params.token);
  const serviceClient = getSupabaseServiceClient(env);

  const { data: rpcRows, error: rpcErr } = await (serviceClient.rpc as any)(
    'get_invitation_by_token_hash',
    { p_hash: tokenHash }
  );

  const invite = rpcRows && rpcRows.length > 0 ? rpcRows[0] : null;

  if (rpcErr || !invite) {
    return errorResponse('INVALID_TOKEN', 'Invitation is invalid or has expired', 404);
  }

  if (invite.revoked_at) {
    return errorResponse('REVOKED', 'This invitation has been revoked', 410);
  }

  if (new Date(invite.expires_at) < new Date()) {
    return errorResponse('EXPIRED', 'This invitation has expired', 410);
  }

  if (invite.max_uses && invite.use_count >= invite.max_uses) {
    return errorResponse('USAGE_LIMIT', 'This invitation has reached its maximum number of uses', 410);
  }

  return jsonResponse({
    valid: true,
    classroom: {
      id: invite.classroom_id,
      name: invite.classroom_name,
      description: invite.classroom_description,
    },
  });
}

export async function onRequestPost(context: { request: Request; params: { token: string }; env: Env }) {
  const { request, params, env } = context;
  const user = await authenticateUser(request, env);
  if (!user) {
    return errorResponse('UNAUTHORIZED', 'You must be signed in to accept an invitation', 401);
  }

  const tokenHash = await sha256(params.token);
  const serviceClient = getSupabaseServiceClient(env);

  const { data: result, error: rpcErr } = await (serviceClient.rpc as any)(
    'redeem_classroom_invitation',
    { p_hash: tokenHash, p_user_id: user.id }
  );

  if (rpcErr || !result) {
    return errorResponse('REDEEM_FAILED', rpcErr?.message || 'Failed to redeem invitation', 500);
  }

  if (!result.success) {
    return errorResponse(result.code || 'ERROR', result.message || 'Invitation redemption failed', 400);
  }

  return jsonResponse(result);
}
