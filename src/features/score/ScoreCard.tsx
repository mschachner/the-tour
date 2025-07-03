import { useState, Fragment } from "react";
import type { ChangeEvent } from "react";
import { Game, Player, HoleScore, CourseHole } from "../../types/golf";
import PlayerIcon from "../player/PlayerIcon";
import PlayerHeader from "../player/PlayerHeader";
import PlayerSelect from "../player/PlayerSelect";

const HOLE_COL_WIDTH = "w-12";
const SKIN_COL_WIDTH = "w-8 md:w-6 min-w-[2rem]";
const PLAYER_COL_WIDTH = "w-20 md:w-24";
const TOTAL_COL_WIDTH = "w-12";

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
  onToggleSandyHole: (holeNumber: number, value: boolean) => void;
  onToggleSandy: (holeNumber: number, playerId: string, value: boolean) => void;
  onToggleDoubleSandy: (
    holeNumber: number,
    playerId: string,
    value: boolean,
  ) => void;
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
  onToggleSandyHole,
  onToggleSandy,
  onToggleDoubleSandy,
  onToggleLostBallHole,
  onToggleLostBall,
}: ScoreCardProps) => {
  const [editingCell, setEditingCell] = useState<{
    playerId: string;
    holeNumber: number;
  } | null>(null);
  const [editingValue, setEditingValue] = useState<string>("");
  const [showTotals, setShowTotals] = useState(false);

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

  // Dynamic sizing for mobile
  const numPlayers = game.players.length;
  const getMobilePlayerWidthClass = (n: number) => {
    if (n <= 3) return "w-10";
    if (n === 4) return "w-8";
    if (n === 5) return "w-6";
    if (n === 6) return "w-5";
    if (n === 7) return "w-4";
    if (n === 8) return "w-4";
    return "w-3";
  };
  const getMobilePlayerPaddingClass = (n: number) => {
    if (n <= 3) return "px-2";
    if (n === 4) return "px-1";
    if (n === 5) return "px-1";
    if (n === 6) return "px-1";
    return "px-0.5";
  };
  const mobilePlayerWidthClass = getMobilePlayerWidthClass(numPlayers);
  const mobilePlayerPaddingClass = getMobilePlayerPaddingClass(numPlayers);
  const mobileHeaderTextClass = numPlayers >= 7 ? "text-[10px]" : numPlayers > 4 ? "text-xs" : "";
  const mobileIconSize = numPlayers >= 7 ? 12 : numPlayers > 4 ? 16 : 20;

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

  const isSandyHole = (holeNumber: number) =>
    game.sandyHoles[holeNumber];

  const isLostBallHole = (holeNumber: number) =>
    game.lostBallHoles[holeNumber];

  const parMap: Record<number, boolean> = {};
  game.course.holes.forEach((hole) => {
    parMap[hole.holeNumber] = game.players.some((p) => {
      const score = p.holes.find((h) => h.holeNumber === hole.holeNumber);
      return score !== undefined && score.strokes <= hole.par && score.strokes > 0;
    });
  });

  const playerMadePar = (playerId: string, holeNumber: number) => {
    const player = game.players.find((p) => p.id === playerId);
    const hole = player?.holes.find((h) => h.holeNumber === holeNumber);
    return hole ? hole.strokes <= hole.par && hole.strokes > 0 : false;
  };

  const isHoleWinner = (holeNumber: number, playerId: string) => {
    const scores = game.players
      .map((p) => ({
        id: p.id,
        strokes:
          p.holes.find((h) => h.holeNumber === holeNumber)?.strokes || 0,
      }))
      .filter((s) => s.strokes > 0);
    if (scores.length === 0) return false;
    const min = Math.min(...scores.map((s) => s.strokes));
    const winners = scores.filter((s) => s.strokes === min);
    return winners.length === 1 && winners[0].id === playerId;
  };

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

  const frontHoles = game.course.holes.filter((h) => h.holeNumber <= 9);
  const backHoles = game.course.holes.filter((h) => h.holeNumber > 9);

const renderDesktopTable = (
  holes: CourseHole[],
  includeTotals: boolean,
) => (
    <table className="w-full table-fixed border-collapse">
      <thead>
        <tr className="bg-gray-100">
          <th
            className={`border border-gray-300 px-3 py-2 text-left font-semibold ${PLAYER_COL_WIDTH}`}
          >
            Player
          </th>
          <th
            className={`border border-gray-300 px-3 py-2 text-center font-semibold ${TOTAL_COL_WIDTH}`}
          >
            Skins
          </th>
          {holes.map((hole) => (
            <Fragment key={hole.holeNumber}>
              <th
                className={`border border-gray-300 px-2 py-2 text-center font-semibold text-sm ${
                  hole.holeNumber === 10 ? "border-l-4" : ""
                } ${HOLE_COL_WIDTH}`}
              >
                <div>{hole.holeNumber}</div>
                <div className="text-xs text-gray-600">Par {hole.par}</div>
                <div className="text-xs text-gray-500">H{hole.handicap}</div>
              </th>
              {hole.par === 3 &&
                isGreenieHole(hole.holeNumber) &&
                parMap[hole.holeNumber] && (
                  <th
                    className={`border border-green-300 bg-green-50 px-1 py-2 text-center font-semibold text-xs ${
                      hole.holeNumber === 10 ? "border-l-4" : ""
                    } ${SKIN_COL_WIDTH}`}
                  >
                    G
                  </th>
                )}
              {hole.par === 5 && parMap[hole.holeNumber] && (
                <th
                  className={`border border-orange-300 bg-orange-50 px-1 py-2 text-center font-semibold text-xs ${
                    hole.holeNumber === 10 ? "border-l-4" : ""
                  } ${SKIN_COL_WIDTH}`}
                >
                  5
                </th>
              )}
              {hole.par === 4 &&
                isFourHole(hole.holeNumber) &&
                parMap[hole.holeNumber] && (
                  <th
                    className={`border border-blue-300 bg-blue-50 px-1 py-2 text-center font-semibold text-xs ${
                      hole.holeNumber === 10 ? "border-l-4" : ""
                    } ${SKIN_COL_WIDTH}`}
                  >
                    4
                  </th>
                )}
              {isSandyHole(hole.holeNumber) && parMap[hole.holeNumber] && (
                <th
                  className={`border border-yellow-300 bg-yellow-50 px-1 py-2 text-center font-semibold text-xs ${
                    hole.holeNumber === 10 ? "border-l-4" : ""
                  } ${SKIN_COL_WIDTH}`}
                >
                  🏖️
                </th>
              )}
              {isLostBallHole(hole.holeNumber) && parMap[hole.holeNumber] && (
                <th
                  className={`border border-red-300 bg-red-50 px-1 py-2 text-center font-semibold text-xs ${
                    hole.holeNumber === 10 ? "border-l-4" : ""
                  } ${SKIN_COL_WIDTH}`}
                >
                  😅
                </th>
              )}
            </Fragment>
          ))}
          {includeTotals && (
            <>
              <th
                className={`border border-gray-300 px-3 py-2 text-center font-semibold ${TOTAL_COL_WIDTH}`}
              >
                Total
              </th>
              <th
                className={`border border-gray-300 px-3 py-2 text-center font-semibold ${TOTAL_COL_WIDTH}`}
              >
                To Par
              </th>
            </>
          )}
        </tr>
      </thead>
      <tbody>
        {game.players.map((player, playerIndex) => (
          <Fragment key={player.id}>
            <tr className={playerIndex % 2 === 0 ? "bg-white" : "bg-gray-50"}>
              <td
                className={`border border-gray-300 px-3 py-2 font-medium ${PLAYER_COL_WIDTH}`}
              >
                <div className="flex items-center space-x-2">
                  <PlayerIcon name={player.name} color={player.color} size={24} />
                  <span>{player.name}</span>
                </div>
              </td>
              <td
                className={`border border-gray-300 px-3 py-2 text-center font-bold bg-green-100 ${TOTAL_COL_WIDTH}`}
              >
                {player.skins}
              </td>
              {holes.map((hole) => {
                const value = player.holes.find(
                  (h) => h.holeNumber === hole.holeNumber,
                )!.strokes;
                const editing = isEditing(player.id, hole.holeNumber);

                return (
                  <Fragment key={hole.holeNumber}>
                    <td
                      className={`border border-gray-300 px-2 py-1 text-center ${
                        hole.holeNumber === 10 ? "border-l-4" : ""
                      } ${HOLE_COL_WIDTH}`}
                    >
                      {editing ? (
                        <input
                          type="number"
                          value={editingValue}
                          onChange={handleInputChange}
                          onBlur={(e) => handleCellChange(e.target.value)}
                          onKeyPress={(e) =>
                            e.key === "Enter" && handleCellChange(editingValue)
                          }
                          className="score-input"
                          autoFocus
                        />
                      ) : (
                        <button
                          className={`score-button hover:bg-gray-200 ${getScoreColor(
                            value,
                            hole.par,
                          )} ${getScoreBorderStyle(value, hole.par)}`}
                          style={{
                            ...getDoubleCircleStyle(value, hole.par),
                            ...getDoubleSquareStyle(value, hole.par),
                            ...getCrossHatchStyle(value, hole.par),
                          }}
                          onClick={() =>
                            handleCellClick(player.id, hole.holeNumber)
                          }
                        >
                          {getScoreDisplay(value, hole.par)}
                        </button>
                      )}
                    </td>
                    {hole.par === 3 &&
                      isGreenieHole(hole.holeNumber) &&
                      parMap[hole.holeNumber] && (
                        <td
                          className={`border border-green-300 bg-green-50 px-1 text-center ${
                            hole.holeNumber === 10 ? "border-l-4" : ""
                          } ${SKIN_COL_WIDTH}`}
                        >
                          {playerMadePar(player.id, hole.holeNumber) ? (
                            <input
                              type="checkbox"
                              className="w-5 h-5 md:w-4 md:h-4"
                              checked={
                                game.greenies[hole.holeNumber]?.[player.id] ||
                                false
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
                      )}
                    {hole.par === 5 && parMap[hole.holeNumber] && (
                      <td
                        className={`border border-orange-300 bg-orange-50 px-1 text-center ${
                          hole.holeNumber === 10 ? "border-l-4" : ""
                        } ${SKIN_COL_WIDTH}`}
                      >
                        {playerMadePar(player.id, hole.holeNumber) ? (
                          <input
                            type="checkbox"
                            className="w-5 h-5 md:w-4 md:h-4"
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
                    )}
                    {hole.par === 4 &&
                      isFourHole(hole.holeNumber) &&
                      parMap[hole.holeNumber] && (
                        <td
                          className={`border border-blue-300 bg-blue-50 px-1 text-center ${
                            hole.holeNumber === 10 ? "border-l-4" : ""
                          } ${SKIN_COL_WIDTH}`}
                        >
                          <input
                            type="checkbox"
                            className="w-5 h-5 md:w-4 md:h-4"
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
                    {isSandyHole(hole.holeNumber) && parMap[hole.holeNumber] && (
                      <td
                        className={`border border-yellow-300 bg-yellow-50 px-1 text-center ${
                          hole.holeNumber === 10 ? "border-l-4" : ""
                        } ${SKIN_COL_WIDTH}`}
                      >
                        {playerMadePar(player.id, hole.holeNumber) ? (
                          <div className="flex flex-col items-center justify-center space-y-0.5">
                            <input
                              type="checkbox"
                              className="w-5 h-5 md:w-4 md:h-4"
                              checked={
                                game.sandies[hole.holeNumber]?.[player.id] ||
                                false
                              }
                              onChange={(e) =>
                                onToggleSandy(
                                  hole.holeNumber,
                                  player.id,
                                  e.target.checked,
                                )
                              }
                            />
                            {game.sandies[hole.holeNumber]?.[player.id] && (
                              <label className="relative">
                                <input
                                  type="checkbox"
                                  className="w-5 h-5 md:w-4 md:h-4"
                                  checked={
                                    game.doubleSandies[hole.holeNumber]?.[
                                      player.id
                                    ] || false
                                  }
                                  onChange={(e) =>
                                    onToggleDoubleSandy(
                                      hole.holeNumber,
                                      player.id,
                                      e.target.checked,
                                    )
                                  }
                                />
                                <span className="absolute inset-0 flex items-center justify-center text-[10px] pointer-events-none">
                                  2
                                </span>
                              </label>
                            )}
                          </div>
                        ) : (
                          "-"
                        )}
                      </td>
                    )}
                    {isLostBallHole(hole.holeNumber) && parMap[hole.holeNumber] && (
                      <td
                        className={`border border-red-300 bg-red-50 px-1 text-center ${
                          hole.holeNumber === 10 ? "border-l-4" : ""
                        } ${SKIN_COL_WIDTH}`}
                      >
                        {playerMadePar(player.id, hole.holeNumber) ? (
                          <input
                            type="checkbox"
                            className="w-5 h-5 md:w-4 md:h-4"
                            checked={
                              game.lostBalls[hole.holeNumber]?.[player.id] ||
                              false
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
                    )}
                  </Fragment>
                );
              })}
              {includeTotals && (
                <>
                  <td
                    className={`border border-gray-300 px-3 py-2 text-center font-bold bg-blue-100 ${TOTAL_COL_WIDTH}`}
                  >
                    {player.totalScore}
                  </td>
                  <td
                    className={`border border-gray-300 px-3 py-2 text-center font-bold bg-purple-100 ${TOTAL_COL_WIDTH}`}
                  >
                    {(() => {
                      const toPar = calculateTotalToPar(player);
                      if (toPar === 0) return "E";
                      return toPar > 0 ? `+${toPar}` : `${toPar}`;
                    })()}
                  </td>
                </>
              )}
            </tr>
          </Fragment>
        ))}
        {/* CTP Row */}
        <tr className="bg-yellow-50">
          <td className={`border border-gray-300 px-3 py-2 font-medium text-center ${PLAYER_COL_WIDTH}`}>CTP</td>
          <td className={`border border-gray-300 px-3 py-2 ${TOTAL_COL_WIDTH}`}></td>
          {holes.map((hole) => (
            <Fragment key={hole.holeNumber}>
              <td
                className={`border border-gray-300 px-2 py-1 text-center align-middle ${
                  hole.holeNumber === 10 ? "border-l-4" : ""
                } ${HOLE_COL_WIDTH}`}
              >
                {isClosestHole(hole.holeNumber) ? (
                  <PlayerSelect
                    players={game.players}
                    selected={game.closestToPin[hole.holeNumber]}
                    onSelect={(id) => onUpdateClosest(hole.holeNumber, id)}
                  />
                ) : null}
              </td>
              {hole.par === 3 &&
                isGreenieHole(hole.holeNumber) &&
                parMap[hole.holeNumber] && (
                  <td
                    className={`border border-green-300 bg-green-50 px-1 ${
                      hole.holeNumber === 10 ? "border-l-4" : ""
                    } ${SKIN_COL_WIDTH}`}
                  />
                )}
              {hole.par === 5 && parMap[hole.holeNumber] && (
                <td
                  className={`border border-orange-300 bg-orange-50 px-1 ${
                    hole.holeNumber === 10 ? "border-l-4" : ""
                  } ${SKIN_COL_WIDTH}`}
                />
              )}
              {hole.par === 4 &&
                isFourHole(hole.holeNumber) &&
                parMap[hole.holeNumber] && (
                  <td
                    className={`border border-blue-300 bg-blue-50 px-1 ${
                      hole.holeNumber === 10 ? "border-l-4" : ""
                    } ${SKIN_COL_WIDTH}`}
                  />
                )}
              {isSandyHole(hole.holeNumber) && parMap[hole.holeNumber] && (
                <td
                  className={`border border-yellow-300 bg-yellow-50 px-1 ${
                    hole.holeNumber === 10 ? "border-l-4" : ""
                  } ${SKIN_COL_WIDTH}`}
                />
              )}
              {isLostBallHole(hole.holeNumber) && parMap[hole.holeNumber] && (
                <td
                  className={`border border-red-300 bg-red-50 px-1 ${
                    hole.holeNumber === 10 ? "border-l-4" : ""
                  } ${SKIN_COL_WIDTH}`}
                />
              )}
            </Fragment>
          ))}
          {includeTotals && (
            <td className="border border-gray-300 px-3 py-2" colSpan={2}></td>
          )}
        </tr>
        {/* LD Row */}
        <tr className="bg-yellow-50">
          <td className={`border border-gray-300 px-3 py-2 font-medium text-center ${PLAYER_COL_WIDTH}`}>LD</td>
          <td className={`border border-gray-300 px-3 py-2 ${TOTAL_COL_WIDTH}`}></td>
          {holes.map((hole) => (
            <Fragment key={hole.holeNumber}>
              <td
                className={`border border-gray-300 px-2 py-1 text-center align-middle ${
                  hole.holeNumber === 10 ? "border-l-4" : ""
                } ${HOLE_COL_WIDTH}`}
              >
                {isLongestHole(hole.holeNumber) ? (
                  <PlayerSelect
                    players={game.players}
                    selected={game.longestDrive[hole.holeNumber]}
                    onSelect={(id) => onUpdateLongest(hole.holeNumber, id)}
                  />
                ) : null}
              </td>
              {hole.par === 3 &&
                isGreenieHole(hole.holeNumber) &&
                parMap[hole.holeNumber] && (
                  <td
                    className={`border border-green-300 bg-green-50 px-1 ${
                      hole.holeNumber === 10 ? "border-l-4" : ""
                    } ${SKIN_COL_WIDTH}`}
                  />
                )}
              {hole.par === 5 && parMap[hole.holeNumber] && (
                <td
                  className={`border border-orange-300 bg-orange-50 px-1 ${
                    hole.holeNumber === 10 ? "border-l-4" : ""
                  } ${SKIN_COL_WIDTH}`}
                />
              )}
              {hole.par === 4 &&
                isFourHole(hole.holeNumber) &&
                parMap[hole.holeNumber] && (
                  <td
                    className={`border border-blue-300 bg-blue-50 px-1 ${
                      hole.holeNumber === 10 ? "border-l-4" : ""
                    } ${SKIN_COL_WIDTH}`}
                  />
                )}
              {isSandyHole(hole.holeNumber) && parMap[hole.holeNumber] && (
                <td
                  className={`border border-yellow-300 bg-yellow-50 px-1 ${
                    hole.holeNumber === 10 ? "border-l-4" : ""
                  } ${SKIN_COL_WIDTH}`}
                />
              )}
              {isLostBallHole(hole.holeNumber) && parMap[hole.holeNumber] && (
                <td
                  className={`border border-red-300 bg-red-50 px-1 ${
                    hole.holeNumber === 10 ? "border-l-4" : ""
                  } ${SKIN_COL_WIDTH}`}
                />
              )}
            </Fragment>
          ))}
          {includeTotals && (
            <td className="border border-gray-300 px-3 py-2" colSpan={2}></td>
          )}
        </tr>
        {/* Sandy Row */}
        <tr className="bg-yellow-50">
          <td className={`border border-gray-300 px-3 py-2 font-medium text-center ${PLAYER_COL_WIDTH}`}>🏖️</td>
          <td className={`border border-gray-300 px-3 py-2 ${TOTAL_COL_WIDTH}`}></td>
          {holes.map((hole) => (
            <Fragment key={hole.holeNumber}>
              <td
                className={`border border-gray-300 px-2 py-1 text-center ${
                  hole.holeNumber === 10 ? "border-l-4" : ""
                } ${HOLE_COL_WIDTH}`}
              >
                <input
                  type="checkbox"
                  className="mx-auto block w-5 h-5 md:w-4 md:h-4"
                  checked={game.sandyHoles[hole.holeNumber] || false}
                  onChange={(e) =>
                    onToggleSandyHole(hole.holeNumber, e.target.checked)
                  }
                />
              </td>
              {hole.par === 3 &&
                isGreenieHole(hole.holeNumber) &&
                parMap[hole.holeNumber] && (
                  <td
                    className={`border border-green-300 bg-green-50 px-1 ${
                      hole.holeNumber === 10 ? "border-l-4" : ""
                    } ${SKIN_COL_WIDTH}`}
                  />
                )}
              {hole.par === 5 && parMap[hole.holeNumber] && (
                <td
                  className={`border border-orange-300 bg-orange-50 px-1 ${
                    hole.holeNumber === 10 ? "border-l-4" : ""
                  } ${SKIN_COL_WIDTH}`}
                />
              )}
              {hole.par === 4 &&
                isFourHole(hole.holeNumber) &&
                parMap[hole.holeNumber] && (
                  <td
                    className={`border border-blue-300 bg-blue-50 px-1 ${
                      hole.holeNumber === 10 ? "border-l-4" : ""
                    } ${SKIN_COL_WIDTH}`}
                  />
                )}
              {isSandyHole(hole.holeNumber) && parMap[hole.holeNumber] && (
                <td
                  className={`border border-yellow-300 bg-yellow-50 px-1 ${
                    hole.holeNumber === 10 ? "border-l-4" : ""
                  } ${SKIN_COL_WIDTH}`}
                />
              )}
              {isLostBallHole(hole.holeNumber) && parMap[hole.holeNumber] && (
                <td
                  className={`border border-red-300 bg-red-50 px-1 ${
                    hole.holeNumber === 10 ? "border-l-4" : ""
                  } ${SKIN_COL_WIDTH}`}
                />
              )}
            </Fragment>
          ))}
          {includeTotals && (
            <td className="border border-gray-300 px-3 py-2" colSpan={2}></td>
          )}
        </tr>
        {/* Lost Ball Row */}
        <tr className="bg-yellow-50">
          <td className={`border border-gray-300 px-3 py-2 font-medium text-center ${PLAYER_COL_WIDTH}`}>LB</td>
          <td className={`border border-gray-300 px-3 py-2 ${TOTAL_COL_WIDTH}`}></td>
          {holes.map((hole) => (
            <Fragment key={hole.holeNumber}>
              <td
                className={`border border-gray-300 px-2 py-1 text-center ${
                  hole.holeNumber === 10 ? "border-l-4" : ""
                } ${HOLE_COL_WIDTH}`}
              >
                <input
                  type="checkbox"
                  className="mx-auto block w-5 h-5 md:w-4 md:h-4"
                  checked={game.lostBallHoles[hole.holeNumber] || false}
                  onChange={(e) =>
                    onToggleLostBallHole(hole.holeNumber, e.target.checked)
                  }
                />
              </td>
              {hole.par === 3 &&
                isGreenieHole(hole.holeNumber) &&
                parMap[hole.holeNumber] && (
                  <td
                    className={`border border-green-300 bg-green-50 px-1 ${
                      hole.holeNumber === 10 ? "border-l-4" : ""
                    } ${SKIN_COL_WIDTH}`}
                  />
                )}
              {hole.par === 5 && parMap[hole.holeNumber] && (
                <td
                  className={`border border-orange-300 bg-orange-50 px-1 ${
                    hole.holeNumber === 10 ? "border-l-4" : ""
                  } ${SKIN_COL_WIDTH}`}
                />
              )}
              {hole.par === 4 &&
                isFourHole(hole.holeNumber) &&
                parMap[hole.holeNumber] && (
                  <td
                    className={`border border-blue-300 bg-blue-50 px-1 ${
                      hole.holeNumber === 10 ? "border-l-4" : ""
                    } ${SKIN_COL_WIDTH}`}
                  />
                )}
              {isSandyHole(hole.holeNumber) && parMap[hole.holeNumber] && (
                <td
                  className={`border border-yellow-300 bg-yellow-50 px-1 ${
                    hole.holeNumber === 10 ? "border-l-4" : ""
                  } ${SKIN_COL_WIDTH}`}
                />
              )}
              {isLostBallHole(hole.holeNumber) && parMap[hole.holeNumber] && (
                <td
                  className={`border border-red-300 bg-red-50 px-1 ${
                    hole.holeNumber === 10 ? "border-l-4" : ""
                  } ${SKIN_COL_WIDTH}`}
                />
              )}
            </Fragment>
          ))}
          {includeTotals && (
            <td className="border border-gray-300 px-3 py-2" colSpan={2}></td>
          )}
        </tr>
      </tbody>
    </table>
  );

  const renderTotalsTable = () => (
    <table className="w-full table-fixed border-collapse mt-4">
      <thead>
        <tr className="bg-gray-100">
          <th
            className={`border border-gray-300 px-3 py-2 text-left font-semibold ${PLAYER_COL_WIDTH}`}
          >
            Player
          </th>
          <th
            className={`border border-gray-300 px-3 py-2 text-center font-semibold ${TOTAL_COL_WIDTH}`}
          >
            Skins
          </th>
          {showTotals && (
            <>
              <th
                className={`border border-gray-300 px-3 py-2 text-center font-semibold ${TOTAL_COL_WIDTH}`}
              >
                Total
              </th>
              <th
                className={`border border-gray-300 px-3 py-2 text-center font-semibold ${TOTAL_COL_WIDTH}`}
              >
                To Par
              </th>
            </>
          )}
        </tr>
      </thead>
      <tbody>
        {game.players.map((player, idx) => (
          <tr key={player.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
            <td className={`border border-gray-300 px-3 py-2 font-medium ${PLAYER_COL_WIDTH}`}>
              <div className="flex items-center space-x-2">
                <PlayerIcon name={player.name} color={player.color} size={24} />
                <span>{player.name}</span>
              </div>
            </td>
            <td className={`border border-gray-300 px-3 py-2 text-center font-bold bg-green-100 ${TOTAL_COL_WIDTH}`}>{player.skins}</td>
            {showTotals && (
              <>
                <td className={`border border-gray-300 px-3 py-2 text-center font-bold bg-blue-100 ${TOTAL_COL_WIDTH}`}>{player.totalScore}</td>
                <td className={`border border-gray-300 px-3 py-2 text-center font-bold bg-purple-100 ${TOTAL_COL_WIDTH}`}>{(() => {const t = calculateTotalToPar(player); if (t === 0) return 'E'; return t > 0 ? `+${t}` : `${t}`;})()}</td>
              </>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div className="golf-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-800">Score Card</h3>
        <button
          className="hidden md:inline-block px-2 py-1 text-sm text-white bg-blue-500 rounded"
          onClick={() => setShowTotals((s) => !s)}
        >
          {showTotals ? "Hide Totals" : "Show Totals"}
        </button>
      </div>

      {/* Desktop Table */}
        <div className="hidden xl:block">
          {renderDesktopTable(game.course.holes, showTotals)}
        </div>
        <div className="hidden md:flex xl:hidden flex-wrap gap-4">
          <div className="grow">
            {renderDesktopTable(frontHoles, showTotals)}
          </div>
          <div className="grow md:ml-4 mt-4 md:mt-0">
            {renderDesktopTable(backHoles, showTotals)}
          </div>
          <div className="basis-full mt-4">
            {renderTotalsTable()}
          </div>
        </div>
      {/* Mobile Table */}
      <div className="md:hidden overflow-x-auto mt-4">
        <table className="w-full table-fixed border-collapse text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className={`border border-gray-300 px-3 py-2 text-left font-semibold ${HOLE_COL_WIDTH}`}>Hole</th>
              {game.players.map((player) => (
                <th
                  key={player.id}
                  className={`border border-gray-300 ${mobilePlayerPaddingClass} md:px-2 py-2 text-center font-semibold ${PLAYER_COL_WIDTH} ${mobilePlayerWidthClass}`}
                >
                  <PlayerHeader
                    player={player}
                    iconSize={mobileIconSize}
                    textClass={mobileHeaderTextClass}
                  />
                </th>
              ))}
              <th
                className={`border border-gray-300 px-1 py-2 text-center font-semibold leading-tight text-[10px] ${SKIN_COL_WIDTH}`}
              >
                CTP
              </th>
              <th
                className={`border border-gray-300 px-1 py-2 text-center font-semibold leading-tight text-[10px] ${SKIN_COL_WIDTH}`}
              >
                LD
              </th>
              <th
                className={`border border-gray-300 px-1 py-2 text-center font-semibold leading-tight text-sm ${SKIN_COL_WIDTH}`}
              >
                🏖️
              </th>
              <th
                className={`border border-gray-300 px-1 py-2 text-center font-semibold leading-tight text-[10px] ${SKIN_COL_WIDTH}`}
              >
                LB
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-yellow-50">
              <td className={`border border-gray-300 px-3 py-2 font-medium ${HOLE_COL_WIDTH}`}>Skins</td>
              {game.players.map((p) => (
                <td
                  key={p.id}
                  className={`border border-gray-300 ${mobilePlayerPaddingClass} md:px-2 py-1 text-center font-bold bg-green-100 ${PLAYER_COL_WIDTH} ${mobilePlayerWidthClass}`}
                >
                  {p.skins}
                </td>
              ))}
              <td className="border border-gray-300 px-3 py-2" colSpan={4}></td>
            </tr>
            {game.course.holes.map((hole, holeIndex) => (
              <Fragment key={hole.holeNumber}>
                <tr className={holeIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td
                    className={`border border-gray-300 px-3 py-2 text-center font-medium ${HOLE_COL_WIDTH}`}
                  >
                    <div>{hole.holeNumber}</div>
                    <div className="text-xs text-gray-600">Par {hole.par}</div>
                    <div className="text-xs text-gray-500">H{hole.handicap}</div>
                  </td>
                  {game.players.map((player) => {
                    const phole = player.holes.find((h) => h.holeNumber === hole.holeNumber)!;
                    const editing = isEditing(player.id, hole.holeNumber);
                    return (
                      <td
                        key={player.id}
                        className={`border border-gray-300 ${mobilePlayerPaddingClass} md:px-2 py-1 text-center ${PLAYER_COL_WIDTH} ${mobilePlayerWidthClass}`}
                      >
                        {editing ? (
                          <input
                            type="number"
                            value={editingValue}
                            onChange={handleInputChange}
                            onBlur={(e) => handleCellChange(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleCellChange(editingValue)}
                          className="score-input"
                          autoFocus
                        />
                      ) : (
                        <button
                          className={`score-button hover:bg-gray-200 ${getScoreColor(phole.strokes, phole.par)} ${getScoreBorderStyle(phole.strokes, phole.par)} ${
                            isHoleWinner(hole.holeNumber, player.id) ? 'text-xl font-bold' : ''
                          }`}
                          style={{
                            ...getDoubleCircleStyle(phole.strokes, phole.par),
                            ...getDoubleSquareStyle(phole.strokes, phole.par),
                            ...getCrossHatchStyle(phole.strokes, phole.par),
                          }}
                          onClick={() => handleCellClick(player.id, hole.holeNumber)}
                        >
                          {getScoreDisplay(phole.strokes, phole.par)}
                        </button>
                        )}
                      </td>
                    );
                  })}
                  <td className={`border border-gray-300 px-1 text-center align-middle ${SKIN_COL_WIDTH}`}>
                    {isClosestHole(hole.holeNumber) ? (
                      <PlayerSelect
                        players={game.players}
                        selected={game.closestToPin[hole.holeNumber]}
                        onSelect={(id) => onUpdateClosest(hole.holeNumber, id)}
                      />
                    ) : null}
                  </td>
                  <td className={`border border-gray-300 px-1 text-center align-middle ${SKIN_COL_WIDTH}`}>
                    {isLongestHole(hole.holeNumber) ? (
                      <PlayerSelect
                        players={game.players}
                        selected={game.longestDrive[hole.holeNumber]}
                        onSelect={(id) => onUpdateLongest(hole.holeNumber, id)}
                      />
                    ) : null}
                  </td>
                  <td className={`border border-gray-300 px-1 text-center ${SKIN_COL_WIDTH}`}>
                    <input
                      type="checkbox"
                      className="mx-auto block w-5 h-5 md:w-4 md:h-4"
                      checked={game.sandyHoles[hole.holeNumber] || false}
                      onChange={(e) => onToggleSandyHole(hole.holeNumber, e.target.checked)}
                    />
                  </td>
                  <td className={`border border-gray-300 px-1 text-center ${SKIN_COL_WIDTH}`}>
                    <input
                      type="checkbox"
                      className="mx-auto block w-5 h-5 md:w-4 md:h-4"
                      checked={game.lostBallHoles[hole.holeNumber] || false}
                      onChange={(e) => onToggleLostBallHole(hole.holeNumber, e.target.checked)}
                    />
                  </td>
                </tr>

                {hole.par === 3 &&
                  isGreenieHole(hole.holeNumber) &&
                  parMap[hole.holeNumber] && (
                    <tr className="bg-green-50">
                      <td className={`border border-green-300 px-3 py-2 text-center font-medium ${HOLE_COL_WIDTH}`}>G</td>
                      {game.players.map((player) => (
                        <td
                          key={player.id}
                          className={`border border-green-300 bg-green-50 ${mobilePlayerPaddingClass} md:px-1 text-center ${PLAYER_COL_WIDTH} ${mobilePlayerWidthClass}`}
                        >
                          {playerMadePar(player.id, hole.holeNumber) ? (
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
                            '-'
                          )}
                        </td>
                      ))}
                      <td className="border border-green-300 bg-green-50" colSpan={4}></td>
                    </tr>
                  )}

                {hole.par === 5 && parMap[hole.holeNumber] && (
                  <tr className="bg-orange-50">
                    <td className={`border border-orange-300 px-3 py-2 text-center font-medium ${HOLE_COL_WIDTH}`}>5</td>
                    {game.players.map((player) => (
                      <td
                        key={player.id}
                        className={`border border-orange-300 bg-orange-50 ${mobilePlayerPaddingClass} md:px-1 text-center ${PLAYER_COL_WIDTH} ${mobilePlayerWidthClass}`}
                      >
                        {playerMadePar(player.id, hole.holeNumber) ? (
                          <input
                            type="checkbox"
                            checked={game.fivers[hole.holeNumber]?.[player.id] || false}
                            onChange={(e) =>
                              onToggleFiver(
                                hole.holeNumber,
                                player.id,
                                e.target.checked,
                              )
                            }
                          />
                        ) : (
                          '-'
                        )}
                      </td>
                    ))}
                    <td className="border border-orange-300 bg-orange-50" colSpan={4}></td>
                  </tr>
                )}

                {hole.par === 4 &&
                  isFourHole(hole.holeNumber) &&
                  parMap[hole.holeNumber] && (
                    <tr className="bg-blue-50">
                      <td className={`border border-blue-300 px-3 py-2 text-center font-medium ${HOLE_COL_WIDTH}`}>4</td>
                      {game.players.map((player) => (
                        <td
                          key={player.id}
                          className={`border border-blue-300 bg-blue-50 ${mobilePlayerPaddingClass} md:px-1 text-center ${PLAYER_COL_WIDTH} ${mobilePlayerWidthClass}`}
                        >
                          <input
                            type="checkbox"
                            className="w-5 h-5 md:w-4 md:h-4"
                            checked={game.fours[hole.holeNumber]?.[player.id] || false}
                            onChange={(e) =>
                              onToggleFour(
                                hole.holeNumber,
                                player.id,
                                e.target.checked,
                              )
                            }
                          />
                        </td>
                      ))}
                      <td className="border border-blue-300 bg-blue-50" colSpan={4}></td>
                    </tr>
                  )}

                {isSandyHole(hole.holeNumber) && parMap[hole.holeNumber] && (
                  <tr className="bg-yellow-50">
                    <td className={`border border-yellow-300 px-3 py-2 text-center font-medium ${HOLE_COL_WIDTH}`}>🏖️</td>
                    {game.players.map((player) => (
                      <td
                        key={player.id}
                        className={`border border-yellow-300 bg-yellow-50 ${mobilePlayerPaddingClass} md:px-1 text-center ${PLAYER_COL_WIDTH} ${mobilePlayerWidthClass}`}
                      >
                        {playerMadePar(player.id, hole.holeNumber) ? (
                          <div className="flex flex-col items-center justify-center space-y-1 md:flex-row md:space-x-1 md:space-y-0">
                            <input
                              type="checkbox"
                              className="mx-auto block w-5 h-5 md:w-4 md:h-4"
                              checked={
                                game.sandies[hole.holeNumber]?.[player.id] || false
                              }
                              onChange={(e) =>
                                onToggleSandy(
                                  hole.holeNumber,
                                  player.id,
                                  e.target.checked,
                                )
                              }
                            />
                            {game.sandies[hole.holeNumber]?.[player.id] && (
                              <label className="relative inline-block mx-auto w-5 h-5 md:w-4 md:h-4">
                                <input
                                  type="checkbox"
                                  className="mx-auto block w-5 h-5 md:w-4 md:h-4"
                                  checked={
                                    game.doubleSandies[hole.holeNumber]?.[player.id] || false
                                  }
                                  onChange={(e) =>
                                    onToggleDoubleSandy(
                                      hole.holeNumber,
                                      player.id,
                                      e.target.checked,
                                    )
                                  }
                                />
                                <span
                                  className="pointer-events-none absolute inset-0 flex items-center justify-center text-[10px]"
                                >
                                  2
                                </span>
                              </label>
                            )}
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                    ))}
                    <td className="border border-yellow-300 bg-yellow-50" colSpan={4}></td>
                  </tr>
                )}

                {isLostBallHole(hole.holeNumber) && parMap[hole.holeNumber] && (
                  <tr className="bg-red-50">
                    <td className={`border border-red-300 px-3 py-2 text-center font-medium ${HOLE_COL_WIDTH}`}>😅</td>
                    {game.players.map((player) => (
                      <td
                        key={player.id}
                        className={`border border-red-300 bg-red-50 ${mobilePlayerPaddingClass} md:px-1 text-center ${PLAYER_COL_WIDTH} ${mobilePlayerWidthClass}`}
                      >
                        {playerMadePar(player.id, hole.holeNumber) ? (
                          <input
                            type="checkbox"
                            className="mx-auto block w-5 h-5 md:w-4 md:h-4"
                            checked={game.lostBalls[hole.holeNumber]?.[player.id] || false}
                            onChange={(e) =>
                              onToggleLostBall(
                                hole.holeNumber,
                                player.id,
                                e.target.checked,
                              )
                            }
                          />
                        ) : (
                          '-'
                        )}
                      </td>
                    ))}
                    <td className="border border-red-300 bg-red-50" colSpan={4}></td>
                  </tr>
                )}
              </Fragment>
            ))}
            {showTotals && (
              <>
                <tr className="bg-yellow-50">
                  <td className={`border border-gray-300 px-3 py-2 font-medium ${HOLE_COL_WIDTH}`}>Total</td>
                  {game.players.map((p) => (
                    <td
                      key={p.id}
                      className={`border border-gray-300 ${mobilePlayerPaddingClass} md:px-2 py-1 text-center font-bold bg-blue-100 ${PLAYER_COL_WIDTH} ${mobilePlayerWidthClass}`}
                    >
                      {p.totalScore}
                    </td>
                  ))}
                  <td className="border border-gray-300 px-3 py-2" colSpan={4}></td>
                </tr>
                <tr className="bg-yellow-50">
                  <td className={`border border-gray-300 px-3 py-2 font-medium ${HOLE_COL_WIDTH}`}>To Par</td>
                  {game.players.map((p) => (
                    <td
                      key={p.id}
                      className={`border border-gray-300 ${mobilePlayerPaddingClass} md:px-2 py-1 text-center font-bold bg-purple-100 ${PLAYER_COL_WIDTH} ${mobilePlayerWidthClass}`}
                    >
                      {(() => {
                        const toPar = calculateTotalToPar(p);
                        if (toPar === 0) return 'E';
                        return toPar > 0 ? `+${toPar}` : `${toPar}`;
                      })()}
                    </td>
                  ))}
                  <td className="border border-gray-300 px-3 py-2" colSpan={4}></td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>
      <div className="md:hidden flex justify-end mt-4">
        <button
          className="px-2 py-1 text-sm text-white bg-blue-500 rounded"
          onClick={() => setShowTotals((s) => !s)}
        >
          {showTotals ? "Hide Totals" : "Show Totals"}
        </button>
      </div>

    </div>
  );
};

export default ScoreCard;
