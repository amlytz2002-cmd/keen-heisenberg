import { supabase } from './supabaseClient';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: unknown;
}

async function getAuthHeader(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    return {
      Authorization: `Bearer ${session.access_token}`,
    };
  }
  return {};
}

export async function apiRequest<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const authHeaders = await getAuthHeader();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...((options.headers as Record<string, string>) || {}),
    };

    const response = await fetch(path, {
      ...options,
      headers,
    });

    const json = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        error: json.message || json.error || `Request failed with status ${response.status}`,
        details: json,
      };
    }

    if (json && typeof json === 'object' && 'success' in json && 'data' in json) {
      return json as ApiResponse<T>;
    }

    // Auto-unwrap common entity list wrappers
    let unwrappedData = json;
    if (json && typeof json === 'object') {
      if (Array.isArray(json.exams)) unwrappedData = json.exams;
      else if (Array.isArray(json.classrooms)) unwrappedData = json.classrooms;
      else if (Array.isArray(json.courses)) unwrappedData = json.courses;
      else if (Array.isArray(json.resources)) unwrappedData = json.resources;
    }

    return {
      success: true,
      data: unwrappedData as T,
      ...json,
    };
  } catch (err: any) {
    console.error(`API Request Error [${path}]:`, err);
    return {
      success: false,
      error: err.message || 'Network request failed',
    };
  }
}

export const api = {
  auth: {
    getProfile: () => apiRequest('/api/auth/profile'),
    updateProfile: (data: { full_name?: string; primary_role?: 'student' | 'instructor' | 'admin' }) =>
      apiRequest('/api/auth/profile', { method: 'POST', body: JSON.stringify(data) }),
  },

  classrooms: {
    list: () => apiRequest<any[]>('/api/classrooms'),
    create: (data: { name: string; description?: string }) =>
      apiRequest('/api/classrooms', { method: 'POST', body: JSON.stringify(data) }),
    get: (id: string) => apiRequest(`/api/classrooms/${id}`),
    createInvitation: (id: string, data?: { max_uses?: number; expires_in_days?: number }) =>
      apiRequest(`/api/classrooms/${id}/invitations`, { method: 'POST', body: JSON.stringify(data || {}) }),
    redeemInvitation: (token: string) =>
      apiRequest(`/api/invitations/${token}`, { method: 'POST' }),
  },

  courses: {
    list: (classroomId?: string) =>
      apiRequest<any[]>(`/api/courses${classroomId ? `?classroom_id=${classroomId}` : ''}`),
    create: (data: { classroom_id?: string; title: string; code?: string; description?: string }) =>
      apiRequest('/api/courses', { method: 'POST', body: JSON.stringify(data) }),
    get: (id: string) => apiRequest(`/api/courses/${id}`),
    createModule: (courseId: string, data: { title: string; description?: string; order_index?: number }) =>
      apiRequest(`/api/courses/${courseId}`, { method: 'POST', body: JSON.stringify(data) }),
  },

  resources: {
    list: (courseId?: string) =>
      apiRequest<any[]>(`/api/resources${courseId ? `?course_id=${courseId}` : ''}`),
    create: (data: {
      course_id?: string;
      title: string;
      file_path: string;
      file_type: string;
      file_size_bytes?: number;
      mime_type?: string;
      raw_text?: string;
    }) => apiRequest('/api/resources', { method: 'POST', body: JSON.stringify(data) }),
    process: (id: string, textOverride?: string) =>
      apiRequest(`/api/resources/${id}/process`, {
        method: 'POST',
        body: JSON.stringify({ text_override: textOverride }),
      }),
  },

  ai: {
    generate: (data: {
      resource_id?: string;
      course_id?: string;
      mode: 'concepts' | 'questions' | 'all';
      concept_id?: string;
    }) => apiRequest('/api/ai/generate', { method: 'POST', body: JSON.stringify(data) }),
  },

  teach: {
    getContentReview: (params?: { course_id?: string; status?: string; limit?: number }) => {
      const q = new URLSearchParams();
      if (params?.course_id) q.set('course_id', params.course_id);
      if (params?.status) q.set('status', params.status);
      if (params?.limit) q.set('limit', String(params.limit));
      return apiRequest(`/api/teach/content-review?${q.toString()}`);
    },
    reviewAction: (data: {
      item_type: 'concept' | 'question';
      item_id: string;
      action: 'approve' | 'publish' | 'reject' | 'edit_and_approve';
      rejection_reason?: string;
      edited_payload?: any;
    }) => apiRequest('/api/teach/content-review', { method: 'POST', body: JSON.stringify(data) }),
    getAnalytics: (classroomId?: string) =>
      apiRequest(`/api/analytics${classroomId ? `?classroom_id=${classroomId}` : ''}`),
  },

  study: {
    getSession: (params?: { course_id?: string; concept_id?: string }) => {
      const q = new URLSearchParams();
      if (params?.course_id) q.set('course_id', params.course_id);
      if (params?.concept_id) q.set('concept_id', params.concept_id);
      return apiRequest(`/api/study/session?${q.toString()}`);
    },
    submitAnswer: (data: {
      session_id?: string;
      question_id: string;
      user_answer: string | string[];
      response_time_ms?: number;
      hints_used_count?: number;
    }) => apiRequest('/api/study/submit-answer', { method: 'POST', body: JSON.stringify(data) }),
    requestHint: (data: {
      session_id?: string;
      question_id: string;
      hint_stage: number;
    }) => apiRequest('/api/study/hint', { method: 'POST', body: JSON.stringify(data) }),
  },

  reviews: {
    getQueue: () => apiRequest('/api/reviews'),
  },

  exams: {
    list: (classroomId?: string) =>
      apiRequest<any[]>(`/api/exams${classroomId ? `?classroom_id=${classroomId}` : ''}`),
    create: (data: {
      classroom_id?: string;
      course_id?: string;
      title: string;
      description?: string;
      duration_minutes: number;
      passing_score_pct?: number;
      max_attempts?: number;
      question_ids?: string[];
    }) => apiRequest('/api/exams', { method: 'POST', body: JSON.stringify(data) }),
    start: (examId: string) =>
      apiRequest(`/api/exams/${examId}/start`, { method: 'POST' }),
    saveAnswers: (attemptId: string, answers: Array<{ question_id: string; answer_payload: any }>) =>
      apiRequest(`/api/exams/attempts/${attemptId}/answers`, {
        method: 'POST',
        body: JSON.stringify({ answers }),
      }),
    submit: (attemptId: string) =>
      apiRequest(`/api/exams/attempts/${attemptId}/submit`, { method: 'POST' }),
  },

  analytics: {
    getStudentProgress: () => apiRequest('/api/analytics'),
  },
};
