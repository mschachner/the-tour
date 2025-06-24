import { Course } from '../types/golf';
import builtInCourses, { defaultCustomCourse } from '../data/courses';

const CUSTOM_COURSES_KEY = 'golfer-custom-courses';

export const loadCustomCourses = (): Course[] => {
  try {
    const stored = localStorage.getItem(CUSTOM_COURSES_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed.filter(course =>
          course &&
          typeof course.id === 'string' &&
          typeof course.name === 'string' &&
          Array.isArray(course.holes) &&
          course.holes.length === 18
        );
      }
    }
  } catch (error) {
    console.error('Error loading custom courses:', error);
  }
  return [];
};

export const saveCustomCourses = (customCourses: Course[]): void => {
  try {
    localStorage.setItem(CUSTOM_COURSES_KEY, JSON.stringify(customCourses));
  } catch (error) {
    console.error('Error saving custom courses:', error);
  }
};

export const saveCustomCourse = (course: Course): void => {
  const customCourses = loadCustomCourses();
  const existingIndex = customCourses.findIndex(c => c.id === course.id);

  if (existingIndex >= 0) {
    customCourses[existingIndex] = course;
  } else {
    customCourses.push(course);
  }

  saveCustomCourses(customCourses);
};

export const deleteCustomCourse = (courseId: string): void => {
  const customCourses = loadCustomCourses();
  const filtered = customCourses.filter(c => c.id !== courseId);
  saveCustomCourses(filtered);
};

export const generateCourseId = (name: string): string => {
  const baseId = name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 30);

  const timestamp = Date.now().toString(36);
  return `${baseId}-${timestamp}`;
};

export const getAllCourses = (): Course[] => {
  const customCourses = loadCustomCourses();
  return [...builtInCourses, ...customCourses];
};

export const courses = getAllCourses();

export const findCourseByName = (name: string): Course | undefined => {
  const allCourses = getAllCourses();
  const searchName = name.toLowerCase().trim();
  return allCourses.find(course =>
    course.name.toLowerCase().includes(searchName) ||
    course.location?.toLowerCase().includes(searchName)
  );
};

export const getCourseSuggestions = (input: string): Course[] => {
  const allCourses = getAllCourses();

  if (!input.trim()) {
    const customCourses = loadCustomCourses().slice(-2);
    return [...builtInCourses.slice(0, 3), ...customCourses].slice(0, 5);
  }

  const searchTerm = input.toLowerCase().trim();
  const filtered = allCourses.filter(course =>
    course.name.toLowerCase().includes(searchTerm) ||
    course.location?.toLowerCase().includes(searchTerm)
  );

  if (!filtered.some(c => c.id === 'custom-course')) {
    filtered.push(defaultCustomCourse);
  }

  return filtered.slice(0, 5);
};

export { defaultCustomCourse };

// --- Remote Course Support ---

const PUBLIC_COURSES_KEY = 'golfer-public-courses';
let publicCoursesCache: Course[] | null = null;
let lastPublicCourseError: string | null = null;

export const getLastPublicCourseError = (): string | null => lastPublicCourseError;
export const clearLastPublicCourseError = (): void => {
  lastPublicCourseError = null;
};

export const fetchPublicCourses = async (): Promise<Course[]> => {
  if (publicCoursesCache) {
    return publicCoursesCache;
  }

  // Try localStorage first to avoid unnecessary requests
  try {
    const stored = localStorage.getItem(PUBLIC_COURSES_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        publicCoursesCache = parsed;
        lastPublicCourseError = null;
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load cached public courses', err);
    lastPublicCourseError = (err as Error).message;
  }

  try {
    const resp = await fetch('https://golf-courses-api.vercel.app/courses');
    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}`);
    }

    const data = await resp.json();
    const courses: unknown = Array.isArray(data) ? data : (data.courses ?? []);

    if (Array.isArray(courses)) {
      publicCoursesCache = courses as Course[];
      localStorage.setItem(PUBLIC_COURSES_KEY, JSON.stringify(publicCoursesCache));
      lastPublicCourseError = null;
      return publicCoursesCache;
    }
  } catch (err) {
    console.error('Error fetching public courses:', err);
    lastPublicCourseError = (err as Error).message;
  }

  return [];
};

export const getAllCoursesAsync = async (): Promise<Course[]> => {
  const custom = loadCustomCourses();
  const remote = await fetchPublicCourses();
  return [...builtInCourses, ...remote, ...custom];
};

// Remote search for courses matching a query string
const searchCache: Record<string, Course[]> = {};

export const searchPublicCourses = async (query: string): Promise<Course[]> => {
  const term = query.trim().toLowerCase();

  if (searchCache[term]) {
    return searchCache[term];
  }

  const baseUrl = 'https://golf-courses-api.vercel.app/courses';
  const url = term ? `${baseUrl}?search=${encodeURIComponent(term)}` : baseUrl;

  try {
    const resp = await fetch(url);
    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}`);
    }

    const data = await resp.json();
    const courses: unknown = Array.isArray(data) ? data : (data.courses ?? []);

    if (Array.isArray(courses)) {
      searchCache[term] = courses as Course[];
      lastPublicCourseError = null;
      return searchCache[term];
    }
  } catch (err) {
    console.error('Error searching public courses:', err);
    lastPublicCourseError = (err as Error).message;
  }

  return [];
};

export const getCourseSuggestionsAsync = async (input: string): Promise<Course[]> => {
  const trimmed = input.trim();

  const localSuggestions = getCourseSuggestions(input).filter(c => c.id !== 'custom-course');

  if (!trimmed) {
    return localSuggestions.slice(0, 5);
  }

  const remote = await searchPublicCourses(trimmed);
  const combined: Course[] = [...remote, ...localSuggestions];

  if (!combined.some(c => c.id === 'custom-course')) {
    combined.push(defaultCustomCourse);
  }

  // Remove duplicate courses by id while preserving order
  const seen = new Set<string>();
  const unique = combined.filter(course => {
    if (seen.has(course.id)) return false;
    seen.add(course.id);
    return true;
  });

  return unique.slice(0, 5);
};
