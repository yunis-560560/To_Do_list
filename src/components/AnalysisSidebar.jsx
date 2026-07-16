import React from 'react';
import { Flame } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

const generateSparklineData = (habitId) => {
  return Array.from({ length: 14 }, (_, i) => ({
    val: Math.sin(i + habitId) * 10 + 50 + Math.random() * 20
  }));
};

const AnalysisSidebar = ({ habits }) => {
  return (
    <div className="bg-zinc-900 rounded-xl p-4 shadow-xl border border-zinc-800 h-full">
      <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-6">Analysis</h2>
      
      <div className="space-y-4">
        {habits.map((habit) => {
          const streak = Math.floor(Math.random() * 15);
          const hasStreak = streak >= 7;

          return (
            <div key={habit.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-zinc-800 transition-colors">
              <div className="w-24 h-8 opacity-70">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={generateSparklineData(habit.id)}>
                    <Line 
                      type="monotone" 
                      dataKey="val" 
                      stroke={hasStreak ? '#f97316' : '#71717a'} // orange-500 or zinc-500
                      strokeWidth={2} 
                      dot={false} 
                      isAnimationActive={false} 
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
          );
        })}
      </div>
    </div>
  );
};

export default AnalysisSidebar;
