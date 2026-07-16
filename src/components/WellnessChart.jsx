import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

const generateWellnessData = () => {
  return Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    mood: (Math.random() * 2 + 3).toFixed(1), // Mood between 3 and 5
    sleep: (Math.random() * 3 + 5.5).toFixed(1), // Sleep between 5.5 and 8.5
  }));
};

const wellnessData = generateWellnessData();

const WellnessChart = () => {
  return (
    <div className="bg-zinc-900 rounded-xl p-4 shadow-xl border border-zinc-800 h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Overall Wellness Trend</h2>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={wellnessData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis dataKey="day" stroke="#71717a" tick={{ fill: '#71717a', fontSize: 12 }} tickLine={false} axisLine={false} />
            
            {/* Left Y Axis for Mood (1-5) */}
            <YAxis yAxisId="left" domain={[1, 5]} stroke="#71717a" tick={{ fill: '#71717a', fontSize: 12 }} tickLine={false} axisLine={false} />
            
            {/* Right Y Axis for Sleep (0-12) */}
            <YAxis yAxisId="right" orientation="right" domain={[0, 12]} stroke="#71717a" tick={{ fill: '#71717a', fontSize: 12 }} tickLine={false} axisLine={false} />
            
            <Tooltip 
              contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px', color: '#fff' }} 
              itemStyle={{ color: '#fff' }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            
            <Line yAxisId="left" type="monotone" dataKey="mood" name="Mood (1-5)" stroke="#f97316" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#f97316', stroke: '#fff' }} />
            <Line yAxisId="right" type="monotone" dataKey="sleep" name="Sleep (Hrs)" stroke="#fb923c" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#fb923c', stroke: '#fff' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default WellnessChart;
