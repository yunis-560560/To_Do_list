import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';

const generateId = () => Math.random().toString(36).substr(2, 9); // For optimistic UI

export const useHabits = (userId) => {
  const [habits, setHabits] = useState([]);
  const [habitLogs, setHabitLogs] = useState({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const [pendingChanges, setPendingChanges] = useState({
    habits: [],
    logs: {}
  });

  useEffect(() => {
    if (!userId) {
      setHabits([]);
      setHabitLogs({});
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setFetchError(null);
      try {
        // Fetch habits
        const habitsQuery = query(collection(db, 'habits'), where('user_id', '==', userId));
        const habitsSnap = await getDocs(habitsQuery);
        const habitsData = habitsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setHabits(habitsData);

        // Fetch logs
        const logsQuery = query(collection(db, 'habit_logs'), where('user_id', '==', userId));
        const logsSnap = await getDocs(logsQuery);
        
        const logsMap = {};
        logsSnap.forEach(docSnap => {
          const log = docSnap.data();
          if (!logsMap[log.habit_id]) logsMap[log.habit_id] = {};
          logsMap[log.habit_id][log.log_date] = true;
        });
        setHabitLogs(logsMap);
      } catch (err) {
        console.error('Error fetching habits data:', err);
        setFetchError(err.message || 'Failed to fetch habits');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [userId]);

  const markUnsaved = () => setHasUnsavedChanges(true);

  const addHabit = async (name, emoji) => {
    if (!name.trim()) return false;
    if (habits.some(h => h.name.toLowerCase() === name.toLowerCase())) return false;
    
    const newHabit = { 
      id: `temp_${generateId()}`, 
      name: name.trim(), 
      emoji,
      user_id: userId
    };
    
    setHabits(prev => [...prev, newHabit]);
    setPendingChanges(prev => ({ ...prev, habits: [...prev.habits, newHabit] }));
    markUnsaved();
    return true;
  };

  const updateHabit = (id, newName, newEmoji) => {
    if (!newName.trim()) return;
    setHabits(prev => prev.map(h => h.id === id ? { ...h, name: newName.trim(), emoji: newEmoji } : h));
    
    setPendingChanges(prev => {
      const existingPending = prev.habits.find(h => h.id === id);
      if (existingPending && !existingPending._isUpdate) {
        return {
          ...prev,
          habits: prev.habits.map(h => h.id === id ? { ...h, name: newName.trim(), emoji: newEmoji } : h)
        };
      } else {
        const filteredHabits = prev.habits.filter(h => h.id !== id);
        const updatedHabits = [...filteredHabits, { id, name: newName.trim(), emoji: newEmoji, _isUpdate: true }];
        return { ...prev, habits: updatedHabits };
      }
    });
    
    markUnsaved();
  };

  const deleteHabit = (id) => {
    setHabits(prev => prev.filter(h => h.id !== id));
    setHabitLogs(prev => {
      const newLogs = { ...prev };
      delete newLogs[id];
      return newLogs;
    });
    
    setPendingChanges(prev => {
      if (id.startsWith('temp_')) {
        return {
          ...prev,
          habits: prev.habits.filter(h => h.id !== id)
        };
      }
      
      return {
        ...prev,
        habits: [
          ...prev.habits.filter(h => h.id !== id),
          { id, _isDelete: true }
        ]
      };
    });
    
    markUnsaved();
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
    
    setPendingChanges(prev => {
      const logs = { ...prev.logs };
      if (!logs[habitId]) logs[habitId] = {};
      
      const isCurrentlyCompleted = !!(habitLogs[habitId] && habitLogs[habitId][dateString]);
      logs[habitId][dateString] = !isCurrentlyCompleted;
      
      return { ...prev, logs };
    });
    
    markUnsaved();
  };

  const saveAll = async () => {
    if (!userId) throw new Error("Must be logged in to save.");
    setIsSyncing(true);
    try {
      // 1. Process Habits
      for (const h of pendingChanges.habits) {
        if (h._isDelete) {
          if (!h.id.startsWith('temp_')) {
            await deleteDoc(doc(db, 'habits', h.id));
          }
        } else if (h._isUpdate) {
           await updateDoc(doc(db, 'habits', h.id), { name: h.name, emoji: h.emoji });
        } else {
           // Insert new habit
           const docRef = await addDoc(collection(db, 'habits'), {
             user_id: userId,
             name: h.name,
             emoji: h.emoji
           });
           
           const tempId = h.id;
           const realId = docRef.id;
           
           setHabits(current => current.map(ch => ch.id === tempId ? { ...ch, id: realId } : ch));
           
           if (pendingChanges.logs[tempId]) {
              pendingChanges.logs[realId] = pendingChanges.logs[tempId];
              delete pendingChanges.logs[tempId];
           }
           
           setHabitLogs(current => {
              const newLogs = { ...current };
              if (newLogs[tempId]) {
                 newLogs[realId] = newLogs[tempId];
                 delete newLogs[tempId];
              }
              return newLogs;
           });
        }
      }

      // 2. Process Logs
      for (const [habitId, dates] of Object.entries(pendingChanges.logs)) {
        if (habitId.startsWith('temp_')) continue; 
        
        for (const [dateStr, isCompleted] of Object.entries(dates)) {
          // In Firestore, we use a composite ID for habit logs to ensure uniqueness and easy upsert/delete
          const logDocId = `${userId}_${habitId}_${dateStr}`;
          const logDocRef = doc(db, 'habit_logs', logDocId);

          if (isCompleted) {
             await setDoc(logDocRef, {
                habit_id: habitId,
                user_id: userId,
                log_date: dateStr
             });
          } else {
             await deleteDoc(logDocRef);
          }
        }
      }

      setHasUnsavedChanges(false);
      setPendingChanges({ habits: [], logs: {} });
      console.log("Firebase write SUCCESS (All)");
      return true;
    } catch (e) {
      console.error("Firebase write FAILED (All):", e);
      throw e;
    } finally {
      setIsSyncing(false);
    }
  };

  const saveToday = async () => {
    return saveAll();
  };

  return {
    habits,
    habitLogs,
    hasUnsavedChanges,
    isSyncing,
    loading,
    fetchError,
    addHabit,
    updateHabit,
    deleteHabit,
    toggleHabitLog,
    saveAll,
    saveToday
  };
};
