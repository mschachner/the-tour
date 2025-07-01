import { useState } from 'react';
import { Game, Player, Course, CourseHole } from './types/golf';
import PlayerSetup from './components/PlayerSetup';
import ScoreCard from './components/ScoreCard';
import './App.css';

const calculateSkins = (
  players: Player[],
  closest: Record<number, string | null> = {},
  longest: Record<number, string | null> = {},
  greenies: Record<number, Record<string, boolean>> = {},
  fivers: Record<number, Record<string, boolean>> = {},
  fours: Record<number, Record<string, boolean>> = {},
  sandies: Record<number, Record<string, boolean>> = {},
  doubleSandies: Record<number, Record<string, boolean>> = {},
  lostBalls: Record<number, Record<string, boolean>> = {},
): Player[] => {
  const skinsMap: Record<string, number> = {};
  players.forEach((p) => {
    skinsMap[p.id] = 0;
  });

  const totalHoles = players[0]?.holes.length || 0;

  for (let i = 0; i < totalHoles; i++) {
    const holePar = players[0].holes[i].par;

    const scores = players.map((p) => ({ id: p.id, strokes: p.holes[i].strokes }));
    const validScores = scores.filter((s) => s.strokes > 0);
    if (validScores.length === 0) continue;

    const minScore = Math.min(...validScores.map((s) => s.strokes));
    const winners = validScores.filter((s) => s.strokes === minScore);

    players.forEach((p) => {
      const strokes = p.holes[i].strokes;
      if (strokes > 0 && strokes <= holePar + 2) {
        if (strokes <= holePar - 2) skinsMap[p.id] += 2;
        else if (strokes === holePar - 1) skinsMap[p.id] += 1;
      }
    });

    if (winners.length === 1) {
      const winning = winners[0];
      if (winning.strokes <= holePar + 2) {
        skinsMap[winning.id] += 1;
      }
    }
  }

  // Lowest-handicap hole skins (par or better)
  const frontLowest = players[0].holes
    .filter((h) => h.holeNumber <= 9)
    .sort((a, b) => a.holeHandicap - b.holeHandicap)[0];
  const backLowest = players[0].holes
    .filter((h) => h.holeNumber > 9)
    .sort((a, b) => a.holeHandicap - b.holeHandicap)[0];

  players.forEach((p) => {
    if (frontLowest) {
      const hole = p.holes.find((h) => h.holeNumber === frontLowest.holeNumber);
      if (hole && hole.strokes > 0 && hole.strokes <= frontLowest.par) {
        skinsMap[p.id] += 1;
      }
    }
    if (backLowest) {
      const hole = p.holes.find((h) => h.holeNumber === backLowest.holeNumber);
      if (hole && hole.strokes > 0 && hole.strokes <= backLowest.par) {
        skinsMap[p.id] += 1;
      }
    }
  });

  // Closest to Pin skins
  const addClosestSkin = (holeNumbers: number[]) => {
    const hole = holeNumbers.sort((a, b) => a - b).find((h) => closest[h]);
    if (hole !== undefined) {
      const winner = closest[hole];
      if (winner) {
        skinsMap[winner] += 1;
      }
    }
  };

  const frontPar3 = players[0].holes
    .filter((h) => h.holeNumber <= 9 && h.par === 3)
    .map((h) => h.holeNumber);
  const backPar3 = players[0].holes
    .filter((h) => h.holeNumber > 9 && h.par === 3)
    .map((h) => h.holeNumber);

  addClosestSkin(frontPar3);
  addClosestSkin(backPar3);

  // Longest Drive skins
  const addLongestSkin = (holeNumbers: number[]) => {
    const hole = holeNumbers.sort((a, b) => a - b).find((h) => longest[h]);
    if (hole !== undefined) {
      const winner = longest[hole];
      if (winner) {
        skinsMap[winner] += 1;
      }
    }
  };

  const frontPar5 = players[0].holes
    .filter((h) => h.holeNumber <= 9 && h.par === 5)
    .map((h) => h.holeNumber);
  const backPar5 = players[0].holes
    .filter((h) => h.holeNumber > 9 && h.par === 5)
    .map((h) => h.holeNumber);

  addLongestSkin(frontPar5);
  addLongestSkin(backPar5);

  // Greenies
  Object.entries(greenies).forEach(([hole, playersMarked]) => {
    Object.entries(playersMarked).forEach(([id, val]) => {
      if (val) {
        skinsMap[id] = (skinsMap[id] || 0) + 1;
      }
    });
  });

  // Fivers
  Object.entries(fivers).forEach(([hole, playersMarked]) => {
    Object.entries(playersMarked).forEach(([id, val]) => {
      if (val) {
        skinsMap[id] = (skinsMap[id] || 0) + 1;
      }
    });
  });

  // Four skins
  Object.entries(fours).forEach(([hole, playersMarked]) => {
    Object.entries(playersMarked).forEach(([id, val]) => {
      if (val) {
        skinsMap[id] = (skinsMap[id] || 0) + 1;
      }
    });
  });

  // Sandy skins
  Object.entries(sandies).forEach(([hole, playersMarked]) => {
    Object.entries(playersMarked).forEach(([id, val]) => {
      if (val) {
        skinsMap[id] = (skinsMap[id] || 0) + 1;
      }
    });
  });

  // Double Sandy skins
  Object.entries(doubleSandies).forEach(([hole, playersMarked]) => {
    Object.entries(playersMarked).forEach(([id, val]) => {
      if (val) {
        skinsMap[id] = (skinsMap[id] || 0) + 1;
      }
    });
  });

  // Lost Ball skins
  Object.entries(lostBalls).forEach(([hole, playersMarked]) => {
    Object.entries(playersMarked).forEach(([id, val]) => {
      if (val) {
        skinsMap[id] = (skinsMap[id] || 0) + 1;
      }
    });
  });

  return players.map((p) => ({ ...p, skins: skinsMap[p.id] }));
};

const getGreenieHolesForSide = (
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

const getGreenieHoles = (
  holes: CourseHole[],
  closest: Record<number, string | null>,
): number[] => [
  ...getGreenieHolesForSide(holes, closest, 'front'),
  ...getGreenieHolesForSide(holes, closest, 'back'),
];

const getFourHoleForSide = (
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

const getFourHoles = (holes: CourseHole[]): number[] => {
  const front = getFourHoleForSide(holes, 'front');
  const back = getFourHoleForSide(holes, 'back');
  return [front, back].filter((n): n is number => n !== null);
};

function App() {
  const [game, setGame] = useState<Game | null>(null);
  const [showSetup, setShowSetup] = useState(true);
  const startNewGame = (players: Player[], course: Course) => {
    const newGame: Game = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      course,
      players: calculateSkins(players, {}, {}, {}, {}, {}, {}, {}, {}),
      currentHole: 1,
      totalHoles: 18,
      closestToPin: {},
      longestDrive: {},
      greenies: {},
      fivers: {},
      fours: {},
      sandyHoles: {},
      sandies: {},
      doubleSandies: {},
      lostBallHoles: {},
      lostBalls: {}
    };

    setGame(newGame);
    setShowSetup(false);
  };

  const updateScore = (playerId: string, holeNumber: number, strokes: number, putts: number) => {
    if (!game) return;

    const updatedPlayers = game.players.map(player => {
        if (player.id === playerId) {
          const updatedHoles = player.holes.map(hole =>
            hole.holeNumber === holeNumber
              ? { ...hole, strokes, putts }
              : hole
          );

          const totalScore = updatedHoles.reduce((sum, hole) => sum + hole.strokes, 0);
          const totalPutts = updatedHoles.reduce((sum, hole) => sum + hole.putts, 0);

          return {
            ...player,
            holes: updatedHoles,
            totalScore,
            totalPutts
          };
        }
        return player;
      });

    const playersWithSkins = calculateSkins(
      updatedPlayers,
      game.closestToPin,
      game.longestDrive,
      game.greenies,
      game.fivers,
      game.fours,
      game.sandies,
      game.doubleSandies,
      game.lostBalls,
    );

    const updatedGame = {
      ...game,
      players: playersWithSkins,
    };
    setGame(updatedGame);
  };

  const updateClosestToPin = (holeNumber: number, playerId: string | null) => {
    if (!game) return;
    let closest: Record<number, string | null> = {
      ...game.closestToPin,
      [holeNumber]: playerId,
    };

    if (playerId) {
      const sideStart = holeNumber <= 9 ? 1 : 10;
      const sideEnd = holeNumber <= 9 ? 9 : 18;
      const laterPar3 = game.course.holes
        .filter(
          (h) =>
            h.par === 3 &&
            h.holeNumber > holeNumber &&
            h.holeNumber >= sideStart &&
            h.holeNumber <= sideEnd,
        )
        .map((h) => h.holeNumber);

      closest = { ...closest };
      for (const h of laterPar3) {
        delete closest[h];
      }
    }

    const validGreenieHoles = new Set(
      getGreenieHoles(game.course.holes, closest),
    );
    const greenies: Record<number, Record<string, boolean>> = {};
    Object.entries(game.greenies).forEach(([hole, playersMarked]) => {
      if (validGreenieHoles.has(Number(hole))) {
        greenies[Number(hole)] = { ...playersMarked };
      }
    });

    const playersWithSkins = calculateSkins(
      game.players,
      closest,
      game.longestDrive,
      greenies,
      game.fivers,
      game.fours,
      game.sandies,
      game.doubleSandies,
      game.lostBalls,
    );
    setGame({
      ...game,
      closestToPin: closest,
      greenies,
      players: playersWithSkins,
    });
  };

  const updateLongestDrive = (holeNumber: number, playerId: string | null) => {
    if (!game) return;
    let longestMap: Record<number, string | null> = {
      ...game.longestDrive,
      [holeNumber]: playerId,
    };

    if (playerId) {
      const sideStart = holeNumber <= 9 ? 1 : 10;
      const sideEnd = holeNumber <= 9 ? 9 : 18;
      const laterPar5 = game.course.holes
        .filter(
          (h) =>
            h.par === 5 &&
            h.holeNumber > holeNumber &&
            h.holeNumber >= sideStart &&
            h.holeNumber <= sideEnd,
        )
        .map((h) => h.holeNumber);

      longestMap = { ...longestMap };
      for (const h of laterPar5) {
        delete longestMap[h];
      }
    }

    const playersWithSkins = calculateSkins(
      game.players,
      game.closestToPin,
      longestMap,
      game.greenies,
      game.fivers,
      game.fours,
      game.sandies,
      game.doubleSandies,
      game.lostBalls,
    );
    setGame({
      ...game,
      longestDrive: longestMap,
      players: playersWithSkins,
    });
  };

  const handleToggleGreenie = (
    holeNumber: number,
    playerId: string,
    value: boolean,
  ) => {
    if (!game) return;
    const validHoles = new Set(
      getGreenieHoles(game.course.holes, game.closestToPin),
    );
    if (!validHoles.has(holeNumber)) return;
    const holeGreenies = { ...(game.greenies[holeNumber] || {}) };
    holeGreenies[playerId] = value;
    const greenies = { ...game.greenies, [holeNumber]: holeGreenies };
    const playersWithSkins = calculateSkins(
      game.players,
      game.closestToPin,
      game.longestDrive,
      greenies,
      game.fivers,
      game.fours,
      game.sandies,
      game.doubleSandies,
      game.lostBalls,
    );
    setGame({ ...game, greenies, players: playersWithSkins });
  };

  const handleToggleFiver = (
    holeNumber: number,
    playerId: string,
    value: boolean,
  ) => {
    if (!game) return;
    const holeFivers = { ...(game.fivers[holeNumber] || {}) };
    holeFivers[playerId] = value;
    const fivers = { ...game.fivers, [holeNumber]: holeFivers };
    const playersWithSkins = calculateSkins(
      game.players,
      game.closestToPin,
      game.longestDrive,
      game.greenies,
      fivers,
      game.fours,
      game.sandies,
      game.doubleSandies,
      game.lostBalls,
    );
    setGame({ ...game, fivers, players: playersWithSkins });
  };

  const handleToggleFour = (
    holeNumber: number,
    playerId: string,
    value: boolean,
  ) => {
    if (!game) return;
    const validHoles = new Set(getFourHoles(game.course.holes));
    if (!validHoles.has(holeNumber)) return;
    const holeFours = { ...(game.fours[holeNumber] || {}) };
    holeFours[playerId] = value;
    const fours = { ...game.fours, [holeNumber]: holeFours };
    const playersWithSkins = calculateSkins(
      game.players,
      game.closestToPin,
      game.longestDrive,
      game.greenies,
      game.fivers,
      fours,
      game.sandies,
      game.doubleSandies,
      game.lostBalls,
    );
    setGame({ ...game, fours, players: playersWithSkins });
  };

  const handleToggleSandyHole = (holeNumber: number, value: boolean) => {
    if (!game) return;
    const sandyHoles = { ...game.sandyHoles, [holeNumber]: value };
    let sandies = { ...game.sandies };
    let doubleSandies = { ...game.doubleSandies };
    if (!value) {
      const { [holeNumber]: _removed, ...rest } = sandies;
      sandies = rest;
      const { [holeNumber]: _dRemoved, ...dRest } = doubleSandies;
      doubleSandies = dRest;
    } else if (!sandies[holeNumber]) {
      sandies[holeNumber] = {};
    }
    const playersWithSkins = calculateSkins(
      game.players,
      game.closestToPin,
      game.longestDrive,
      game.greenies,
      game.fivers,
      game.fours,
      sandies,
      doubleSandies,
      game.lostBalls,
    );
    setGame({
      ...game,
      sandyHoles,
      sandies,
      doubleSandies,
      players: playersWithSkins,
    });
  };

  const handleToggleSandy = (
    holeNumber: number,
    playerId: string,
    value: boolean,
  ) => {
    if (!game) return;
    if (!game.sandyHoles[holeNumber]) return;
    const holeMarks = { ...(game.sandies[holeNumber] || {}) };
    holeMarks[playerId] = value;
    const sandies = { ...game.sandies, [holeNumber]: holeMarks };
    let doubleSandies = { ...game.doubleSandies };
    if (!value) {
      if (doubleSandies[holeNumber]) {
        const { [playerId]: _r, ...rest } = doubleSandies[holeNumber];
        doubleSandies = {
          ...doubleSandies,
          [holeNumber]: rest,
        };
      }
    } else if (!doubleSandies[holeNumber]) {
      doubleSandies[holeNumber] = {};
    }
    const playersWithSkins = calculateSkins(
      game.players,
      game.closestToPin,
      game.longestDrive,
      game.greenies,
      game.fivers,
      game.fours,
      sandies,
      doubleSandies,
      game.lostBalls,
    );
    setGame({ ...game, sandies, doubleSandies, players: playersWithSkins });
  };

  const handleToggleDoubleSandy = (
    holeNumber: number,
    playerId: string,
    value: boolean,
  ) => {
    if (!game) return;
    if (!game.sandyHoles[holeNumber]) return;
    if (!game.sandies[holeNumber]?.[playerId]) return;
    const holeMarks = { ...(game.doubleSandies[holeNumber] || {}) };
    holeMarks[playerId] = value;
    const doubleSandies = { ...game.doubleSandies, [holeNumber]: holeMarks };
    const playersWithSkins = calculateSkins(
      game.players,
      game.closestToPin,
      game.longestDrive,
      game.greenies,
      game.fivers,
      game.fours,
      game.sandies,
      doubleSandies,
      game.lostBalls,
    );
    setGame({ ...game, doubleSandies, players: playersWithSkins });
  };

  const handleToggleLostBallHole = (holeNumber: number, value: boolean) => {
    if (!game) return;
    const lostBallHoles = { ...game.lostBallHoles, [holeNumber]: value };
    let lostBalls = { ...game.lostBalls };
    if (!value) {
      const { [holeNumber]: _removed, ...rest } = lostBalls;
      lostBalls = rest;
    } else if (!lostBalls[holeNumber]) {
      lostBalls[holeNumber] = {};
    }
    const playersWithSkins = calculateSkins(
      game.players,
      game.closestToPin,
      game.longestDrive,
      game.greenies,
      game.fivers,
      game.fours,
      game.sandies,
      game.doubleSandies,
      lostBalls,
    );
    setGame({ ...game, lostBallHoles, lostBalls, players: playersWithSkins });
  };

  const handleToggleLostBall = (
    holeNumber: number,
    playerId: string,
    value: boolean,
  ) => {
    if (!game) return;
    if (!game.lostBallHoles[holeNumber]) return;
    const holeMarks = { ...(game.lostBalls[holeNumber] || {}) };
    holeMarks[playerId] = value;
    const lostBalls = { ...game.lostBalls, [holeNumber]: holeMarks };
    const playersWithSkins = calculateSkins(
      game.players,
      game.closestToPin,
      game.longestDrive,
      game.greenies,
      game.fivers,
      game.fours,
      game.sandies,
      game.doubleSandies,
      lostBalls,
    );
    setGame({ ...game, lostBalls, players: playersWithSkins });
  };

  const resetGame = () => {
    setGame(null);
    setShowSetup(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 to-blue-500">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🏌️ The Tour</h1>
          <p className="text-white/80">Track your game with style</p>
        </header>

        {showSetup ? (
          <PlayerSetup onStartGame={startNewGame} />
        ) : game ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="text-white">
                <h2 className="text-2xl font-semibold">{game.course.name}</h2>
                <p className="text-white/80">{game.course.location} • {game.date}</p>
                <p className="text-white/80">Par {game.course.totalPar}
                  {game.course.totalDistance && ` • ${game.course.totalDistance} yards`}
                </p>
              </div>
              <button 
                onClick={resetGame}
                className="golf-button"
              >
                New Game
              </button>
            </div>
            <ScoreCard
              game={game}
              onUpdateScore={updateScore}
              onUpdateClosest={updateClosestToPin}
              onUpdateLongest={updateLongestDrive}
              onToggleGreenie={handleToggleGreenie}
              onToggleFiver={handleToggleFiver}
              onToggleFour={handleToggleFour}
              onToggleSandyHole={handleToggleSandyHole}
              onToggleSandy={handleToggleSandy}
              onToggleDoubleSandy={handleToggleDoubleSandy}
              onToggleLostBallHole={handleToggleLostBallHole}
              onToggleLostBall={handleToggleLostBall}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default App;
