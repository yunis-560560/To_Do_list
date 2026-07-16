import React from 'react';
import { Check } from 'lucide-react';
import { format, getDaysInMonth, startOfMonth, addDays } from 'date-fns';

const HabitGrid = ({ habits }) => {
  // Mock current month (August 2026 for now)
  const currentDate = new Date(2026, 7, 1);
  const daysInMonth = getDaysInMonth(currentDate);
  const days = Array.from({ length: daysInMonth }, (_, i) => addDays(startOfMonth(currentDate), i));

  // Mock random completion data
  const isCompleted = (habitId, dayIndex) => {
    // Generate a consistent pseudo-random boolean based on id and day
    return (habitId * 7 + dayIndex * 13) % 2 !== 0;
  };

  return (
    <div className="w-full">
      <div className="flex">
        {/* Empty top-left cell */}
        <div className="w-8 flex-shrink-0"></div>
        
        {/* Days Header */}
        <div className="flex flex-1">
          {days.map((date, i) => (
            <div key={i} className="flex-1 min-w-[32px] flex flex-col items-center justify-end pb-2">
              <span className="text-[10px] text-zinc-500 font-medium uppercase">{format(date, 'EEEE').substring(0, 2)}</span>
              <span className="text-xs text-zinc-300 font-bold mt-1">{format(date, 'd')}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Grid Rows */}
      <div className="space-y-2 mt-2">
        {habits.map((habit) => (
          <div key={habit.id} className="flex items-center group">
            <div className="w-8 flex-shrink-0 text-xl flex items-center justify-center pointer-events-none" title={habit.name}>
              {habit.emoji}
            </div>
            
            <div className="flex flex-1 gap-1">
              {days.map((_, dayIndex) => {
                const completed = isCompleted(habit.id, dayIndex);
                return (
                  <div 
                    key={dayIndex}
                    className={`flex-1 min-w-[32px] h-8 rounded border transition-all cursor-pointer flex items-center justify-center
                      ${completed 
                        ? 'bg-orange-500/20 border-orange-500/50 text-orange-500' 
                        : 'bg-black border-zinc-800 hover:border-orange-500/30'
                      }
                    `}
                  >
                    {completed && <Check size={14} strokeWidth={4} />}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HabitGrid;
