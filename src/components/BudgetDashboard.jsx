import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Edit2, Save, X, AlertTriangle, Info, TrendingUp, TrendingDown, ArrowRight, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, isWithinInterval, differenceInDays, getDate } from 'date-fns';

const EXPENSE_CATEGORIES = ['Food', 'Transport', 'Bills', 'Shopping', 'Entertainment', 'Education', 'Other'];
const INCOME_CATEGORIES = ['Salary', 'Business', 'Investment', 'Gift', 'Other'];

const BudgetDashboard = ({ budgetProfile, transactions, addTransaction, updateTransaction, deleteTransaction }) => {
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

  // Handle Form Category change when type changes
  const handleTypeChange = (newType) => {
    setEntryType(newType);
    setEntryCategory(newType === 'expense' ? EXPENSE_CATEGORIES[0] : INCOME_CATEGORIES[0]);
  };

  const handleAddTransaction = (e) => {
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

    addTransaction({
      type: entryType,
      date: entryDate,
      amount: amt,
      category: entryCategory,
      title: entryNote
    });

    // Reset form
    setEntryAmount('');
    setEntryNote('');
    setEntryDate(todayStr);
  };

  const startEditing = (transaction) => {
    setEditingId(transaction.id);
    setEditValues({
      type: transaction.type,
      date: transaction.date,
      amount: transaction.amount,
      category: transaction.category,
      title: transaction.title || ''
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
          <h2 className="text-2xl font-bold tracking-wider text-white">
            MY <span className="text-orange-500">BUDGET</span>
          </h2>
          <div className="text-left md:text-right">
            <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-1">Monthly Goal</p>
            <p className="text-2xl font-bold text-white">₹{goal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

      {/* QUICK ENTRY FORM */}
      <div className="bg-black p-4 rounded-xl border border-zinc-800">
        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">Quick Entry</h3>
        <form onSubmit={handleAddTransaction} className="flex flex-col md:flex-row gap-3 items-center">
          
          <select 
            value={entryType}
            onChange={e => handleTypeChange(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm font-bold text-white outline-none focus:border-orange-500 shrink-0"
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>

          <input 
            type="date" 
            value={entryDate}
            onChange={e => { setEntryDate(e.target.value); setEntryError(''); }}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-orange-500 shrink-0"
          />
          
          <div className="relative shrink-0 md:w-32">
            <span className="absolute left-3 top-2.5 text-zinc-500 font-bold text-sm pointer-events-none">₹</span>
            <input 
              type="number" 
              step="0.01"
              value={entryAmount}
              onChange={e => { setEntryAmount(e.target.value); setEntryError(''); }}
              placeholder="Amount"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-7 pr-3 py-2 text-sm text-white outline-none focus:border-orange-500"
            />
          </div>
          
          <select 
            value={entryCategory}
            onChange={e => setEntryCategory(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-orange-500 shrink-0"
          >
            {(entryType === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          
          <input 
            type="text" 
            value={entryNote}
            onChange={e => setEntryNote(e.target.value)}
            placeholder="Note (optional)"
            className="flex-1 w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-orange-500"
          />
          
          <button 
            type="submit"
            className={`${entryType === 'income' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-orange-500 hover:bg-orange-600'} w-full md:w-auto text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 shrink-0`}
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
            <table className="w-full text-left text-sm text-zinc-300">
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
                          <input type="date" value={editValues.date} onChange={e => setEditValues({...editValues, date: e.target.value})} className="bg-black border border-zinc-700 rounded px-2 py-1 text-xs w-full outline-none focus:border-orange-500" />
                        </td>
                        <td className="px-4 py-2">
                          <select value={editValues.category} onChange={e => setEditValues({...editValues, category: e.target.value})} className="bg-black border border-zinc-700 rounded px-2 py-1 text-xs w-full outline-none focus:border-orange-500">
                            {(editValues.type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </td>
                        <td className="px-4 py-2">
                          <input type="text" value={editValues.title} onChange={e => setEditValues({...editValues, title: e.target.value})} className="bg-black border border-zinc-700 rounded px-2 py-1 text-xs w-full outline-none focus:border-orange-500" />
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
                      <td className="px-4 py-3 text-zinc-400 truncate max-w-[200px]">{transaction.title}</td>
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
          </div>
        )}
      </div>

    </div>
  );
};

export default BudgetDashboard;
