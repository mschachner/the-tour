import { Course } from '../types/golf';

// Built-in courses that come with the app
const builtInCourses: Course[] = [
  {
    id: 'pebble-beach',
    name: 'Pebble Beach Golf Links',
    location: 'Pebble Beach, CA',
    totalPar: 72,
    totalDistance: 7075,
    holes: [
      { holeNumber: 1, par: 4, handicap: 9, distance: 380, description: 'Opening hole with ocean views' },
      { holeNumber: 2, par: 5, handicap: 13, distance: 516, description: 'Reachable par 5' },
      { holeNumber: 3, par: 4, handicap: 11, distance: 404, description: 'Dogleg left' },
      { holeNumber: 4, par: 4, handicap: 7, distance: 331, description: 'Short par 4' },
      { holeNumber: 5, par: 3, handicap: 17, distance: 195, description: 'Over the ocean' },
      { holeNumber: 6, par: 5, handicap: 15, distance: 523, description: 'Long par 5' },
      { holeNumber: 7, par: 3, handicap: 3, distance: 109, description: 'Famous short par 3' },
      { holeNumber: 8, par: 4, handicap: 1, distance: 428, description: 'Iconic cliff-top hole' },
      { holeNumber: 9, par: 4, handicap: 5, distance: 462, description: 'Along the ocean' },
      { holeNumber: 10, par: 4, handicap: 8, distance: 495, description: 'Back nine starts' },
      { holeNumber: 11, par: 4, handicap: 12, distance: 390, description: 'Dogleg right' },
      { holeNumber: 12, par: 3, handicap: 18, distance: 202, description: 'Over the ocean' },
      { holeNumber: 13, par: 4, handicap: 14, distance: 445, description: 'Along the coast' },
      { holeNumber: 14, par: 5, handicap: 16, distance: 580, description: 'Long par 5' },
      { holeNumber: 15, par: 4, handicap: 6, distance: 397, description: 'Dogleg left' },
      { holeNumber: 16, par: 4, handicap: 4, distance: 403, description: 'Uphill approach' },
      { holeNumber: 17, par: 3, handicap: 2, distance: 208, description: 'Famous island green' },
      { holeNumber: 18, par: 5, handicap: 10, distance: 543, description: 'Iconic finishing hole' }
    ]
  },
  {
    id: 'augusta-national',
    name: 'Augusta National Golf Club',
    location: 'Augusta, GA',
    totalPar: 72,
    totalDistance: 7475,
    holes: [
      { holeNumber: 1, par: 4, handicap: 7, distance: 445, description: 'Tea Olive' },
      { holeNumber: 2, par: 5, handicap: 15, distance: 575, description: 'Pink Dogwood' },
      { holeNumber: 3, par: 4, handicap: 11, distance: 350, description: 'Flowering Peach' },
      { holeNumber: 4, par: 3, handicap: 17, distance: 240, description: 'Flowering Crab Apple' },
      { holeNumber: 5, par: 4, handicap: 3, distance: 495, description: 'Magnolia' },
      { holeNumber: 6, par: 3, handicap: 13, distance: 180, description: 'Juniper' },
      { holeNumber: 7, par: 4, handicap: 1, distance: 450, description: 'Pampas' },
      { holeNumber: 8, par: 5, handicap: 9, distance: 570, description: 'Yellow Jasmine' },
      { holeNumber: 9, par: 4, handicap: 5, distance: 460, description: 'Carolina Cherry' },
      { holeNumber: 10, par: 4, handicap: 2, distance: 495, description: 'Camellia' },
      { holeNumber: 11, par: 4, handicap: 4, distance: 505, description: 'White Dogwood' },
      { holeNumber: 12, par: 3, handicap: 16, distance: 155, description: 'Golden Bell' },
      { holeNumber: 13, par: 5, handicap: 14, distance: 510, description: 'Azalea' },
      { holeNumber: 14, par: 4, handicap: 8, distance: 440, description: 'Chinese Fir' },
      { holeNumber: 15, par: 5, handicap: 12, distance: 550, description: 'Firethorn' },
      { holeNumber: 16, par: 3, handicap: 18, distance: 170, description: 'Redbud' },
      { holeNumber: 17, par: 4, handicap: 6, distance: 440, description: 'Nandina' },
      { holeNumber: 18, par: 4, handicap: 10, distance: 465, description: 'Holly' }
    ]
  },
  {
    id: 'st-andrews-old',
    name: 'St Andrews Old Course',
    location: 'St Andrews, Scotland',
    totalPar: 72,
    totalDistance: 7305,
    holes: [
      { holeNumber: 1, par: 4, handicap: 11, distance: 376, description: 'Burn' },
      { holeNumber: 2, par: 4, handicap: 5, distance: 453, description: 'Dyke' },
      { holeNumber: 3, par: 4, handicap: 15, distance: 397, description: 'Cartgate (Out)' },
      { holeNumber: 4, par: 4, handicap: 7, distance: 480, description: 'Ginger Beer' },
      { holeNumber: 5, par: 5, handicap: 13, distance: 568, description: 'Hole O\'Cross (Out)' },
      { holeNumber: 6, par: 4, handicap: 3, distance: 412, description: 'Heathery (Out)' },
      { holeNumber: 7, par: 4, handicap: 9, distance: 371, description: 'High (Out)' },
      { holeNumber: 8, par: 3, handicap: 17, distance: 175, description: 'Short' },
      { holeNumber: 9, par: 4, handicap: 1, distance: 352, description: 'End' },
      { holeNumber: 10, par: 4, handicap: 8, distance: 386, description: 'Bobby Jones' },
      { holeNumber: 11, par: 3, handicap: 16, distance: 174, description: 'High (In)' },
      { holeNumber: 12, par: 4, handicap: 4, distance: 348, description: 'Heathery (In)' },
      { holeNumber: 13, par: 4, handicap: 12, distance: 465, description: 'Hole O\'Cross (In)' },
      { holeNumber: 14, par: 5, handicap: 6, distance: 618, description: 'Long' },
      { holeNumber: 15, par: 4, handicap: 2, distance: 455, description: 'Cartgate (In)' },
      { holeNumber: 16, par: 4, handicap: 10, distance: 423, description: 'Corner of the Dyke' },
      { holeNumber: 17, par: 4, handicap: 14, distance: 495, description: 'Road' },
      { holeNumber: 18, par: 4, handicap: 18, distance: 357, description: 'Tom Morris' }
    ]
  }
];

// Default custom course template
const defaultCustomCourse: Course = {
  id: 'custom-course',
  name: 'Custom Course',
  location: 'Your Location',
  totalPar: 72,
  holes: Array.from({ length: 18 }, (_, i) => ({
    holeNumber: i + 1,
    par: 4,
    handicap: i + 1,
    distance: 400,
    description: `Hole ${i + 1}`
  }))
};

// LocalStorage key for custom courses
const CUSTOM_COURSES_KEY = 'golfer-custom-courses';

// Load custom courses from localStorage
export const loadCustomCourses = (): Course[] => {
  try {
    const stored = localStorage.getItem(CUSTOM_COURSES_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Validate that it's an array of courses
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
    console.error('Error loading custom courses from localStorage:', error);
  }
  return [];
};

// Save custom courses to localStorage
export const saveCustomCourses = (customCourses: Course[]): void => {
  try {
    localStorage.setItem(CUSTOM_COURSES_KEY, JSON.stringify(customCourses));
  } catch (error) {
    console.error('Error saving custom courses to localStorage:', error);
  }
};

// Save a single custom course
export const saveCustomCourse = (course: Course): void => {
  const customCourses = loadCustomCourses();
  const existingIndex = customCourses.findIndex(c => c.id === course.id);
  
  if (existingIndex >= 0) {
    // Update existing course
    customCourses[existingIndex] = course;
  } else {
    // Add new course
    customCourses.push(course);
  }
  
  saveCustomCourses(customCourses);
};

// Delete a custom course
export const deleteCustomCourse = (courseId: string): void => {
  const customCourses = loadCustomCourses();
  const filtered = customCourses.filter(c => c.id !== courseId);
  saveCustomCourses(filtered);
};

// Generate unique ID for new custom courses
export const generateCourseId = (name: string): string => {
  const baseId = name.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 30);
  
  const timestamp = Date.now().toString(36);
  return `${baseId}-${timestamp}`;
};

// Get all courses (built-in + custom)
export const getAllCourses = (): Course[] => {
  const customCourses = loadCustomCourses();
  return [...builtInCourses, ...customCourses];
};

// Maintain backward compatibility
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
    // Return built-in courses first, then recent custom courses
    const customCourses = loadCustomCourses().slice(-2); // Last 2 custom courses
    return [...builtInCourses.slice(0, 3), ...customCourses].slice(0, 5);
  }
  
  const searchTerm = input.toLowerCase().trim();
  const filtered = allCourses.filter(course => 
    course.name.toLowerCase().includes(searchTerm) ||
    course.location?.toLowerCase().includes(searchTerm)
  );
  
  // Always include "Custom Course" option if searching
  if (!filtered.some(c => c.id === 'custom-course')) {
    filtered.push(defaultCustomCourse);
  }
  
  return filtered.slice(0, 5);
};

export { defaultCustomCourse }; 