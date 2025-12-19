import { useState } from 'react';
import type { ChangeEvent } from 'react';
import { Player, PlayerSetup as PlayerSetupType, Course } from '../../types/golf';
import {
  saveCustomCourse,
  generateCourseId
} from '../../services/courseService';
import CourseSelector from '../course/CourseSelector';
import CourseEditor from '../course/CourseEditor';
import PlayerIcon from './PlayerIcon';

interface PlayerSetupProps {
  onStartGame: (players: Player[], course: Course, eventName: string) => void;
  eventName: string;
  onEventNameChange: (value: string) => void;
  savedScorecards: Array<{
    id: string;
    name: string;
    data: {
      course: Course;
      date: string;
    };
  }>;
  onLoadScorecard: (scorecardId: string) => void;
  onImportScorecards: (file: File) => Promise<string>;
}

const PlayerSetup = ({
  onStartGame,
  eventName,
  onEventNameChange,
  savedScorecards,
  onLoadScorecard,
  onImportScorecards,
}: PlayerSetupProps) => {
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
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [showScorecardDialog, setShowScorecardDialog] = useState(false);

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

    const trimmedEventName = eventName.trim() || 'New Scorecard';
    onStartGame(gamePlayers, selectedCourse, trimmedEventName);
  };

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const status = await onImportScorecards(file);
    setImportStatus(status);
    event.target.value = '';
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
    <div className="golf-card fade-in max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 font-marker">Game Setup</h2>
      
      <div className="space-y-6">
        {/* Scorecards */}
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Load Saved Scorecard
            </label>
            <button
              onClick={() => setShowScorecardDialog(true)}
              className="px-4 py-2 rounded-md bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors text-sm"
            >
              Load Saved Scorecard
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Import Scorecards
            </label>
            <label className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-800 rounded-md cursor-pointer hover:bg-gray-200 text-sm">
              Choose JSON file
              <input
                type="file"
                accept="application/json"
                onChange={handleImport}
                className="hidden"
              />
            </label>
            {importStatus && (
              <p className="text-xs text-gray-500 mt-2">{importStatus}</p>
            )}
          </div>
        </div>

        {/* Event Details */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Event Name
          </label>
          <input
            type="text"
            value={eventName}
            onChange={(e) => onEventNameChange(e.target.value)}
            className="golf-input w-full"
            placeholder="Weekend skins match"
          />
        </div>

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
      {showScorecardDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
              <h3 className="text-lg font-semibold text-gray-800">
                Saved Scorecards
              </h3>
              <button
                onClick={() => setShowScorecardDialog(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto px-4 py-4">
              {savedScorecards.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No saved scorecards yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {savedScorecards.map((scorecard) => (
                    <div
                      key={scorecard.id}
                      className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2"
                    >
                      <div>
                        <div className="font-medium text-gray-900">
                          {scorecard.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {scorecard.data.course.name} • {scorecard.data.date}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          onLoadScorecard(scorecard.id);
                          setShowScorecardDialog(false);
                        }}
                        className="px-3 py-1 rounded-md bg-blue-100 text-blue-800 text-sm"
                      >
                        Load
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="border-t border-gray-200 px-4 py-3 text-right">
              <button
                onClick={() => setShowScorecardDialog(false)}
                className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerSetup; 
