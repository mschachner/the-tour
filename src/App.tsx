import React, { useState } from 'react';
import { Game, Player, Course } from './types/golf';
import PlayerSetup from './components/PlayerSetup';
import ScoreCard from './components/ScoreCard';
import './App.css';

function App() {
  const [game, setGame] = useState<Game | null>(null);
  const [showSetup, setShowSetup] = useState(true);

  const startNewGame = (players: Player[], course: Course) => {
    console.log('startNewGame called with:', { players, course });
    
    const newGame: Game = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      course,
      players,
      currentHole: 1,
      totalHoles: 18
    };
    
    console.log('New game created:', newGame);
    console.log('Setting game state...');
    setGame(newGame);
    console.log('Setting showSetup to false...');
    setShowSetup(false);
    console.log('Game state updated successfully');
  };

  const updateScore = (playerId: string, holeNumber: number, strokes: number, putts: number) => {
    if (!game) return;

    const updatedGame = {
      ...game,
      players: game.players.map(player => {
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
      })
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
          <h1 className="text-4xl font-bold text-white mb-2">🏌️ Golf Score Tracker</h1>
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
