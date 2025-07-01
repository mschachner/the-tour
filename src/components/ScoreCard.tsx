import { useState, Fragment } from "react";
import type { ChangeEvent } from "react";
import { Game, Player, HoleScore, CourseHole } from "../types/golf";

const getClosestHoleForSide = (
  holes: CourseHole[],
  closest: Record<number, string | null>,
  side: "front" | "back",
): number | null => {
  const [start, end] = side === "front" ? [1, 9] : [10, 18];
  const par3Holes = holes
    .filter(
      (h) => h.holeNumber >= start && h.holeNumber <= end && h.par === 3,
    )
    .map((h) => h.holeNumber)
    .sort((a, b) => a - b);

  for (const hole of par3Holes) {
    const val = closest[hole];
    if (val === undefined) return hole; // first eligible par-3 not set yet
    if (val === null) continue; // allow next par-3 if no winner
    // once a winner exists, no further holes are eligible
    return null;
  }

  return null;
};

const getLongestHoleForSide = (
  holes: CourseHole[],
  longest: Record<number, string | null>,
  side: "front" | "back",
): number | null => {
  const [start, end] = side === "front" ? [1, 9] : [10, 18];
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

const getFourHoleForSide = (
  holes: CourseHole[],
  side: "front" | "back",
): number | null => {
  const [start, end] = side === "front" ? [1, 9] : [10, 18];
  const sideHoles = holes.filter(
    (h) => h.holeNumber >= start && h.holeNumber <= end,
  );
  const lowest = [...sideHoles].sort((a, b) => a.handicap - b.handicap)[0];
  const par4 = sideHoles
    .filter((h) => h.par === 4 && h.holeNumber !== lowest.holeNumber)
    .sort((a, b) => a.handicap - b.handicap)[0];
  return par4 ? par4.holeNumber : null;
};

interface ScoreCardProps {
  game: Game;
  onUpdateScore: (
    playerId: string,
    holeNumber: number,
    strokes: number,
    putts: number,
  ) => void;
  onUpdateClosest: (holeNumber: number, playerId: string | null) => void;
  onUpdateLongest: (holeNumber: number, playerId: string | null) => void;
  onToggleGreenie: (holeNumber: number, playerId: string, value: boolean) => void;
  onToggleFiver: (holeNumber: number, playerId: string, value: boolean) => void;
  onToggleFour: (holeNumber: number, playerId: string, value: boolean) => void;
  onToggleLostBallHole: (holeNumber: number, value: boolean) => void;
  onToggleLostBall: (holeNumber: number, playerId: string, value: boolean) => void;
}

const ScoreCard = ({
  game,
  onUpdateScore,
  onUpdateClosest,
  onUpdateLongest,
  onToggleGreenie,
  onToggleFiver,
  onToggleFour,
  onToggleLostBallHole,
  onToggleLostBall,
}: ScoreCardProps) => {
  const [editingCell, setEditingCell] = useState<{
    playerId: string;
    holeNumber: number;
  } | null>(null);
  const [editingValue, setEditingValue] = useState<string>("");

  const handleCellClick = (
    playerId: string,
    holeNumber: number,
  ) => {
    const player = game.players.find((p) => p.id === playerId);
    if (player) {
      const hole = player.holes.find((h) => h.holeNumber === holeNumber);
      if (hole) {
        const currentValue = hole.strokes;
        setEditingValue(currentValue > 0 ? currentValue.toString() : "");
      }
    }
    setEditingCell({ playerId, holeNumber });
  };

  const handleCellChange = (value: string) => {
    if (!editingCell) return;

    const numValue = parseInt(value) || 0;
    const { playerId, holeNumber } = editingCell;
    const player = game.players.find((p) => p.id === playerId);

    if (player) {
      const hole = player.holes.find((h) => h.holeNumber === holeNumber);
      if (hole) {
        onUpdateScore(playerId, holeNumber, numValue, hole.putts);
      }
    }

    setEditingCell(null);
    setEditingValue("");
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEditingValue(e.target.value);
  };

  const frontClosestHole = getClosestHoleForSide(
    game.course.holes,
    game.closestToPin,
    "front",
  );
  const backClosestHole = getClosestHoleForSide(
    game.course.holes,
    game.closestToPin,
    "back",
  );
  const isClosestHole = (holeNumber: number) =>
    holeNumber === frontClosestHole ||
    holeNumber === backClosestHole ||
    game.closestToPin[holeNumber] !== undefined;

  const frontLongestHole = getLongestHoleForSide(
    game.course.holes,
    game.longestDrive,
    "front",
  );
  const backLongestHole = getLongestHoleForSide(
    game.course.holes,
    game.longestDrive,
    "back",
  );
  const isLongestHole = (holeNumber: number) =>
    holeNumber === frontLongestHole ||
    holeNumber === backLongestHole ||
    game.longestDrive[holeNumber] !== undefined;

  const frontFourHole = getFourHoleForSide(game.course.holes, "front");
  const backFourHole = getFourHoleForSide(game.course.holes, "back");
  const isFourHole = (holeNumber: number) =>
    holeNumber === frontFourHole || holeNumber === backFourHole;

  const isLostBallHole = (holeNumber: number) =>
    game.lostBallHoles[holeNumber];

  const holeWinners: Record<number, string | null> = (() => {
    const winners: Record<number, string | null> = {};
    game.course.holes.forEach((hole) => {
      const scores = game.players
        .map((p) => ({
          id: p.id,
          strokes:
            p.holes.find((h) => h.holeNumber === hole.holeNumber)?.strokes || 0,
        }))
        .filter((s) => s.strokes > 0);
      if (scores.length === 0) {
        winners[hole.holeNumber] = null;
        return;
      }
      const min = Math.min(...scores.map((s) => s.strokes));
      const minScores = scores.filter((s) => s.strokes === min);
      winners[hole.holeNumber] =
        minScores.length === 1 ? minScores[0].id : null;
    });
    return winners;
  })();

  const getGreenieHolesForSide = (
    holes: CourseHole[],
    closest: Record<number, string | null>,
    side: "front" | "back",
  ): number[] => {
    const [start, end] = side === "front" ? [1, 9] : [10, 18];
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

  const greenieHolesSet = new Set<number>([
    ...getGreenieHolesForSide(game.course.holes, game.closestToPin, "front"),
    ...getGreenieHolesForSide(game.course.holes, game.closestToPin, "back"),
  ]);

  const isGreenieHole = (holeNumber: number) => greenieHolesSet.has(holeNumber);

  const isEditing = (playerId: string, holeNumber: number) => {
    return (
      editingCell?.playerId === playerId &&
      editingCell?.holeNumber === holeNumber
    );
  };

  const getScoreColor = (strokes: number, par: number) => {
    if (strokes === 0) return "";
    if (strokes < par) return "bg-green-100 text-green-800";
    if (strokes === par) return "bg-blue-100 text-blue-800";
    if (strokes === par + 1) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const getScoreBorderStyle = (strokes: number, par: number) => {
    if (strokes === 0) return "";
    if (strokes === par - 2) return "border-2 border-green-600 rounded-full"; // Double circle for eagle
    if (strokes < par) return "border-2 border-green-600 rounded-full"; // Circle for birdie
    if (strokes === par) return ""; // No special border for par
    if (strokes === par + 1) return "border-2 border-yellow-600"; // Square for bogey
    if (strokes === par + 2) return "border-2 border-red-600"; // Double square for double bogey
    return "border-2 border-red-800 relative"; // Cross-hatched for triple bogey+
  };

  const getDoubleCircleStyle = (strokes: number, par: number) => {
    if (strokes === par - 2) {
      return {
        boxShadow: "inset 0 0 0 2px white, inset 0 0 0 4px green",
      };
    }
    return {};
  };

  const getDoubleSquareStyle = (strokes: number, par: number) => {
    if (strokes === par + 2) {
      return {
        boxShadow: "inset 0 0 0 2px white, inset 0 0 0 4px red",
      };
    }
    return {};
  };

  const getCrossHatchStyle = (strokes: number, par: number) => {
    if (strokes > par + 2) {
      return {
        background: `linear-gradient(45deg, rgba(255,255,255,0.8) 40%, rgba(139,0,0,0.6) 40%, rgba(139,0,0,0.6) 60%, rgba(255,255,255,0.8) 60%), 
                     linear-gradient(-45deg, rgba(255,255,255,0.8) 40%, rgba(139,0,0,0.6) 40%, rgba(139,0,0,0.6) 60%, rgba(255,255,255,0.8) 60%)`,
        backgroundSize: "6px 6px",
      };
    }
    return {};
  };

  const getScoreDisplay = (strokes: number, par: number) => {
    if (strokes === 0) return "-";
    return `${strokes}`;
  };

  const calculateTotalToPar = (player: Player) => {
    return player.holes.reduce((total: number, hole: HoleScore) => {
      if (hole.strokes > 0) {
        return total + (hole.strokes - hole.par);
      }
      return total;
    }, 0);
  };


  return (
    <div className="golf-card">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Score Card</h3>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-3 py-2 text-left font-semibold">
                Player
              </th>
              {game.course.holes.map((hole) => (
                <Fragment key={hole.holeNumber}>
                  <th
                    className={`border border-gray-300 px-2 py-2 text-center font-semibold text-sm ${hole.holeNumber === 10 ? "border-l-4" : ""}`}
                  >
                    <div>{hole.holeNumber}</div>
                    <div className="text-xs text-gray-600">Par {hole.par}</div>
                    <div className="text-xs text-gray-500">H{hole.handicap}</div>
                  </th>
                  {hole.par === 3 && isGreenieHole(hole.holeNumber) && (
                    <th
                      className={`border border-green-300 bg-green-50 px-1 py-2 text-center font-semibold text-xs ${hole.holeNumber === 10 ? "border-l-4" : ""}`}
                    >
                      G
                    </th>
                  )}
                  {hole.par === 5 && (
                    <th
                      className={`border border-orange-300 bg-orange-50 px-1 py-2 text-center font-semibold text-xs ${hole.holeNumber === 10 ? "border-l-4" : ""}`}
                    >
                      5
                    </th>
                  )}
                  {hole.par === 4 && isFourHole(hole.holeNumber) && (
                    <th
                      className={`border border-blue-300 bg-blue-50 px-1 py-2 text-center font-semibold text-xs ${hole.holeNumber === 10 ? "border-l-4" : ""}`}
                    >
                      4
                    </th>
                  )}
                  {isLostBallHole(hole.holeNumber) && (
                    <th
                      className={`border border-red-300 bg-red-50 px-1 py-2 text-center font-semibold text-xs ${hole.holeNumber === 10 ? "border-l-4" : ""}`}
                    >
                      😅
                    </th>
                  )}
                </Fragment>
              ))}
              <th className="border border-gray-300 px-3 py-2 text-center font-semibold">
                Total
              </th>
              <th className="border border-gray-300 px-3 py-2 text-center font-semibold">
                To Par
              </th>
              <th className="border border-gray-300 px-3 py-2 text-center font-semibold">
                Skins
              </th>
            </tr>
          </thead>
          <tbody>
            {game.players.map((player, playerIndex) => (
              <Fragment key={player.id}>
                {/* Strokes Row */}
                <tr
                  className={playerIndex % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  <td className="border border-gray-300 px-3 py-2 font-medium">
                    {player.name}
                  </td>
                  {player.holes.map((hole) => {
                    const value = hole.strokes;
                    const editing = isEditing(player.id, hole.holeNumber);

                    return (
                      <Fragment key={hole.holeNumber}>
                        <td className={`border border-gray-300 px-2 py-1 text-center ${hole.holeNumber === 10 ? "border-l-4" : ""}`}>
                          {editing ? (
                            <input
                              type="number"
                              value={editingValue}
                              onChange={handleInputChange}
                              onBlur={(e) => handleCellChange(e.target.value)}
                              onKeyPress={(e) =>
                                e.key === "Enter" &&
                                handleCellChange((e.target as HTMLInputElement).value)
                              }
                              className="w-12 text-center border border-gray-300 rounded px-1"
                              autoFocus
                              min="1"
                              max="20"
                            />
                          ) : (
                            <button
                              onClick={() =>
                                handleCellClick(player.id, hole.holeNumber)
                              }
                              className={`mx-auto w-10 h-10 md:w-8 md:h-8 flex items-center justify-center rounded border border-gray-300 bg-white hover:bg-gray-200 transition-colors ${
                                holeWinners[hole.holeNumber] === player.id ? "text-lg font-bold" : "text-sm"
                              } ${getScoreColor(
                                value,
                                hole.par,
                              )} ${getScoreBorderStyle(value, hole.par)}`}
                              style={{
                                ...getCrossHatchStyle(value, hole.par),
                                ...getDoubleCircleStyle(value, hole.par),
                                ...getDoubleSquareStyle(value, hole.par),
                              }}
                            >
                              {getScoreDisplay(value, hole.par)}
                            </button>
                          )}
                        </td>
                        {hole.par === 3 && isGreenieHole(hole.holeNumber) && (
                          <td className={`border border-green-300 bg-green-50 px-1 text-center ${hole.holeNumber === 10 ? "border-l-4" : ""}`}
                          >
                            <input
                              type="checkbox"
                              checked={
                                game.greenies[hole.holeNumber]?.[player.id] || false
                              }
                              onChange={(e) =>
                                onToggleGreenie(
                                  hole.holeNumber,
                                  player.id,
                                  e.target.checked,
                                )
                              }
                            />
                          </td>
                        )}
                        {hole.par === 5 && (
                          <td className={`border border-orange-300 bg-orange-50 px-1 text-center ${hole.holeNumber === 10 ? "border-l-4" : ""}`}
                          >
                            <input
                              type="checkbox"
                              checked={
                                game.fivers[hole.holeNumber]?.[player.id] || false
                              }
                              onChange={(e) =>
                                onToggleFiver(
                                  hole.holeNumber,
                                  player.id,
                                  e.target.checked,
                                )
                              }
                            />
                          </td>
                        )}
                        {hole.par === 4 && isFourHole(hole.holeNumber) && (
                          <td className={`border border-blue-300 bg-blue-50 px-1 text-center ${hole.holeNumber === 10 ? "border-l-4" : ""}`}
                          >
                            <input
                              type="checkbox"
                              checked={
                                game.fours[hole.holeNumber]?.[player.id] || false
                              }
                              onChange={(e) =>
                                onToggleFour(
                                  hole.holeNumber,
                                  player.id,
                                  e.target.checked,
                                )
                              }
                            />
                          </td>
                        )}
                        {isLostBallHole(hole.holeNumber) && (
                          <td className={`border border-red-300 bg-red-50 px-1 text-center ${hole.holeNumber === 10 ? "border-l-4" : ""}`}
                          >
                            <input
                              type="checkbox"
                              checked={
                                game.lostBalls[hole.holeNumber]?.[player.id] || false
                              }
                              onChange={(e) =>
                                onToggleLostBall(
                                  hole.holeNumber,
                                  player.id,
                                  e.target.checked,
                                )
                              }
                            />
                          </td>
                        )}
                      </Fragment>
                    );
                  })}
                  <td className="border border-gray-300 px-3 py-2 text-center font-bold bg-blue-100">
                    {player.totalScore}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center font-bold bg-purple-100">
                    {(() => {
                      const toPar = calculateTotalToPar(player);
                      if (toPar === 0) return "E";
                      return toPar > 0 ? `+${toPar}` : `${toPar}`;
                    })()}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center font-bold bg-green-100">
                    {player.skins}
                  </td>
                </tr>


              </Fragment>
            ))}
            <tr className="bg-yellow-50">
              <td className="border border-gray-300 px-3 py-2 font-medium">
                CTP
              </td>

              {game.course.holes.map((hole) => (
                <Fragment key={hole.holeNumber}>
                  <td className={`border border-gray-300 px-2 py-1 text-center ${hole.holeNumber === 10 ? "border-l-4" : ""}`}
                  >
                    {isClosestHole(hole.holeNumber) ? (
                      <select
                        className="text-sm"
                        value={
                          game.closestToPin[hole.holeNumber] === null
                            ? "none"
                            : game.closestToPin[hole.holeNumber] ?? ""
                        }
                        onChange={(e) =>
                          onUpdateClosest(
                            hole.holeNumber,
                            e.target.value === "none" ? null : e.target.value,
                          )
                        }
                      >
                        <option value="" disabled>...</option>
                        <option value="none">None</option>
                        {game.players.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    ) : null}
                  </td>
                  {hole.par === 3 && isGreenieHole(hole.holeNumber) && (
                    <td className={`border border-green-300 bg-green-50 px-1 ${hole.holeNumber === 10 ? "border-l-4" : ""}`} />
                  )}
                  {hole.par === 5 && (
                    <td className={`border border-orange-300 bg-orange-50 px-1 ${hole.holeNumber === 10 ? "border-l-4" : ""}`} />
                  )}
                  {hole.par === 4 && isFourHole(hole.holeNumber) && (
                    <td className={`border border-blue-300 bg-blue-50 px-1 ${hole.holeNumber === 10 ? "border-l-4" : ""}`} />
                  )}
                  {isLostBallHole(hole.holeNumber) && (
                    <td className={`border border-red-300 bg-red-50 px-1 ${hole.holeNumber === 10 ? "border-l-4" : ""}`} />
                  )}
                </Fragment>
              ))}
              <td
                className="border border-gray-300 px-3 py-2"
                colSpan={3}
              ></td>
            </tr>

            <tr className="bg-yellow-50">
              <td className="border border-gray-300 px-3 py-2 font-medium">
                LD
              </td>

              {game.course.holes.map((hole) => (
                <Fragment key={hole.holeNumber}>
                  <td className={`border border-gray-300 px-2 py-1 text-center ${hole.holeNumber === 10 ? "border-l-4" : ""}`}
                  >
                    {isLongestHole(hole.holeNumber) ? (
                      <select
                        className="text-sm"
                        value={
                          game.longestDrive[hole.holeNumber] === null
                            ? "none"
                            : game.longestDrive[hole.holeNumber] ?? ""
                        }
                        onChange={(e) =>
                          onUpdateLongest(
                            hole.holeNumber,
                            e.target.value === "none" ? null : e.target.value,
                          )
                        }
                      >
                        <option value="" disabled>...</option>
                        <option value="none">None</option>
                        {game.players.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    ) : null}
                  </td>
                  {hole.par === 3 && isGreenieHole(hole.holeNumber) && (
                    <td className={`border border-green-300 bg-green-50 px-1 ${hole.holeNumber === 10 ? "border-l-4" : ""}`} />
                  )}
                  {hole.par === 5 && (
                    <td className={`border border-orange-300 bg-orange-50 px-1 ${hole.holeNumber === 10 ? "border-l-4" : ""}`} />
                  )}
                  {hole.par === 4 && isFourHole(hole.holeNumber) && (
                    <td className={`border border-blue-300 bg-blue-50 px-1 ${hole.holeNumber === 10 ? "border-l-4" : ""}`} />
                  )}
                  {isLostBallHole(hole.holeNumber) && (
                    <td className={`border border-red-300 bg-red-50 px-1 ${hole.holeNumber === 10 ? "border-l-4" : ""}`} />
                  )}
                </Fragment>
              ))}
              <td
                className="border border-gray-300 px-3 py-2"
                colSpan={3}
              ></td>
            </tr>
            <tr className="bg-yellow-50">
              <td className="border border-gray-300 px-3 py-2 font-medium">
                LB
              </td>

              {game.course.holes.map((hole) => (
                <Fragment key={hole.holeNumber}>
                  <td className={`border border-gray-300 px-2 py-1 text-center ${hole.holeNumber === 10 ? "border-l-4" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={game.lostBallHoles[hole.holeNumber] || false}
                      onChange={(e) =>
                        onToggleLostBallHole(hole.holeNumber, e.target.checked)
                      }
                    />
                  </td>
                  {hole.par === 3 && isGreenieHole(hole.holeNumber) && (
                    <td className={`border border-green-300 bg-green-50 px-1 ${hole.holeNumber === 10 ? "border-l-4" : ""}`} />
                  )}
                  {hole.par === 5 && (
                    <td className={`border border-orange-300 bg-orange-50 px-1 ${hole.holeNumber === 10 ? "border-l-4" : ""}`} />
                  )}
                  {hole.par === 4 && isFourHole(hole.holeNumber) && (
                    <td className={`border border-blue-300 bg-blue-50 px-1 ${hole.holeNumber === 10 ? "border-l-4" : ""}`} />
                  )}
                  {isLostBallHole(hole.holeNumber) && (
                    <td className={`border border-red-300 bg-red-50 px-1 ${hole.holeNumber === 10 ? "border-l-4" : ""}`} />
                  )}
                </Fragment>
              ))}
              <td
                className="border border-gray-300 px-3 py-2"
                colSpan={3}
              ></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden space-y-4">
          {game.players.map((player) => {
          const toPar = calculateTotalToPar(player);

          return (
            <div key={player.id} className="border rounded-lg overflow-hidden">
              <div className="flex justify-between items-center bg-gray-100 px-3 py-2">
                <span className="font-semibold">{player.name}</span>
              </div>
              <table className="w-full border-collapse">
                <thead className="text-xs">
                  <tr className="bg-gray-50">
                    <th className="border px-2 py-1 text-left">Hole</th>
                    <th className="border px-2 py-1 text-center">Strokes</th>
                    <th className="border px-2 py-1 text-center">G</th>
                    <th className="border px-2 py-1 text-center">5</th>
                    <th className="border px-2 py-1 text-center">4</th>
                    <th className="border px-2 py-1 text-center">😅</th>
                  </tr>
                </thead>
                <tbody>
                  {player.holes.map((hole) => {
                    const strokeEditing = isEditing(
                      player.id,
                      hole.holeNumber,
                    );
                    return (
                      <tr key={hole.holeNumber}>
                        <td className="border px-2 py-1">
                          <div className="font-medium">{hole.holeNumber}</div>
                          <div className="text-xs text-gray-600 flex items-center space-x-1">
                            <span>Par {hole.par}</span>
                            <span className="text-gray-500">H{hole.holeHandicap}</span>
                          </div>
                        </td>
                        <td className={`border px-2 py-1 text-center ${hole.holeNumber === 10 ? "border-l-4" : ""}`}>
                          {strokeEditing ? (
                            <input
                              type="number"
                              value={editingValue}
                              onChange={handleInputChange}
                              onBlur={(e) => handleCellChange(e.target.value)}
                              onKeyPress={(e) =>
                                e.key === "Enter" &&
                                handleCellChange(
                                  (e.target as HTMLInputElement).value,
                                )
                              }
                              className="w-12 text-center border border-gray-300 rounded px-1 text-sm"
                              autoFocus
                              min="1"
                              max="20"
                            />
                          ) : (
                            <button
                              onClick={() =>
                                handleCellClick(
                                  player.id,
                                  hole.holeNumber,
                                )
                              }
                              className={`mx-auto w-10 h-10 md:w-8 md:h-8 flex items-center justify-center rounded border border-gray-300 bg-white hover:bg-gray-200 transition-colors ${
                                holeWinners[hole.holeNumber] === player.id ? "text-lg font-bold" : "text-sm"
                              } ${getScoreColor(hole.strokes, hole.par)} ${getScoreBorderStyle(hole.strokes, hole.par)}`}
                              style={{
                                ...getCrossHatchStyle(hole.strokes, hole.par),
                                ...getDoubleCircleStyle(hole.strokes, hole.par),
                                ...getDoubleSquareStyle(hole.strokes, hole.par),
                              }}
                            >
                              {getScoreDisplay(hole.strokes, hole.par)}
                            </button>
                          )}
                        </td>
                        <td className={`border px-2 py-1 text-center ${hole.holeNumber === 10 ? "border-l-4" : ""}`}>
                          {hole.par === 3 && isGreenieHole(hole.holeNumber) ? (
                            <input
                              type="checkbox"
                              checked={
                                game.greenies[hole.holeNumber]?.[player.id] || false
                              }
                              onChange={(e) =>
                                onToggleGreenie(
                                  hole.holeNumber,
                                  player.id,
                                  e.target.checked,
                                )
                              }
                            />
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className={`border px-2 py-1 text-center ${hole.holeNumber === 10 ? "border-l-4" : ""}`}>
                          {hole.par === 5 ? (
                            <input
                              type="checkbox"
                              checked={
                                game.fivers[hole.holeNumber]?.[player.id] || false
                              }
                              onChange={(e) =>
                                onToggleFiver(
                                  hole.holeNumber,
                                  player.id,
                                  e.target.checked,
                                )
                              }
                            />
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className={`border px-2 py-1 text-center ${hole.holeNumber === 10 ? "border-l-4" : ""}`}>
                          {hole.par === 4 && isFourHole(hole.holeNumber) ? (
                            <input
                              type="checkbox"
                              checked={
                                game.fours[hole.holeNumber]?.[player.id] || false
                              }
                              onChange={(e) =>
                                onToggleFour(
                                  hole.holeNumber,
                                  player.id,
                                  e.target.checked,
                                )
                              }
                            />
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className={`border px-2 py-1 text-center ${hole.holeNumber === 10 ? "border-l-4" : ""}`}>
                          {isLostBallHole(hole.holeNumber) ? (
                            <input
                              type="checkbox"
                              checked={
                                game.lostBalls[hole.holeNumber]?.[player.id] || false
                              }
                              onChange={(e) =>
                                onToggleLostBall(
                                  hole.holeNumber,
                                  player.id,
                                  e.target.checked,
                                )
                              }
                            />
                          ) : (
                            "-"
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-gray-50 font-semibold text-sm">
                    <td className="border px-2 py-1">Total</td>
                    <td className="border px-2 py-1 text-center">
                      {player.totalScore}
                    </td>
                  <td className="border px-2 py-1" />
                  <td className="border px-2 py-1" />
                  <td className="border px-2 py-1" />
                  <td className="border px-2 py-1" />
                  </tr>
                  <tr className="bg-gray-50 font-semibold text-sm">
                    <td className="border px-2 py-1">To Par</td>
                    <td className="border px-2 py-1 text-center" colSpan={5}>
                      {toPar === 0 ? "E" : toPar > 0 ? `+${toPar}` : `${toPar}`}
                    </td>
                  </tr>
                  <tr className="bg-gray-50 font-semibold text-sm">
                    <td className="border px-2 py-1">Skins</td>
                    <td className="border px-2 py-1 text-center" colSpan={5}>
                      {player.skins}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {game.players.map((player) => {
          const toPar = calculateTotalToPar(player);

          return (
            <div key={player.id} className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-2">
                {player.name}
              </h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Total Score:</span>
                  <span className="font-bold text-blue-600">
                    {player.totalScore}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>To Par:</span>
                  <span
                    className={`font-bold ${
                      toPar === 0
                        ? "text-gray-600"
                        : toPar > 0
                          ? "text-red-600"
                          : "text-green-600"
                    }`}
                  >
                    {toPar === 0 ? "E" : toPar > 0 ? `+${toPar}` : `${toPar}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Skins:</span>
                  <span className="font-bold">{player.skins}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ScoreCard;
