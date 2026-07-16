import React, { useState } from 'react';
import { GraduationCap, Briefcase, Building2, Plus, ArrowRight } from 'lucide-react';
import { useBudget } from '../hooks/useBudget';
import BudgetDashboard from './BudgetDashboard';

const USER_TYPES = [
  { id: 'student', label: 'Student', icon: GraduationCap, prompt: 'Monthly allowance/pocket money amount' },
  { id: 'employee', label: 'Employee', icon: Briefcase, prompt: 'Monthly salary/income' },
  { id: 'business', label: 'Business Owner', icon: Building2, prompt: 'Average monthly business income' },
  { id: 'other', label: 'Other', icon: Plus, prompt: 'Monthly income amount' }
];

const BudgetModule = ({ userEmail }) => {
  const { budgetProfile, saveBudgetProfile, expenses, addExpense, updateExpense, deleteExpense } = useBudget(userEmail);
  
  // Setup State
  const [selectedType, setSelectedType] = useState(null);
  const [income, setIncome] = useState('');
  const [goal, setGoal] = useState('');

  const handleSetupSubmit = (e) => {
    e.preventDefault();
    if (!selectedType || !income || !goal) return;
    
    saveBudgetProfile({
      userType: selectedType.id,
      monthlyIncome: parseFloat(income),
      monthlyBudgetGoal: parseFloat(goal)
    });
  };

  // If no profile exists, show the One-Time Setup Screen (Step 2)
  if (!budgetProfile) {
    return (
      <div className="bg-zinc-900 rounded-xl shadow-xl border border-zinc-800 p-8 max-w-3xl mx-auto mt-6">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold tracking-wider text-white">
            BUDGET <span className="text-orange-500">SETUP</span>
          </h2>
          <p className="text-zinc-400 mt-2">Let's personalize your financial dashboard.</p>
        </div>

        <form onSubmit={handleSetupSubmit} className="space-y-8">
          {/* Category Selection */}
          <div>
            <label className="block text-sm font-bold text-zinc-300 uppercase tracking-wider mb-4 text-center">
              Which category best describes you?
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {USER_TYPES.map(type => {
                const Icon = type.icon;
                const isSelected = selectedType?.id === type.id;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setSelectedType(type)}
                    className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all duration-200 ${
                      isSelected 
                        ? 'bg-orange-500/10 border-orange-500 text-orange-500 scale-105 shadow-[0_0_20px_rgba(249,115,22,0.15)]' 
                        : 'bg-black border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
                    }`}
                  >
                    <Icon size={32} className="mb-3" />
                    <span className="font-bold text-sm">{type.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Follow-up Questions (Only visible after selecting a type) */}
          {selectedType && (
            <div className="bg-black p-6 rounded-xl border border-zinc-800 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                  {selectedType.prompt}
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-zinc-500 font-bold">₹</span>
                  <input 
                    type="number"
                    required
                    value={income}
                    onChange={(e) => setIncome(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-orange-500 rounded-lg pl-10 pr-4 py-3 text-white outline-none transition-colors"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                  Set your Monthly Budget Goal
                </label>
                <p className="text-xs text-zinc-500 mb-2">How much do you intend to spend this month? (This becomes your limit)</p>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-zinc-500 font-bold">₹</span>
                  <input 
                    type="number"
                    required
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-orange-500 rounded-lg pl-10 pr-4 py-3 text-white outline-none transition-colors"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button 
                  type="submit"
                  disabled={!income || !goal}
                  className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(249,115,22,0.3)] hover:shadow-[0_0_25px_rgba(249,115,22,0.5)]"
                >
                  COMPLETE SETUP <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    );
  }

  // Budget Dashboard (Step 3 & 4)
  return (
    <BudgetDashboard 
      budgetProfile={budgetProfile} 
      expenses={expenses} 
      addExpense={addExpense} 
      updateExpense={updateExpense} 
      deleteExpense={deleteExpense} 
    />
  );
};

export default BudgetModule;
