import { describe, it, expect } from 'vitest';

type ContentStatus = 'draft' | 'needs_review' | 'approved' | 'published' | 'rejected';

interface EducationalItem {
  id: string;
  stem: string;
  status: ContentStatus;
  reviewed_by?: string;
  rejection_reason?: string;
}

function filterStudentVisibleItems(items: EducationalItem[]): EducationalItem[] {
  // Student view MUST only retrieve items with status === 'published'
  return items.filter((item) => item.status === 'published');
}

function applyInstructorAction(
  item: EducationalItem,
  instructorId: string,
  action: 'approve' | 'publish' | 'reject' | 'edit_and_approve',
  payload?: { editedStem?: string; rejectionReason?: string }
): EducationalItem {
  const updated = { ...item, reviewed_by: instructorId };

  if (action === 'approve') {
    updated.status = 'approved';
  } else if (action === 'publish') {
    updated.status = 'published';
  } else if (action === 'reject') {
    updated.status = 'rejected';
    updated.rejection_reason = payload?.rejectionReason || 'Unspecified';
  } else if (action === 'edit_and_approve') {
    updated.status = 'approved';
    if (payload?.editedStem) updated.stem = payload.editedStem;
  }

  return updated;
}

describe('CENNA.live Content Review & Anti-Hallucination Gate', () => {
  const items: EducationalItem[] = [
    { id: '1', stem: 'Q1: Published item', status: 'published' },
    { id: '2', stem: 'Q2: AI draft item awaiting review', status: 'needs_review' },
    { id: '3', stem: 'Q3: Approved by instructor but not published yet', status: 'approved' },
    { id: '4', stem: 'Q4: Rejected item with inaccurate formula', status: 'rejected' },
  ];

  it('strictly isolates students from unreviewed or draft educational content', () => {
    const visibleToStudents = filterStudentVisibleItems(items);

    expect(visibleToStudents.length).toBe(1);
    expect(visibleToStudents[0].id).toBe('1');
    expect(visibleToStudents.every((item) => item.status === 'published')).toBe(true);
  });

  it('transitions needs_review to approved on instructor approval', () => {
    const item = items[1]; // needs_review
    const result = applyInstructorAction(item, 'inst-1', 'approve');

    expect(result.status).toBe('approved');
    expect(result.reviewed_by).toBe('inst-1');
  });

  it('transitions approved item to published, making it visible to students', () => {
    const item = items[2]; // approved
    const published = applyInstructorAction(item, 'inst-1', 'publish');

    expect(published.status).toBe('published');

    const updatedCatalog = [...items.filter((i) => i.id !== '3'), published];
    const visibleToStudents = filterStudentVisibleItems(updatedCatalog);
    expect(visibleToStudents.some((i) => i.id === '3')).toBe(true);
  });

  it('rejects hallucinated content and records rejection reason', () => {
    const item = items[1]; // needs_review
    const rejected = applyInstructorAction(item, 'inst-1', 'reject', {
      rejectionReason: 'Formula omitted female muscle mass factor',
    });

    expect(rejected.status).toBe('rejected');
    expect(rejected.rejection_reason).toBe('Formula omitted female muscle mass factor');
  });

  it('updates stem and approves on edit_and_approve', () => {
    const item = items[1];
    const edited = applyInstructorAction(item, 'inst-1', 'edit_and_approve', {
      editedStem: 'Q2 (Corrected): Calculate CrCl with adjusted body weight',
    });

    expect(edited.status).toBe('approved');
    expect(edited.stem).toBe('Q2 (Corrected): Calculate CrCl with adjusted body weight');
  });
});
