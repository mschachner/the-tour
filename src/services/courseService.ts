import { Course, CourseHole } from '../types/golf';
import builtInCourses, { defaultCustomCourse } from '../data/courses';

const API_BASE_URL = 'https://api.golfcourseapi.com/v1';
const API_KEY = process.env.REACT_APP_GOLFCOURSE_API_KEY || '';

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

interface RemoteHole {
  par?: number;
  yardage?: number;
  handicap?: number;
}

interface RemoteTee {
  par_total?: number;
  total_yards?: number;
  holes?: RemoteHole[];
}

interface RemoteCourse {
  id: number;
  club_name?: string;
  course_name?: string;
  location?: {
    city?: string;
    state?: string;
    country?: string;
  };
  tees?: {
    female?: RemoteTee[];
    male?: RemoteTee[];
  };
}

const mapRemoteCourse = (remote: RemoteCourse): Course => {
  const name = remote.course_name || remote.club_name || 'Unknown Course';
  let location = '';
  if (remote.location) {
    const { city, state, country } = remote.location;
    location = [city, state, country].filter(Boolean).join(', ');
  }

  const tee = remote.tees?.male?.[0] || remote.tees?.female?.[0];
  const holes: CourseHole[] = Array.isArray(tee?.holes)
    ? tee!.holes!.map((h, i) => ({
        holeNumber: i + 1,
        par: h.par ?? 4,
        handicap: h.handicap ?? i + 1,
        distance: h.yardage,
        description: ''
      }))
    : [];

  const totalPar = tee?.par_total ?? holes.reduce((sum, h) => sum + h.par, 0);
  const totalDistance = tee?.total_yards;

  return {
    id: String(remote.id),
    name,
    location,
    holes,
    totalPar,
    totalDistance
  };
};

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
    const url = `${API_BASE_URL}/search?search_query=a`;
    const resp = await fetch(url, {
      headers: { Authorization: `Key ${API_KEY}` }
    });
    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}`);
    }

    const data = await resp.json();
    const courses: unknown = data.courses ?? data;

    if (Array.isArray(courses)) {
      publicCoursesCache = (courses as RemoteCourse[]).map(mapRemoteCourse);
      localStorage.setItem(
        PUBLIC_COURSES_KEY,
        JSON.stringify(publicCoursesCache)
      );
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

  if (!term) {
    const courses = await fetchPublicCourses();
    searchCache[term] = courses;
    return courses;
  }

  const url = `${API_BASE_URL}/search?search_query=${encodeURIComponent(term)}`;

  try {
    const resp = await fetch(url, {
      headers: { Authorization: `Key ${API_KEY}` }
    });
    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}`);
    }

    const data = await resp.json();
    const courses: unknown = data.courses ?? data;

    if (Array.isArray(courses)) {
      searchCache[term] = (courses as RemoteCourse[]).map(mapRemoteCourse);
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
