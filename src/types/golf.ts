export interface PlayerSetup {
  id: string;
  name: string;
  color?: string;
}

export interface Player {
  id: string;
  name: string;
  color?: string;
  totalScore: number;
  totalPutts: number;
  skins: number;
  holes: HoleScore[];
}

export interface HoleScore {
  holeNumber: number;
  strokes: number;
  putts: number;
  par: number;
  holeHandicap: number;
}

export interface CourseHole {
  holeNumber: number;
  par: number;
  handicap: number;
  distance?: number;
  description?: string;
}

export interface Course {
  id: string;
  name: string;
  location?: string;
  holes: CourseHole[];
  totalPar: number;
  totalDistance?: number;
}

export interface Game {
  id: string;
  date: string;
  course: Course;
  players: Player[];
  currentHole: number;
  totalHoles: number;
  closestToPin: Record<number, string | null>;
  longestDrive: Record<number, string | null>;
  greenies: Record<number, Record<string, boolean>>;
  fivers: Record<number, Record<string, boolean>>;
  fours: Record<number, Record<string, boolean>>;
  sandyHoles: Record<number, boolean>;
  sandies: Record<number, Record<string, boolean>>;
  doubleSandies: Record<number, Record<string, boolean>>;
  lostBallHoles: Record<number, boolean>;
  lostBalls: Record<number, Record<string, boolean>>;
}
