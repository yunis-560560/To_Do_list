import React, { useState, useRef, useEffect } from 'react';
import { Check, Plus, Settings2, MoreHorizontal, Trash2, Edit2, Smile, Flame, Loader2 } from 'lucide-react';
import { format, getDaysInMonth, startOfMonth, addDays } from 'date-fns';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { getHabitEmoji } from '../utils/emojiUtils';

const calculateStreak = (habitId, habitLogs) => {
  let streak = 0;
  let currentDate = new Date();
  const todayStr = format(currentDate, 'yyyy-MM-dd');
  
  // Check if today is not logged, but yesterday might be
  if (!habitLogs[habitId]?.[todayStr]) {
    currentDate = addDays(currentDate, -1);
    const yesterdayStr = format(currentDate, 'yyyy-MM-dd');
    if (!habitLogs[habitId]?.[yesterdayStr]) {
      return 0; // Streak is 0 if neither today nor yesterday is logged
    }
  }

  while (true) {
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    if (habitLogs[habitId]?.[dateStr]) {
      streak++;
      currentDate = addDays(currentDate, -1);
    } else {
      break;
    }
  }
  return streak;
};

const generateSparklineData = (habitId, habitLogs, days) => {
  return days.map(day => {
    const dateStr = format(day, 'yyyy-MM-dd');
    return {
      val: habitLogs[habitId]?.[dateStr] ? 1 : 0
    };
  });
};

const HabitRow = ({ habit, habitLogs, days, onToggle, onUpdate, onDelete }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(habit.name);
  const menuRef = useRef(null);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSaveEdit = () => {
    if (editName.trim() !== '') {
      onUpdate(habit.id, editName, habit.emoji);
    } else {
      setEditName(habit.name); // Revert
    }
    setIsEditing(false);
  };

  const streak = calculateStreak(habit.id, habitLogs);
  const hasStreak = streak > 0;

  return (
    <>
      {/* Desktop View */}
      <div className="hidden md:flex w-max min-w-full border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors group">
        
        {/* Sticky Left: Habit Info */}
        <div className={`w-64 sticky left-0 ${isMenuOpen ? 'z-50' : 'z-20'} bg-zinc-900 border-r border-zinc-800 flex items-center p-3 gap-3`}>
          <button 
            className="text-2xl hover:scale-110 transition-transform flex-shrink-0"
            title="Change Icon (Mock)"
          >
            {habit.emoji}
          </button>
          
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <input
                autoFocus
                className="w-full bg-black border border-orange-500 rounded px-2 py-1 text-sm text-white outline-none min-h-[44px]"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={handleSaveEdit}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
              />
            ) : (
              <span className="font-medium text-zinc-300 group-hover:text-zinc-100 transition-colors break-words">
                {habit.name}
              </span>
            )}
          </div>

          {/* Kebab Menu */}
          <div className="relative flex-shrink-0" ref={menuRef}>
            <button 
              className="p-1 text-zinc-600 hover:text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity min-w-[44px] min-h-[44px] flex items-center justify-center"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <MoreHorizontal size={18} />
            </button>
            
            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-32 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-50 overflow-hidden">
                <button 
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-700 transition-colors min-h-[44px]"
                  onClick={() => { setIsEditing(true); setIsMenuOpen(false); }}
                >
                  <Edit2 size={14} /> Rename
                </button>
                <button 
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-zinc-700 transition-colors min-h-[44px]"
                  onClick={() => {
                    if (window.confirm('Delete this habit? This removes its history too.')) {
                      onDelete(habit.id);
                    }
                    setIsMenuOpen(false);
                  }}
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Center: Grid */}
        <div className="flex flex-1 p-2 gap-1 items-center">
          {days.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const isCompleted = !!habitLogs[habit.id]?.[dateStr];
            const isToday = dateStr === format(new Date(), 'yyyy-MM-dd');

            return (
              <button
                key={dateStr}
                disabled={!isToday}
                onClick={() => onToggle(habit.id, dateStr)}
                className={`flex-1 min-w-[40px] h-10 rounded-md border transition-all duration-150 flex items-center justify-center
                  ${!isToday ? 'opacity-30 cursor-not-allowed' : 'active:scale-90 cursor-pointer'}
                  ${isCompleted 
                    ? 'bg-orange-500 border-orange-400 text-white shadow-[0_0_10px_rgba(249,115,22,0.3)]' 
                    : (isToday ? 'bg-black border-zinc-800 hover:border-orange-500/50' : 'bg-black border-zinc-800')
                  }
                `}
              >
                {isCompleted && <Check size={20} strokeWidth={4} />}
              </button>
            );
          })}
        </div>

        {/* Right Analysis */}
        <div className="w-64 sticky right-0 z-20 bg-zinc-900 border-l border-zinc-800 flex items-center p-3 justify-between shrink-0">
          <div className="w-24 h-8 opacity-70">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={generateSparklineData(habit.id, habitLogs, days)}>
                <Line 
                  type="stepAfter" 
                  dataKey="val" 
                  stroke={hasStreak ? '#f97316' : '#71717a'} 
                  strokeWidth={2} 
                  dot={false} 
                  isAnimationActive={true} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <div className="flex items-center gap-1.5 min-w-[50px] justify-end">
            <span className={`font-bold ${hasStreak ? 'text-orange-500' : 'text-zinc-500'}`}>
              {streak}
            </span>
            <Flame 
              size={16} 
              className={hasStreak ? 'text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]' : 'text-zinc-600'} 
            />
          </div>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="flex md:hidden flex-col bg-zinc-800/40 border border-zinc-800 rounded-xl p-4 mx-3 my-2 gap-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{habit.emoji}</span>
            {isEditing ? (
              <input
                autoFocus
                className="flex-1 min-w-0 bg-black border border-orange-500 rounded px-2 py-1 text-base text-white outline-none min-h-[44px]"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={handleSaveEdit}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
              />
            ) : (
              <span className="font-bold text-lg text-zinc-100 break-words">{habit.name}</span>
            )}
          </div>
          
          {/* Mobile Kebab Menu */}
          <div className="relative flex-shrink-0" ref={menuRef}>
            <button 
              className="text-zinc-400 hover:text-zinc-200 min-w-[44px] min-h-[44px] flex items-center justify-center"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <MoreHorizontal size={24} />
            </button>
            
            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-40 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-50 overflow-hidden">
                <button 
                  className="w-full flex items-center gap-3 px-4 py-3 text-base text-zinc-300 hover:bg-zinc-700 transition-colors min-h-[48px]"
                  onClick={() => { setIsEditing(true); setIsMenuOpen(false); }}
                >
                  <Edit2 size={16} /> Rename
                </button>
                <button 
                  className="w-full flex items-center gap-3 px-4 py-3 text-base text-red-400 hover:bg-zinc-700 transition-colors min-h-[48px]"
                  onClick={() => {
                    if (window.confirm('Delete this habit?')) {
                      onDelete(habit.id);
                    }
                    setIsMenuOpen(false);
                  }}
                >
                  <Trash2 size={16} /> Delete
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center bg-black/50 p-3 rounded-lg border border-zinc-800/50">
            <span className="text-sm font-medium text-zinc-400">Today's Status</span>
            {(() => {
              const todayStr = format(new Date(), 'yyyy-MM-dd');
              const isCompleted = !!habitLogs[habit.id]?.[todayStr];
              return (
                <button
                  onClick={() => onToggle(habit.id, todayStr)}
                  className={`min-h-[44px] px-6 rounded-md font-bold text-sm transition-all flex items-center gap-2 ${
                    isCompleted 
                      ? 'bg-orange-500 text-white shadow-[0_0_10px_rgba(249,115,22,0.3)]' 
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  {isCompleted ? <Check size={18} strokeWidth={3} /> : '☐'} 
                  {isCompleted ? 'Complete' : 'Pending'}
                </button>
              );
            })()}
          </div>

          <div className="flex justify-between items-center bg-black/50 p-3 rounded-lg border border-zinc-800/50">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-zinc-400">Streak:</span>
              <span className={`font-bold text-base ${hasStreak ? 'text-orange-500' : 'text-zinc-300'}`}>
                {streak}
              </span>
              {hasStreak && <Flame size={16} className="text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]" />}
            </div>
            
            <div className="w-24 h-8 opacity-70">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={generateSparklineData(habit.id, habitLogs, days)}>
                  <Line 
                    type="stepAfter" 
                    dataKey="val" 
                    stroke={hasStreak ? '#f97316' : '#71717a'} 
                    strokeWidth={2} 
                    dot={false} 
                    isAnimationActive={true} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const HabitTracker = ({ habits, habitLogs, hasUnsavedChanges, isSyncing, loading, onToggle, onAdd, onUpdate, onDelete, onSaveAll, onSaveToday }) => {
  const [newHabitName, setNewHabitName] = useState('');
  const [toastMessage, setToastMessage] = useState(null);
  
  const showToast = (message, isError = false) => {
    setToastMessage({ message, isError });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSaveAll = async () => {
    console.log("Save button clicked");
    try {
      await onSaveAll();
      showToast("Tasks saved successfully");
    } catch (e) {
      console.error(e);
      showToast(e.message || "Couldn't save, try again", true);
    }
  };

  const handleSaveToday = async () => {
    console.log("Update Today's Task button clicked");
    try {
      await onSaveToday();
      showToast("Tasks saved successfully");
    } catch (e) {
      console.error(e);
      showToast(e.message || "Couldn't save, try again", true);
    }
  };
  
  // Use actual current date
  const currentDate = new Date();
  const daysInMonth = getDaysInMonth(currentDate);
  const days = Array.from({ length: daysInMonth }, (_, i) => addDays(startOfMonth(currentDate), i));

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (newHabitName.trim()) {
      const habitEmoji = getHabitEmoji(newHabitName.trim());
      const success = onAdd(newHabitName, habitEmoji);
      if (success) {
        setNewHabitName('');
      } else {
        alert("Habit name must be unique and not empty.");
      }
    }
  };

  if (loading) {
    return (
      <div className="bg-zinc-900 rounded-xl shadow-xl border border-zinc-800 flex items-center justify-center p-12 text-zinc-500 min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500 mr-3"></div>
        Loading habits...
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 rounded-xl shadow-xl border border-zinc-800 relative">
      <div className="overflow-x-hidden md:overflow-x-auto custom-scrollbar w-full">
        {/* Header Row (Desktop Only) */}
        <div className="hidden md:flex w-max min-w-full border-b border-zinc-800 bg-zinc-900/95 backdrop-blur z-30 sticky top-0">
          <div className="w-64 sticky left-0 z-40 bg-zinc-900 p-4 border-r border-zinc-800 flex items-center justify-between">
            <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">My Habits</h2>
            <button className="text-zinc-500 hover:text-orange-500 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
              <Settings2 size={16} />
            </button>
          </div>
          
          <div className="flex flex-1 p-2 gap-1 items-end">
            {days.map((date, i) => (
              <div key={i} className="flex-1 min-w-[40px] flex flex-col items-center justify-end pb-1">
                <span className="text-[10px] text-zinc-500 font-medium uppercase">{format(date, 'EE').substring(0, 2)}</span>
                <span className="text-sm text-zinc-300 font-bold mt-1">{format(date, 'd')}</span>
              </div>
            ))}
          </div>
          
          <div className="w-64 sticky right-0 z-40 bg-zinc-900 p-4 border-l border-zinc-800 flex items-center shrink-0">
            <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Analysis</h2>
          </div>
        </div>

        {/* Body Rows */}
        <div className="flex flex-col w-full md:w-max md:min-w-full">
          {habits.map(habit => (
            <HabitRow 
              key={habit.id}
              habit={habit}
              habitLogs={habitLogs}
              days={days}
              onToggle={onToggle}
              onUpdate={onUpdate}
              onDelete={onDelete}
            />
          ))}

          {/* Add Habit Row (Desktop) */}
          <div className="hidden md:flex w-max min-w-full">
            <div className="w-64 sticky left-0 z-20 bg-zinc-900 border-r border-zinc-800 p-3">
              <form onSubmit={handleAddSubmit} className="flex items-center gap-2">
                <button 
                  type="button"
                  className="text-2xl text-zinc-600 hover:text-zinc-400 transition-colors flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <Plus size={24} />
                </button>
                <input 
                  type="text" 
                  placeholder="Add new habit..."
                  className="flex-1 min-w-0 bg-transparent border-none text-sm text-white placeholder-white/70 outline-none h-10"
                  value={newHabitName}
                  onChange={(e) => setNewHabitName(e.target.value)}
                />
              </form>
            </div>
            <div className="flex-1"></div>
            <div className="w-64 sticky right-0 z-20 bg-zinc-900 border-l border-zinc-800 shrink-0"></div>
          </div>
          
          {/* Add Habit Row (Mobile) */}
          <div className="flex md:hidden w-full p-3 mb-2">
            <form onSubmit={handleAddSubmit} className="flex items-center gap-3 w-full bg-zinc-800/40 border border-zinc-800 rounded-xl p-3">
              <button 
                type="button"
                className="text-zinc-500 hover:text-zinc-300 transition-colors flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center bg-black/50 rounded-lg"
              >
                <Plus size={24} />
              </button>
              <input 
                type="text" 
                placeholder="Add new habit..."
                className="flex-1 min-w-0 bg-transparent border-none text-base text-white placeholder-zinc-500 outline-none h-12"
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
              />
            </form>
          </div>
        </div>
      </div>

      {/* Action Buttons Row */}
      <div className="flex flex-col sm:flex-row justify-end items-center gap-3 sm:gap-4 p-4 border-t border-zinc-800 bg-zinc-900/95 rounded-b-xl">
        {hasUnsavedChanges && (
          <span className="text-orange-500 text-sm font-medium flex items-center gap-1 w-full sm:w-auto justify-center sm:justify-start">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
            Unsaved changes
          </span>
        )}
        <button 
          onClick={handleSaveToday}
          disabled={isSyncing}
          className="w-full sm:w-auto px-6 py-3 min-h-[48px] text-sm text-zinc-300 border border-zinc-700 rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-50"
        >
          {isSyncing ? <Loader2 size={16} className="animate-spin inline mr-2" /> : null}
          Update Today's Task
        </button>
        <button 
          onClick={handleSaveAll}
          disabled={isSyncing}
          className="w-full sm:w-auto px-6 py-3 min-h-[48px] text-sm text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isSyncing ? <Loader2 size={16} className="animate-spin" /> : null}
          Save
        </button>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed md:absolute bottom-4 right-4 md:bottom-20 md:right-4 p-3 rounded-lg shadow-xl text-sm font-bold z-50 flex items-center gap-2 transition-all animate-in slide-in-from-bottom-4 ${toastMessage.isError ? 'bg-red-500/90 text-white' : 'bg-emerald-500/90 text-white'}`}>
          {toastMessage.message}
        </div>
      )}
    </div>
  );
};

export default HabitTracker;

// Missing lucide icon import: import { Flame } from 'lucide-react';
