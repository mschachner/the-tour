import { useState } from 'react';
import { Game, Player, Course } from './types/golf';
import PlayerSetup from './components/PlayerSetup';
import ScoreCard from './components/ScoreCard';
import './App.css';

const calculateSkins = (players: Player[]): Player[] => {
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

  return players.map((p) => ({ ...p, skins: skinsMap[p.id] }));
};

function App() {
  const [game, setGame] = useState<Game | null>(null);
  const [showSetup, setShowSetup] = useState(true);

  const startNewGame = (players: Player[], course: Course) => {
    const newGame: Game = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      course,
      players: calculateSkins(players),
      currentHole: 1,
      totalHoles: 18
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

    const playersWithSkins = calculateSkins(updatedPlayers);

    const updatedGame = {
      ...game,
      players: playersWithSkins,
    };
    setGame(updatedGame);
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
            <ScoreCard game={game} onUpdateScore={updateScore} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default App;
