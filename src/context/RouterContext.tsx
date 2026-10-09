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

export const RouterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [path, setPath] = useState<string>(window.location.pathname || '/');
  const [searchParams, setSearchParams] = useState<URLSearchParams>(
    new URLSearchParams(window.location.search)
  );

  useEffect(() => {
    const handlePopState = () => {
      setPath(window.location.pathname || '/');
      setSearchParams(new URLSearchParams(window.location.search));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (to: string) => {
    if (to === path) return;
    window.history.pushState({}, '', to);
    const [pathname, search] = to.split('?');
    setPath(pathname || '/');
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
