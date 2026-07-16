import React, { useMemo } from 'react';
import { Medal } from 'lucide-react';
import { getDaysInMonth } from 'date-fns';

const Leaderboard = ({ habits = [], habitLogs = {} }) => {
  const currentDate = new Date();
  const daysInMonth = getDaysInMonth(currentDate);

  const sortedHabits = useMemo(() => {
    return habits.map(habit => {
      const logs = habitLogs[habit.id] || {};
      const completed = Object.keys(logs).length;
      const score = Math.round((completed / daysInMonth) * 100);
      return { ...habit, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
  }, [habits, habitLogs, daysInMonth]);

  return (
    <div className="bg-zinc-900 rounded-xl p-4 shadow-xl border border-zinc-800 h-full">
      <div className="flex items-center gap-2 mb-6">
        <Medal className="text-orange-500" size={20} />
        <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Top Habits</h2>
      </div>

      <div className="space-y-3">
        {sortedHabits.length === 0 && (
          <div className="text-sm text-zinc-500 italic">No habits yet.</div>
        )}
        {sortedHabits.map((habit, index) => (
          <div key={habit.id} className="flex items-center gap-3">
            <div className={`
              w-6 text-sm font-bold text-right
              ${index === 0 ? 'text-orange-500' : index === 1 ? 'text-orange-400' : index === 2 ? 'text-orange-300' : 'text-zinc-600'}
            `}>
              {index + 1}.
            </div>
            <div className="w-8 flex-shrink-0 text-xl flex justify-center">{habit.emoji}</div>
            <div className="flex-1 font-medium text-zinc-200 truncate">{habit.name}</div>
            <div className="font-bold text-orange-500">{habit.score}%</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Leaderboard;
