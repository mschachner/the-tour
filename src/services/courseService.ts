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
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load cached public courses', err);
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
      return publicCoursesCache;
    }
  } catch (err) {
    console.error('Error fetching public courses:', err);
  }

  return [];
};

export const getAllCoursesAsync = async (): Promise<Course[]> => {
  const custom = loadCustomCourses();
  const remote = await fetchPublicCourses();
  return [...builtInCourses, ...remote, ...custom];
};

export const getCourseSuggestionsAsync = async (input: string): Promise<Course[]> => {
  const allCourses = await getAllCoursesAsync();

  if (!input.trim()) {
    const custom = loadCustomCourses().slice(-2);
    const builtIn = builtInCourses.slice(0, 3);
    return [...builtIn, ...custom].slice(0, 5);
  }

  const term = input.toLowerCase().trim();
  const filtered = allCourses.filter(course =>
    course.name.toLowerCase().includes(term) ||
    course.location?.toLowerCase().includes(term)
  );

  if (!filtered.some(c => c.id === 'custom-course')) {
    filtered.push(defaultCustomCourse);
  }

  return filtered.slice(0, 5);
};
