import { useState } from 'react';
import { Player, PlayerSetup as PlayerSetupType, Course } from '../types/golf';
import {
  saveCustomCourse,
  generateCourseId
} from '../services/courseService';
import CourseSelector from './CourseSelector';
import CourseEditor from './CourseEditor';
import PlayerIcon from './PlayerIcon';

interface PlayerSetupProps {
  onStartGame: (players: Player[], course: Course) => void;
}

const PlayerSetup = ({ onStartGame }: PlayerSetupProps) => {
  const getRandomColor = () => {
    const h = Math.floor(Math.random() * 360);
    const s = 70 + Math.floor(Math.random() * 30); // 70-100% saturation
    const l = 40 + Math.floor(Math.random() * 20); // 40-60% lightness
    return `hsl(${h}, ${s}%, ${l}%)`;
  };
  const [players, setPlayers] = useState<PlayerSetupType[]>([
    { id: '1', name: '' },
    { id: '2', name: '' },
    { id: '3', name: '' },
    { id: '4', name: '' },
  ]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [activePlayers, setActivePlayers] = useState(2);
  const [showCourseEditor, setShowCourseEditor] = useState(false);
  const [courseToEdit, setCourseToEdit] = useState<Course | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const updatePlayer = (
    id: string,
    field: keyof PlayerSetupType,
    value: string,
  ) => {
    setPlayers((prev) =>
      prev.map((player) => {
        if (player.id !== id) return player;
        const updated: PlayerSetupType = { ...player, [field]: value };
        if (
          field === 'name' &&
          value.trim() !== '' &&
          !player.color
        ) {
          updated.color = getRandomColor();
        }
        if (field === 'name' && value.trim() === '') {
          updated.color = undefined;
        }
        return updated;
      }),
    );
  };

  const randomizePlayerColor = (id: string) => {
    setPlayers((prev) =>
      prev.map((player) =>
        player.id === id ? { ...player, color: getRandomColor() } : player,
      ),
    );
  };


  const handleCourseSelect = (course: Course) => {
    // Check if this is a custom course that should be editable
    if (course.id === 'custom-course' || course.name.includes('Custom')) {
      setCourseToEdit(course);
      setShowCourseEditor(true);
    } else {
      setSelectedCourse(course);
    }
  };

  const handleCourseEditorSave = (updatedCourse: Course) => {
    // Generate a new ID if this is a new custom course or if the name changed significantly
    let courseToSave = updatedCourse;
    
    if (updatedCourse.id === 'custom-course' || updatedCourse.name !== courseToEdit?.name) {
      // Create a new course with a unique ID
      courseToSave = {
        ...updatedCourse,
        id: generateCourseId(updatedCourse.name),
        location: updatedCourse.location || 'Custom Location'
      };
    }
    
    // Save to localStorage
    try {
      saveCustomCourse(courseToSave);
    } catch (error) {
      console.error('Failed to save custom course:', error);
      alert('Failed to save course. Please try again.');
      return;
    }
    
    setSelectedCourse(courseToSave);
    setShowCourseEditor(false);
    setCourseToEdit(null);
    setRefreshKey(prevKey => prevKey + 1);
  };

  const handleCourseEditorCancel = () => {
    setShowCourseEditor(false);
    setCourseToEdit(null);
  };

  const handleCourseEditorDelete = () => {
    setShowCourseEditor(false);
    setCourseToEdit(null);
    setSelectedCourse(null);
    setRefreshKey(prevKey => prevKey + 1);
  };

  const handleEditCourse = () => {
    if (selectedCourse) {
      setCourseToEdit(selectedCourse);
      setShowCourseEditor(true);
    }
  };

  const handleStartGame = () => {

    
    const validPlayers = players
      .slice(0, activePlayers)
      .filter(player => player.name.trim() !== '');
    
    if (validPlayers.length === 0) {
      alert('Please add at least one player');
      return;
    }
    
    if (!selectedCourse) {
      alert('Please select a golf course');
      return;
    }

    // Convert PlayerSetup to Player with course data
    const gamePlayers: Player[] = validPlayers.map((player) => ({
      ...player,
      totalScore: 0,
      totalPutts: 0,
      skins: 0,
      holes: selectedCourse.holes.map((hole) => ({
        holeNumber: hole.holeNumber,
        strokes: 0,
        putts: 0,
        par: hole.par,
        holeHandicap: hole.handicap,
      })),
    }));

    onStartGame(gamePlayers, selectedCourse);
  };

  if (showCourseEditor && courseToEdit) {
    return (
      <CourseEditor 
        course={courseToEdit}
        onSaveCourse={handleCourseEditorSave}
        onCancel={handleCourseEditorCancel}
        onDeleteCourse={handleCourseEditorDelete}
      />
    );
  }

  return (
    <div className="golf-card max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Game Setup</h2>
      
      <div className="space-y-6">
        {/* Course Selection */}
        <div>
          <CourseSelector 
            onCourseSelect={handleCourseSelect}
            selectedCourse={selectedCourse}
            refreshKey={refreshKey}
          />
          
          {/* Edit Course Button */}
          {selectedCourse && (
            <div className="mt-3">
              <button
                onClick={handleEditCourse}
                className="px-4 py-2 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 transition-colors text-sm"
              >
                ✏️ Edit Course Details
              </button>
            </div>
          )}
        </div>

        {/* Number of Players */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of Players
          </label>
          <div className="flex space-x-2">
            {[1, 2, 3, 4].map(num => (
              <button
                key={num}
                onClick={() => setActivePlayers(num)}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  activePlayers === num
                    ? 'bg-golf-green text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        {/* Player Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Players</h3>
          <div className="space-y-4">
            {players.slice(0, activePlayers).map((player, index) => (
              <div key={player.id} className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Player {index + 1} Name
                  </label>
                  <div className="flex items-center space-x-3">
                    <PlayerIcon
                      name={player.name}
                      color={player.color}
                      size={32}
                      onClick={() => randomizePlayerColor(player.id)}
                    />
                    <input
                      type="text"
                      value={player.name}
                      onChange={(e) =>
                        updatePlayer(player.id, 'name', e.target.value)
                      }
                      placeholder={`Player ${index + 1}`}
                      className="golf-input w-full"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Start Game Button */}
        <div className="pt-4">
          <button
            onClick={handleStartGame}
            disabled={!selectedCourse}
            className={`w-full text-lg py-3 rounded font-medium transition-colors ${
              selectedCourse
                ? 'golf-button'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Start Game
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlayerSetup; 