import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Edit2, Save, X, AlertTriangle, Info, TrendingUp, TrendingDown, ArrowRight, ArrowUpRight, ArrowDownRight, RotateCcw, Eraser, Loader2, CheckCircle2 } from 'lucide-react';
import { PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format, startOfMonth, endOfMonth, isWithinInterval, differenceInDays, getDate } from 'date-fns';

const EXPENSE_CATEGORIES = ['Food', 'Transport', 'Bills', 'Shopping', 'Entertainment', 'Education', 'Other'];
const INCOME_CATEGORIES = ['Salary', 'Business', 'Investment', 'Gift', 'Other'];

const BudgetDashboard = ({ budgetProfile, transactions, addTransaction, updateTransaction, deleteTransaction, onGoToSetup, onClearAllData, onClearMonthData, onSaveNow, saveStatus }) => {

  // Save button local loading state (for immediate press feedback)
  const [isSavingManual, setIsSavingManual] = useState(false);

  const handleManualSave = async () => {
    if (!onSaveNow || isSavingManual) return;
    setIsSavingManual(true);
    try { await onSaveNow(); } finally { setIsSavingManual(false); }
  };

  // Derive save button label
  const isSaving = saveStatus === 'saving' || isSavingManual;
  const isSaved  = saveStatus === 'saved';

  // Entry Form State
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const [entryType, setEntryType] = useState('expense'); // 'expense' or 'income'
  const [entryDate, setEntryDate] = useState(todayStr);
  const [entryAmount, setEntryAmount] = useState('');
  const [entryCategory, setEntryCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [entryNote, setEntryNote] = useState('');
  const [entryError, setEntryError] = useState('');

  // Editing State
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({});

  // Clear dialog state: null | 'confirm' | 'choosing'
  const [clearDialog, setClearDialog] = useState(null);
  const [clearMode, setClearMode] = useState('all'); // 'all' | 'month'
  const [isClearing, setIsClearing] = useState(false);

  // Calculations for Current Month
  const currentMonthStart = startOfMonth(new Date());
  const currentMonthEnd = endOfMonth(new Date());
  const today = new Date();
  
  const currentMonthTransactions = useMemo(() => {
    return transactions.filter(t => {
      const tDate = new Date(t.date);
      return isWithinInterval(tDate, { start: currentMonthStart, end: currentMonthEnd });
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [transactions, currentMonthStart, currentMonthEnd]);

  const totalSpentThisMonth = useMemo(() => {
    return currentMonthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount), 0);
  }, [currentMonthTransactions]);

  const totalIncomeThisMonth = useMemo(() => {
    return currentMonthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount), 0);
  }, [currentMonthTransactions]);

  // Overall Goal and Balance
  const goal = budgetProfile.monthlyBudgetGoal;
  const remainingBudget = goal - totalSpentThisMonth;
  const currentBalance = totalIncomeThisMonth - totalSpentThisMonth;
  const daysLeftInMonth = differenceInDays(currentMonthEnd, today);
  const daysElapsed = getDate(today);

  const recommendedDaily = daysLeftInMonth > 0 ? (remainingBudget / daysLeftInMonth) : 0;
  const actualAverage = daysElapsed > 0 ? (totalSpentThisMonth / daysElapsed) : 0;

  // Chart Data Calculations
  const spendPercentage = goal > 0 ? Math.min(Math.round((totalSpentThisMonth / goal) * 100), 100) : 0;
  const getGaugeColor = (pct) => {
    if (pct >= 90) return '#ef4444'; // Red
    if (pct >= 75) return '#f59e0b'; // Yellow
    return '#10b981'; // Emerald/Green
  };
  const gaugeColor = getGaugeColor(spendPercentage);
  const gaugeData = [
    { name: 'Spent', value: spendPercentage, color: gaugeColor },
    { name: 'Remaining', value: 100 - spendPercentage, color: '#27272a' }
  ];

  const trendData = useMemo(() => {
    const totalDays = getDate(currentMonthEnd);
    let cumulativeSpend = 0;
    
    return Array.from({ length: totalDays }, (_, i) => {
      const day = i + 1;
      if (day > daysElapsed) {
        return { day }; // No spend plotted for future days
      }
      
      const dayTransactions = currentMonthTransactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate.getDate() === day && t.type === 'expense';
      });
      
      const daySpend = dayTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
      cumulativeSpend += daySpend;
      
      return {
        day,
        spend: cumulativeSpend
      };
    });
  }, [currentMonthTransactions, currentMonthEnd, daysElapsed]);

  // Handle Form Category change when type changes
  const handleTypeChange = (newType) => {
    setEntryType(newType);
    setEntryCategory(newType === 'expense' ? EXPENSE_CATEGORIES[0] : INCOME_CATEGORIES[0]);
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    setEntryError('');
    
    if (!entryDate) {
      setEntryError('Date is required.');
      return;
    }
    const amt = parseFloat(entryAmount);
    if (isNaN(amt) || amt <= 0) {
      setEntryError('Amount must be greater than 0.');
      return;
    }

    const { success, error } = await addTransaction({
      type: entryType,
      date: entryDate,
      amount: amt,
      category: entryCategory,
      note: entryNote
    });

    if (success) {
      // Reset form on success
      setEntryAmount('');
      setEntryNote('');
      setEntryDate(todayStr);
    } else {
      setEntryError(`Failed to save: ${error?.message || 'Unknown error'}`);
    }
  };

  const startEditing = (transaction) => {
    setEditingId(transaction.id);
    setEditValues({
      type: transaction.type,
      date: transaction.date,
      amount: transaction.amount,
      category: transaction.category,
      note: transaction.note || ''
    });
  };

  const saveEdit = (id) => {
    const amt = parseFloat(editValues.amount);
    if (isNaN(amt) || amt <= 0 || !editValues.date) {
      alert("Invalid date or amount.");
      return;
    }
    updateTransaction(id, {
      ...editValues,
      amount: amt
    });
    setEditingId(null);
  };

  return (
    <div className="bg-zinc-900 rounded-xl shadow-xl border border-zinc-800 p-4 sm:p-6 md:p-8 mt-4 sm:mt-6 flex flex-col gap-6 sm:gap-8">
      
      {/* HEADER & SUMMARY STATS */}
      <div>
        {/* ── Top row: title + action buttons ── */}
        <div className="flex flex-col gap-4 mb-6">

          {/* Title + Monthly Goal */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <h2 className="text-2xl font-bold tracking-wider text-white">
              MY <span className="text-orange-500">BUDGET</span>
            </h2>
            <div className="text-left sm:text-right">
              <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-0.5">Monthly Goal</p>
              <p className="text-2xl font-bold text-white">₹{goal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
          </div>

          {/* Premium action buttons row */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-3">

            {/* ── Back to Budget Setup ── */}
            <button
              id="btn-back-to-setup"
              onClick={onGoToSetup}
              className="
                group flex items-center justify-center gap-2
                px-5 py-2.5 h-10
                rounded-[12px] border border-zinc-700
                bg-zinc-900 text-zinc-300
                text-sm font-semibold
                transition-all duration-250 ease-out
                hover:border-orange-500 hover:text-white
                hover:bg-gradient-to-r hover:from-orange-600 hover:to-orange-500
                hover:shadow-[0_0_18px_rgba(249,115,22,0.45)]
                hover:scale-[1.03]
                active:scale-[0.97] active:shadow-none
              "
            >
              <RotateCcw size={15} className="transition-transform duration-250 group-hover:rotate-[-30deg]" />
              Back to Budget Setup
            </button>

            {/* ── Clear Budget Data ── */}
            <button
              id="btn-clear-budget-data"
              onClick={() => setClearDialog('confirm')}
              className="
                group flex items-center justify-center gap-2
                px-5 py-2.5 h-10
                rounded-[12px] border border-zinc-700
                bg-zinc-900 text-zinc-300
                text-sm font-semibold
                transition-all duration-250 ease-out
                hover:border-red-500 hover:text-white
                hover:bg-gradient-to-r hover:from-red-700 hover:to-red-500
                hover:shadow-[0_0_18px_rgba(239,68,68,0.4)]
                hover:scale-[1.03]
                active:scale-[0.97] active:shadow-none
              "
            >
              <Eraser size={15} />
              Clear Budget Data
            </button>

            {/* ── Save Budget (primary CTA) ── */}
            <button
              id="btn-save-budget"
              onClick={handleManualSave}
              disabled={isSaving}
              className="
                group flex items-center justify-center gap-2
                px-5 py-2.5 h-10
                rounded-[12px]
                font-bold text-sm text-white
                transition-all duration-250 ease-out
                hover:scale-[1.03]
                active:scale-[0.97]
                disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100
                sm:ml-auto
                ${
                  isSaved
                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-[0_0_16px_rgba(16,185,129,0.4)] hover:shadow-[0_0_24px_rgba(16,185,129,0.55)]'
                    : 'bg-orange-500 hover:bg-orange-400 shadow-[0_0_16px_rgba(249,115,22,0.4)] hover:shadow-[0_0_28px_rgba(249,115,22,0.6)]'
                }
              "
            >
              {isSaving ? (
                <Loader2 size={15} className="animate-spin" />
              ) : isSaved ? (
                <CheckCircle2 size={15} />
              ) : (
                <Save size={15} />
              )}
              {isSaving ? 'Saving…' : isSaved ? 'Saved!' : 'Save Budget'}
            </button>

          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-black border border-zinc-800 rounded-xl p-4">
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1 flex items-center gap-1"><ArrowUpRight size={14} className="text-emerald-500" /> Income</p>
            <p className="text-xl font-bold text-emerald-400">₹{totalIncomeThisMonth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          <div className="bg-black border border-zinc-800 rounded-xl p-4">
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1 flex items-center gap-1"><ArrowDownRight size={14} className="text-red-500" /> Spent</p>
            <p className="text-xl font-bold text-red-400">₹{totalSpentThisMonth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          <div className="bg-black border border-zinc-800 rounded-xl p-4">
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">Balance</p>
            <p className="text-xl font-bold text-white">₹{currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          <div className={`border rounded-xl p-4 transition-colors duration-300 ${remainingBudget < 0 ? 'bg-red-500/10 border-red-500/50' : 'bg-black border-zinc-800'}`}>
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">Goal Remaining</p>
            <p className={`text-xl font-bold ${remainingBudget < 0 ? 'text-red-400' : 'text-orange-400'}`}>
              {remainingBudget < 0 ? 'Over goal by ' : ''}
              ₹{Math.abs(remainingBudget).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      {/* CALLOUT BOX: Average Spend Per Day */}
      <div className={`border-l-4 rounded-r-xl p-4 ${remainingBudget < 0 ? 'border-red-500 bg-red-500/10' : 'border-orange-500 bg-orange-500/10'}`}>
        <div className="flex items-start gap-3">
          {remainingBudget < 0 ? <AlertTriangle className="text-red-500 shrink-0 mt-1" /> : <Info className="text-orange-500 shrink-0 mt-1" />}
          <div>
            <h3 className={`font-bold text-lg mb-1 ${remainingBudget < 0 ? 'text-red-400' : 'text-orange-500'}`}>
              {remainingBudget < 0 ? "You've exceeded your spending goal!" : "Recommended Daily Spend"}
            </h3>
            {daysLeftInMonth === 0 ? (
               <p className="text-sm text-zinc-300">
                 Month review: You finished the month {remainingBudget < 0 ? 'over' : 'under'} budget by ₹{Math.abs(remainingBudget).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.
               </p>
            ) : remainingBudget < 0 ? (
              <p className="text-sm text-zinc-300">
                You are over your monthly goal by ₹{Math.abs(remainingBudget).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}. Try to minimize spending for the rest of the month.
              </p>
            ) : (
              <p className="text-sm text-zinc-300">
                To stay within your ₹{goal.toLocaleString()} goal, spend no more than <span className="font-bold text-white text-base">₹{recommendedDaily.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span> per day for the remaining {daysLeftInMonth} days.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Gauge Chart */}
        <div className="bg-black border border-zinc-800 rounded-xl p-4 flex flex-col items-center justify-center relative">
          <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2 self-start">Target Gauge</h3>
          <div className="w-full h-48 -mb-10">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={gaugeData}
                  cx="50%"
                  cy="100%"
                  startAngle={180}
                  endAngle={0}
                  innerRadius={70}
                  outerRadius={90}
                  dataKey="value"
                  stroke="none"
                >
                  {gaugeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center pb-4">
            <span className="text-3xl font-bold text-white">{spendPercentage}%</span>
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mt-1">OF MONTHLY GOAL</p>
          </div>
        </div>

        {/* Trend Chart */}
        <div className="bg-black border border-zinc-800 rounded-xl p-4 lg:col-span-2">
          <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">Cumulative Spending Trend</h3>
          {totalSpentThisMonth === 0 ? (
            <div className="h-48 flex items-center justify-center border-2 border-dashed border-zinc-800 rounded-lg">
              <p className="text-zinc-500 text-sm font-bold uppercase tracking-wider">No expenses yet - Add your first expense!</p>
            </div>
          ) : (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={gaugeColor} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={gaugeColor} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="day" stroke="#71717a" tick={{ fill: '#71717a', fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis stroke="#71717a" tick={{ fill: '#71717a', fontSize: 12 }} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px', color: '#fff' }} 
                    itemStyle={{ color: '#fff' }}
                    labelStyle={{ color: '#71717a', marginBottom: '4px' }}
                    formatter={(value) => [`₹${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Spent']}
                    labelFormatter={(label) => `Day ${label}`}
                  />
                  <Area type="monotone" dataKey="spend" stroke={gaugeColor} strokeWidth={3} fillOpacity={1} fill="url(#colorSpend)" isAnimationActive={true} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* QUICK ENTRY FORM */}
      <div className="bg-black p-4 rounded-xl border border-zinc-800">
        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">Quick Entry</h3>
        <form onSubmit={handleAddTransaction} className="flex flex-col md:flex-row gap-3 items-center">
          
          <select 
            value={entryType}
            onChange={e => handleTypeChange(e.target.value)}
            className="w-full md:w-auto bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-3 md:py-2 text-base md:text-sm font-bold text-white outline-none focus:border-orange-500 shrink-0 min-h-[48px]"
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>

          <input 
            type="date" 
            value={entryDate}
            onChange={e => { setEntryDate(e.target.value); setEntryError(''); }}
            className="w-full md:w-auto bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-3 md:py-2 text-base md:text-sm text-white outline-none focus:border-orange-500 shrink-0 [color-scheme:dark] min-h-[48px]"
          />
          
          <div className="relative shrink-0 w-full md:w-32">
            <span className="absolute left-3 top-3.5 md:top-2.5 text-zinc-500 font-bold text-sm pointer-events-none">₹</span>
            <input 
              type="number" 
              step="0.01"
              value={entryAmount}
              onChange={e => { setEntryAmount(e.target.value); setEntryError(''); }}
              placeholder="Amount"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-7 pr-3 py-3 md:py-2 text-base md:text-sm text-white outline-none focus:border-orange-500 min-h-[48px]"
            />
          </div>
          
          <select 
            value={entryCategory}
            onChange={e => setEntryCategory(e.target.value)}
            className="w-full md:w-auto bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-3 md:py-2 text-base md:text-sm text-white outline-none focus:border-orange-500 shrink-0 min-h-[48px]"
          >
            {(entryType === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          
          <input 
            type="text" 
            value={entryNote}
            onChange={e => setEntryNote(e.target.value)}
            placeholder="Note (optional)"
            className="w-full md:flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-3 md:py-2 text-base md:text-sm text-white outline-none focus:border-orange-500 min-h-[48px]"
          />
          
          <button 
            type="submit"
            className={`${entryType === 'income' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-orange-500 hover:bg-orange-600'} w-full md:w-auto text-white font-bold py-3 md:py-2 px-4 rounded-lg text-base md:text-sm transition-colors flex items-center justify-center gap-2 shrink-0 min-h-[48px]`}
          >
            <Plus size={16} /> Add {entryType === 'income' ? 'Income' : 'Expense'}
          </button>
        </form>
        {entryError && <p className="text-red-500 text-xs mt-2 font-medium">{entryError}</p>}
      </div>

      {/* TRANSACTION LOG TABLE */}
      <div>
        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">This Month's Transactions</h3>
        {currentMonthTransactions.length === 0 ? (
          <div className="text-center py-8 bg-black/50 border border-dashed border-zinc-800 rounded-xl">
            <p className="text-zinc-500">No transactions logged yet this month.</p>
            <p className="text-zinc-600 text-sm mt-1">Add your first one above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-black">
            <table className="hidden md:table w-full text-left text-sm text-zinc-300">
              <thead className="bg-zinc-900 text-xs uppercase text-zinc-500 border-b border-zinc-800">
                <tr>
                  <th className="px-4 py-3 font-bold tracking-wider w-10"></th>
                  <th className="px-4 py-3 font-bold tracking-wider">Date</th>
                  <th className="px-4 py-3 font-bold tracking-wider">Category</th>
                  <th className="px-4 py-3 font-bold tracking-wider">Note</th>
                  <th className="px-4 py-3 font-bold tracking-wider">Amount</th>
                  <th className="px-4 py-3 font-bold tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {currentMonthTransactions.map(transaction => {
                  const isEditing = editingId === transaction.id;
                  
                  if (isEditing) {
                    return (
                      <tr key={transaction.id} className="bg-zinc-900/50">
                        <td className="px-4 py-2 text-center">
                          <select value={editValues.type} onChange={e => {
                            setEditValues({...editValues, type: e.target.value, category: e.target.value === 'expense' ? EXPENSE_CATEGORIES[0] : INCOME_CATEGORIES[0]});
                          }} className="bg-black border border-zinc-700 rounded px-2 py-1 text-xs outline-none focus:border-orange-500">
                            <option value="expense">Exp</option>
                            <option value="income">Inc</option>
                          </select>
                        </td>
                        <td className="px-4 py-2">
                          <input type="date" value={editValues.date} onChange={e => setEditValues({...editValues, date: e.target.value})} className="bg-black border border-zinc-700 rounded px-2 py-1 text-xs w-full outline-none focus:border-orange-500 [color-scheme:dark]" />
                        </td>
                        <td className="px-4 py-2">
                          <select value={editValues.category} onChange={e => setEditValues({...editValues, category: e.target.value})} className="bg-black border border-zinc-700 rounded px-2 py-1 text-xs w-full outline-none focus:border-orange-500">
                            {(editValues.type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </td>
                        <td className="px-4 py-2">
                          <input type="text" value={editValues.note} onChange={e => setEditValues({...editValues, note: e.target.value})} className="bg-black border border-zinc-700 rounded px-2 py-1 text-xs w-full outline-none focus:border-orange-500" />
                        </td>
                        <td className="px-4 py-2">
                          <input type="number" step="0.01" value={editValues.amount} onChange={e => setEditValues({...editValues, amount: e.target.value})} className="bg-black border border-zinc-700 rounded px-2 py-1 text-xs w-24 outline-none focus:border-orange-500" />
                        </td>
                        <td className="px-4 py-2 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => saveEdit(transaction.id)} className="p-1.5 text-emerald-500 hover:bg-zinc-800 rounded transition-colors" title="Save"><Save size={16} /></button>
                            <button onClick={() => setEditingId(null)} className="p-1.5 text-zinc-500 hover:bg-zinc-800 rounded transition-colors" title="Cancel"><X size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={transaction.id} className="hover:bg-zinc-800/30 transition-colors group">
                      <td className="px-4 py-3 text-center">
                        {transaction.type === 'income' ? (
                           <ArrowUpRight size={16} className="text-emerald-500 mx-auto" />
                        ) : (
                           <ArrowDownRight size={16} className="text-red-500 mx-auto" />
                        )}
                      </td>
                      <td className="px-4 py-3">{format(new Date(transaction.date), 'MMM d, yyyy')}</td>
                      <td className="px-4 py-3">
                        <span className="bg-zinc-800 px-2 py-1 rounded text-xs">{transaction.category}</span>
                      </td>
                      <td className="px-4 py-3 text-zinc-400 truncate max-w-[200px]">{transaction.note}</td>
                      <td className={`px-4 py-3 font-bold ${transaction.type === 'income' ? 'text-emerald-400' : 'text-white'}`}>
                        {transaction.type === 'income' ? '+' : '-'}₹{parseFloat(transaction.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => startEditing(transaction)} className="p-1.5 text-zinc-400 hover:text-orange-500 hover:bg-zinc-800 rounded transition-colors" title="Edit"><Edit2 size={16} /></button>
                          <button onClick={() => {
                            if (window.confirm('Delete this transaction?')) deleteTransaction(transaction.id);
                          }} className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-zinc-800 rounded transition-colors" title="Delete"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Mobile Card Layout for Transactions */}
            <div className="md:hidden flex flex-col divide-y divide-zinc-800">
              {currentMonthTransactions.map(transaction => {
                const isEditing = editingId === transaction.id;
                
                if (isEditing) {
                  return (
                    <div key={transaction.id} className="bg-zinc-900/50 p-4 flex flex-col gap-3">
                      <div className="flex gap-2">
                        <select value={editValues.type} onChange={e => {
                          setEditValues({...editValues, type: e.target.value, category: e.target.value === 'expense' ? EXPENSE_CATEGORIES[0] : INCOME_CATEGORIES[0]});
                        }} className="flex-1 bg-black border border-zinc-700 rounded px-3 py-2 text-sm outline-none focus:border-orange-500 min-h-[48px]">
                          <option value="expense">Exp</option>
                          <option value="income">Inc</option>
                        </select>
                        <input type="date" value={editValues.date} onChange={e => setEditValues({...editValues, date: e.target.value})} className="flex-1 bg-black border border-zinc-700 rounded px-3 py-2 text-sm outline-none focus:border-orange-500 [color-scheme:dark] min-h-[48px]" />
                      </div>
                      <div className="flex gap-2">
                        <select value={editValues.category} onChange={e => setEditValues({...editValues, category: e.target.value})} className="flex-1 bg-black border border-zinc-700 rounded px-3 py-2 text-sm outline-none focus:border-orange-500 min-h-[48px]">
                          {(editValues.type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <input type="number" step="0.01" value={editValues.amount} onChange={e => setEditValues({...editValues, amount: e.target.value})} className="flex-1 bg-black border border-zinc-700 rounded px-3 py-2 text-sm outline-none focus:border-orange-500 min-h-[48px]" />
                      </div>
                      <input type="text" value={editValues.note} onChange={e => setEditValues({...editValues, note: e.target.value})} placeholder="Note..." className="w-full bg-black border border-zinc-700 rounded px-3 py-2 text-sm outline-none focus:border-orange-500 min-h-[48px]" />
                      <div className="flex justify-end gap-3 mt-2">
                        <button onClick={() => setEditingId(null)} className="flex-1 min-h-[48px] bg-zinc-800 text-white rounded-lg flex items-center justify-center gap-2 font-bold"><X size={18} /> Cancel</button>
                        <button onClick={() => saveEdit(transaction.id)} className="flex-1 min-h-[48px] bg-orange-500 text-white rounded-lg flex items-center justify-center gap-2 font-bold"><Save size={18} /> Save</button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={transaction.id} className="p-4 flex items-center justify-between gap-3 bg-black hover:bg-zinc-800/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${transaction.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                        {transaction.type === 'income' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-zinc-200">{transaction.category}</span>
                        <span className="text-xs text-zinc-500">{format(new Date(transaction.date), 'MMM d, yyyy')}</span>
                        {transaction.note && <span className="text-xs text-zinc-400 truncate mt-0.5">{transaction.note}</span>}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <span className={`font-bold text-lg ${transaction.type === 'income' ? 'text-emerald-400' : 'text-white'}`}>
                        {transaction.type === 'income' ? '+' : '-'}₹{parseFloat(transaction.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <div className="flex gap-2">
                        <button onClick={() => startEditing(transaction)} className="p-2 text-zinc-400 hover:text-orange-500 hover:bg-zinc-800 rounded min-w-[44px] min-h-[44px] flex items-center justify-center" title="Edit"><Edit2 size={16} /></button>
                        <button onClick={() => {
                          if (window.confirm('Delete this transaction?')) deleteTransaction(transaction.id);
                        }} className="p-2 text-zinc-400 hover:text-red-500 hover:bg-zinc-800 rounded min-w-[44px] min-h-[44px] flex items-center justify-center" title="Delete"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── CLEAR BUDGET DATA CONFIRMATION DIALOG ── */}
      {clearDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ animation: 'fadeIn 0.18s ease' }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => !isClearing && setClearDialog(null)}
          />

          {/* Modal */}
          <div
            className="relative bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl w-full max-w-md p-7"
            style={{ animation: 'scaleIn 0.2s ease' }}
          >
            {/* Icon */}
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 mx-auto mb-5">
              <Eraser size={26} className="text-red-400" />
            </div>

            <h3 className="text-xl font-bold text-white text-center mb-2">Clear Budget Data?</h3>
            <p className="text-zinc-400 text-sm text-center mb-6">
              This will permanently remove all your budget records.<br />
              <span className="text-zinc-300 font-semibold">Your profile and habits will NOT be deleted.</span>
            </p>

            {/* Scope selector */}
            <div className="flex flex-col gap-3 mb-7">
              <label
                className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-150 ${
                  clearMode === 'month'
                    ? 'border-orange-500 bg-orange-500/10'
                    : 'border-zinc-700 bg-black hover:border-zinc-500'
                }`}
              >
                <input
                  type="radio"
                  name="clearMode"
                  value="month"
                  checked={clearMode === 'month'}
                  onChange={() => setClearMode('month')}
                  className="mt-1 accent-orange-500"
                />
                <div>
                  <p className={`font-bold text-sm ${clearMode === 'month' ? 'text-orange-400' : 'text-zinc-200'}`}>
                    Delete only this month's data
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">Removes transactions from this month only. Past history is kept.</p>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-150 ${
                  clearMode === 'all'
                    ? 'border-red-500 bg-red-500/10'
                    : 'border-zinc-700 bg-black hover:border-zinc-500'
                }`}
              >
                <input
                  type="radio"
                  name="clearMode"
                  value="all"
                  checked={clearMode === 'all'}
                  onChange={() => setClearMode('all')}
                  className="mt-1 accent-red-500"
                />
                <div>
                  <p className={`font-bold text-sm ${clearMode === 'all' ? 'text-red-400' : 'text-zinc-200'}`}>
                    Delete all budget history
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">Permanently removes all income, expenses, and transactions.</p>
                </div>
              </label>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                id="btn-clear-cancel"
                onClick={() => setClearDialog(null)}
                disabled={isClearing}
                className="flex-1 py-3 rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 font-bold transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                id="btn-clear-confirm-delete"
                disabled={isClearing}
                onClick={async () => {
                  setIsClearing(true);
                  try {
                    if (clearMode === 'all') {
                      await onClearAllData();
                    } else {
                      await onClearMonthData();
                    }
                  } finally {
                    setIsClearing(false);
                    setClearDialog(null);
                  }
                }}
                className="flex-1 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold transition-colors shadow-[0_0_15px_rgba(239,68,68,0.3)] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isClearing ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog animations */}
      <style>{`
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.94) translateY(8px) } to { opacity: 1; transform: scale(1) translateY(0) } }
      `}</style>

    </div>
  );
};

export default BudgetDashboard;
