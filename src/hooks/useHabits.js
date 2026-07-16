import { useState, useEffect } from 'react';

// Utility to generate a simple ID
const generateId = () => Math.random().toString(36).substr(2, 9);

const INITIAL_HABITS = [
  { id: 'h1', name: 'Drink Water', emoji: '💧' },
  { id: 'h2', name: 'Read 10 pages', emoji: '📚' },
  { id: 'h3', name: 'Exercise', emoji: '🏋️' },
  { id: 'h4', name: 'Meditate', emoji: '🧘' },
  { id: 'h5', name: 'Code 1 hour', emoji: '💻' }
];

export const useHabits = (userEmail) => {
  const habitsKey = userEmail ? `habits_${userEmail}` : 'habits';
  const logsKey = userEmail ? `habitLogs_${userEmail}` : 'habitLogs';

  const [habits, setHabits] = useState(() => {
    const saved = localStorage.getItem(habitsKey);
    return saved ? JSON.parse(saved) : INITIAL_HABITS;
  });

  const [habitLogs, setHabitLogs] = useState(() => {
    const saved = localStorage.getItem(logsKey);
    return saved ? JSON.parse(saved) : {};
  });

  // Effect to load data when user changes
  useEffect(() => {
    const savedHabits = localStorage.getItem(habitsKey);
    setHabits(savedHabits ? JSON.parse(savedHabits) : INITIAL_HABITS);
    
    const savedLogs = localStorage.getItem(logsKey);
    setHabitLogs(savedLogs ? JSON.parse(savedLogs) : {});
  }, [habitsKey, logsKey]);

  useEffect(() => {
    localStorage.setItem(habitsKey, JSON.stringify(habits));
  }, [habits, habitsKey]);

  useEffect(() => {
    localStorage.setItem(logsKey, JSON.stringify(habitLogs));
  }, [habitLogs, logsKey]);

  const addHabit = (name, emoji) => {
    if (!name.trim()) return false;
    if (habits.some(h => h.name.toLowerCase() === name.toLowerCase())) return false;
    
    setHabits([...habits, { id: generateId(), name: name.trim(), emoji }]);
    return true;
  };

  const updateHabit = (id, newName, newEmoji) => {
    if (!newName.trim()) return;
    setHabits(habits.map(h => h.id === id ? { ...h, name: newName.trim(), emoji: newEmoji } : h));
  };

  const deleteHabit = (id) => {
    setHabits(habits.filter(h => h.id !== id));
    // Optionally remove logs, but keeping them doesn't hurt much and allows undo in the future
    const newLogs = { ...habitLogs };
    delete newLogs[id];
    setHabitLogs(newLogs);
  };

  const toggleHabitLog = (habitId, dateString) => {
    setHabitLogs(prev => {
      const habitData = prev[habitId] || {};
      const isCompleted = !!habitData[dateString];
      
      const updatedHabitData = { ...habitData };
      if (isCompleted) {
        delete updatedHabitData[dateString];
      } else {
        updatedHabitData[dateString] = true;
      }

      return {
        ...prev,
        [habitId]: updatedHabitData
      };
    });
  };

  return {
    habits,
    habitLogs,
    addHabit,
    updateHabit,
    deleteHabit,
    toggleHabitLog
  };
};
