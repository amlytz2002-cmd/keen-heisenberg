import React, { createContext, useContext, useEffect, useState } from 'react';

interface RouterContextType {
  path: string;
  navigate: (to: string) => void;
  params: Record<string, string>;
  searchParams: URLSearchParams;
}

const RouterContext = createContext<RouterContextType>({
  path: window.location.pathname || '/',
  navigate: () => {},
  params: {},
  searchParams: new URLSearchParams(window.location.search),
});

export const useRouter = () => useContext(RouterContext);

const normalizePath = (rawPath: string): string => {
  let clean = (rawPath || '/').split('?')[0].trim();
  if (clean.length > 1 && clean.endsWith('/')) {
    clean = clean.slice(0, -1);
  }
  return clean || '/';
};

export const RouterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [path, setPath] = useState<string>(normalizePath(window.location.pathname));
  const [searchParams, setSearchParams] = useState<URLSearchParams>(
    new URLSearchParams(window.location.search)
  );

  useEffect(() => {
    const handlePopState = () => {
      setPath(normalizePath(window.location.pathname));
      setSearchParams(new URLSearchParams(window.location.search));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (to: string) => {
    const [rawPathname, search] = to.split('?');
    const cleanPath = normalizePath(rawPathname);
    if (cleanPath === path && !search) return;
    window.history.pushState({}, '', to);
    setPath(cleanPath);
    setSearchParams(new URLSearchParams(search || ''));
    window.scrollTo(0, 0);
  };

  // Extract params based on common patterns
  const extractParams = (currentPath: string): Record<string, string> => {
    const params: Record<string, string> = {};

    // Pattern: /invite/:token
    const inviteMatch = currentPath.match(/^\/invite\/([^/]+)/);
    if (inviteMatch) params.token = inviteMatch[1];

    // Pattern: /app/courses/:courseId
    const courseMatch = currentPath.match(/^\/app\/courses\/([^/]+)/);
    if (courseMatch) params.courseId = courseMatch[1];

    // Pattern: /app/study/:sessionId
    const studyMatch = currentPath.match(/^\/app\/study\/([^/]+)/);
    if (studyMatch) params.sessionId = studyMatch[1];

    // Pattern: /learn/lesson/:lessonId
    const lessonMatch = currentPath.match(/^\/learn\/lesson\/([^/]+)/);
    if (lessonMatch) params.lessonId = lessonMatch[1];

    // Pattern: /app/exams/:id/take
    const examTakeMatch = currentPath.match(/^\/app\/exams\/([^/]+)\/take/);
    if (examTakeMatch) params.id = examTakeMatch[1];

    // Pattern: /app/exam-attempts/:id/results
    const examResultsMatch = currentPath.match(/^\/app\/exam-attempts\/([^/]+)\/results/);
    if (examResultsMatch) params.id = examResultsMatch[1];

    return params;
  };

  const params = extractParams(path);

  return (
    <RouterContext.Provider value={{ path, navigate, params, searchParams }}>
      {children}
    </RouterContext.Provider>
  );
};
