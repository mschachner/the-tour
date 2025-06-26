import { useState, Fragment } from "react";
import type { ChangeEvent } from "react";
import { Game, Player, HoleScore } from "../types/golf";

interface ScoreCardProps {
  game: Game;
  onUpdateScore: (
    playerId: string,
    holeNumber: number,
    strokes: number,
    putts: number,
  ) => void;
}

const ScoreCard = ({ game, onUpdateScore }: ScoreCardProps) => {
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

  const calculateAdjustedScore = (player: Player) => {
    if (player.handicap === 0) return player.totalScore;

    // Sort holes by handicap (lowest to highest) - easiest holes first
    const sortedHoles = [...player.holes].sort(
      (a, b) => a.holeHandicap - b.holeHandicap,
    );

    let adjustedScore = player.totalScore;
    let strokesToDeduct = 0;

    // Apply strokes starting from easiest holes (lowest handicap numbers)
    // For handicap > 18, we cycle through holes multiple times
    for (let i = 0; i < player.handicap; i++) {
      const cycleIndex = i % 18; // Which hole in the current cycle
      const hole = sortedHoles[cycleIndex];
      if (hole && hole.strokes > 0) {
        strokesToDeduct++;
      }
    }

    return adjustedScore - strokesToDeduct;
  };

  const getAdjustedScoreForHole = (player: Player, holeNumber: number) => {
    if (player.handicap === 0) return null;

    const hole = player.holes.find((h) => h.holeNumber === holeNumber);
    if (!hole || hole.strokes === 0) return null;

    // Calculate how many strokes this player gets on this hole
    const sortedHoles = [...player.holes].sort(
      (a, b) => a.holeHandicap - b.holeHandicap,
    );
    const holeIndex = sortedHoles.findIndex((h) => h.holeNumber === holeNumber);

    // Calculate strokes to deduct for this specific hole
    let strokesToDeduct = 0;

    // For each stroke in the handicap, check if this hole gets it
    for (let i = 0; i < player.handicap; i++) {
      const cycleIndex = i % 18; // Which hole in the current cycle
      if (cycleIndex === holeIndex) {
        strokesToDeduct++;
      }
    }

    // Return adjusted score if strokes are deducted, otherwise return original score
    return strokesToDeduct > 0 ? hole.strokes - strokesToDeduct : hole.strokes;
  };

  const calculateAdjustedToPar = (player: Player) => {
    const adjustedScore = calculateAdjustedScore(player);
    return adjustedScore - game.course.totalPar;
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
              <th className="border border-gray-300 px-3 py-2 text-center font-semibold">
                Handicap
              </th>
              {game.course.holes.map((hole) => (
                <th
                  key={hole.holeNumber}
                  className="border border-gray-300 px-2 py-2 text-center font-semibold text-sm"
                >
                  <div>{hole.holeNumber}</div>
                  <div className="text-xs text-gray-600">Par {hole.par}</div>
                  <div className="text-xs text-gray-500">H{hole.handicap}</div>
                </th>
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
                  <td className="border border-gray-300 px-3 py-2 text-center">
                    {player.handicap}
                  </td>
                  {player.holes.map((hole) => {
                    const value = hole.strokes;
                    const editing = isEditing(
                      player.id,
                      hole.holeNumber,
                    );

                    return (
                      <td
                        key={hole.holeNumber}
                        className="border border-gray-300 px-2 py-1 text-center"
                      >
                        {editing ? (
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
                            className="w-12 text-center border border-gray-300 rounded px-1"
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
                            className={`mx-auto w-10 h-10 md:w-8 md:h-8 flex items-center justify-center rounded border border-gray-300 bg-white hover:bg-gray-200 transition-colors text-sm ${getScoreColor(
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

                {/* Adjusted Score Row (only show if player has handicap) */}
                {player.handicap > 0 && (
                  <tr
                    className={
                      playerIndex % 2 === 0 ? "bg-white" : "bg-gray-50"
                    }
                  >
                    <td className="border border-gray-300 px-3 py-1 text-xs text-gray-500">
                      Adjusted
                    </td>
                    <td className="border border-gray-300 px-3 py-1 text-xs text-gray-500">
                      ({player.handicap})
                    </td>
                    {player.holes.map((hole) => {
                      const adjustedScore = getAdjustedScoreForHole(
                        player,
                        hole.holeNumber,
                      );

                      return (
                        <td
                          key={hole.holeNumber}
                          className="border border-gray-300 px-2 py-1 text-center"
                        >
                          {adjustedScore !== null ? (
                            <div
                              className={`text-xs font-medium ${
                                adjustedScore < hole.strokes
                                  ? "text-blue-600"
                                  : "text-gray-600"
                              }`}
                            >
                              {adjustedScore}
                            </div>
                          ) : (
                            <div className="text-xs text-gray-400">-</div>
                          )}
                        </td>
                      );
                    })}
                    <td className="border border-gray-300 px-3 py-1 text-center font-bold bg-blue-50 text-blue-700 text-sm">
                      {calculateAdjustedScore(player)}
                    </td>
                    <td className="border border-gray-300 px-3 py-1 text-center font-bold bg-purple-50 text-purple-700 text-sm">
                      {(() => {
                        const adjustedToPar = calculateAdjustedToPar(player);
                        if (adjustedToPar === 0) return "E";
                        return adjustedToPar > 0
                          ? `+${adjustedToPar}`
                          : `${adjustedToPar}`;
                      })()}
                    </td>
                  </tr>
                )}

              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden space-y-4">
        {game.players.map((player) => {
          const toPar = calculateTotalToPar(player);
          const adjustedScore = calculateAdjustedScore(player);
          const adjustedToPar = calculateAdjustedToPar(player);

          return (
            <div key={player.id} className="border rounded-lg overflow-hidden">
              <div className="flex justify-between items-center bg-gray-100 px-3 py-2">
                <span className="font-semibold">{player.name}</span>
                <span className="text-sm">HCP {player.handicap}</span>
              </div>
              <table className="w-full border-collapse">
                <thead className="text-xs">
                  <tr className="bg-gray-50">
                    <th className="border px-2 py-1 text-left">Hole</th>
                    <th className="border px-2 py-1 text-center">Strokes</th>
                    <th className="border px-2 py-1 text-center">Adj</th>
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
                        <td className="border px-2 py-1 text-center">
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
                              className={`mx-auto w-10 h-10 md:w-8 md:h-8 flex items-center justify-center rounded border border-gray-300 bg-white hover:bg-gray-200 transition-colors text-sm ${getScoreColor(hole.strokes, hole.par)} ${getScoreBorderStyle(hole.strokes, hole.par)}`}
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
                        <td className="border px-2 py-1 text-center text-sm">
                          {(() => {
                            const adj = getAdjustedScoreForHole(
                              player,
                              hole.holeNumber,
                            );
                            return adj !== null ? adj : "-";
                          })()}
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-gray-50 font-semibold text-sm">
                    <td className="border px-2 py-1">Total</td>
                    <td className="border px-2 py-1 text-center">
                      {player.totalScore}
                    </td>
                    <td className="border px-2 py-1 text-center">
                      {player.handicap > 0 ? adjustedScore : "-"}
                    </td>
                  </tr>
                  <tr className="bg-gray-50 font-semibold text-sm">
                    <td className="border px-2 py-1">To Par</td>
                    <td className="border px-2 py-1 text-center" colSpan={2}>
                      {toPar === 0 ? "E" : toPar > 0 ? `+${toPar}` : `${toPar}`}
                    </td>
                  </tr>
                  <tr className="bg-gray-50 font-semibold text-sm">
                    <td className="border px-2 py-1">Skins</td>
                    <td className="border px-2 py-1 text-center" colSpan={2}>
                      {player.skins}
                    </td>
                  </tr>
                  {player.handicap > 0 && (
                    <>
                      <tr className="bg-gray-50 font-semibold text-sm">
                        <td className="border px-2 py-1">Adjusted Score</td>
                        <td
                          className="border px-2 py-1 text-center"
                          colSpan={2}
                        >
                          {adjustedScore}
                        </td>
                      </tr>
                      <tr className="bg-gray-50 font-semibold text-sm">
                        <td className="border px-2 py-1">Adjusted To Par</td>
                        <td
                          className="border px-2 py-1 text-center"
                          colSpan={2}
                        >
                          {adjustedToPar === 0
                            ? "E"
                            : adjustedToPar > 0
                              ? `+${adjustedToPar}`
                              : `${adjustedToPar}`}
                        </td>
                      </tr>
                    </>
                  )}
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
          const adjustedScore = calculateAdjustedScore(player);
          const adjustedToPar = calculateAdjustedToPar(player);

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
                {player.handicap > 0 && (
                  <>
                    <div className="flex justify-between">
                      <span>Adjusted Score:</span>
                      <span className="font-bold text-blue-600">
                        {adjustedScore}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Adjusted To Par:</span>
                      <span
                        className={`font-bold ${
                          adjustedToPar === 0
                            ? "text-gray-600"
                            : adjustedToPar > 0
                              ? "text-red-600"
                              : "text-green-600"
                        }`}
                      >
                        {adjustedToPar === 0
                          ? "E"
                          : adjustedToPar > 0
                            ? `+${adjustedToPar}`
                            : `${adjustedToPar}`}
                      </span>
                    </div>
                  </>
                )}
                <div className="flex justify-between">
                  <span>Handicap:</span>
                  <span className="font-bold">{player.handicap}</span>
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
