import { handleOptions, jsonResponse, errorResponse } from '../../_lib/cors';
import { authenticateUser, getSupabaseUserClient, Env } from '../../_lib/supabaseServer';

export async function onRequestOptions() {
  return handleOptions();
}

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const user = await authenticateUser(request, env);
  if (!user) {
    return errorResponse('UNAUTHORIZED', 'Authentication required', 401);
  }

  const { client } = getSupabaseUserClient(request, env);

  // Fetch all concept progress records for this user
  const { data: progressItems, error } = await client
    .from('user_concept_progress')
    .select(`
      id,
      concept_id,
      mastery_score,
      review_stage,
      last_reviewed_at,
      next_review_at,
      consecutive_successes,
      total_attempts,
      correct_attempts,
      concepts (
        id,
        title,
        summary,
        difficulty,
        course_id,
        courses (id, title)
      )
    `)
    .eq('user_id', user.id);

  if (error) {
    return errorResponse('DB_ERROR', error.message, 500);
  }

  const now = new Date();

  // Categorize and sort items:
  // 1. Overdue concepts (next_review_at <= NOW)
  // 2. Low mastery (< 50)
  // 3. Upcoming (next_review_at > NOW)
  const items = (progressItems || []).map((p: any) => {
    const dueDate = p.next_review_at ? new Date(p.next_review_at) : new Date(0);
    const isOverdue = dueDate <= now;
    const hoursOverdue = isOverdue ? Math.round((now.getTime() - dueDate.getTime()) / 3600000) : 0;

    return {
      ...p,
      isOverdue,
      hoursOverdue,
      masteryScore: Number(p.mastery_score) || 0,
    };
  });

  items.sort((a: any, b: any) => {
    // Overdue first
    if (a.isOverdue && !b.isOverdue) return -1;
    if (!a.isOverdue && b.isOverdue) return 1;
    // Then lowest mastery first
    return a.masteryScore - b.masteryScore;
  });

  const overdueCount = items.filter((i: any) => i.isOverdue).length;

  return jsonResponse({
    queue: items,
    overdueCount,
    totalTracked: items.length,
  });
}
