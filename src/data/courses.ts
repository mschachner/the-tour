import { Course } from '../types/golf';

const builtInCourses: Course[] = [];

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

export { builtInCourses as default, defaultCustomCourse };
