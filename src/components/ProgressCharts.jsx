import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Target, Trophy } from 'lucide-react';
import { getDaysInMonth, startOfMonth, addDays, getWeek } from 'date-fns';

const ProgressCharts = ({ habits = [], habitLogs = {} }) => {
  const currentDate = new Date();
  const daysInMonth = getDaysInMonth(currentDate);
  const days = Array.from({ length: daysInMonth }, (_, i) => addDays(startOfMonth(currentDate), i));
  const totalPossible = habits.length * daysInMonth;

  // Calculate Daily Progress
  const dailyData = useMemo(() => {
    return days.map(day => {
      const dateStr = day.toISOString().split('T')[0];
      let completed = 0;
      habits.forEach(habit => {
        if (habitLogs[habit.id]?.[dateStr]) {
          completed++;
        }
      });
      // Return percentage for the day
      const percentage = habits.length > 0 ? Math.round((completed / habits.length) * 100) : 0;
      return { day: day.getDate(), completed: percentage };
    });
  }, [habits, habitLogs, days]);

  // Calculate Weekly Average
  const weeklyData = useMemo(() => {
    const weeks = {};
    days.forEach(day => {
      const weekNum = getWeek(day, { weekStartsOn: 1 });
      if (!weeks[weekNum]) weeks[weekNum] = { totalPossible: 0, completed: 0 };
      
      const dateStr = day.toISOString().split('T')[0];
      habits.forEach(habit => {
        weeks[weekNum].totalPossible++;
        if (habitLogs[habit.id]?.[dateStr]) {
          weeks[weekNum].completed++;
        }
      });
    });

    return Object.keys(weeks).map((weekNum, index) => {
      const w = weeks[weekNum];
      const avg = w.totalPossible > 0 ? Math.round((w.completed / w.totalPossible) * 100) : 0;
      return { week: `W${index + 1}`, avg };
    });
  }, [habits, habitLogs, days]);

  // Calculate Monthly Goal
  const { totalCompleted, goalPercentage } = useMemo(() => {
    let completed = 0;
    Object.values(habitLogs).forEach(log => {
      completed += Object.keys(log).length;
    });
    const percentage = totalPossible > 0 ? Math.round((completed / totalPossible) * 100) : 0;
    return { totalCompleted: completed, goalPercentage: percentage };
  }, [habitLogs, totalPossible]);

  const goalData = [
    { name: 'Completed', value: goalPercentage, color: '#f97316' }, // orange-500
    { name: 'Remaining', value: Math.max(100 - goalPercentage, 0), color: '#27272a' } // zinc-800
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
      {/* Daily Progress */}
      <div className="bg-zinc-900 rounded-xl p-4 shadow-xl border border-zinc-800">
        <h3 className="text-zinc-400 text-sm font-bold uppercase tracking-wider mb-4">Daily Progress (%)</h3>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 10 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 10 }} domain={[0, 100]} />
              <Tooltip cursor={{ fill: '#27272a' }} contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px', color: '#fff' }} />
              <Bar dataKey="completed" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Weekly Progress */}
      <div className="bg-zinc-900 rounded-xl p-4 shadow-xl border border-zinc-800">
        <h3 className="text-zinc-400 text-sm font-bold uppercase tracking-wider mb-4">Weekly Average (%)</h3>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
              <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} domain={[0, 100]} />
              <Tooltip cursor={{ fill: '#27272a' }} contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px', color: '#fff' }} />
              <Bar dataKey="avg" fill="#fb923c" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Goal Ring */}
      <div className="bg-zinc-900 rounded-xl p-4 shadow-xl border border-zinc-800 flex items-center justify-between relative">
        <div className="flex flex-col h-full justify-between">
          <div>
            <h3 className="text-zinc-400 text-sm font-bold uppercase tracking-wider mb-1">Monthly Goal</h3>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold text-white">{goalPercentage}%</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 mt-4 text-sm">
            <Target size={16} className="text-orange-500" />
            <span className="text-zinc-300">{totalCompleted} completed</span>
            <span className="text-zinc-500">/ {totalPossible}</span>
          </div>
        </div>

        <div className="h-32 w-32 relative flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={goalData}
                innerRadius={40}
                outerRadius={55}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {goalData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <Trophy size={20} className="text-orange-500 mb-1 drop-shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressCharts;
