import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { format } from 'date-fns';

const generateId = () => Math.random().toString(36).substr(2, 9); // For optimistic UI

export const useHabits = (userId) => {
  const [habits, setHabits] = useState([]);
  const [habitLogs, setHabitLogs] = useState({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // We will keep an array of optimistic changes to sync
  const [pendingChanges, setPendingChanges] = useState({
    habits: [],
    logs: {}
  });

  useEffect(() => {
    if (!userId) {
      setHabits([]);
      setHabitLogs({});
      return;
    }

    const fetchData = async () => {
      // Fetch habits
      const { data: habitsData, error: habitsError } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', userId);
        
      if (!habitsError && habitsData) {
        setHabits(habitsData);
      }

      // Fetch logs
      const { data: logsData, error: logsError } = await supabase
        .from('habit_logs')
        .select('*')
        .eq('user_id', userId);

      if (!logsError && logsData) {
        // Transform logs back into { habitId: { dateStr: true } }
        const logsMap = {};
        logsData.forEach(log => {
          if (!logsMap[log.habit_id]) logsMap[log.habit_id] = {};
          logsMap[log.habit_id][log.log_date] = true;
        });
        setHabitLogs(logsMap);
      }
    };
    
    fetchData();
  }, [userId]);

  const markUnsaved = () => setHasUnsavedChanges(true);

  const addHabit = async (name, emoji) => {
    if (!name.trim()) return false;
    if (habits.some(h => h.name.toLowerCase() === name.toLowerCase())) return false;
    
    const newHabit = { 
      // Supabase expects UUIDs, so let it auto-generate, but we need an ID for optimistic UI.
      // We will let Supabase handle the ID when saving, but we need a temporary one for React keys.
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
      // Find if it's already a pending new habit
      const existingPending = prev.habits.find(h => h.id === id);
      if (existingPending) {
        return {
          ...prev,
          habits: prev.habits.map(h => h.id === id ? { ...h, name: newName.trim(), emoji: newEmoji } : h)
        };
      } else {
        // It's an existing habit to update
        const updatedHabits = [...prev.habits, { id, name: newName.trim(), emoji: newEmoji, _isUpdate: true }];
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
    
    setPendingChanges(prev => ({
      ...prev,
      habits: [...prev.habits, { id, _isDelete: true }]
    }));
    
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
      
      // If we are toggling, we record what it SHOULD be now based on state (which we just updated optimistically)
      // Since state update is async, we can compute it here.
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
          // It's a real UUID from DB
          if (!h.id.startsWith('temp_')) {
            await supabase.from('habits').delete().eq('id', h.id);
          }
        } else if (h._isUpdate) {
           await supabase.from('habits').update({ name: h.name, emoji: h.emoji }).eq('id', h.id);
        } else {
           // Insert new habit
           const { data, error } = await supabase.from('habits').insert({
             user_id: userId,
             name: h.name,
             emoji: h.emoji
           }).select().single();
           
           if (!error && data) {
              // We need to update any logs that were associated with 'temp_x' to the new real UUID
              const tempId = h.id;
              const realId = data.id;
              
              setHabits(current => current.map(ch => ch.id === tempId ? data : ch));
              
              // Map pending logs to the real ID
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
      }

      // 2. Process Logs
      for (const [habitId, dates] of Object.entries(pendingChanges.logs)) {
        if (habitId.startsWith('temp_')) continue; // Should have been remapped above
        
        for (const [dateStr, isCompleted] of Object.entries(dates)) {
          if (isCompleted) {
             // Insert log
             // Using upsert or handling duplicates
             await supabase.from('habit_logs').upsert({
                habit_id: habitId,
                user_id: userId,
                log_date: dateStr
             }, { onConflict: 'habit_id,log_date' });
          } else {
             // Delete log
             await supabase.from('habit_logs')
               .delete()
               .eq('habit_id', habitId)
               .eq('user_id', userId)
               .eq('log_date', dateStr);
          }
        }
      }

      setHasUnsavedChanges(false);
      setPendingChanges({ habits: [], logs: {} });
      console.log("Supabase write SUCCESS (All)");
      return true;
    } catch (e) {
      console.error("Supabase write FAILED (All):", e);
      throw e;
    } finally {
      setIsSyncing(false);
    }
  };

  const saveToday = async () => {
    // For simplicity, we just save all pending changes as it handles the logic
    return saveAll();
  };

  return {
    habits,
    habitLogs,
    hasUnsavedChanges,
    isSyncing,
    addHabit,
    updateHabit,
    deleteHabit,
    toggleHabitLog,
    saveAll,
    saveToday
  };
};
