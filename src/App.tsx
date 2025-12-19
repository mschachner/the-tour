import { useState, useEffect, ChangeEvent } from 'react';
import { Game, Player, Course } from './types/golf';
import PlayerSetup from './features/player/PlayerSetup';
import ScoreCard from './features/score/ScoreCard';
import CourseSelector from './features/course/CourseSelector';
import {
  buildExportFile,
  clearGame,
  deleteScorecard,
  loadGame,
  loadScorecards,
  mergeImportedScorecards,
  parseScorecardImport,
  saveGame,
  saveScorecard,
} from './services/gameService';
import { getGreenieHoles, getFourHoles } from './utils/golfLogic';
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

// Centralized helper for recomputing skins after any game update.
const getPlayersWithSkins = (players: Player[], game: Game): Player[] =>
  calculateSkins(
    players,
    game.closestToPin,
    game.longestDrive,
    game.greenies,
    game.fivers,
    game.fours,
    game.sandies,
    game.doubleSandies,
    game.lostBalls,
  );

function App() {
  const initialGame = loadGame();
  const [game, setGame] = useState<Game | null>(initialGame);
  const [showSetup, setShowSetup] = useState(!initialGame);
  const [savedScorecards, setSavedScorecards] = useState(loadScorecards());
  const [activeScorecardId, setActiveScorecardId] = useState<string | null>(null);
  const [scorecardTitle, setScorecardTitle] = useState(
    initialGame?.eventName || 'New Scorecard',
  );
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [showScorecardsMenu, setShowScorecardsMenu] = useState(false);

  useEffect(() => {
    if (game) {
      saveGame(game);
    }
  }, [game]);
  const startNewGame = (players: Player[], course: Course, eventName: string) => {
    const newGame: Game = {
      id: Date.now().toString(),
      eventName,
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

    // Initialize game state with skins computed against empty side-game maps.
    setGame(newGame);
    setShowSetup(false);
    setActiveScorecardId(null);
    setScorecardTitle(newGame.eventName);
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

    const updatedGame = {
      ...game,
      players: updatedPlayers,
    };
    setGame({
      ...updatedGame,
      players: getPlayersWithSkins(updatedPlayers, updatedGame),
    });
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

    const updatedGame = {
      ...game,
      closestToPin: closest,
      greenies,
    };
    setGame({
      ...updatedGame,
      players: getPlayersWithSkins(game.players, updatedGame),
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

    const updatedGame = {
      ...game,
      longestDrive: longestMap,
    };
    setGame({
      ...updatedGame,
      players: getPlayersWithSkins(game.players, updatedGame),
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
    const updatedGame = { ...game, greenies };
    setGame({
      ...updatedGame,
      players: getPlayersWithSkins(game.players, updatedGame),
    });
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
    const updatedGame = { ...game, fivers };
    setGame({
      ...updatedGame,
      players: getPlayersWithSkins(game.players, updatedGame),
    });
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
    const updatedGame = { ...game, fours };
    setGame({
      ...updatedGame,
      players: getPlayersWithSkins(game.players, updatedGame),
    });
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
    const updatedGame = {
      ...game,
      sandyHoles,
      sandies,
      doubleSandies,
    };
    setGame({
      ...updatedGame,
      players: getPlayersWithSkins(game.players, updatedGame),
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
    const updatedGame = { ...game, sandies, doubleSandies };
    setGame({
      ...updatedGame,
      players: getPlayersWithSkins(game.players, updatedGame),
    });
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
    const updatedGame = { ...game, doubleSandies };
    setGame({
      ...updatedGame,
      players: getPlayersWithSkins(game.players, updatedGame),
    });
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
    const updatedGame = { ...game, lostBallHoles, lostBalls };
    setGame({
      ...updatedGame,
      players: getPlayersWithSkins(game.players, updatedGame),
    });
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
    const updatedGame = { ...game, lostBalls };
    setGame({
      ...updatedGame,
      players: getPlayersWithSkins(game.players, updatedGame),
    });
  };

  const resetGame = () => {
    clearGame();
    setGame(null);
    setShowSetup(true);
    setActiveScorecardId(null);
    setScorecardTitle('New Scorecard');
  };

  const importScorecardsFromFile = async (file: File): Promise<string> => {
    const content = await file.text();
    const { scorecards, warnings } = parseScorecardImport(content);
    const { merged, addedCount } = mergeImportedScorecards(scorecards);
    setSavedScorecards(merged);
    if (warnings.length > 0) {
      return warnings.join(' ');
    }
    return addedCount > 0
      ? `Imported ${addedCount} new scorecard${addedCount === 1 ? '' : 's'}.`
      : 'Import complete.';
  };

  const formatScorecardLabel = (scorecard: { name: string; data: Game }) => {
    const date = scorecard.data.date;
    const courseName = scorecard.data.course?.name ?? 'Course';
    return `${scorecard.name} • ${courseName} • ${date}`;
  };

  const handleScorecardTitleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setScorecardTitle(event.target.value);
    if (!game) return;
    setGame({ ...game, eventName: event.target.value });
  };

  const handleCourseChange = (course: Course) => {
    if (!game) return;
    if (course.id === game.course.id) return;
    const shouldReset = window.confirm(
      'Changing the course will reset hole scores and side games. Continue?',
    );
    if (!shouldReset) return;
    const updatedPlayers = game.players.map((player) => ({
      ...player,
      totalScore: 0,
      totalPutts: 0,
      skins: 0,
      holes: course.holes.map((hole) => ({
        holeNumber: hole.holeNumber,
        strokes: 0,
        putts: 0,
        par: hole.par,
        holeHandicap: hole.handicap,
      })),
    }));

    const updatedGame: Game = {
      ...game,
      course,
      players: updatedPlayers,
      currentHole: 1,
      totalHoles: course.holes.length,
      closestToPin: {},
      longestDrive: {},
      greenies: {},
      fivers: {},
      fours: {},
      sandyHoles: {},
      sandies: {},
      doubleSandies: {},
      lostBallHoles: {},
      lostBalls: {},
    };
    setGame(updatedGame);
  };

  const handleSaveScorecard = () => {
    if (!game) return;
    const now = new Date().toISOString();
    const name = scorecardTitle.trim() || game.eventName || 'Untitled Scorecard';
    const stored = saveScorecard({
      id: activeScorecardId ?? `${game.id}-${Date.now()}`,
      name,
      createdAt: activeScorecardId
        ? savedScorecards.find((item) => item.id === activeScorecardId)?.createdAt ??
          now
        : now,
      updatedAt: now,
      data: { ...game, eventName: name },
    });
    setSavedScorecards(stored);
    setActiveScorecardId(stored[0]?.id ?? null);
    setScorecardTitle(stored[0]?.name ?? name);
  };

  const handleLoadScorecard = (scorecardId: string) => {
    const selected = savedScorecards.find((item) => item.id === scorecardId);
    if (!selected) return;
    setGame(selected.data);
    setShowSetup(false);
    setActiveScorecardId(selected.id);
    setScorecardTitle(selected.name);
  };

  const handleDeleteScorecard = (scorecardId: string) => {
    const updated = deleteScorecard(scorecardId);
    setSavedScorecards(updated);
    if (activeScorecardId === scorecardId) {
      setActiveScorecardId(null);
    }
  };

  const handleExportScorecards = () => {
    const payload = buildExportFile(savedScorecards);
    const dataStr = JSON.stringify(payload, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `the-tour-scorecards-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportScorecards = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const status = await importScorecardsFromFile(file);
    setImportStatus(status);
    event.target.value = '';
  };

  return (
    <div className="min-h-screen fade-in">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-earth-beige mb-2 font-marker">🏌️ The Tour</h1>
          <p className="text-earth-beige/80">Track your game with style</p>
        </header>

        {showSetup ? (
          <PlayerSetup
            onStartGame={startNewGame}
            eventName={scorecardTitle}
            onEventNameChange={setScorecardTitle}
            savedScorecards={savedScorecards}
            onLoadScorecard={handleLoadScorecard}
            onImportScorecards={importScorecardsFromFile}
          />
        ) : game ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="text-earth-beige">
                <h2 className="text-3xl font-semibold">{game.eventName}</h2>
                <p className="text-earth-beige/80">{game.course.name}</p>
                <p className="text-earth-beige/80">{game.course.location} • {game.date}</p>
                <p className="text-earth-beige/80">Par {game.course.totalPar}
                  {game.course.totalDistance && ` • ${game.course.totalDistance} yards`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowScorecardsMenu((prev) => !prev)}
                  className="px-4 py-2 rounded-md bg-white/10 text-earth-beige border border-white/20 hover:bg-white/20 transition-colors"
                >
                  Saved Scorecards
                </button>
                <button onClick={resetGame} className="golf-button">
                  New Game
                </button>
              </div>
            </div>
            {showScorecardsMenu && (
              <div className="golf-card bg-white/10 border border-white/20">
                <div className="flex flex-wrap gap-4 items-end">
                  <div className="flex-1 min-w-[220px]">
                  <label className="block text-sm font-medium text-earth-beige mb-2">
                    Scorecard name
                  </label>
                  <input
                    type="text"
                    value={scorecardTitle}
                    onChange={handleScorecardTitleChange}
                    className="w-full rounded-md px-3 py-2 text-gray-900"
                    placeholder="Weekend skins match"
                  />
                </div>
                <div className="flex-1 min-w-[220px]">
                  <label className="block text-sm font-medium text-earth-beige mb-2">
                    Course
                  </label>
                  <CourseSelector
                    onCourseSelect={handleCourseChange}
                    selectedCourse={game.course}
                  />
                </div>
                <button
                  onClick={handleSaveScorecard}
                  className="px-4 py-2 rounded-md bg-golf-green text-white"
                  >
                    Save Scorecard
                  </button>
                  <button
                    onClick={handleExportScorecards}
                    className="px-4 py-2 rounded-md bg-white/20 text-earth-beige"
                    disabled={savedScorecards.length === 0}
                  >
                    Export
                  </button>
                  <label className="px-4 py-2 rounded-md bg-white/20 text-earth-beige cursor-pointer">
                    Import
                    <input
                      type="file"
                      accept="application/json"
                      onChange={handleImportScorecards}
                      className="hidden"
                    />
                  </label>
                </div>
                {importStatus && (
                  <p className="text-sm text-earth-beige/80 mt-3">
                    {importStatus}
                  </p>
                )}
                <div className="mt-4 space-y-2">
                  {savedScorecards.length === 0 ? (
                    <p className="text-sm text-earth-beige/80">
                      No saved scorecards yet.
                    </p>
                  ) : (
                    savedScorecards.map((scorecard) => (
                      <div
                        key={scorecard.id}
                        className="flex items-center justify-between gap-3 rounded-md border border-white/10 px-3 py-2"
                      >
                        <button
                          onClick={() => handleLoadScorecard(scorecard.id)}
                          className="text-left text-earth-beige hover:text-white flex-1"
                        >
                          <div className="font-semibold">
                            {scorecard.name}
                          </div>
                          <div className="text-xs text-earth-beige/70">
                            {formatScorecardLabel(scorecard)}
                          </div>
                        </button>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleLoadScorecard(scorecard.id)}
                            className="px-3 py-1 rounded-md bg-white/10 text-earth-beige text-sm"
                          >
                            Load
                          </button>
                          <button
                            onClick={() => handleDeleteScorecard(scorecard.id)}
                            className="px-3 py-1 rounded-md bg-red-500/70 text-white text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
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
