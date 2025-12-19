import type { CourseHole } from '../types/golf';

// Shared helpers for course-side calculations used by both App and ScoreCard.
// Keeping these in one place prevents subtle drift between UI and scoring logic.

export const getGreenieHolesForSide = (
  holes: CourseHole[],
  closest: Record<number, string | null>,
  side: 'front' | 'back',
): number[] => {
  const [start, end] = side === 'front' ? [1, 9] : [10, 18];
  const par3 = holes
    .filter((h) => h.par === 3 && h.holeNumber >= start && h.holeNumber <= end)
    .map((h) => h.holeNumber)
    .sort((a, b) => a - b);

  const awarded = par3.find(
    (h) => closest[h] !== undefined && closest[h] !== null,
  );
  if (awarded === undefined) return [];
  return par3.filter((h) => h > awarded);
};

export const getGreenieHoles = (
  holes: CourseHole[],
  closest: Record<number, string | null>,
): number[] => [
  ...getGreenieHolesForSide(holes, closest, 'front'),
  ...getGreenieHolesForSide(holes, closest, 'back'),
];

export const getFourHoleForSide = (
  holes: CourseHole[],
  side: 'front' | 'back',
): number | null => {
  const [start, end] = side === 'front' ? [1, 9] : [10, 18];
  const sideHoles = holes.filter(
    (h) => h.holeNumber >= start && h.holeNumber <= end,
  );
  const lowest = [...sideHoles].sort((a, b) => a.handicap - b.handicap)[0];
  const par4 = sideHoles
    .filter((h) => h.par === 4 && h.holeNumber !== lowest.holeNumber)
    .sort((a, b) => a.handicap - b.handicap)[0];
  return par4 ? par4.holeNumber : null;
};

export const getFourHoles = (holes: CourseHole[]): number[] => {
  const front = getFourHoleForSide(holes, 'front');
  const back = getFourHoleForSide(holes, 'back');
  return [front, back].filter((n): n is number => n !== null);
};

export const getClosestHoleForSide = (
  holes: CourseHole[],
  closest: Record<number, string | null>,
  side: 'front' | 'back',
): number | null => {
  const [start, end] = side === 'front' ? [1, 9] : [10, 18];
  const par3Holes = holes
    .filter(
      (h) => h.holeNumber >= start && h.holeNumber <= end && h.par === 3,
    )
    .map((h) => h.holeNumber)
    .sort((a, b) => a - b);

  for (const hole of par3Holes) {
    const val = closest[hole];
    if (val === undefined) return hole; // First eligible par-3 not set yet.
    if (val === null) continue; // Allow next par-3 if no winner.
    // Once a winner exists, no further holes are eligible.
    return null;
  }

  return null;
};

export const getLongestHoleForSide = (
  holes: CourseHole[],
  longest: Record<number, string | null>,
  side: 'front' | 'back',
): number | null => {
  const [start, end] = side === 'front' ? [1, 9] : [10, 18];
  const par5Holes = holes
    .filter(
      (h) => h.holeNumber >= start && h.holeNumber <= end && h.par === 5,
    )
    .map((h) => h.holeNumber)
    .sort((a, b) => a - b);

  for (const hole of par5Holes) {
    const val = longest[hole];
    if (val === undefined) return hole;
    if (val === null) continue;
    return null;
  }

  return null;
};
