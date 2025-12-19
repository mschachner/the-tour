import { useState, useEffect, useRef } from 'react';
import type { ChangeEvent, KeyboardEvent } from 'react';
import { Course } from '../../types/golf';
import {
  getCourseSuggestionsAsync,
  fetchPublicCourses,
  findCourseByName,
  defaultCustomCourse,
  loadCustomCourses,
  deleteCustomCourse,
  getLastPublicCourseError,
  clearLastPublicCourseError,
  hasPublicCourseAccess
} from '../../services/courseService';

interface CourseSelectorProps {
  onCourseSelect: (course: Course) => void;
  selectedCourse?: Course | null;
  refreshKey?: number;
}

const CourseSelector = ({ onCourseSelect, selectedCourse, refreshKey }: CourseSelectorProps) => {
  const [inputValue, setInputValue] = useState(selectedCourse?.name || '');
  const [suggestions, setSuggestions] = useState<Course[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isCustomCourse, setIsCustomCourse] = useState(false);
  const [showSavedCourses, setShowSavedCourses] = useState(false);
  const [savedCourses, setSavedCourses] = useState<Course[]>([]);
  const [publicError, setPublicError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasPublicAccess = hasPublicCourseAccess();

  // Load saved custom courses
  useEffect(() => {
    const customCourses = loadCustomCourses();
    setSavedCourses(customCourses);
  }, [refreshKey]);

  // Preload public courses on mount
  useEffect(() => {
    if (!hasPublicAccess) return;
    fetchPublicCourses().catch(() => undefined);
  }, [hasPublicAccess]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (inputValue.trim()) {
        clearLastPublicCourseError();
        const newSuggestions = await getCourseSuggestionsAsync(inputValue);
        if (active) {
          setSuggestions(newSuggestions);
          setShowSuggestions(true);
          setPublicError(getLastPublicCourseError());
        }
      } else {
        const defaultSuggestions = await getCourseSuggestionsAsync('');
        if (active) {
          setSuggestions(defaultSuggestions);
          setShowSuggestions(false);
          setPublicError(null);
        }
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [inputValue, refreshKey]);

  useEffect(() => {
    if (!showSuggestions) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showSuggestions]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setIsCustomCourse(false);
  };

  const handleSuggestionClick = (course: Course) => {
    setInputValue(course.name);
    setShowSuggestions(false);
    setIsCustomCourse(course.id === 'custom-course' || course.name.includes('Custom'));
    onCourseSelect(course);
  };

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => setShowSuggestions(false), 200);
  };

  const handleInputFocus = () => {
    if (inputValue.trim()) {
      setShowSuggestions(true);
    } else {
      // Show default suggestions when focused
      getCourseSuggestionsAsync('').then((defaultSuggestions) => {
        setSuggestions(defaultSuggestions);
        setShowSuggestions(true);
      });
    }
  };

  const handleCustomCourse = () => {
    const customCourse: Course = {
      ...defaultCustomCourse,
      name: inputValue || 'Custom Course'
    };
    setIsCustomCourse(true);
    onCourseSelect(customCourse);
  };

  // Match against suggestions first to allow selecting remote results on Enter.
  const findSuggestionMatch = (value: string) => {
    const normalized = value.trim().toLowerCase();
    if (!normalized) return undefined;
    return suggestions.find(
      (course) => course.name.toLowerCase() === normalized,
    );
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const exactMatch = findSuggestionMatch(inputValue) || findCourseByName(inputValue);
      if (exactMatch) {
        handleSuggestionClick(exactMatch);
      } else if (inputValue.trim()) {
        handleCustomCourse();
      }
    }
  };

  const handleDeleteCustomCourse = (courseId: string, courseName: string) => {
    if (window.confirm(`Are you sure you want to delete "${courseName}"?`)) {
      deleteCustomCourse(courseId);
      const updatedCourses = loadCustomCourses();
      setSavedCourses(updatedCourses);
      
      // If the deleted course was selected, clear the selection
      if (selectedCourse?.id === courseId) {
        setInputValue('');
        onCourseSelect(defaultCustomCourse);
      }
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Golf Course
      </label>
      
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder="Search courses online or enter custom course name..."
          className="golf-input w-full pr-10"
        />

        {inputValue && (
          <button
            onClick={() => setInputValue('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>
      <p className="text-xs text-gray-500 mt-1">
        Start typing to search the public course database.
      </p>
      {publicError && (
        <p className="text-xs text-red-600 mt-1">
          Could not fetch public courses. Results may be limited.
        </p>
      )}
      {!hasPublicAccess && (
        <p className="text-xs text-gray-500 mt-1">
          Add REACT_APP_GOLFCOURSE_API_KEY to enable public course search.
        </p>
      )}

      {/* Course Suggestions */}
      {showSuggestions && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {suggestions.length > 0 && suggestions.map((course) => (
            <button
              key={course.id}
              onClick={() => handleSuggestionClick(course)}
              className="w-full text-left px-4 py-3 hover:bg-gray-100 border-b border-gray-200 last:border-b-0"
            >
              <div className="font-medium text-gray-900">{course.name}</div>
              <div className="text-sm text-gray-600">
                {course.location} • Par {course.totalPar}
                {course.totalDistance && ` • ${course.totalDistance} yards`}
              </div>
            </button>
          ))}

          {suggestions.length === 0 && (
            <div className="px-4 py-3 text-gray-500">No matching courses.</div>
          )}
          
          {inputValue.trim() && (
            <button
              onClick={handleCustomCourse}
              className="w-full text-left px-4 py-3 hover:bg-gray-100 border-t border-gray-200 text-blue-600 font-medium"
            >
              Use "{inputValue}" as custom course
            </button>
          )}
        </div>
      )}

      {/* Selected Course Info */}
      {selectedCourse && (
        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-semibold text-green-800">{selectedCourse.name}</h4>
              {selectedCourse.location && (
                <p className="text-sm text-green-600">{selectedCourse.location}</p>
              )}
              <p className="text-sm text-green-600">
                Par {selectedCourse.totalPar}
                {selectedCourse.totalDistance && ` • ${selectedCourse.totalDistance} yards`}
              </p>
            </div>
            {isCustomCourse && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                Custom
              </span>
            )}
          </div>
        </div>
      )}

      {/* Saved Custom Courses */}
      {savedCourses.length > 0 && (
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-gray-700">
              Saved Custom Courses ({savedCourses.length})
            </label>
            <button
              onClick={() => setShowSavedCourses(!showSavedCourses)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {showSavedCourses ? 'Hide' : 'Show'}
            </button>
          </div>
          
          {showSavedCourses && (
            <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-md">
              {savedCourses.map((course) => (
                <div key={course.id} className="flex justify-between items-center p-2 hover:bg-gray-50">
                  <button
                    onClick={() => handleSuggestionClick(course)}
                    className="flex-1 text-left"
                  >
                    <div className="font-medium text-gray-900 text-sm">{course.name}</div>
                    <div className="text-xs text-gray-600">
                      {course.location} • Par {course.totalPar}
                    </div>
                  </button>
                  <button
                    onClick={() => handleDeleteCustomCourse(course.id, course.name)}
                    className="ml-2 text-red-500 hover:text-red-700 text-sm px-2 py-1"
                    title="Delete course"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CourseSelector; 
