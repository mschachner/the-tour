import { useState } from 'react';
import { Course, CourseHole } from '../types/golf';
import { deleteCustomCourse } from '../services/courseService';

interface CourseEditorProps {
  course: Course;
  onSaveCourse: (updatedCourse: Course) => void;
  onCancel: () => void;
  onDeleteCourse?: () => void;
}

const CourseEditor = ({ course, onSaveCourse, onCancel, onDeleteCourse }: CourseEditorProps) => {
  const [editedCourse, setEditedCourse] = useState<Course>({
    ...course,
    holes: [...course.holes]
  });

  const updateHole = (holeNumber: number, field: keyof CourseHole, value: number) => {
    const updatedHoles = editedCourse.holes.map(hole =>
      hole.holeNumber === holeNumber ? { ...hole, [field]: value } : hole
    );
    
    const totalPar = updatedHoles.reduce((sum, hole) => sum + hole.par, 0);
    
    setEditedCourse({
      ...editedCourse,
      holes: updatedHoles,
      totalPar
    });
  };

  const updateCourseName = (name: string) => {
    setEditedCourse({
      ...editedCourse,
      name
    });
  };

  const updateCourseLocation = (location: string) => {
    setEditedCourse({
      ...editedCourse,
      location
    });
  };

  const resetToDefaults = () => {
    const defaultHoles = Array.from({ length: 18 }, (_, i) => ({
      holeNumber: i + 1,
      par: 4,
      handicap: i + 1,
      distance: 400,
      description: `Hole ${i + 1}`
    }));
    
    setEditedCourse({
      ...editedCourse,
      holes: defaultHoles,
      totalPar: 72
    });
  };

  const setTemplate = (template: 'regulation' | 'par3' | 'executive') => {
    let holes: CourseHole[] = [];
    
    switch (template) {
      case 'regulation':
        holes = [
          // Front 9
          { holeNumber: 1, par: 4, handicap: 9, distance: 380, description: 'Hole 1' },
          { holeNumber: 2, par: 5, handicap: 13, distance: 520, description: 'Hole 2' },
          { holeNumber: 3, par: 4, handicap: 11, distance: 400, description: 'Hole 3' },
          { holeNumber: 4, par: 3, handicap: 17, distance: 180, description: 'Hole 4' },
          { holeNumber: 5, par: 4, handicap: 3, distance: 420, description: 'Hole 5' },
          { holeNumber: 6, par: 5, handicap: 15, distance: 540, description: 'Hole 6' },
          { holeNumber: 7, par: 3, handicap: 7, distance: 160, description: 'Hole 7' },
          { holeNumber: 8, par: 4, handicap: 1, distance: 440, description: 'Hole 8' },
          { holeNumber: 9, par: 4, handicap: 5, distance: 410, description: 'Hole 9' },
          // Back 9
          { holeNumber: 10, par: 4, handicap: 8, distance: 390, description: 'Hole 10' },
          { holeNumber: 11, par: 3, handicap: 16, distance: 170, description: 'Hole 11' },
          { holeNumber: 12, par: 5, handicap: 12, distance: 510, description: 'Hole 12' },
          { holeNumber: 13, par: 4, handicap: 14, distance: 380, description: 'Hole 13' },
          { holeNumber: 14, par: 4, handicap: 6, distance: 430, description: 'Hole 14' },
          { holeNumber: 15, par: 3, handicap: 18, distance: 150, description: 'Hole 15' },
          { holeNumber: 16, par: 4, handicap: 4, distance: 420, description: 'Hole 16' },
          { holeNumber: 17, par: 5, handicap: 10, distance: 550, description: 'Hole 17' },
          { holeNumber: 18, par: 4, handicap: 2, distance: 450, description: 'Hole 18' }
        ];
        break;
      case 'par3':
        holes = Array.from({ length: 18 }, (_, i) => ({
          holeNumber: i + 1,
          par: 3,
          handicap: i + 1,
          distance: 120 + Math.floor(Math.random() * 100),
          description: `Hole ${i + 1}`
        }));
        break;
      case 'executive':
        const executivePars = [3, 4, 3, 4, 3, 4, 4, 3, 4, 3, 4, 3, 4, 3, 4, 4, 3, 4];
        holes = Array.from({ length: 18 }, (_, i) => ({
          holeNumber: i + 1,
          par: executivePars[i],
          handicap: i + 1,
          distance: executivePars[i] === 3 ? 140 : 350,
          description: `Hole ${i + 1}`
        }));
        break;
    }
    
    const totalPar = holes.reduce((sum, hole) => sum + hole.par, 0);
    
    setEditedCourse({
      ...editedCourse,
      holes,
      totalPar
    });
  };

  const handleSave = () => {
    onSaveCourse(editedCourse);
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${editedCourse.name}"? This action cannot be undone.`)) {
      deleteCustomCourse(editedCourse.id);
      if (onDeleteCourse) {
        onDeleteCourse();
      }
    }
  };

  const isCustomCourse = course.id !== 'pebble-beach' && course.id !== 'augusta-national' && course.id !== 'st-andrews-old';

  return (
    <div className="golf-card max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Course Editor</h2>
        <div className="flex space-x-2">
          {isCustomCourse && (
            <button
              onClick={handleDelete}
              className="px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors text-sm"
            >
              Delete Course
            </button>
          )}
          <button
            onClick={onCancel}
            className="px-3 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="golf-button text-sm"
          >
            Save Course
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Course Name and Location */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Course Name
            </label>
            <input
              type="text"
              value={editedCourse.name}
              onChange={(e) => updateCourseName(e.target.value)}
              className="golf-input w-full text-sm"
              placeholder="Enter course name..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              type="text"
              value={editedCourse.location || ''}
              onChange={(e) => updateCourseLocation(e.target.value)}
              className="golf-input w-full text-sm"
              placeholder="Enter course location..."
            />
          </div>
        </div>

        {/* Templates */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Course Templates
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setTemplate('regulation')}
              className="px-3 py-1 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 transition-colors text-sm"
            >
              Regulation (Par 72)
            </button>
            <button
              onClick={() => setTemplate('par3')}
              className="px-3 py-1 bg-green-100 text-green-800 rounded-md hover:bg-green-200 transition-colors text-sm"
            >
              Par 3 Course (Par 54)
            </button>
            <button
              onClick={() => setTemplate('executive')}
              className="px-3 py-1 bg-purple-100 text-purple-800 rounded-md hover:bg-purple-200 transition-colors text-sm"
            >
              Executive (Par 60)
            </button>
            <button
              onClick={resetToDefaults}
              className="px-3 py-1 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition-colors text-sm"
            >
              Reset to Defaults
            </button>
          </div>
        </div>

        {/* Course Summary */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xl font-bold text-blue-600">{editedCourse.totalPar}</div>
              <div className="text-xs text-gray-600">Total Par</div>
            </div>
            <div>
              <div className="text-xl font-bold text-green-600">
                {editedCourse.holes.filter(h => h.par === 3).length}
              </div>
              <div className="text-xs text-gray-600">Par 3s</div>
            </div>
            <div>
              <div className="text-xl font-bold text-yellow-600">
                {editedCourse.holes.filter(h => h.par === 5).length}
              </div>
              <div className="text-xs text-gray-600">Par 5s</div>
            </div>
          </div>
        </div>

        {/* Hole Editor - Compact Grid */}
        <div>
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Hole Details</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            {editedCourse.holes.map((hole) => (
              <div key={hole.holeNumber} className="bg-white border border-gray-200 rounded-lg p-2 hover:shadow-sm transition-shadow">
                <div className="text-center">
                  <div className="text-sm font-bold text-gray-700 mb-1">Hole {hole.holeNumber}</div>
                  <div className="space-y-1">
                    <div>
                      <label className="text-xs text-gray-600">Par</label>
                      <select
                        value={hole.par}
                        onChange={(e) => updateHole(hole.holeNumber, 'par', parseInt(e.target.value))}
                        className="w-full text-xs border border-gray-300 rounded px-1 py-1 text-center"
                      >
                        <option value={3}>3</option>
                        <option value={4}>4</option>
                        <option value={5}>5</option>
                        <option value={6}>6</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">HCP</label>
                      <select
                        value={hole.handicap}
                        onChange={(e) => updateHole(hole.holeNumber, 'handicap', parseInt(e.target.value))}
                        className="w-full text-xs border border-gray-300 rounded px-1 py-1 text-center"
                      >
                        {Array.from({ length: 18 }, (_, i) => (
                          <option key={i + 1} value={i + 1}>{i + 1}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseEditor; 