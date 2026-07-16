import React from 'react';
import { Plus, Settings2 } from 'lucide-react';

const HabitSidebar = ({ habits }) => {
  return (
    <div className="bg-zinc-900 rounded-xl p-4 shadow-xl border border-zinc-800 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-zinc-100 uppercase tracking-wider">My Habits</h2>
        <button className="text-zinc-500 hover:text-orange-500 transition-colors">
          <Settings2 size={20} />
        </button>
      </div>
      
      <div className="flex-1 space-y-3">
        {habits.map((habit) => (
          <div 
            key={habit.id} 
            className="flex items-center gap-3 p-3 bg-black rounded-lg border border-zinc-800 hover:border-orange-500/50 transition-colors group cursor-pointer shadow-sm"
          >
            <span className="text-2xl">{habit.emoji}</span>
            <span className="font-medium text-zinc-300 group-hover:text-zinc-100 transition-colors">{habit.name}</span>
          </div>
        ))}
      </div>

      <button className="mt-6 flex items-center justify-center gap-2 w-full py-3.5 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white rounded-lg font-bold tracking-wide transition-all shadow-[0_0_15px_rgba(249,115,22,0.4)] hover:shadow-[0_0_25px_rgba(249,115,22,0.6)] transform hover:-translate-y-0.5">
        <Plus size={20} strokeWidth={3} />
        ADD HABIT
      </button>
    </div>
  );
};

export default HabitSidebar;
